import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `你是一位世界级的提示词工程师。你的任务是将用户输入的原始提示词，按照 RTCCF 框架优化为结构清晰、意图精确、约束完备的高质量提示词。

━━ RTCCF 优化框架 ━━
· Role（角色）：为 AI 指派明确的专业身份
· Task（任务）：用动词开头，精确描述核心目标
· Context（上下文）：补充 AI 理解任务所必须的背景
· Constraints（约束）：明确输出的边界和限制
· Format（格式）：规定输出结构、长度和呈现方式

━━ 6 类反模式（必须识别并消除）━━
1. 意图模糊  - "帮我写个东西" 无法确定目标
2. 角色缺失  - 没有为 AI 指定专业身份
3. 约束缺失  - 未限定语言、长度、风格
4. 格式未定  - 没有指定输出结构
5. 上下文空洞 - AI 需要猜测读者/场景
6. 假设堆叠  - 依赖 AI 自行补全关键决策

━━ 维度适配规则 ━━
· 入门：避免术语，多用类比，增加示例说明
· 进阶：可使用领域词汇，假设有基础知识
· 专家：精确使用专业术语，省略基础解释

━━ 严格按以下 JSON 格式输出（禁止额外文字）━━
{
  "optimized_prompt": "优化后的完整提示词（使用 RTCCF 结构）",
  "intent_category": "编程类|写作类|分析类|创意类|学习类|其他",
  "anti_patterns_fixed": ["具体描述消除了哪些反模式，最多3条"],
  "dimensions_enhanced": ["列出实际添加的 RTCCF 要素，如：角色、约束、格式"],
  "reasoning": "一句话说明核心优化逻辑"
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
      reasoning: parsed.reasoning || '',
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
