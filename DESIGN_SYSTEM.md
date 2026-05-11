# GEO引擎平台 - 设计规范

> 版本：V1.0 | 日期：2025年

---

## 一、设计理念

### 1.1 核心原则

| 原则 | 说明 | 应用场景 |
|------|------|----------|
| **极简克制** | 去除一切非必要元素，每处设计都有明确目的 | 界面层级、控件数量 |
| **低饱和美学** | 低明度中性色为主，低饱和莫兰迪辅助 | 色彩体系、图标 |
| **充足留白** | 大量留白创造呼吸感，提升内容聚焦 | 页面布局、组件间距 |
| **理性现代** | 无衬线字体、几何形态、克制的圆角 | 字体选择、形状设计 |
| **高端克制** | 科技理性、商务专业、AI极简 | 整体气质、交互反馈 |

### 1.2 风格对标

```
Apple          Google          Anthropic        GEO引擎
─────────────────────────────────────────────────────────
极简克制  →   Material You   →   Claude AI   →   本规范
大量留白  →   清晰层级      →   优雅克制    →   低饱和灰阶
精致细节  →   功能性强      →   AI专业感    →   企业级稳重
```

---

## 二、色彩体系

### 2.1 主色板（Primary Palette）

> 低明度中性色为主，单色渐变、哑光质感，拒绝高饱和艳色

```css
:root {
    /* 核心灰阶 - Neutrals */
    --color-gray-50:  #f9fafb;   /* 最浅背景 */
    --color-gray-100: #f3f4f6;   /* 浅色背景 */
    --color-gray-200: #e5e7eb;   /* 边框线 */
    --color-gray-300: #d1d5db;   /* 禁用态 */
    --color-gray-400: #9ca3af;   /* 次要文字 */
    --color-gray-500: #6b7280;   /* 占位符 */
    --color-gray-600: #4b5563;   /* 正文文字 */
    --color-gray-700: #374151;   /* 标题文字 */
    --color-gray-800: #1f2937;   /* 深色文字 */
    --color-gray-900: #111827;   /* 最深文字 */
    --color-gray-950: #0a0a0f;   /* 纯黑 */
}
```

### 2.2 功能色板（Functional Colors）

| 色组 | 色值 | 用途 | 语义 |
|------|------|------|------|
| **Primary** | `#6366f1` | 主要按钮、链接 | 品牌主色、科技蓝 |
| **Primary Light** | `#818cf8` | 悬停态 | 交互反馈 |
| **Primary Dark** | `#4f46e5` | 按下态 | 交互反馈 |
| **Success** | `#10b981` | 成功状态 | 完成、通过 |
| **Warning** | `#f59e0b` | 警告状态 | 提示、注意 |
| **Error** | `#ef4444` | 错误状态 | 失败、危险 |
| **Info** | `#3b82f6` | 信息提示 | 资讯、帮助 |

### 2.3 莫兰迪辅助色系（Morandi Palette）

> 低饱和莫兰迪色，用于数据可视化、标签、状态标识

```css
:root {
    /* 莫兰迪色系 - 低饱和 */
    --morandi-sage:      #a8b5a0;   /* 森林绿 */
    --morandi-sand:      #c9b99a;   /* 沙色 */
    --morandi-dusty:     #b8a9c9;   /* 藕粉紫 */
    --morandi-blush:     #d4a5a5;   /* 烟灰粉 */
    --morandi-slate:     #9aadb8;   /* 青灰 */
    --morandi-clay:      #c4a77d;   /* 陶土 */
    --morandi-mist:      #b5c4c9;   /* 雾蓝 */
    --morandi-lavender:  #b8b5d4;   /* 薰衣草 */
}
```

### 2.4 语义色值（Semantic Tokens）

```css
:root {
    /* 背景色 */
    --bg-primary:      #ffffff;
    --bg-secondary:    #f9fafb;
    --bg-tertiary:     #f3f4f6;
    --bg-elevated:     rgba(255, 255, 255, 0.8);
    --bg-glass:        rgba(255, 255, 255, 0.7);
    --bg-overlay:      rgba(17, 24, 39, 0.5);
    
    /* 文字色 */
    --text-primary:    #111827;     /* 主要文字 */
    --text-secondary:  #4b5563;     /* 次要文字 */
    --text-tertiary:   #9ca3af;     /* 占位符 */
    --text-disabled:   #d1d5db;     /* 禁用 */
    --text-inverse:    #ffffff;     /* 反色文字 */
    
    /* 边框色 */
    --border-default:  #e5e7eb;
    --border-subtle:   #f3f4f6;
    --border-strong:   #d1d5db;
    --border-focus:    #6366f1;
    
    /* 阴影色 */
    --shadow-sm:       0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow-md:       0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    --shadow-lg:       0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
    --shadow-xl:       0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
}
```

