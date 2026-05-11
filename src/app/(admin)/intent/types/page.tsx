import { IntentTypesPage } from './intent-types-client';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function IntentTypesRoute() {
  const { data: allTypes, error } = await supabase
    .from('intent_types')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(`查询分类失败: ${error.message}`);

  const types = allTypes || [];
  const rootTypes = types.filter((t: { parent_id: string | null }) => !t.parent_id);
  const childTypesMap: Record<string, typeof types> = {};
  for (const t of types) {
    if (t.parent_id) {
      if (!childTypesMap[t.parent_id]) childTypesMap[t.parent_id] = [];
      childTypesMap[t.parent_id].push(t);
    }
  }

  return <IntentTypesPage rootTypes={rootTypes} childTypesMap={childTypesMap} allTypes={types} />;
}
