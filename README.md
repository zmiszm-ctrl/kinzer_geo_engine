# GEO 引擎平台

> 帮助企业优化内容在 AI 搜索引擎中的可见性和引用率

GEO（Generative Engine Optimization）引擎平台，通过意图挖掘、智能写作、多风格内容生成，帮助企业内容在 AI 搜索引擎中获得更高的引用率和可见性。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16 |
| 核心 | React | 19 |
| 语言 | TypeScript | 5 (strict) |
| UI 组件 | shadcn/ui (Radix UI) | — |
| 样式 | Tailwind CSS | 4 |
| 数据库 | Supabase (PostgreSQL) | — |
| ORM | Drizzle ORM (仅 Schema 定义) | — |
| 数据操作 | Supabase SDK | — |
| LLM | 智谱 (ZhiPu) + DeepSeek (自动降级) | — |
| 包管理 | pnpm | — |

## 环境要求

- **Node.js** ≥ 18
- **pnpm** ≥ 8
- **PostgreSQL** (通过 Supabase 托管)

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase 数据库连接（由平台自动注入，无需手动配置）
COZE_SUPABASE_URL=<your-supabase-url>
COZE_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# LLM API Key（也可在系统设置 > 模型配置中管理）
BIGMODEL_API_KEY=<your-zhipu-api-key>
DEEPSEEK_API_KEY=<your-deepseek-api-key>
```

### 3. 数据库初始化

```bash
# 执行数据库迁移（创建所有表结构）
npx coze-coding-ai db upgrade

# 插入种子数据（意图分类体系 + 默认模型配置）
# 详见下方"种子数据"章节
```

### 4. 开发模式

```bash
pnpm dev
```

服务启动在 `http://localhost:5000`，支持热更新。

### 5. 生产构建与启动

```bash
pnpm build          # 构建生产版本
pnpm start          # 启动生产服务
```

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── (admin)/                # 管理后台布局组
│   │   │   ├── layout.tsx          # 侧边栏 + 内容区布局
│   │   │   ├── intent/             # 意图挖掘模块
│   │   │   │   ├── types/          #   意图分类体系页面
│   │   │   │   └── custom/         #   自定义意图页面
│   │   │   ├── writing/            # GEO 智能写作页面
│   │   │   └── settings/           # 系统设置
│   │   │       └── model-config/   #   模型配置页面
│   │   ├── api/                    # API 路由
│   │   │   ├── intent-types/       #   意图分类 CRUD
│   │   │   ├── intents/            #   意图 CRUD + AI 挖掘
│   │   │   │   └── mine/           #     AI 意图挖掘
│   │   │   ├── writing/            #   写作引擎
│   │   │   │   ├── generate/       #     流式内容生成
│   │   │   │   └── save/           #     保存生成内容
│   │   │   └── settings/           #   系统设置
│   │   │       └── model-config/   #     模型配置管理
│   │   ├── layout.tsx              # 根布局
│   │   ├── page.tsx                # 首页 (重定向到 /intent/types)
│   │   └── globals.css             # 全局样式 + 设计令牌
│   ├── components/
│   │   ├── app-sidebar.tsx         # 导航侧边栏
│   │   └── ui/                     # shadcn/ui 组件库
│   ├── lib/
│   │   ├── db.ts                   # Supabase 客户端
│   │   ├── llm-provider.ts         # LLM Provider (智谱优先 + DeepSeek 降级)
│   │   └── utils.ts                # 工具函数 (cn 等)
│   └── storage/
│       └── database/
│           ├── shared/
│           │   ├── schema.ts        # Drizzle 表结构定义 (仅迁移用)
│           │   └── relations.ts     # Drizzle 关系定义
│           └── supabase-client.ts   # Supabase SDK 客户端
├── scripts/                        # 构建/启动脚本
├── DESIGN_SYSTEM.md                # 设计规范文档
├── GEO_ENGINE_ARCHITECTURE.md      # 架构文档
├── AGENTS.md                       # 项目开发指南
└── .coze                           # 构建运行配置
```

## 功能模块

### 已实现 (MVP v0.1.0)

| 模块 | 功能 | 路径 |
|------|------|------|
| 意图分类体系 | 查看/新增/编辑分类，树形结构展示 | `/intent/types` |
| 自定义意图 | AI 意图挖掘、手动创建、编辑、删除 | `/intent/custom` |
| GEO 智能写作 | 选择意图 → 多风格流式生成 → 保存 | `/writing` |
| 模型配置 | API Key 管理、模型选择、参数配置、优先级切换 | `/settings/model-config` |

### 规划中 (菜单已创建)

- 知识资产管理
- 内容结构化引擎
- 发布与链接管理
- GEO 监测与分析
- A/B 测试与迭代

## API 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/intent-types` | 创建意图分类 |
| PUT | `/api/intent-types` | 更新意图分类 |
| POST | `/api/intents` | 批量创建意图 |
| PUT | `/api/intents` | 更新意图 |
| DELETE | `/api/intents` | 删除意图 |
| POST | `/api/intents/mine` | AI 意图挖掘 |
| POST | `/api/writing/generate` | 流式内容生成 (SSE) |
| POST | `/api/writing/save` | 保存生成内容 |
| GET | `/api/settings/model-config` | 获取模型配置 |
| PUT | `/api/settings/model-config` | 更新模型配置 |
| POST | `/api/settings/model-config` | 测试模型连接 |

