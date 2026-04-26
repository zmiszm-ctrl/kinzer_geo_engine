import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, style, intent_ids } = body;

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('generated_contents')
      .insert({
        title: title || '未命名内容',
        content,
        content_type: style,
        intent_ids: intent_ids || [],
        style: style || 'xiaohongshu',
        model_id: 'doubao-seed-2-0-pro-260215',
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw new Error(`保存失败: ${error.message}`);

    return NextResponse.json({ content: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
