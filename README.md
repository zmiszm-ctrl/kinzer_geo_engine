# GEO 引擎平台

> Generative Engine Optimization — 帮助企业优化内容在 AI 搜索引擎中的可见性和引用率

**版本**: MVP v0.1.0  
**技术栈**: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 + SQLite + shadcn/ui

---

## 目录

- [功能概览](#功能概览)
- [技术架构](#技术架构)
- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [环境变量](#环境变量)
- [数据库](#数据库)
- [LLM 集成](#llm-集成)
- [项目结构](#项目结构)
- [API 接口](#api-接口)
- [对话功能](#对话功能)
- [常见问题](#常见问题)

---

## 功能概览

| 模块 | 功能 | 状态 |
|------|------|------|
| 平台总览 | 平台介绍、业务流程、功能导航 | ✅ 已上线 |
| 意图分类体系 | 4 大 L1 分类 + 多级 L2 子分类管理 | ✅ 已上线 |
| 自定义意图管理 | AI 挖掘意图 + 手动创建/编辑/删除 | ✅ 已上线 |
| GEO 智能写作 | 选择意图 → 多风格流式生成 → 保存 | ✅ 已上线 |
| 模型配置 | API Key / 模型选择 / Thinking Mode / 参数调优 | ✅ 已上线 |
| AI 对话助手 | 悬浮窗 + 多轮对话 + 流式输出 | ✅ 已上线 |
| 知识资产管理 | 导入、清洗、图谱、版本 | 🔜 规划中 |
| 内容结构化引擎 | 切片、重排、Schema、证据强化 | 🔜 规划中 |
| 发布与链接管理 | 多渠道发布、锚文本、引用矩阵 | 🔜 规划中 |
| GEO 监测与分析 | 引用率、准确率、流量、竞品看板 | 🔜 规划中 |
| A/B 测试与迭代 | 版本对比、效果分析、一键重写 | 🔜 规划中 |

---

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                  前端 (Next.js 16)                │
│  App Router + React 19 + Tailwind CSS 4          │
│  shadcn/ui 组件库 + Server/Client Components     │
├─────────────────────────────────────────────────┤
│                  API Routes                       │
│  意图管理 / 写作引擎 / 对话 / 模型配置            │
│  SSE 流式输出 + SQLite 本地数据操作               │
├──────────────┬──────────────────────────────────┤
│   数据层      │         LLM 层                    │
│  SQLite      │  智谱 (优先) → DeepSeek (降级)     │
│  better-sqlite3 │ 流式/非流式 + Thinking Mode        │
└──────────────┴──────────────────────────────────┘
```

---

## 本地开发

### 前置要求

- **Node.js** ≥ 20
- **pnpm** ≥ 9（严禁使用 npm/yarn）
- 操作系统：Linux / macOS / Windows (WSL)

### 步骤 1: 克隆项目

```bash
git clone <repo-url> && cd geo-engine
```

### 步骤 2: 安装依赖

```bash
pnpm install
```

### 步骤 3: 配置环境变量

创建 `.env.local` 文件：

```bash
# 无需额外环境变量配置
# 数据库：SQLite（本地文件 data/geo.db，自动创建）
# LLM API Key：通过「系统设置 > 模型配置」页面管理，或编辑 model.md 文件
```

> **注意**: 项目使用 SQLite 本地数据库，零配置，无需安装和连接任何外部数据库服务。

### 步骤 4: 初始化数据库

数据库在首次启动时自动创建并初始化：
- 自动创建 `data/geo.db` 文件
- 自动建表：`intent_types`、`intents`、`generated_contents`、`model_configs`
- 自动插入种子数据：
  - 意图分类（13 条）：4 个 L1 + 9 个 L2 分类
  - 模型配置（2 条）：智谱 + DeepSeek 默认配置

### 步骤 5: 配置 LLM 密钥

密钥配置方式有两种（任选其一）：

**方式 A：通过界面配置（推荐）**

启动服务后，进入 **系统设置 → 模型配置** 页面，在线填写 API Key 并测试连接。

**方式 B：通过数据库配置**

```sql
UPDATE model_configs SET api_key = 'your-zhipu-key' WHERE provider = 'zhipu';
UPDATE model_configs SET api_key = 'your-deepseek-key' WHERE provider = 'deepseek';
```

### 步骤 6: 启动开发服务器

```bash
# 方式 1：使用 Coze CLI（沙箱环境）
coze dev

# 方式 2：直接使用 pnpm
pnpm dev
```

服务启动在 **5000** 端口，访问 http://localhost:5000

### 步骤 7: 编辑对话系统提示词（可选）

对话助手的系统提示词保存在项目根目录的 `chat-system-prompt.md` 文件中，可以直接编辑：

```bash
vim chat-system-prompt.md
```

也可以通过对话窗口的设置图标在线编辑。

---

## 生产部署

### 方式 1：Coze Coding 平台部署（推荐）

平台会自动执行构建和部署，无需手动操作：

1. **提交代码** — 将代码推送到 Git 仓库
2. **触发部署** — 平台自动执行 `.coze` 中定义的 build 和 run 命令
3. **访问应用** — 通过平台分配的域名访问

`.coze` 配置：

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]

[deploy]
build = ["bash", "scripts/build.sh"]
run = ["bash", "scripts/start.sh"]
```

### 方式 2：手动部署

#### 2.1 构建生产版本

```bash
# 安装依赖
pnpm install --frozen-lockfile

# 构建 Next.js + 打包服务端
bash scripts/build.sh
```

构建产物：
- `.next/` — Next.js 静态资源和服务端页面
- `dist/server.js` — 自定义 Node.js 服务入口

#### 2.2 启动生产服务

```bash
# 直接启动
PORT=5000 node dist/server.js

# 或使用启动脚本
bash scripts/start.sh
```

#### 2.3 进程管理（生产环境推荐）

```bash
# 使用 PM2
pm2 start dist/server.js --name geo-engine -- -p 5000

# 或使用 systemd
# 创建 /etc/systemd/system/geo-engine.service
```

#### 2.4 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_remote_addr;
        proxy_cache_bypass $http_upgrade;
        
        # SSE 流式响应需要关闭缓冲
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

> **重要**: Nginx 必须关闭 `proxy_buffering`，否则 SSE 流式输出（写作生成、AI 对话）会被缓冲，无法实时显示。

---

## 环境变量

| 变量名 | 说明 | 必须 | 默认值 |
|--------|------|------|--------|
| `COZE_WORKSPACE_PATH` | 项目工作目录 | ✅ | `/workspace/projects` |
| `DEPLOY_RUN_PORT` | 服务监听端口 | ✅ | `5000` |
| `COZE_PROJECT_ENV` | 运行环境 `DEV`/`PROD` | ✅ | `DEV` |
| `COZE_PROJECT_DOMAIN_DEFAULT` | 对外访问域名 | ✅ | — |

> 项目使用 SQLite 本地数据库，无需配置外部数据库连接。LLM API Key 通过 `model.md` 文件或「系统设置 > 模型配置」页面管理。

---

## 数据库

### 表结构

| 表名 | 说明 | 初始记录数 |
|------|------|-----------|
| `intent_types` | 意图分类体系 | 13 条（4 L1 + 9 L2） |
| `intents` | 用户意图列表 | 0 |
| `generated_contents` | 生成内容存储 | 0 |
| `model_configs` | 模型配置 | 2 条（智谱 + DeepSeek） |

### 数据操作规范

- **数据库客户端**: 使用 `import { getDb } from '@/lib/db'` 获取实例
- **查询**: `getDb().all(sql, params)` / `getDb().get(sql, params)` / `getDb().run(sql, params)`
- **SQLite 限制**: 只能绑定 number/string/buffer/null，布尔值必须转为 0/1
- **自增ID**: 使用 `lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))` 生成 UUID
- **数据库文件位置**: `data/geo.db`（首次启动自动创建）
- **重置数据库**: 删除 `data/geo.db` 后重启服务即可重建

---

## LLM 集成

### 降级策略

```
智谱 API (优先级 1)
    │
    ├─ 成功 → 返回结果
    │
    └─ 失败（网络错误/HTTP 非200/流无内容）
        │
        └─ DeepSeek API (优先级 2)
              │
              ├─ 成功 → 返回结果
              │
              └─ 失败 → 抛出 "所有 LLM 提供商调用失败"
```

优先级可在 **系统设置 → 模型配置** 中通过「设为优先/设为备选」切换。

### 支持的模型

| 提供商 | 模型 | 说明 |
|--------|------|------|
| 智谱 | glm-4.5-air | 默认，速度快 |
| 智谱 | glm-4.5 | 标准版 |
| 智谱 | glm-4.6 / 4.7 / 5 / 5-turbo / 5.1 | 高级模型 |
| DeepSeek | deepseek-v4-flash | 默认，速度快 |
| DeepSeek | deepseek-v4-pro | 高级推理 |

### 代码使用

```typescript
import { llmInvoke, llmStream } from '@/lib/llm-provider';

// 非流式调用
const result = await llmInvoke(messages, { temperature: 0.7 });
// result.content, result.provider, result.model

// 流式调用
const stream = llmStream(messages, { temperature: 0.8, maxTokens: 4096 });
for await (const chunk of stream) {
  // chunk.content, chunk.done, chunk.provider
}
```

### DeepSeek Thinking Mode

在模型配置页面开启 Thinking Mode 后，DeepSeek 请求会自动附带：

```json
{
  "thinking": { "type": "enabled" },
  "reasoning_effort": "high"
}
```

支持四档：Low / Medium / High / Max

---

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── (admin)/            # 管理后台布局组
│   │   │   ├── overview/       # 平台总览
│   │   │   ├── intent/         # 意图挖掘模块
│   │   │   │   ├── types/      # 意图分类体系页面
│   │   │   │   └── custom/     # 自定义意图页面
│   │   │   ├── writing/        # GEO 智能写作页面
│   │   │   └── settings/       # 系统设置
│   │   │       └── model-config/ # 模型配置页面
│   │   ├── api/                # API 路由
│   │   │   ├── intent-types/   # 意图分类 CRUD
│   │   │   ├── intents/        # 意图 CRUD + AI 挖掘
│   │   │   │   └── mine/       # AI 意图挖掘
│   │   │   ├── writing/        # 写作引擎
│   │   │   │   ├── generate/   # 流式内容生成
│   │   │   │   └── save/       # 保存生成内容
│   │   │   ├── chat/           # AI 对话
│   │   │   │   ├── system-prompt/ # 系统提示词管理
│   │   │   │   └── history/    # 对话历史管理
│   │   │   └── settings/       # 系统设置
│   │   │       └── model-config/ # 模型配置 CRUD
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页 (重定向 /overview)
│   │   └── globals.css         # 全局样式 + 设计系统令牌
│   ├── components/
│   │   ├── app-sidebar.tsx     # 导航侧边栏
│   │   ├── chat-widget.tsx     # AI 对话悬浮窗
│   │   └── ui/                 # shadcn/ui 组件
│   ├── lib/
│   │   ├── llm-provider.ts     # LLM Provider（智谱优先+DeepSeek降级）
│   │   └── utils.ts            # cn() 工具函数
├── chat-system-prompt.md       # 对话系统提示词（可编辑）
├── chat-history/               # 对话记录存储（按天保存 MD 文件）
├── data/
│   └── geo.db                  # SQLite 数据库文件（自动创建）
├── scripts/
│   ├── build.sh                # 生产构建脚本
│   ├── start.sh                # 生产启动脚本
│   └── dev.sh                  # 开发启动脚本
├── DESIGN_SYSTEM.md            # 设计规范文档
├── GEO_ENGINE_ARCHITECTURE.md  # 架构文档
├── AGENTS.md                   # 项目指南
├── .coze                       # 构建运行配置
└── .gitignore                  # Git 忽略规则
```

---

## API 接口

### 意图分类

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/intent-types` | 创建意图分类 |
| PUT | `/api/intent-types` | 更新意图分类 |

### 意图管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/intents` | 批量创建意图 |
| PUT | `/api/intents` | 更新意图 |
| DELETE | `/api/intents` | 删除意图 |
| POST | `/api/intents/mine` | AI 意图挖掘（LLM） |

### 写作引擎

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/writing/generate` | 流式内容生成（SSE） |
| POST | `/api/writing/save` | 保存生成内容 |

### 模型配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings/model-config` | 获取模型配置列表 |
| PUT | `/api/settings/model-config` | 更新模型配置 |
| POST | `/api/settings/model-config` | 测试模型连接 |

### AI 对话

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 流式对话（SSE） |
| GET | `/api/chat/system-prompt` | 获取系统提示词 |
| PUT | `/api/chat/system-prompt` | 更新系统提示词 |
| GET | `/api/chat/history?date=YYYY-MM-DD` | 获取指定日期对话历史 |
| POST | `/api/chat/history` | 保存对话历史 |

---

## 对话功能

### 系统提示词

- 保存位置：项目根目录 `chat-system-prompt.md`
- 编辑方式：直接编辑文件 或 通过对话窗口设置图标在线编辑
- 修改后实时生效（无需重启服务）

### 对话历史

- 保存位置：`chat-history/YYYY-MM-DD.md`
- 每次打开对话窗口自动加载当天历史记录
- 按 Markdown 格式存储，包含时间戳、角色、内容、模型信息

### 悬浮窗交互

- 悬浮按钮可自由拖拽，松手自动吸附窗口左右边缘
- 点击弹出对话面板（根据按钮位置自动定位左侧/右侧）
- 支持 Enter 发送、Shift+Enter 换行
- 支持重新生成、清空对话

---

## 常见问题

### 数据库连接失败

```bash
# 检查数据库文件
ls -la data/geo.db

# 重置数据库：删除后重启会自动重建
rm data/geo.db
```

### LLM 调用失败

1. 检查 **系统设置 → 模型配置** 中的 API Key 是否正确
2. 点击「测试连接」验证密钥和模型是否可用
3. 确认至少一个提供商处于启用状态
4. 系统会自动降级：智谱失败 → DeepSeek

### 端口冲突

服务默认运行在 5000 端口，可通过 `DEPLOY_RUN_PORT` 环境变量修改：

```bash
DEPLOY_RUN_PORT=8080 pnpm dev
```

### SSE 流式输出不生效

如果通过 Nginx 反向代理，必须关闭缓冲：

```nginx
proxy_buffering off;
proxy_cache off;
```

### 对话历史丢失

- 对话记录保存在 `chat-history/` 目录下
- 生产环境中该目录需具有写入权限
- 每次打开只展示当天对话，历史日期的记录可通过 API 查询

---

## 常用命令

```bash
# 开发
pnpm install              # 安装依赖
pnpm dev                  # 启动开发服务 (端口 5000)
pnpm build                # 生产构建
pnpm lint                 # ESLint 检查
pnpm ts-check             # TypeScript 类型检查

# 数据库
rm data/geo.db && pnpm dev    # 重置数据库（自动重建+种子数据）

# 清理
rm -rf .next              # 清除构建缓存
rm -rf node_modules       # 清除依赖
pnpm install              # 重新安装
```

---

## 设计规范

详见 `DESIGN_SYSTEM.md`，核心原则：

- **主色**: `#6366f1`（Indigo）
- **风格**: 低饱和高级灰阶 + 莫兰迪辅助色
- **字体**: Inter → PingFang SC → Microsoft YaHei
- **圆角**: 4px → 24px 体系
- **原则**: 极简克制、留白充足、理性现代、无冗余装饰