## 数据库

### 表结构

| 表名 | 说明 | 初始记录 |
|------|------|----------|
| `intent_types` | 意图分类体系 | 13 条 (4 L1 + 9 L2) |
| `intents` | 意图列表 | — |
| `generated_contents` | 生成内容 | — |
| `model_configs` | 模型配置 | 2 条 (智谱 + DeepSeek) |

### 数据操作规范

- **Schema 定义**：使用 Drizzle ORM (`src/storage/database/shared/schema.ts`)
- **数据操作**：必须使用 Supabase SDK (`supabase.from('table').select()...`)
- **禁止**：使用 Drizzle ORM 的 `db.select()` / `db.insert()` 等方法做数据操作
- **迁移**：`npx coze-coding-ai db upgrade`
- **RLS**：所有表已启用 RLS，后端使用 `service_role_key` 绕过

### 种子数据

`intent_types` 预置 13 条分类记录：

**L1 分类 (4个)**：
| 编码 | 名称 |
|------|------|
| `informational` | 信息型 |
| `navigational` | 导航型 |
| `commercial` | 商业型 |
| `transactional` | 交易型 |

**L2 子分类 (9个)**：
| 编码 | 名称 | 父级 |
|------|------|------|
| `informational_understand` | 理解型 | informational |
| `informational_explain` | 解释型 | informational |
| `informational_compare` | 对比型 | informational |
| `informational_howto` | 方法型 | informational |
| `navigational_brand` | 品牌导航 | navigational |
| `commercial_research` | 商业调研 | commercial |
| `commercial_compare` | 商业对比 | commercial |
| `transactional_buy` | 购买型 | transactional |
| `transactional_download` | 下载型 | transactional |

## LLM 集成

### 架构

系统使用自定义 LLM Provider (`src/lib/llm-provider.ts`)，支持智谱 + DeepSeek 双提供商自动降级。配置存储在数据库 `model_configs` 表中，运行时动态读取（60 秒缓存）。

### 降级策略

```
请求 → 智谱 (priority=1) → 成功 → 返回
                          → 失败 → DeepSeek (priority=2) → 成功 → 返回
                                                            → 失败 → 抛出错误
```

### 代码使用

```typescript
import { llmInvoke, llmStream } from '@/lib/llm-provider';

// 非流式调用
const result = await llmInvoke(
  [{ role: 'user', content: '你好' }],
  { temperature: 0.7, maxTokens: 4096 }
);
console.log(result.content, result.provider, result.model);

// 流式调用
const stream = llmStream(messages, { temperature: 0.8 });
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### 支持模型

**智谱 (ZhiPu)**：
| 模型 ID | 说明 |
|---------|------|
| `glm-4.5-air` | 均衡性价比，推荐日常使用 (默认) |
| `glm-4.5` | 标准版，能力更全面 |
| `glm-4.6` | 增强版，推理能力更强 |
| `glm-4.7` | 最新版，旗舰级能力 |
| `glm-5` | GLM-5 标准版 |
| `glm-5-turbo` | GLM-5 快速版 |
| `glm-5.1` | GLM-5.1 最新旗舰 |

**DeepSeek**：
| 模型 ID | 说明 |
|---------|------|
| `deepseek-v4-flash` | 快速响应，适合批量生成 (默认) |
| `deepseek-v4-pro` | 深度推理，支持 Thinking Mode |

### Thinking Mode (DeepSeek)

DeepSeek V4 Pro 支持深度推理模式，可在系统设置 > 模型配置中开启：

| 参数 | 值 | 说明 |
|------|-----|------|
| `thinking` | `{ type: "enabled" }` | 开启深度推理 |
| `reasoning_effort` | `low` / `medium` / `high` / `max` | 推理深度，越高质量越好但耗时越长 |

## 设计规范

遵循 `DESIGN_SYSTEM.md` 中的设计令牌：

- **主色**：`#6366f1`
- **风格**：低饱和高级灰阶、莫兰迪辅助色、极简圆角、软投影
- **字体**：Inter → PingFang SC → Microsoft YaHei
- **原则**：极简克制、留白充足、科技理性、企业级稳重

## 常用命令

```bash
# 开发
pnpm install              # 安装依赖
pnpm dev                  # 启动开发服务 (端口 5000)

# 构建
pnpm build                # 生产构建
pnpm start                # 启动生产服务

# 代码质量
pnpm lint                 # ESLint 检查
pnpm ts-check             # TypeScript 类型检查

# 数据库
npx coze-coding-ai db upgrade   # 执行数据库迁移

# 清理
rm -rf .next              # 清除构建缓存 (下次 dev/build 自动重建)
```

## 常见问题

### 数据库连接失败

确认环境变量 `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_SERVICE_ROLE_KEY` 存在。数据操作必须使用 Supabase SDK，不要使用 Drizzle ORM 的 `db.select()` 等方法。

### LLM 调用失败

1. 检查系统设置 > 模型配置中的 API Key 是否正确
2. 使用「测试连接」功能验证 API Key 可用性
3. 确认至少一个提供商已启用
4. 查看控制台日志中的 `[LLM]` 前缀错误信息

### 端口冲突

服务默认运行在 5000 端口。如需修改，编辑 `.coze` 配置文件中的 `run` 命令。

## 许可证

Private - All Rights Reserved
