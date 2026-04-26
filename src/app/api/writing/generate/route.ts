import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

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
    const { intents, style, style_name, custom_requirements } = body;

    if (!intents || !style) {
      return new Response(JSON.stringify({ error: 'intents and style are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.xiaohongshu;
    const intentDescriptions = intents
      .map((i: { name: string; query?: string; keywords?: string[] }) => {
        let desc = `- 意图：${i.name}`;
        if (i.query) desc += `\n  搜索词：${i.query}`;
        if (i.keywords && i.keywords.length > 0) desc += `\n  关键词：${i.keywords.join('、')}`;
        return desc;
      })
      .join('\n');

    const systemPrompt = `你是一个专业的GEO内容写作专家。你需要根据给定的用户意图，生成符合特定平台风格的优质内容。

写作风格要求：
${stylePrompt}

内容生成规范：
1. 标题要包含核心关键词，吸引点击
2. 内容要自然融入关键词，密度适中
3. 结构化排版，便于AI搜索引擎解析
4. 信息准确，有事实支撑
5. 字数控制在800-1500字${custom_requirements ? `\n\n额外要求：${custom_requirements}` : ''}`;

    const userPrompt = `请根据以下用户意图，生成一篇${style_name}风格的内容：

${intentDescriptions}

请直接输出完整内容，以#标题开头。`;

    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.8,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(chunk.content.toString()));
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
