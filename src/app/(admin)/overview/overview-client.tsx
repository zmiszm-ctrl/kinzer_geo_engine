'use client';

import {
  Database,
  Layers,
  Search,
  PenTool,
  Send,
  BarChart3,
  FlaskConical,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

/* ──────────────── Data ──────────────── */

interface ModuleInfo {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'active' | 'coming';
  features: string[];
  href?: string;
}

const modules: ModuleInfo[] = [
  {
    icon: <Database className="h-5 w-5" />,
    title: '知识资产管理',
    description: '构建企业专属知识库，支持多源异构数据导入、智能清洗、知识切片和版本管理，为内容生成提供高质量知识底座。',
    status: 'coming',
    features: ['多格式导入（PDF/Word/HTML/URL）', '智能清洗与去重', '知识切片与实体识别', '知识图谱构建', '版本管理与血缘追踪'],
  },
  {
    icon: <Layers className="h-5 w-5" />,
    title: '内容结构化引擎',
    description: '将知识资产转化为结构化内容，适配AI搜索引擎的解析偏好，通过Schema标记和证据强化提升引用概率。',
    status: 'coming',
    features: ['智能切片重排', 'Schema.org 标记自动注入', '实体富化与语义增强', '证据强化与引用溯源', '格式优化与原创度检测'],
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: '意图挖掘系统',
    description: '发现目标用户的真实搜索意图，建立意图词库，通过AI自动挖掘和问题裂变指导内容生成方向。',
    status: 'active',
    href: '/intent/types',
    features: ['意图分类体系（4大类型）', 'AI关键词意图挖掘', '自定义意图管理', '意图分层与问题裂变'],
  },
  {
    icon: <PenTool className="h-5 w-5" />,
    title: 'GEO智能写作',
    description: '基于意图和关键词，AI批量生成多风格、多平台的GEO优化内容，自然融入目标关键词，提升AI搜索引用率。',
    status: 'active',
    href: '/writing',
    features: ['多风格写作（小红书/公众号/头条等）', '批量内容生成', '关键词密度控制', '流式生成实时预览', '内容保存与版本管理'],
  },
  {
    icon: <Send className="h-5 w-5" />,
    title: '发布与链接管理',
    description: '对接各内容平台，一键多渠道分发，管理锚文本策略和引用矩阵，最大化内容曝光。',
    status: 'coming',
    features: ['多渠道一键分发', '定时发布计划', '锚文本策略管理', '引用矩阵构建', '发布状态追踪'],
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'GEO监测与分析',
    description: '追踪内容在AI搜索引擎中的引用情况，监测品牌曝光度，与竞品进行实时对比分析。',
    status: 'coming',
    features: ['AI引用率监测', '排名位置追踪', '竞品看板', '趋势分析与预警', '效果归因分析'],
  },
  {
    icon: <FlaskConical className="h-5 w-5" />,
    title: 'A/B测试与迭代',
    description: '对生成内容进行多版本测试，分析效果差异，一键优化重写，持续提升GEO效果。',
    status: 'coming',
    features: ['多版本内容对比', 'A/B分流测试', '效果显著性分析', '一键优化重写', '最佳实践沉淀'],
  },
];

const flowSteps = [
  {
    step: 1,
    icon: <Database className="h-6 w-6" />,
    title: '知识入库',
    subtitle: '知识资产管理',
    desc: '导入文档、网页、API数据，构建企业专属知识库',
  },
  {
    step: 2,
    icon: <Layers className="h-6 w-6" />,
    title: '结构化治理',
    subtitle: '内容结构化引擎',
    desc: '知识切片、Schema标记、证据强化，适配AI搜索偏好',
  },
  {
    step: 3,
    icon: <Search className="h-6 w-6" />,
    title: '意图挖掘',
    subtitle: '意图挖掘系统',
    desc: 'AI自动挖掘用户搜索意图，建立意图词库与分类',
  },
  {
    step: 4,
    icon: <PenTool className="h-6 w-6" />,
    title: '智能写作',
    subtitle: 'GEO智能写作',
    desc: '按意图+关键词+风格批量生成GEO优化内容',
  },
  {
    step: 5,
    icon: <Send className="h-6 w-6" />,
    title: '发布分发',
    subtitle: '发布与链接管理',
    desc: '多渠道一键分发，管理锚文本和引用矩阵',
  },
  {
    step: 6,
    icon: <BarChart3 className="h-6 w-6" />,
    title: '监测迭代',
    subtitle: 'GEO监测 + A/B测试',
    desc: '追踪引用率、竞品对比、A/B测试持续优化',
  },
];

const highlights = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'AI驱动',
    desc: '智谱/DeepSeek大模型双引擎，智能降级保障可用性',
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: '意图精准',
    desc: '4大意图类型9大子类，AI挖掘+手动创建双模式',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: '效果可量化',
    desc: '全链路数据追踪，引用率/排名/流量多维度分析',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: '批量高效',
    desc: '一次生成多篇多风格内容，覆盖主流内容平台',
  },
];

