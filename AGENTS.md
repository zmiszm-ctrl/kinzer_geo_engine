# GEO 引擎平台 - 项目指南

## 项目概览

GEO（Generative Engine Optimization）引擎平台，帮助企业优化内容在 AI 搜索引擎中的可见性和引用率。产品定位为**本地运行、不依赖云端数据库**的轻量级工具。当前为 MVP v0.1.0 阶段。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5 (strict)
- **UI 组件**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (better-sqlite3) — 本地文件数据库，零配置
- **LLM**: 自定义 Provider (`src/lib/llm-provider.ts`)，智谱优先 + DeepSeek 备选
- **包管理器**: pnpm (严禁 npm/yarn)

## 目录结构

```
├── src/
│   ├── app/
│   │   ├── (admin)/            # 管理后台布局组
│   │   │   ├── layout.tsx      # 侧边栏 + 内容区布局
│   │   │   ├── overview/       # 平台总览页面
│   │   │   ├── intent/         # 意图挖掘模块
│   │   │   │   ├── types/      # 意图分类体系页面
│   │   │   │   └── custom/     # 自定义意图页面
│   │   │   ├── writing/        # GEO 智能写作页面
│   │   │   └── settings/       # 系统设置
│   │   │       ├── model-config/  # 模型配置页面
│   │   │       └── database/      # 数据库管理页面
│   │   ├── api/                # API 路由
│   │   │   ├── intent-types/   # 意图分类 CRUD
│   │   │   ├── intents/        # 意图 CRUD + 批量创建
│   │   │   │   └── mine/       # AI 意图挖掘
│   │   │   ├── writing/        # 写作引擎
│   │   │   │   ├── generate/   # 流式内容生成
│   │   │   │   └── save/       # 保存生成内容
│   │   │   ├── chat/           # AI 对话
│   │   │   │   ├── route.ts    # 流式对话接口
│   │   │   │   ├── system-prompt/ # 系统提示词管理
│   │   │   │   └── history/    # 对话历史管理
│   │   │   └── settings/       # 设置
│   │   │       ├── model-config/  # 模型配置 CRUD
│   │   │       └── database/      # 数据库查询接口
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页 (重定向 /overview)
│   │   └── globals.css         # 全局样式 + 设计系统令牌
│   ├── components/
│   │   ├── app-sidebar.tsx     # 导航侧边栏
│   │   ├── chat-widget.tsx     # AI 对话悬浮窗
│   │   └── ui/                 # shadcn/ui 组件
│   └── lib/
│       ├── db.ts               # SQLite 数据库客户端 (export getDb)
│       ├── llm-provider.ts     # LLM Provider (智谱优先 + DeepSeek 降级)
│       └── utils.ts            # cn() 工具函数
├── data/                       # 数据目录 (SQLite + 对话历史)
│   └── geo.db                  # SQLite 数据库文件 (自动创建)
├── chat-history/               # 对话历史 (按天MD文件)
├── chat-system-prompt.md       # AI对话系统提示词 (可编辑)
├── model.md                    # 模型API密钥配置 (已加入.gitignore)
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

### 技术选型
- **SQLite** (better-sqlite3) — 本地文件数据库，无需安装和配置
- 数据文件位置: `data/geo.db`（自动创建）
- 同步 API，无需 async/await

### 表结构
- **intent_types**: 意图分类体系 (4个L1分类 + 9个L2子分类，内置数据)
- **intents**: 意图列表 (AI挖掘 + 手动创建)
- **generated_contents**: 生成内容存储
- **model_configs**: 模型配置 (提供商、API Key、模型参数、优先级)

### 关键规则
- **数据库客户端**: 使用 `import { getDb } from '@/lib/db'` 获取实例
- **查询**: `getDb().all(sql, params)` / `getDb().get(sql, params)` / `getDb().run(sql, params)`
- **SQLite 限制**: 只能绑定 number/string/buffer/null，布尔值必须转为 0/1
- **自增ID**: 使用 `lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))` 生成 UUID

### 种子数据
intent_types 预置 13 条记录:
- L1: informational, navigational, commercial, transactional
- L2: informational_understand/explain/compare/howto, navigational_brand, commercial_research/compare, transactional_buy/download

model_configs 预置 2 条记录:
- zhipu: glm-4.5-air (优先级 1)
- deepseek: deepseek-v4-flash (优先级 2)

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
| `/api/chat` | POST | AI 对话 (流式 SSE) |
| `/api/chat/system-prompt` | GET | 获取系统提示词 |
| `/api/chat/system-prompt` | PUT | 更新系统提示词 |
| `/api/chat/history` | GET | 获取对话历史 |
| `/api/chat/history` | POST | 保存对话历史 |
| `/api/settings/model-config` | GET | 获取模型配置列表 |
| `/api/settings/model-config` | PUT | 更新模型配置 |
| `/api/settings/model-config` | POST | 测试模型连接 |
| `/api/settings/database` | GET | 查询数据库表结构和数据 |

## LLM 集成

使用自定义 LLM Provider (`src/lib/llm-provider.ts`)，从数据库读取模型配置，支持智谱优先 + DeepSeek 备选的自动降级策略。

### 配置来源
1. **数据库 model_configs 表**（优先）— 通过"系统设置 > 模型配置"页面管理
2. **model.md 文件**（降级）— 数据库无配置时读取
3. **环境变量**（最终降级）— `BIGMODEL_API_KEY` / `DEEPSEEK_API_KEY`

### 使用方式
```typescript
import { llmInvoke, llmStream } from '@/lib/llm-provider';

