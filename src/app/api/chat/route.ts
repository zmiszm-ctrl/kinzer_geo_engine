import { NextRequest } from 'next/server';
import { llmStream } from '@/lib/llm-provider';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROMPT_FILE = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'chat-system-prompt.md');

function loadSystemPrompt(): string {
  try {
    return fs.readFileSync(PROMPT_FILE, 'utf-8');
  } catch {
    return '你是 GEO 引擎平台的 AI 助手，专注于帮助企业优化内容在 AI 搜索引擎中的可见性和引用率。';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Array<{ role: string; content: string }> };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }

    // Read system prompt from file
    const systemPromptContent = loadSystemPrompt();
    const systemPrompt: { role: 'system'; content: string } = {
      role: 'system',
      content: systemPromptContent,
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
