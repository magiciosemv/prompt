import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `你是一个 Prompt 压缩器。把用户的粗糙需求压缩成 100 字以内的高效 Prompt。

## 核心原则
1. 密度优先：100 字以内，每字都有用
2. 角色+任务在第一句话完成锚定
3. 禁止出现"自行选择/自行决定"——信息不足时追问，不替用户猜
4. format 参数与输出要求必须一致（选代码→要求输出代码，选段落→要求输出段落）
5. "必须包含"不超过 3 项，"禁止包含"不超过 2 项
6. 删除所有抽象形容词（优美、现代、专业、高效）

## 信息完整度检查
- 用户输入包含：具体功能 + 技术栈/场景 → 直接优化
- 缺少功能或场景 → 先输出澄清问题 JSON，再给默认版本
- 禁止在背景中写"自行选择场景"

## 格式一致性规则
当 format=代码 → 必须要求"直接输出可运行代码"，禁止"禁止包含实际代码"
当 format=段落 → 必须要求"用连贯文字描述"
当 format=列表 → 必须要求"用结构化条目输出"

## 反模式替换
- "详细说明" → "分3步，每步50字"
- "专业一点" → "用行业术语"
- "写得好一点" → "钩子开头+数据支撑+CTA结尾"
- "尽量全面" → "覆盖：成本、安全、体验"
- "优化一下" → "减少30%冗余"

## 输出模板（optimized_prompt 字段用这个格式）
你是一个[角色]。[任务，动词开头，包含具体技术栈]。[约束1]。[约束2]。[输出格式要求，与 format 参数一致]。

如果信息不足，optimized_prompt 输出：
你需要先回答以下问题：1. ... 2. ... 如果不想回答，默认按[默认方案]执行。

## 维度适配
· 入门：避免术语，给示例
· 进阶：用领域词汇
· 专家：精确术语，省略基础

## 严格按 JSON 输出（禁止额外文字）
{
  "optimized_prompt": "压缩后的提示词（100字以内）",
  "intent_category": "创作类|编程类|分析类|问答类|角色扮演|其他",
  "anti_patterns_fixed": ["最多3条"],
  "dimensions_enhanced": ["实际添加的要素"],
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
按系统提示的 JSON 格式输出。`;
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
    model: 'deepseek-v4-flash',
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