// 非流式
const result = await llmInvoke(messages, { temperature: 0.7 });
// result.content, result.provider, result.model

// 流式
const stream = llmStream(messages, { temperature: 0.8, maxTokens: 4096 });
for await (const chunk of stream) {
  // chunk.content, chunk.done, chunk.provider
}
```

### 降级策略
1. 按 priority 排序从数据库读取已启用的提供商配置
2. 优先调用智谱 API，失败自动切换 DeepSeek
3. 所有提供商失败 → 抛出 "所有LLM提供商调用失败" 错误

## 设计系统

详见 `DESIGN_SYSTEM.md`。核心原则:
- 低饱和高级灰阶、莫兰迪辅助色
- 无衬线现代字体 (Inter → PingFang SC → Microsoft YaHei)
- 主色 `#6366f1`，极简圆角、软投影
- 严禁高饱和艳色、过度装饰

## MVP 功能范围

### 已实现
1. 平台总览 (功能介绍、业务流程、模块导航)
2. 意图分类体系管理 (查看、新增、编辑、新增子分类)
3. 自定义意图管理 (AI挖掘、手动创建、编辑、删除)
4. GEO 智能写作 (选择意图 → 多风格流式生成 → 保存)
5. 模型配置 (API Key管理、模型选择、Thinking Mode、参数配置、优先级切换)
6. 数据库管理 (查看表结构、浏览数据、分页)
7. AI 对话悬浮窗 (可拖拽、吸附边缘、流式对话、系统提示词编辑、按天保存历史)

### 菜单已创建但未实现
- 知识资产管理
- 内容结构化引擎
- 发布与链接管理
- GEO 监测与分析
- A/B 测试与迭代

## 编码规范

- TypeScript strict 模式，禁止隐式 any / as any
- 函数参数、返回值、事件对象必须标注类型
- React 17+ 不要 `import React`，除非使用 `React.xxx`
- 严禁在 JSX 中直接使用 `typeof window`、`Date.now()` 等 (用 useEffect + useState)
- 禁止 `<head>` 标签，使用 `metadata` 或 `globals.css` @import
- next.config.ts 路径必须使用 `path.resolve(__dirname, ...)` 动态拼接
- SQLite 布尔值使用 0/1，不能直接绑定 true/false

## 常见问题

### 数据库文件位置
- 开发环境: `{project_root}/data/geo.db`
- 首次启动自动创建并初始化种子数据
- 删除 `data/geo.db` 后重启会自动重建

### LLM 调用失败
- 使用 `llmInvoke` / `llmStream` 从 `@/lib/llm-provider` 导入
- 配置优先级: 数据库 model_configs → model.md 文件 → 环境变量
- 可在"系统设置 > 模型配置"中管理 API Key 和参数

### SQLite 绑定错误
- 错误 "can only bind numbers, strings, bigints, buffers, and null"
- 原因: 传入了 undefined、boolean 或对象类型参数
- 修复: 确保所有绑定值为 string|number|null，布尔值转为 0/1
