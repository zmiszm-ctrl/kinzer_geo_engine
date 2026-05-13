import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/writing/save - Save generated content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, style, intent_ids, content_type, model_id, quality_score } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const db = getDb();
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO generated_contents (id, title, content, content_type, intent_ids, style, model_id, quality_score, version, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'draft')
    `).run(
      id,
      title,
      content,
      content_type || style || 'article',
      JSON.stringify(intent_ids || []),
      style || 'default',
      model_id || null,
      quality_score || null
    );

    const savedContent = db.prepare('SELECT * FROM generated_contents WHERE id = ?').get(id);
    return NextResponse.json({ content: savedContent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
