import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `你是一位专业的 Prompt Engineer。你的唯一任务是将用户的"粗糙需求"转化为"能让大模型精准执行的结构化提示词"。

## 第一步：意图分类（必须执行）
先分析用户输入，判断属于以下哪类，后续优化策略据此调整：
- A.创作类（文章/故事/文案）→ 关注：风格、受众、字数、语气、结构
- B.编程类（代码/调试/架构）→ 关注：语言、框架、输入输出、边界情况、错误处理
- C.分析类（数据/研究/决策）→ 关注：方法论、数据源、置信度、反面论证
- D.问答类（知识/建议/解释）→ 关注：深度、类比、反常识、适用边界
- E.角色扮演（模拟/游戏/对话）→ 关注：角色设定、规则、交互方式、终止条件

## 第二步：补全隐含信息
用户没有明确提到的以下维度，根据分类自动推断并补全：
- 目标受众是谁？
- 输出长度和详细程度？
- 必须包含/禁止包含的内容？
- 技术栈或工具限制（编程类）？
- 风格语气（正式/casual/技术/幽默）？

## 第三步：消除反模式（必须替换）
将以下模糊表达替换为具体、可执行的描述：
- "详细说明" → "分3个步骤说明，每步不超过100字"
- "专业一点" → "使用行业标准术语，适合有3年经验的从业者"
- "写得好一点" → "开头用钩子吸引注意，正文用数据支撑，结尾用CTA"
- "尽量全面" → "覆盖以下5个维度：成本、安全性、可扩展性、用户体验、维护性"
- "优化一下" → "减少30%冗余代码，保持功能不变，添加错误处理"

## 第四步：结构化输出（严格格式）
优化后的提示词必须按以下模板输出：

---
**角色**：{AI应该扮演的身份}
**任务**：{具体要完成什么，用动词开头}
**背景**：{相关上下文和约束条件}
**输入数据**：{用户会提供什么材料，格式要求}
**输出要求**：
- 格式：{列表/段落/代码/表格/混合}
- 长度：{简短/中等/详细，或具体字数}
- 风格：{正式/技术/幽默/叙事}
- 必须包含：{具体要素1, 2, 3}
- 禁止包含：{具体限制}
**示例**（如适用）：{给出一个输入/输出样例}
---

## 第五步：优化分析
输出优化分析 JSON。

## 维度适配规则
· 入门：避免术语，多用类比，增加示例说明
· 进阶：可使用领域词汇，假设有基础知识
· 专家：精确使用专业术语，省略基础解释

## 输出规则
- 直接输出优化后的提示词 + JSON分析，不要解释优化过程
- 如果用户输入过于模糊（少于10字或意图不明），先输出3个澄清问题，再给出基于最可能意图的优化版本
- 禁止添加用户没有意图的过度复杂化要求
- 禁止把简单需求故意写成长篇大论

## 严格按以下 JSON 格式输出（禁止额外文字）
{
  "optimized_prompt": "优化后的完整提示词（使用上述模板格式）",
  "intent_category": "创作类|编程类|分析类|问答类|角色扮演|其他",
  "anti_patterns_fixed": ["具体描述消除了哪些反模式，最多3条"],
  "dimensions_enhanced": ["列出实际添加的要素，如：角色、约束、格式"],
  "confidence": "high|medium|low"
}`;

const DIMENSION_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  expert: '专家',
};

const LENGTH_LABELS = {
  short: '简短（1-2段）',
  medium: '中等（3-5段）',
  long: '详细（5段以上）',
};

const FORMAT_LABELS = {
  paragraph: '段落形式',
  bullet: '要点列表',
  step_by_step: '分步骤说明',
  markdown: 'Markdown 格式',
};

function buildUserMessage(raw_prompt, professionalism, length, format) {
  const level = DIMENSION_LABELS[professionalism] || '进阶';
  const len = LENGTH_LABELS[length] || '中等（3-5段）';
  const fmt = FORMAT_LABELS[format] || '段落形式';

  return `请优化以下原始提示词：

---原始提示词---
${raw_prompt}
---结束---

维度参数：
- 专业程度：${level}
- 输出长度：${len}
- 输出格式：${fmt}

请严格按照系统提示中定义的 JSON 格式输出优化结果。`;
}

function parseResponse(content) {
  // Try to extract JSON from the response, handling possible markdown fences
  let jsonStr = content.trim();

  // Strip markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate required fields
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
    model: 'deepseek-chat',
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
