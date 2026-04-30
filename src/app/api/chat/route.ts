import { NextRequest } from 'next/server';
import { llmStream } from '@/lib/llm-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Array<{ role: string; content: string }> };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }

    // System prompt for GEO assistant
    const systemPrompt: { role: 'system'; content: string } = {
      role: 'system',
      content: `你是 GEO 引擎平台的 AI 助手，专注于帮助企业优化内容在 AI 搜索引擎中的可见性和引用率。

你的能力范围：
1. **GEO 策略咨询** — 解答关于生成式引擎优化的问题，包括内容结构化、意图匹配、关键词策略等
2. **内容优化建议** — 分析内容并提供提升 AI 搜索可见性的优化建议
3. **意图分析** — 帮助用户理解不同搜索意图（信息型、导航型、商业型、交易型）的内容优化策略
4. **平台功能指引** — 介绍 GEO 引擎平台的各项功能和使用方法
5. **写作风格建议** — 针对小红书、公众号、头条等不同平台的内容风格提供建议

回答要求：
- 专业、简洁、实用
- 优先提供可操作的建议
- 涉及 GEO 相关概念时给出通俗解释
- 如果问题超出范围，礼貌说明并引导回 GEO 话题`,
    };

    const fullMessages = [systemPrompt, ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))] as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

    const stream = llmStream(fullMessages, { temperature: 0.7 });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const sseData = `data: ${JSON.stringify({ content: chunk.content, done: false, provider: chunk.provider, model: chunk.model })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
            if (chunk.done) {
              const sseData = `data: ${JSON.stringify({ content: '', done: true, provider: chunk.provider, model: chunk.model })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Chat API] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
