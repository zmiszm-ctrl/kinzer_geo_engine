import { NextRequest, NextResponse } from 'next/server';
import { llmInvoke } from '@/lib/llm-provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const prompt = `你是一个专业的GEO（Generative Engine Optimization）意图挖掘专家。用户会给你一个行业关键词，你需要挖掘出与该关键词相关的用户搜索意图。

行业关键词：${keyword}

请严格按照以下JSON格式返回意图列表，不要输出任何其他内容：
[
  {
    "name": "意图名称，简洁明了描述用户意图",
    "query": "用户搜索时的典型查询词",
    "intent_type_code": "意图类型编码，从以下选择：informational_understand, informational_explain, informational_compare, informational_howto, navigational_brand, commercial_research, commercial_compare, transactional_buy, transactional_download",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  }
]

要求：
1. 挖掘8-15个意图，覆盖不同意图类型（信息型、商业型、交易型等）
2. 意图名称要自然、具体、符合真实搜索场景
3. 查询词要贴近用户真实搜索习惯
4. 每个意图包含3-5个相关关键词
5. 确保意图之间不重复
6. 只返回JSON数组，不要其他文字`;

    const messages = [{ role: 'user' as const, content: prompt }];
    const response = await llmInvoke(messages, { temperature: 0.7 });

    let intents: { name: string; query: string; intent_type_code: string; keywords: string[] }[] = [];

    try {
      const content = response.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        intents = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // parse failed
    }

    return NextResponse.json({ intents, provider: response.provider, model: response.model });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
