import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Batch create from AI mining or single create
    const intentsData = body.intents as {
      name: string;
      query?: string;
      intent_type_code?: string;
      keywords?: string[];
    }[];

    if (!intentsData || !Array.isArray(intentsData)) {
      return NextResponse.json({ error: 'intents array is required' }, { status: 400 });
    }

    // Resolve intent_type_code to intent_type_id
    const { data: allTypes, error: typeError } = await supabase
      .from('intent_types')
      .select('id, code');

    if (typeError) throw new Error(`查询分类失败: ${typeError.message}`);

    const typeCodeMap = Object.fromEntries(
      (allTypes || []).map((t: { id: string; code: string }) => [t.code, t.id])
    );

    const values = intentsData.map((item) => ({
      name: item.name,
      query: item.query || item.name,
      intent_type_id: item.intent_type_code ? typeCodeMap[item.intent_type_code] || null : null,
      level: 1,
      keywords: item.keywords || [],
      priority: 0,
      tags: [],
      source: 'ai',
      status: 'active',
    }));

    const { data, error } = await supabase
      .from('intents')
      .insert(values)
      .select();

    if (error) throw new Error(`创建意图失败: ${error.message}`);

    return NextResponse.json({ saved: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, query, intent_type_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (query !== undefined) updateData.query = query;
    if (intent_type_id !== undefined) updateData.intent_type_id = intent_type_id;

    const { data, error } = await supabase
      .from('intents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新意图失败: ${error.message}`);

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ intent: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase.from('intents').delete().eq('id', id);

    if (error) throw new Error(`删除意图失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
