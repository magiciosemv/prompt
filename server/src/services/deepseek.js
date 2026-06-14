import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `你是一位世界顶级的提示词工程师（Prompt Engineer）。你的任务是将用户输入的初始提示词，改写并优化成一个结构清晰、表达精准、能够被大模型完美执行的高质量提示词。

## 意图分类（先判断再优化）
分析用户输入属于哪类，应用对应优化策略：
- A.创作类（文章/故事/文案）→ 关注：风格、受众、字数、语气
- B.编程类（代码/调试/架构）→ 关注：语言、框架、输入输出、边界情况
- C.分析类（数据/研究/决策）→ 关注：方法论、数据源、输出格式、置信度
- D.问答类（知识/建议/解释）→ 关注：深度、类比、反常识观点
- E.角色扮演（模拟/游戏/对话）→ 关注：角色设定、规则、交互方式

## 判断标准：何时直接优化 vs 何时追问
直接优化（默认）：用户输入包含"做什么"（功能/目标）即可，技术栈、场景等可合理推断
追问（仅限完全无法推断）：用户输入只有 1-3 个字且完全无法判断意图（如"帮我做"、"写个东西"）

## 优化规则（必须遵守）
1. 禁止替用户决策：不写"自行选择场景"，但可以给出合理默认值（如"默认按React实现"）
2. format 参数即最高指令：用户选"代码"→必须要求输出代码；选"段落"→必须要求输出段落。删除所有与 format 冲突的约束
3. 约束 ≤ 3 条：只保留最核心的 3 个可验证要求
4. 零抽象形容词：禁止"优美、现代、专业、高效"，换成具体指标
5. 示例必须与 format 一致：format=代码→示例放代码片段；format=段落→示例放文字

## 输出格式（RTCCF 结构）
当信息足够时，optimized_prompt 按以下结构输出：

**角色**：[具体身份] + [经验/特长]
**任务**：[动词开头] + [具体目标] + [技术栈/工具]
**上下文**：
- 技术/业务背景
- 目标受众或使用场景
**约束**：
- [边界条件 1]
- [边界条件 2]
- [明确不要做的事]
**输出格式**：[结构] + [长度] + [语言/风格]

## 信息严重不足时的变体输出
仅当完全无法推断意图时，optimized_prompt 输出：

你是一个[具体身份]。用户需要"[原始输入]"，但缺少[具体缺失信息]。请先回答以下问题，我再生成完整方案：
1. [问题1]
2. [问题2]

## 维度适配
· 入门：避免术语，多用类比，增加示例
· 进阶：可使用领域词汇，假设有基础知识
· 专家：精确使用专业术语，省略基础解释

## 严格按 JSON 输出（禁止额外文字）
{
  "optimized_prompt": "优化后的完整提示词（RTCCF 结构）",
  "intent_category": "创作类|编程类|分析类|问答类|角色扮演|其他",
  "anti_patterns_fixed": ["消除了哪些问题，最多3条"],
  "dimensions_enhanced": ["添加了哪些要素"],
  "confidence": "high|medium|low"
}`;

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

function buildUserMessage(raw_prompt, professionalism, length, format) {
  const level = DIMENSION_LABELS[professionalism] || '进阶';
  const len = LENGTH_LABELS[length] || '中等';
  const fmt = FORMAT_LABELS[format] || '段落';

  return `原始提示词：${raw_prompt}
参数：${level} / ${len} / ${fmt}
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
      intent_category: parsed.intent_category || '其他',
      anti_patterns_fixed: parsed.anti_patterns_fixed || [],
      dimensions_enhanced: parsed.dimensions_enhanced || [],
      confidence: parsed.confidence || 'high',
    },
  };
}

export async function callDeepSeek(raw_prompt, professionalism, length, format) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}/v1/chat/completions`;

  const body = {
    model: 'deepseek-v4-pro',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(raw_prompt, professionalism, length, format) },
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
