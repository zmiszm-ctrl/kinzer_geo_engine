import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

/** GET /api/settings/model-config — 获取所有模型配置 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('model_configs')
      .select('*')
      .order('priority', { ascending: true });

    if (error) throw new Error(`查询模型配置失败: ${error.message}`);

    return NextResponse.json({ configs: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PUT /api/settings/model-config — 更新模型配置 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, provider, api_key, model, base_url, thinking_enabled, reasoning_effort, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, priority, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (api_key !== undefined) updateData.api_key = api_key;
    if (model !== undefined) updateData.model = model;
    if (base_url !== undefined) updateData.base_url = base_url;
    if (thinking_enabled !== undefined) updateData.thinking_enabled = thinking_enabled;
    if (reasoning_effort !== undefined) updateData.reasoning_effort = reasoning_effort;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (max_tokens !== undefined) updateData.max_tokens = max_tokens;
    if (top_p !== undefined) updateData.top_p = top_p;
    if (frequency_penalty !== undefined) updateData.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined) updateData.presence_penalty = presence_penalty;
    if (priority !== undefined) updateData.priority = priority;
    if (enabled !== undefined) updateData.enabled = enabled;

    const { data, error } = await supabase
      .from('model_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新模型配置失败: ${error.message}`);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ config: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/settings/model-config — 测试模型连接 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, api_key, model, base_url } = body;

    if (!provider || !api_key || !model) {
      return NextResponse.json({ error: 'provider, api_key, model are required' }, { status: 400 });
    }

    const url = base_url || (provider === 'zhipu'
      ? 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      : 'https://api.deepseek.com/chat/completions');

    const testBody = JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10,
      stream: false,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api_key}`,
      },
      body: testBody,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return NextResponse.json({
        success: false,
        message: `连接失败 (${response.status}): ${errText.slice(0, 200)}`,
      });
    }

    const data = await response.json();
    const content = (data.choices?.[0]?.message?.content) || '';

    return NextResponse.json({
      success: true,
      message: `连接成功，模型返回: "${content.slice(0, 50)}"`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: `连接失败: ${msg}` });
  }
}
