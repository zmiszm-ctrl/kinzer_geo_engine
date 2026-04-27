import { NextRequest } from 'next/server';
import { llmStream } from '@/lib/llm-provider';

const STYLE_PROMPTS: Record<string, string> = {
  xiaohongshu: `小红书种草笔记风格：
- 开头用吸引人的钩子，带emoji
- 分点列举，每点带emoji标记
- 语气轻松活泼，像朋友分享
- 适当使用🔥✨💡👉等emoji
- 结尾加互动引导和话题标签
- 整体排版有节奏感，长短句搭配`,

  wechat: `微信公众号专业深度风格：
- 标题有观点有态度
- 开头引用数据或痛点引入
- 正文逻辑清晰，分段明确
- 专业术语配合通俗解释
- 适当引用权威数据或案例
- 结尾给出行动建议或思考`,

  toutiao: `头条新闻资讯风格：
- 标题突出关键信息点
- 导语简洁有力
- 段落信息密度高
- 数据和事实支撑观点
- 客观中立但有趣味
- 结尾简短有力`,

  zhihu: `知乎知识分享风格：
- 开头直击核心问题
- 逻辑严密，论据充分
- 适当使用引用和数据
- 多角度分析问题
- 语言专业但不晦涩
- 结尾给出明确结论`,

  blog: `技术博客风格：
- 标题精准描述主题
- 开头交代背景和目标
- 步骤清晰，代码/工具推荐
- 图文并茂的描述
- 注意事项和常见问题
- 总结和延伸阅读`,

  official: `企业官网风格：
- 标题体现品牌价值
- 开头点明业务场景
- 产品特性结构化呈现
- 突出竞争优势
- 客户案例或数据佐证
- CTA引导咨询/试用`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intents, style, style_name, custom_requirements, article_count } = body;

    if (!intents || !style) {
      return new Response(JSON.stringify({ error: 'intents and style are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const count = Math.min(Math.max(Number(article_count) || 1, 1), 5);
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.xiaohongshu;

    const intentDescriptions = intents
      .map((i: { name: string; query?: string; keywords?: string[] }) => {
        let desc = `- 意图：${i.name}`;
        if (i.query) desc += `\n  搜索词：${i.query}`;
        if (i.keywords && i.keywords.length > 0) desc += `\n  关键词：${i.keywords.join('、')}`;
        return desc;
      })
      .join('\n');

    const systemPrompt = `你是一个专业的GEO（Generative Engine Optimization）推广内容写作引擎。你的核心任务是根据用户提供的意图关键词和写作风格，生成高质量的GEO推广文章。

## 你的专业能力
1. 精通各平台内容分发算法和推荐机制
2. 擅长在内容中自然融入关键词，提升AI搜索引擎的引用率和可见性
3. 能够根据不同平台调性调整语言风格和排版格式
4. 善于构建结构化内容，便于AI搜索引擎解析和引用

## 写作风格要求
${stylePrompt}

## 内容生成规范
1. 每篇文章必须以 # 标题 开头
2. 标题要包含核心关键词，具备吸引力和点击欲望
3. 内容自然融入关键词，密度控制在2%-5%之间，避免堆砌
4. 采用结构化排版（标题、段落、列表），便于AI搜索引擎解析
5. 信息准确可信，适当引用数据或案例增强说服力
6. 每篇文章字数控制在800-1500字
7. 多篇文章之间要有差异化视角和切入点，避免内容雷同
8. 结尾要有明确的行动引导（CTA），增强转化效果
${custom_requirements ? `\n## 额外要求\n${custom_requirements}` : ''}`;

    const userPrompt = `请根据以下用户意图信息，生成${count > 1 ? count + '篇' : '1篇'}${style_name || ''}风格的GEO推广文章。

## 用户意图
${intentDescriptions}

## 输出要求
${count > 1 ? `请生成${count}篇独立的推广文章，每篇文章之间用 "---" 分隔，每篇文章都必须以 # 标题 开头。多篇文章应从不同角度和切入点撰写，确保内容差异化。` : '请直接输出完整内容，以#标题开头。'}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const encoder = new TextEncoder();
    const stream = llmStream(messages, { temperature: 0.8, maxTokens: 4096 });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(chunk.content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
