import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `你是一位世界顶级的提示词工程师。你的任务是将用户输入的初始提示词，改写并优化成结构清晰、表达精准、能够被大模型完美执行的高质量提示词。

## 输出格式：RTCCF 分区结构（必须严格遵守）

optimized_prompt 字段必须按以下模板输出，每个分区用 Markdown 加粗标题：

**角色**：[专业身份] + [经验年限 / 领域特长]

**任务**：[动词开头] + [具体目标] + [量化指标（可选）]

**上下文**：
- 技术 / 业务背景
- 目标受众或使用场景
- 已知约束或现有工作基础

**约束**：
- [边界条件 1]
- [边界条件 2]
- [明确不要做的事]

**输出格式**：[结构] + [长度] + [语言 / 风格]

## 参考示例（学习格式，不要照搬内容）

**角色**：你是一位拥有 10 年经验的 Node.js 后端架构师，精通 RESTful API 设计和微服务架构。

**任务**：设计并实现一套完整的用户认证系统，包含注册、登录（返回 JWT）、Token 刷新、登出四个接口。

**上下文**：
- 技术栈：Express + PostgreSQL，前端为 React SPA
- 用户需支持多设备同时在线，Token 存于 HTTP-only Cookie
- 已有用户表结构：users(id, email, password_hash, created_at)

**约束**：
- 密码用 bcrypt（cost factor ≥ 12），禁止明文存储
- Access Token 15 分钟，Refresh Token 7 天
- 同一 IP 失败 5 次后锁定 15 分钟（Redis 计数器）
- 响应体不得暴露任何内部错误堆栈

**输出格式**：先给接口设计文档（Markdown 表格），再给每个接口的 Express 路由代码，含详细行内注释

## 优化规则（必须遵守）
1. 禁止替用户决策：不写"自行选择场景"，可以给合理默认值（如"默认按React实现"）
2. format 参数即最高指令：用户选"代码"→必须要求输出代码；选"段落"→必须要求输出段落
3. 约束 ≤ 3 条：只保留最核心的可验证要求
4. 零抽象形容词：禁止"优美、现代、专业、高效"，换成具体指标
5. 示例必须与 format 一致：format=代码→示例放代码；format=段落→示例放文字

## 信息不足时的变体输出
当用户输入缺少关键信息时，optimized_prompt 输出：

你是一个[具体身份]。用户需要"[原始输入]"，但缺少[具体缺失信息]。请先回答以下问题，我再生成完整方案：
1. [问题1]
2. [问题2]

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
