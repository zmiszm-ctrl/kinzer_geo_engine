# GEO 引擎平台 - 项目指南

## 项目概览

GEO（Generative Engine Optimization）引擎平台，帮助企业优化内容在 AI 搜索引擎中的可见性和引用率。当前为 MVP v0.1.0 阶段。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5 (strict)
- **UI 组件**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL) + Drizzle ORM (仅 schema 定义)
- **数据操作**: Supabase SDK (`@supabase/supabase-js`)
- **LLM**: 自定义 Provider (`src/lib/llm-provider.ts`)，智谱优先 + DeepSeek 备选
- **包管理器**: pnpm (严禁 npm/yarn)

## 目录结构

```
├── src/
│   ├── app/
│   │   ├── (admin)/            # 管理后台布局组
│   │   │   ├── layout.tsx      # 侧边栏 + 内容区布局
│   │   │   ├── intent/         # 意图挖掘模块
│   │   │   │   ├── types/      # 意图分类体系页面
│   │   │   │   └── custom/     # 自定义意图页面
│   │   │   └── writing/        # GEO 智能写作页面
│   │   │   └── settings/       # 系统设置
│   │   │       └── model-config/ # 模型配置页面
│   │   ├── api/                # API 路由
│   │   │   ├── intent-types/   # 意图分类 CRUD
│   │   │   ├── intents/        # 意图 CRUD + 批量创建
│   │   │   │   └── mine/       # AI 意图挖掘
│   │   │   └── writing/        # 写作引擎
│   │   │       ├── generate/   # 流式内容生成
│   │   │       └── save/       # 保存生成内容
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页 (重定向 /intent/types)
│   │   └── globals.css         # 全局样式 + 设计系统令牌
│   ├── components/
│   │   ├── app-sidebar.tsx     # 导航侧边栏
│   │   └── ui/                 # shadcn/ui 组件
│   ├── lib/
│   │   ├── db.ts               # Supabase 客户端 (export supabase)
│   │   └── utils.ts            # cn() 工具函数
│   └── storage/
│       └── database/
│           ├── shared/
│           │   ├── schema.ts   # Drizzle 表结构定义 (仅迁移用)
│           │   └── relations.ts # Drizzle 关系定义
│           └── supabase-client.ts # Supabase SDK 客户端
├── DESIGN_SYSTEM.md            # 设计规范文档
├── GEO_ENGINE_ARCHITECTURE.md  # 架构文档
└── .coze                       # 构建运行配置
```

## 构建和测试命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发环境 (端口 5000)
pnpm build            # 生产构建
pnpm lint             # ESLint 检查
pnpm ts-check         # TypeScript 类型检查
```

## 数据库

### 表结构
- **intent_types**: 意图分类体系 (4个L1分类 + 9个L2子分类，内置数据)
- **intents**: 意图列表 (AI挖掘 + 手动创建)
- **generated_contents**: 生成内容存储
- **model_configs**: 模型配置 (提供商、API Key、模型参数、优先级)

### 关键规则
- **Schema 定义**: 使用 Drizzle ORM (`src/storage/database/shared/schema.ts`)
- **数据操作**: 必须使用 Supabase SDK (`supabase.from('table').select()...`)
- **禁止**: 使用 Drizzle ORM 的 `db.select()` / `db.insert()` 等方法做数据操作
- **迁移**: 使用 `npx coze-coding-ai db upgrade`
- **RLS**: 所有表已启用 RLS，后端使用 service_role_key 绕过

### 种子数据
intent_types 预置 13 条记录:
- L1: informational, navigational, commercial, transactional
- L2: informational_understand/explain/compare/howto, navigational_brand, commercial_research/compare, transactional_buy/download

## API 接口

| 路径 | 方法 | 功能 |
|------|------|------|
| `/api/intent-types` | POST | 创建意图分类 |
| `/api/intent-types` | PUT | 更新意图分类 |
| `/api/intents` | POST | 批量创建意图 |
| `/api/intents` | PUT | 更新意图 |
| `/api/intents` | DELETE | 删除意图 |
| `/api/intents/mine` | POST | AI 意图挖掘 (LLM) |
| `/api/writing/generate` | POST | 流式内容生成 (LLM stream) |
| `/api/writing/save` | POST | 保存生成内容 |
| `/api/settings/model-config` | GET | 获取模型配置列表 |
| `/api/settings/model-config` | PUT | 更新模型配置 |
| `/api/settings/model-config` | POST | 测试模型连接 |

## LLM 集成

使用自定义 LLM Provider (`src/lib/llm-provider.ts`)，支持智谱优先 + DeepSeek 备选的自动降级策略。

### 配置
- **智谱 (ZhiPu)**: 模型 `glm-4.5-air`，API Key 来自 `BIGMODEL_API_KEY` 环境变量
- **DeepSeek**: 模型 `deepseek-v4-flash`，API Key 来自 `DEEPSEEK_API_KEY` 环境变量
- 密钥配置文件: `model.md`

### 使用方式
```typescript
import { llmInvoke, llmStream } from '@/lib/llm-provider';

// 非流式 (智谱优先，失败自动切DeepSeek)
const result = await llmInvoke(messages, { temperature: 0.7 });
// result.content, result.provider, result.model

// 流式 (智谱优先，失败自动切DeepSeek)
const stream = llmStream(messages, { temperature: 0.8, maxTokens: 4096 });
for await (const chunk of stream) {
  // chunk.content, chunk.done, chunk.provider
}
```

### 降级策略
1. 优先调用智谱 API
2. 智谱调用失败（网络错误、HTTP 非200、流无内容）→ 自动切换 DeepSeek
3. 所有提供商失败 → 抛出 "所有LLM提供商调用失败" 错误

## 设计系统

详见 `DESIGN_SYSTEM.md`。核心原则:
- 低饱和高级灰阶、莫兰迪辅助色
- 无衬线现代字体 (Inter → PingFang SC → Microsoft YaHei)
- 主色 `#6366f1`，极简圆角、软投影
- 严禁高饱和艳色、过度装饰

## MVP 功能范围

### 已实现
1. 意图分类体系管理 (查看、新增、编辑、新增子分类)
2. 自定义意图管理 (AI挖掘、手动创建、编辑、删除)
3. GEO 智能写作 (选择意图 → 多风格流式生成 → 保存)
4. 模型配置 (API Key管理、模型选择、Thinking Mode、参数配置、优先级切换)

### 菜单已创建但未实现
- 知识资产管理
- 内容结构化引擎
- 发布与链接管理
- GEO 监测与分析
- A/B 测试与迭代
- 系统设置

## 编码规范

- TypeScript strict 模式，禁止隐式 any / as any
- 函数参数、返回值、事件对象必须标注类型
- React 17+ 不要 `import React`，除非使用 `React.xxx`
- 严禁在 JSX 中直接使用 `typeof window`、`Date.now()` 等 (用 useEffect + useState)
- 禁止 `<head>` 标签，使用 `metadata` 或 `globals.css` @import
- next.config.ts 路径必须使用 `path.resolve(__dirname, ...)` 动态拼接

## 常见问题

### 数据库连接失败
- 确认 `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_SERVICE_ROLE_KEY` 环境变量存在
- 数据操作必须使用 Supabase SDK，不要用 Drizzle ORM

### LLM 调用失败
- 使用 `llmInvoke` / `llmStream` 从 `@/lib/llm-provider` 导入
- 智谱优先，DeepSeek 备选，自动降级
- 密钥配置: `model.md` 文件或环境变量 `BIGMODEL_API_KEY` / `DEEPSEEK_API_KEY`
