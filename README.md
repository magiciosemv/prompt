# Prompt Optimizer

> 🧠 专业的 AI 提示词优化工具，将用户的粗糙需求转化为结构清晰、表达精准的高质量提示词。

## ✨ 功能特性

- **RTCCF 框架优化**：基于 Role/Task/Context/Constraints/Format 结构化输出
- **智能格式选择**：根据任务类型自动选择最优格式（RTCCF/指令先行/思维链/少样本）
- **意图分类**：自动识别创作类/编程类/分析类/问答类/角色扮演
- **反模式检测**：自动消除模糊表达（"详细说明"→"分3步，每步100字"）
- **流式输出**：SSE 实时流式渲染，无需等待
- **Diff 对比**：一键查看原始提示词与优化后的差异
- **历史记录**：保存优化历史，支持回填和迭代
- **维度调节**：专业度/长度/格式三维度自定义

## 📸 界面预览

```
┌──────────────────────────────┬──────────────────────────────────┐
│  📝 原始提示词                │  ✨ 优化结果                      │
│                              │                                  │
│  ┌────────────────────────┐  │  ┌────────────────────────────┐  │
│  │  输入框 (textarea)      │  │  │  (SSE 流式渲染，逐字显示)    │  │
│  │  占位符示例文字          │  │  │  **角色**：...              │  │
│  └────────────────────────┘  │  │  **任务**：...              │  │
│                              │  │  **上下文**：...            │  │
│                              │  │  **约束**：...              │  │
│                              │  │  **输出格式**：...          │  │
│                              │  └────────────────────────────┘  │
│                              │  [📋复制] [🔄重新优化] [查看对比]  │
│                              │  📊 优化分析                      │
├──────────────────────────────┼──────────────────────────────────┤
│  🎛️ 优化参数                 │  📜 历史记录                      │
│                              │                                  │
│  意图分类: ○自动 ●编程 ○创作  │  · "帮我写个请假邮件" [创作类]    │
│  专业度:   ○入门 ●进阶 ○专家  │  · "写个API接口"     [编程类]    │
│  长度:     ○简短 ●中等 ○详细  │  · "市场分析报告"    [分析类]    │
│  格式:     ○列表 ●段落 ○代码  │                                  │
│  [🚀 开始优化]                │  (点击条目回填到输入框)            │
└──────────────────────────────┴──────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18（推荐 20 LTS）
- npm >= 9
- DeepSeek API Key（[获取地址](https://platform.deepseek.com/)）

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/magiciosemv/prompt.git
cd prompt/prompt-optimizer

# 2. 安装依赖
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 DEEPSEEK_API_KEY

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:5173
```

### 生产部署（Ubuntu）

#### 方式一：PM2 部署（推荐）

```bash
# 1. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 克隆项目
sudo git clone https://github.com/magiciosemv/prompt.git /opt/prompt-optimizer
cd /opt/prompt-optimizer

# 3. 配置环境变量
sudo cp .env.example .env
sudo nano .env
# 填入：
# DEEPSEEK_API_KEY=sk-你的key
# DEEPSEEK_BASE_URL=https://api.deepseek.com
# PORT=3001

# 4. 安装依赖
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 5. 构建前端
npm run build

# 6. 安装 PM2
npm install -g pm2

# 7. 启动服务
pm2 start server/src/index.js --name prompt-optimizer
pm2 save
pm2 startup

# 8. 访问 http://你的服务器IP:3001
```

#### 方式二：Docker 部署

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sudo sh

# 2. 克隆项目
sudo git clone https://github.com/magiciosemv/prompt.git /opt/prompt-optimizer
cd /opt/prompt-optimizer

# 3. 配置环境变量
sudo cp .env.example .env
sudo nano .env

# 4. 启动
sudo docker compose up -d

