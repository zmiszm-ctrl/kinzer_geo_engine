import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/intents - Batch create intents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intents } = body as { intents: Array<{
      name: string;
      query: string;
      intent_type_code?: string;
      intent_type_id?: string;
      keywords?: string[];
      tags?: string[];
      source?: string;
    }> };

    if (!intents || !Array.isArray(intents) || intents.length === 0) {
      return NextResponse.json({ error: 'intents array is required' }, { status: 400 });
    }

    const db = getDb();
    const saved: Record<string, unknown>[] = [];

    const insertStmt = db.prepare(`
      INSERT INTO intents (id, name, query, intent_type_id, level, parent_id, keywords, priority, tags, source, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const intent of intents) {
      let intentTypeId = intent.intent_type_id || null;

      // Resolve intent_type_code to intent_type_id
      if (!intentTypeId && intent.intent_type_code) {
        const typeRow = db.prepare('SELECT id FROM intent_types WHERE code = ?').get(intent.intent_type_code) as { id: string } | undefined;
        if (typeRow) intentTypeId = typeRow.id;
      }

      const id = crypto.randomUUID();
      insertStmt.run(
        id,
        intent.name,
        intent.query || '',
        intentTypeId,
        1,
        null,
        JSON.stringify(intent.keywords || []),
        0,
        JSON.stringify(intent.tags || []),
        intent.source || 'ai',
        'active'
      );
      saved.push(db.prepare('SELECT * FROM intents WHERE id = ?').get(id) as Record<string, unknown>);
    }

    return NextResponse.json({ saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/intents - Update intent
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, query, intent_type_id, keywords, tags, priority, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT * FROM intents WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (query !== undefined) { updates.push('query = ?'); values.push(query); }
    if (intent_type_id !== undefined) { updates.push('intent_type_id = ?'); values.push(intent_type_id); }
    if (keywords !== undefined) { updates.push('keywords = ?'); values.push(JSON.stringify(keywords)); }
    if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    updates.push("updated_at = datetime('now', 'localtime')");

    values.push(id);
    db.prepare(`UPDATE intents SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const intent = db.prepare('SELECT * FROM intents WHERE id = ?').get(id);
    return NextResponse.json({ intent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/intents - Delete intent
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM intents WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM intents WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