/* ──────────────── Component ──────────────── */

export function OverviewPage() {
  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/3 to-transparent border border-primary/10 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              MVP v0.1.0
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            GEO 引擎平台
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            面向企业的 AI 驱动内容优化与分发平台。构建专属知识资产，通过结构化治理和智能写作，
            生成符合 AI 搜索引擎偏好的高质量内容，实现品牌在 AI 搜索结果中的高质量曝光。
          </p>
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">已上线模块</span>
              <span className="font-semibold text-foreground">2</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-muted-foreground">规划中模块</span>
              <span className="font-semibold text-foreground">5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Highlights */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center text-primary mb-3">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business Flow */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">业务流程</h2>
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {flowSteps.map((item, index) => (
              <div key={item.step} className="relative">
                <div
                  className={`rounded-xl border p-4 h-full transition-all hover:shadow-sm ${
                    item.step <= 4
                      ? 'border-primary/15 bg-primary/3 hover:border-primary/25'
                      : 'border-border bg-card hover:border-gray-300'
                  }`}
                >
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.step <= 4
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        item.step <= 4
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      Step {item.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-[10px] text-primary/70 mt-0.5 font-medium">
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                {/* Arrow between steps */}
                {index < flowSteps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-gray-300">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module Details */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">功能模块</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className={`group rounded-xl border p-5 transition-all ${
                mod.status === 'active'
                  ? 'border-primary/15 bg-white hover:border-primary/25 hover:shadow-sm'
                  : 'border-border bg-white/50 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      mod.status === 'active'
                        ? 'bg-primary/8 text-primary'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {mod.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                      {mod.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          已上线
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
                          <Lock className="h-3 w-3" />
                          规划中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                  </div>
                </div>
                {mod.href && (
                  <a
                    href={mod.href}
                    className="shrink-0 ml-3 text-xs text-primary font-medium hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    进入 <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {mod.features.map((f) => (
                  <span
                    key={f}
                    className={`text-[11px] px-2 py-0.5 rounded-md ${
                      mod.status === 'active'
                        ? 'bg-primary/5 text-primary/80'
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="rounded-xl border border-primary/10 bg-gradient-to-r from-primary/3 to-transparent p-6">
        <h2 className="text-base font-semibold text-foreground mb-3">快速开始</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              1
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">配置模型</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                在
                <a href="/settings/model-config" className="text-primary hover:underline">
                  系统设置 → 模型配置
                </a>
                中配置 API Key 和模型参数
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">挖掘意图</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                在
                <a href="/intent/custom" className="text-primary hover:underline">
                  自定义意图
                </a>
                中输入关键词，AI自动挖掘用户搜索意图
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              3
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">生成内容</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                在
                <a href="/writing" className="text-primary hover:underline">
                  GEO智能写作
                </a>
                中选择意图和风格，AI批量生成优化内容
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