# 5. 访问 http://你的服务器IP:3000
```

**注意**：如果服务器在国内，Docker Hub 可能被墙，需要配置镜像加速：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### Nginx 反向代理（绑定域名）

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo tee /etc/nginx/sites-available/prompt << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/prompt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS 配置（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 📁 项目结构

```
prompt-optimizer/
├── client/                    # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx      # 输入面板
│   │   │   ├── OutputPanel.jsx     # 输出面板
│   │   │   ├── ParamsPanel.jsx     # 参数调节面板
│   │   │   ├── HistoryPanel.jsx    # 历史记录面板
│   │   │   ├── DiffView.jsx        # Diff 对比视图
│   │   │   └── AnalysisCard.jsx    # 优化分析卡片
│   │   ├── App.jsx                 # 主应用
│   │   └── main.jsx                # 入口文件
│   └── package.json
├── server/                    # Express 后端
│   ├── src/
│   │   ├── routes/
│   │   │   ├── optimize.js         # POST /api/optimize (SSE)
│   │   │   └── history.js          # GET/DELETE /api/history
│   │   ├── services/
│   │   │   └── deepseek.js         # DeepSeek API 调用
│   │   ├── db/
│   │   │   ├── index.js            # SQLite 连接
│   │   │   └── schema.sql          # 数据库表结构
│   │   └── index.js                # 服务入口
│   └── package.json
├── docker-compose.yml         # Docker 编排
├── Dockerfile                 # Docker 构建文件
├── .env.example               # 环境变量模板
└── README.md                  # 项目文档
```

## 🔧 API 接口

### POST /api/optimize

优化提示词（SSE 流式响应）

**请求体**：
```json
{
  "raw_prompt": "帮我写一个API接口",
  "intent": "auto",
  "professionalism": "intermediate",
  "length": "medium",
  "format": "code"
}
```

**参数说明**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| raw_prompt | string | 必填 | 用户输入的原始提示词 |
| intent | string | auto | 意图分类：auto/creative/coding/analysis/qa/roleplay |
| professionalism | string | intermediate | 专业度：beginner/intermediate/expert |
| length | string | medium | 长度：short/medium/detailed |
| format | string | paragraph | 格式：paragraph/list/code |

**响应**（SSE 流）：
```
data: {"type":"token","content":"**"}
data: {"type":"token","content":"角色"}
...
data: {"type":"done","analysis":{"format_type":"rtccf","intent_category":"编程类","confidence":"high"}}
```

### GET /api/history

获取优化历史记录（最近 50 条）

**响应**：
```json
[
  {
    "id": 1,
    "raw_prompt": "帮我写一个API接口",
    "optimized_prompt": "**角色**：...",
    "intent_category": "编程类",
    "created_at": "2026-06-15T12:00:00.000Z"
  }
]
```

### DELETE /api/history/:id

删除指定历史记录

**响应**：
```json
{ "success": true }
```

## 🎯 优化输出格式

系统会根据任务类型自动选择最优格式：

### RTCCF 分区（默认，80% 场景）

```
**角色**：[专业身份] + [经验年限/领域特长]

**任务**：[动词开头] + [具体目标] + [量化指标]

**上下文**：
- 技术/业务背景
- 目标受众或使用场景

**约束**：
- [边界条件 1，带具体数字]
- [边界条件 2，带具体数字]
- [明确不要做的事]

**输出格式**：[结构] + [长度] + [语言/风格]
```

### 指令先行（简单任务）

```
[动词] + [核心目标]，[关键约束]。

背景：[最少必要上下文，1-2句]
格式：[输出结构要求]
```

### 思维链引导（推理/计算任务）

```
[问题陈述，给出所有已知条件]

请按以下步骤逐步分析：

第一步：[梳理已知信息]
第二步：[分解子问题]
第三步：[逐一推导/计算]
第四步：[验证结论/排除边界情况]

在每一步写出完整推理过程，最后给出最终结论。
```

### 少样本锚定（格式复制/批量处理）

```
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
```

## ⚙️ 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| DEEPSEEK_API_KEY | 是 | - | DeepSeek API 密钥 |
| DEEPSEEK_BASE_URL | 否 | https://api.deepseek.com | API 基础地址 |
| PORT | 否 | 3001 | 服务端口 |

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + Vite | 快速构建，热更新 |
| 后端 | Node.js + Express | 异步高性能 |
| 数据库 | SQLite (better-sqlite3) | 零配置，单文件 |
| LLM | DeepSeek V4 Flash | 高性价比，中文优化 |
| 部署 | Docker / PM2 | 灵活部署方案 |

## 📊 优化规则

系统会自动检测并消除以下反模式：

| 低效表达 | 优化后 |
|---------|--------|
| "详细说明" | "分3个步骤说明，每步不超过100字" |
| "专业一点" | "使用行业标准术语，适合有3年经验的从业者" |
| "写得好一点" | "开头用钩子吸引注意，正文用数据支撑，结尾用CTA" |
| "尽量全面" | "覆盖以下5个维度：成本、安全性、可扩展性、用户体验、维护性" |
| "优化一下" | "减少30%冗余代码，保持功能不变，添加错误处理" |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
