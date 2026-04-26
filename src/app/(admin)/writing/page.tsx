import { WritingPage } from './writing-client';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function WritingRoute() {
  const { data: allIntents, error: intentError } = await supabase
    .from('intents')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (intentError) throw new Error(`查询意图失败: ${intentError.message}`);

  const { data: allTypes, error: typeError } = await supabase
    .from('intent_types')
    .select('*');

  if (typeError) throw new Error(`查询分类失败: ${typeError.message}`);

  return <WritingPage intents={allIntents || []} intentTypes={allTypes || []} />;
}