---

## 三、字体体系

### 3.1 字体栈（Font Stack）

```css
:root {
    /* 中文优先 */
    --font-sans-zh: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui;
    
    /* 英文优先 */
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", var(--font-sans-zh);
    
    /* 等宽字体 */
    --font-mono: "SF Mono", "Fira Code", "JetBrains Mono", "Roboto Mono", monospace;
}
```

### 3.2 字号系统（Type Scale）

> 基于 4px 网格系统，1.25 比例增量

| Token | 字号 | 行高 | 字重 | 用途 |
|-------|------|------|------|------|
| `--text-xs` | 12px | 16px | 400 | 辅助说明、标签 |
| `--text-sm` | 14px | 20px | 400 | 次要正文、按钮 |
| `--text-base` | 16px | 24px | 400 | 正文、默认 |
| `--text-lg` | 18px | 28px | 500 | 小标题、强调 |
| `--text-xl` | 20px | 28px | 600 | 卡片标题 |
| `--text-2xl` | 24px | 32px | 600 | 页面标题 |
| `--text-3xl` | 30px | 36px | 700 | 大标题 |
| `--text-4xl` | 36px | 40px | 700 | Hero标题 |

### 3.3 字重规范（Font Weight）

```css
:root {
    --font-light:      300;    /* 轻 */
    --font-normal:     400;    /* 常规 */
    --font-medium:     500;    /* 中等 */
    --font-semibold:   600;    /* 半粗 */
    --font-bold:       700;    /* 粗体 */
}

/* 字重使用场景 */
.font-light     { font-weight: 300; }  /* 长文正文 */
.font-normal    { font-weight: 400; }  /* 默认正文 */
.font-medium    { font-weight: 500; }  /* 按钮、标签 */
.font-semibold  { font-weight: 600; }  /* 小标题 */
.font-bold      { font-weight: 700; }  /* 大标题、强调 */
```

---

## 四、间距系统

### 4.1 基础间距（Spacing Scale）

> 基于 4px 网格系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-0` | 0px | 无间距 |
| `--space-1` | 4px | 紧凑间距 |
| `--space-2` | 8px | 小间距 |
| `--space-3` | 12px | 中小间距 |
| `--space-4` | 16px | 默认间距 |
| `--space-5` | 20px | 中间距 |
| `--space-6` | 24px | 中大间距 |
| `--space-8` | 32px | 大间距 |
| `--space-10` | 40px | 特大间距 |
| `--space-12` | 48px | 超大间距 |
| `--space-16` | 64px | 页面级间距 |
| `--space-20` | 80px | 超大间距 |
| `--space-24` | 96px | 极间距 |

### 4.2 组件间距规范

```css
/* 组件内间距 */
--padding-tight:    8px;     /* 紧凑 */
--padding-base:     12px;    /* 默认 */
--padding-relaxed:  16px;    /* 宽松 */
--padding-loose:    24px;    /* 宽散 */

/* 组件间间距 */
--gap-sm:   8px;     /* 紧凑 */
--gap-md:   16px;    /* 默认 */
--gap-lg:   24px;    /* 宽松 */
--gap-xl:   32px;    /* 区块间 */

/* 页面留白 */
--page-padding-x:  24px;     /* 移动端 */
--page-padding-y:  16px;
@media (min-width: 768px) {
    --page-padding-x:  48px;
    --page-padding-y:  24px;
}
@media (min-width: 1280px) {
    --page-padding-x:  64px;
    --page-padding-y:  32px;
}
```

---

## 五、圆角系统

### 5.1 圆角规范（Border Radius）

> 极简圆角、低阴影、软投影

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-none` | 0px | 无圆角（分割线） |
| `--radius-sm` | 4px | 小按钮、输入框 |
| `--radius-md` | 6px | 默认按钮、卡片 |
| `--radius-lg` | 8px | 大按钮、模态框 |
| `--radius-xl` | 12px | 面板、容器 |
| `--radius-2xl` | 16px | 大面板 |
| `--radius-full` | 9999px | 胶囊按钮、头像 |

### 5.2 使用指南

