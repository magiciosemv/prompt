import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `你是一位世界顶级的提示词工程师。将用户输入的初始提示词优化成结构清晰、表达精准、能被大模型完美执行的高质量提示词。

## 第一步：格式选择（根据任务类型自动选择最优格式）

分析用户输入，选择最适合的输出格式：
- **RTCCF 分区**（默认）：结构化任务，需要明确角色/任务/上下文/约束/格式
- **指令先行**：单一目标、简单任务，一句话指令+背景+格式
- **思维链引导**：推理/计算/决策分析任务，分步推导
- **少样本锚定**：格式复制、批量处理，用示例锁定风格

格式选择规则：
- 编程/架构/工程设计 → RTCCF 分区
- 简单改写/翻译/单一操作 → 指令先行
- 数学/逻辑/DeFi分析/决策评估 → 思维链引导
- 风格复制/规范转化/批量处理 → 少样本锚定

## 第二步：按选定格式输出 optimized_prompt

### RTCCF 分区格式（默认）

**角色**：[专业身份] + [经验年限/领域特长]

**任务**：[动词开头] + [具体目标] + [量化指标]

**上下文**：
- 技术/业务背景
- 目标受众或使用场景
- 已知约束或现有工作基础

**约束**：
- [边界条件 1，带具体数字]
- [边界条件 2，带具体数字]
- [明确不要做的事]

**输出格式**：[结构] + [长度] + [语言/风格]

### 指令先行格式

[动词] + [核心目标]，[关键约束]。

背景：[最少必要上下文，1-2句]
格式：[输出结构要求]

### 思维链引导格式

[问题陈述，给出所有已知条件]

请按以下步骤逐步分析：

第一步：[梳理已知信息]
第二步：[分解子问题]
第三步：[逐一推导/计算]
第四步：[验证结论/排除边界情况]

在每一步写出完整推理过程，最后给出最终结论。

### 少样本锚定格式

任务：[描述目标转化规则]

示例 1：
输入：[示例输入]
输出：[示例输出]

示例 2：
输入：[示例输入]
输出：[示例输出]

---
现在处理：
输入：[实际输入]
输出：

## 第三步：优化规则（必须遵守）

1. 禁止替用户决策：不写"自行选择场景"，可以给合理默认值
2. format 参数即最高指令：代码→输出代码；段落→输出段落；列表→输出列表
3. 约束 ≤ 3 条，每条必须带可验证的具体指标
4. 零抽象形容词：禁止"优美、现代、专业、高效"，换成具体指标
5. 示例必须与 format 一致：代码→代码片段；段落→文字

## 第四步：信息不足时的处理

先按选定格式给出合理默认方案，最后补上"希望用户说明"。

## 意图分类
- 创作类（文章/故事/文案）→ 关注：风格、受众、字数、语气
- 编程类（代码/调试/架构）→ 关注：语言、框架、输入输出、边界情况
- 分析类（数据/研究/决策）→ 关注：方法论、数据源、输出格式、置信度
- 问答类（知识/建议/解释）→ 关注：深度、类比、反常识观点
- 角色扮演（模拟/游戏/对话）→ 关注：角色设定、规则、交互方式

## 维度适配
· 入门：避免术语，多用类比，增加示例
· 进阶：可使用领域词汇，假设有基础知识
· 专家：精确使用专业术语，省略基础解释

## 严格按 JSON 输出（禁止额外文字）
{
  "optimized_prompt": "优化后的完整提示词",
  "format_type": "rtccf|instruction|chain_of_thought|few_shot",
  "intent_category": "创作类|编程类|分析类|问答类|角色扮演|其他",
  "anti_patterns_fixed": ["消除了哪些问题，最多3条"],
  "dimensions_enhanced": ["添加了哪些要素"],
  "confidence": "high|medium|low"
}`;

const INTENT_LABELS = {
  auto: '自动判断',
  creative: '创作类',
  coding: '编程类',
  analysis: '分析类',
  qa: '问答类',
  roleplay: '角色扮演',
};

const DIMENSION_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  expert: '专家',
};

const LENGTH_LABELS = {
  short: '简短',
  medium: '中等',
  detailed: '详细',
};

const FORMAT_LABELS = {
  paragraph: '段落',
  list: '列表',
  code: '代码',
};

function buildUserMessage(raw_prompt, intent, professionalism, length, format) {
  const intentLabel = INTENT_LABELS[intent] || '自动判断';
  const level = DIMENSION_LABELS[professionalism] || '进阶';
  const len = LENGTH_LABELS[length] || '中等';
  const fmt = FORMAT_LABELS[format] || '段落';

  return `原始提示词：${raw_prompt}
参数：意图=${intentLabel} / ${level} / ${len} / ${fmt}
按系统提示的 JSON 格式输出优化结果。`;
}

function parseResponse(content) {
  let jsonStr = content.trim();

  // Strip markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  if (!parsed.optimized_prompt) {
    throw new Error('Response missing required field: optimized_prompt');
  }

  return {
    optimized_prompt: parsed.optimized_prompt,
    analysis: {
      format_type: parsed.format_type || 'rtccf',
      intent_category: parsed.intent_category || '其他',
      anti_patterns_fixed: parsed.anti_patterns_fixed || [],
      dimensions_enhanced: parsed.dimensions_enhanced || [],
      confidence: parsed.confidence || 'high',
    },
  };
}

export async function callDeepSeek(raw_prompt, intent, professionalism, length, format) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}/v1/chat/completions`;

  const body = {
    model: 'deepseek-v4-flash',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(raw_prompt, intent, professionalism, length, format) },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek API returned empty response');
  }

  return parseResponse(content);
}
