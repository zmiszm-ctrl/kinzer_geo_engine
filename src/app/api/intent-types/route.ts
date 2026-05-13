import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/intent-types - Create intent type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, color, parent_id, level, icon } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'name and code are required' }, { status: 400 });
    }

    const db = getDb();

    // Check code uniqueness
    const existing = db.prepare('SELECT id FROM intent_types WHERE code = ?').get(code) as { id: string } | undefined;
    if (existing) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const maxSort = db.prepare(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM intent_types WHERE parent_id IS ?'
    ).get(parent_id || null) as { next_sort: number };

    db.prepare(`
      INSERT INTO intent_types (id, name, code, description, icon, color, parent_id, level, sort_order, is_builtin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, code, description || null, icon || null, color || null, parent_id || null, level || 1, maxSort.next_sort, 0);

    const intentType = db.prepare('SELECT * FROM intent_types WHERE id = ?').get(id);
    return NextResponse.json({ intentType });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/intent-types - Update intent type
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, code, description, color, icon } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT * FROM intent_types WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Intent type not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (code !== undefined) { updates.push('code = ?'); values.push(code); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    updates.push("updated_at = datetime('now', 'localtime')");

    if (updates.length === 1) {
      return NextResponse.json({ intentType: existing });
    }

    values.push(id);
    db.prepare(`UPDATE intent_types SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const intentType = db.prepare('SELECT * FROM intent_types WHERE id = ?').get(id);
    return NextResponse.json({ intentType });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
