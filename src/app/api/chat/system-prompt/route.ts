import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROMPT_FILE = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'chat-system-prompt.md');

export async function GET() {
  try {
    const content = fs.readFileSync(PROMPT_FILE, 'utf-8');
    return Response.json({ content });
  } catch {
    return Response.json({ content: '' });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { content: string };
    const { content } = body;
    if (typeof content !== 'string') {
      return Response.json({ error: 'content is required' }, { status: 400 });
    }
    fs.writeFileSync(PROMPT_FILE, content, 'utf-8');
    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