```css
/* 按钮 */
.btn-sm       { border-radius: var(--radius-sm); }   /* 图标按钮 */
.btn          { border-radius: var(--radius-md); }   /* 默认按钮 */
.btn-lg       { border-radius: var(--radius-lg); }   /* 主要按钮 */

/* 卡片 */
.card         { border-radius: var(--radius-lg); }   /* 默认卡片 */
.card-sm      { border-radius: var(--radius-md); }   /* 小卡片 */
.card-elevated { border-radius: var(--radius-xl); }  /* 浮起卡片 */

/* 输入框 */
.input        { border-radius: var(--radius-sm); }   /* 默认输入 */
.input-lg     { border-radius: var(--radius-md); }   /* 大输入框 */

/* 标签 */
.tag          { border-radius: var(--radius-full); } /* 胶囊标签 */
```

---

## 六、阴影系统

### 6.1 阴影规范（Shadows）

> 低阴影/软投影、玻璃态轻质感

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-none` | none | 无阴影 |
| `--shadow-xs` | 0 1px 2px rgba(0,0,0,0.03) | 极淡阴影 |
| `--shadow-sm` | 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) | 小元素 |
| `--shadow-md` | 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03) | 卡片、面板 |
| `--shadow-lg` | 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025) | 弹窗、下拉 |
| `--shadow-xl` | 0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02) | 模态框 |
| `--shadow-glow` | 0 0 0 3px rgba(99, 102, 241, 0.15) | 焦点环 |

### 6.2 玻璃态（Glassmorphism）

```css
.glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-dark {
    background: rgba(17, 24, 39, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 七、动效规范

### 7.1 时间曲线（Timing Functions）

> 极简微动、低动效频率、柔和过渡、高级静谧感

| Token | 值 | 用途 |
|-------|-----|------|
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | 默认过渡 |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | 进入动画 |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | 退出动画 |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | 弹性效果 |
| `--ease-smooth` | cubic-bezier(0.25, 0.1, 0.25, 1) | 平滑过渡 |

### 7.2 时长规范（Duration）

| Token | 值 | 用途 |
|-------|-----|------|
| `--duration-instant` | 0ms | 无延迟 |
| `--duration-fast` | 100ms | 微交互 |
| `--duration-normal` | 200ms | 默认过渡 |
| `--duration-slow` | 300ms | 页面过渡 |
| `--duration-slower` | 500ms | 大动画 |

### 7.3 动效示例

```css
/* 按钮悬停 */
.btn {
    transition: all var(--duration-normal) var(--ease-default);
}
.btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}
.btn:active {
    transform: translateY(0);
}

/* 淡入 */
.fade-in {
    animation: fadeIn var(--duration-slow) var(--ease-out);
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 滑入 */
.slide-up {
    animation: slideUp var(--duration-slow) var(--ease-out);
}
@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
```

---

## 八、组件规范

### 8.1 按钮（Button）

#### 主按钮
```css
.btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-weight: 500;
    transition: all var(--duration-normal) var(--ease-default);
}
.btn-primary:hover {
    background: var(--color-primary-dark);
    box-shadow: var(--shadow-md);
}
```

#### 次按钮
```css
.btn-secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    padding: 10px 20px;
    border-radius: var(--radius-md);
}
.btn-secondary:hover {
    background: var(--bg-secondary);
    border-color: var(--border-strong);
}
```

#### 幽灵按钮
```css
.btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: none;
    padding: 10px 20px;
}
.btn-ghost:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
}
```

#### 尺寸变体
```css
.btn-sm  { padding: 6px 12px;  font-size: 13px; }
.btn     { padding: 10px 20px; font-size: 14px; }
.btn-lg  { padding: 14px 28px; font-size: 16px; }
```

### 8.2 输入框（Input）

```css
.input {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    font-size: 14px;
    color: var(--text-primary);
    transition: all var(--duration-fast) var(--ease-default);
}
.input::placeholder {
    color: var(--text-tertiary);
}
.input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-glow);
}
.input:disabled {
    background: var(--bg-secondary);
    color: var(--text-disabled);
    cursor: not-allowed;
}
```

### 8.3 卡片（Card）

```css
.card {
    background: var(--bg-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--padding-relaxed);
    transition: all var(--duration-normal) var(--ease-default);
}
.card:hover {
    border-color: var(--border-default);
    box-shadow: var(--shadow-sm);
}
.card-elevated {
    box-shadow: var(--shadow-md);
    border: none;
}
```

### 8.4 标签（Tag）

```css
.tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
}
.tag-primary {
    background: rgba(99, 102, 241, 0.1);
    color: var(--color-primary);
}
.tag-success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
}
```

### 8.5 头像（Avatar）

```css
.avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-weight: 500;
    overflow: hidden;
}
.avatar-sm  { width: 28px; height: 28px; font-size: 12px; }
.avatar-md  { width: 36px; height: 36px; font-size: 14px; }
.avatar-lg  { width: 48px; height: 48px; font-size: 16px; }
.avatar-xl  { width: 64px; height: 64px; font-size: 20px; }
```

### 8.6 开关（Switch）

```css
.switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--color-gray-300);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: background var(--duration-normal) var(--ease-default);
}
.switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);
    transition: transform var(--duration-normal) var(--ease-bounce);
}
.switch.active {
    background: var(--color-primary);
}
.switch.active::after {
    transform: translateX(20px);
}
```

### 8.7 进度条（Progress）

```css
.progress {
    width: 100%;
    height: 6px;
    background: var(--bg-secondary);
    border-radius: var(--radius-full);
    overflow: hidden;
}
.progress-bar {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width var(--duration-slow) var(--ease-out);
}
.progress-success { background: var(--color-success); }
.progress-warning { background: var(--color-warning); }
.progress-error   { background: var(--color-error); }
```

---

## 九、布局规范

### 9.1 页面布局系统

```css
/* 容器 */
.container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 var(--page-padding-x);
}

/* 网格 */
.grid {
    display: grid;
    gap: var(--gap-lg);
}
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 1024px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
    .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
}

/* Flex */
.flex { display: flex; }
.flex-center { align-items: center; justify-content: center; }
.flex-between { align-items: center; justify-content: space-between; }
.flex-gap-sm { gap: var(--gap-sm); }
.flex-gap-md { gap: var(--gap-md); }
```

### 9.2 内容区域规范

```css
/* 侧边栏 */
.sidebar {
    width: 240px;
    min-height: 100vh;
    background: var(--bg-primary);
    border-right: 1px solid var(--border-subtle);
}

/* 主内容区 */
.main {
    flex: 1;
    padding: var(--page-padding-y) var(--page-padding-x);
}

/* 区块 */
.section {
    padding: var(--space-12) 0;
}
.section-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-6);
}
```

---

## 十、图标规范

### 10.1 图标风格

- **风格**: 线性图标，1.5px 描边
- **圆角**: 统一 2px 端点圆角
- **尺寸**: 16px / 20px / 24px / 32px
- **颜色**: 跟随文字色或指定单色

### 10.2 图标使用

```css
.icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.icon-sm  { width: 16px; height: 16px; }
.icon-md  { width: 20px; height: 20px; }
.icon-lg  { width: 24px; height: 24px; }
.icon-xl  { width: 32px; height: 32px; }
```

---

## 十一、响应式断点

### 11.1 断点系统

| 断点 | 范围 | 用途 |
|------|------|------|
| `sm` | 640px+ | 大手机 |
| `md` | 768px+ | 平板 |
| `lg` | 1024px+ | 小桌面 |
| `xl` | 1280px+ | 桌面 |
| `2xl` | 1536px+ | 大桌面 |

### 11.2 响应式间距

```css
/* 移动优先 */
.page-padding { padding: 16px; }

@media (min-width: 768px) {
    .page-padding { padding: 24px 32px; }
}

@media (min-width: 1280px) {
    .page-padding { padding: 32px 48px; }
}
```

---

## 十二、无障碍规范

### 12.1 色彩对比度

| 文本类型 | 最小对比度 | 使用场景 |
|----------|------------|----------|
| 大文本 | 3:1 | 标题（18px+） |
| 正常文本 | 4.5:1 | 正文（14-17px） |
| UI组件 | 3:1 | 按钮、输入框边框 |

### 12.2 焦点管理

```css
:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

---

## 附录：完整 CSS 变量

```css
:root {
    /* 颜色 */
    --color-primary: #6366f1;
    --color-primary-light: #818cf8;
    --color-primary-dark: #4f46e5;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #3b82f6;
    
    /* 灰阶 */
    --color-gray-50: #f9fafb;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-800: #1f2937;
    --color-gray-900: #111827;
    --color-gray-950: #0a0a0f;
    
    /* 间距 */
    --space-0: 0px;
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;
    --space-16: 64px;
    
    /* 圆角 */
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;
    --radius-full: 9999px;
    
    /* 阴影 */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    --shadow-glow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    
    /* 动效 */
    --duration-fast: 100ms;
    --duration-normal: 200ms;
    --duration-slow: 300ms;
    --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    
    /* 字体 */
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    --font-mono: "SF Mono", "Fira Code", "JetBrains Mono", monospace;
}
```
