import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HISTORY_DIR = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'chat-history');

function ensureDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function getTodayFilename(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}.md`;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
}

function parseMessagesFromMd(md: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const sections = md.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.split('\n');
    const header = lines[0];

    // Parse: "14:30:25 用户" or "14:30:28 AI (智谱 glm-4.5-air)"
    const userMatch = header.match(/^(\d{2}:\d{2}:\d{2})\s+用户$/);
    const aiMatch = header.match(/^(\d{2}:\d{2}:\d{2})\s+AI(?:\s+\((.+)\))?$/);

    if (userMatch) {
      const timeStr = userMatch[1]!;
      const content = lines.slice(1).join('\n').trim();
      const today = new Date();
      const [h, m, s] = timeStr.split(':').map(Number);
      const timestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, s).getTime();
      messages.push({ role: 'user', content, timestamp });
    } else if (aiMatch) {
      const timeStr = aiMatch[1]!;
      const providerInfo = aiMatch[2] || '';
      const content = lines.slice(1).join('\n').trim();
      const today = new Date();
      const [h, m, s] = timeStr.split(':').map(Number).map(v => v ?? 0);
      const timestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, s).getTime();

      let provider: string | undefined;
      let model: string | undefined;
      if (providerInfo) {
        const parts = providerInfo.split(' ');
        provider = parts[0];
        model = parts.slice(1).join(' ');
      }

      messages.push({ role: 'assistant', content, timestamp, provider, model });
    }
  }

  return messages;
}

function messagesToMd(messages: ChatMessage[]): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let md = `# 对话记录 ${dateStr}\n\n`;

  for (const msg of messages) {
    const date = new Date(msg.timestamp);
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

    if (msg.role === 'user') {
      md += `## ${timeStr} 用户\n\n${msg.content}\n\n`;
    } else {
      const providerInfo = msg.provider && msg.model ? ` (${msg.provider} ${msg.model})` : '';
      md += `## ${timeStr} AI${providerInfo}\n\n${msg.content}\n\n`;
    }
  }

  return md;
}

// GET: Load today's chat history
export async function GET() {
  try {
    ensureDir();
    const filename = getTodayFilename();
    const filepath = path.join(HISTORY_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return Response.json({ messages: [], date: filename.replace('.md', '') });
    }

    const md = fs.readFileSync(filepath, 'utf-8');
    const messages = parseMessagesFromMd(md);
    return Response.json({ messages, date: filename.replace('.md', '') });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}

// POST: Save today's chat history
export async function POST(request: NextRequest) {
  try {
    ensureDir();
    const body = await request.json() as { messages: ChatMessage[] };
    const { messages } = body;

    if (!Array.isArray(messages)) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }

    const filename = getTodayFilename();
    const filepath = path.join(HISTORY_DIR, filename);
    const md = messagesToMd(messages);
    fs.writeFileSync(filepath, md, 'utf-8');

    return Response.json({ success: true, file: filename });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Clear today's chat history
export async function DELETE() {
  try {
    ensureDir();
    const filename = getTodayFilename();
    const filepath = path.join(HISTORY_DIR, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
