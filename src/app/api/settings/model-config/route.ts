import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/settings/model-config - Get all model configs
export async function GET() {
  try {
    const db = getDb();
    const configs = db.prepare('SELECT * FROM model_configs ORDER BY priority ASC').all();
    return NextResponse.json({ configs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/settings/model-config - Update model config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, api_key, model, base_url, thinking_enabled, reasoning_effort, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, priority, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM model_configs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (api_key !== undefined) { updates.push('api_key = ?'); values.push(api_key); }
    if (model !== undefined) { updates.push('model = ?'); values.push(model); }
    if (base_url !== undefined) { updates.push('base_url = ?'); values.push(base_url); }
    if (thinking_enabled !== undefined) { updates.push('thinking_enabled = ?'); values.push(thinking_enabled ? 1 : 0); }
    if (reasoning_effort !== undefined) { updates.push('reasoning_effort = ?'); values.push(reasoning_effort); }
    if (temperature !== undefined) { updates.push('temperature = ?'); values.push(temperature); }
    if (max_tokens !== undefined) { updates.push('max_tokens = ?'); values.push(max_tokens); }
    if (top_p !== undefined) { updates.push('top_p = ?'); values.push(top_p); }
    if (frequency_penalty !== undefined) { updates.push('frequency_penalty = ?'); values.push(frequency_penalty); }
    if (presence_penalty !== undefined) { updates.push('presence_penalty = ?'); values.push(presence_penalty); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled ? 1 : 0); }
    updates.push("updated_at = datetime('now', 'localtime')");

    values.push(id);
    db.prepare(`UPDATE model_configs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const config = db.prepare('SELECT * FROM model_configs WHERE id = ?').get(id);
    return NextResponse.json({ config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/settings/model-config - Test model connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, api_key, model, base_url } = body;

    if (!api_key || !model) {
      return NextResponse.json({ error: 'api_key and model are required' }, { status: 400 });
    }

    const url = base_url || (provider === 'zhipu'
      ? 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      : 'https://api.deepseek.com/chat/completions');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: `${provider} (${model}) 连接成功` });
    } else {
      const errorText = await response.text();
      return NextResponse.json({ success: false, message: `连接失败: ${response.status} - ${errorText.substring(0, 200)}` });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: `连接失败: ${message}` }, { status: 500 });
  }
}
