import { IntentTypesPage } from './intent-types-client';
import { db } from '@/lib/db';

interface IntentType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  level: number;
  sort_order: number;
  is_builtin: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export const dynamic = 'force-dynamic';

export default function Page() {
  const rows = db.prepare('SELECT * FROM intent_types ORDER BY level, sort_order').all() as IntentType[];

  const rootTypes = rows.filter((t: IntentType) => t.level === 1);
  const childTypesMap: Record<string, IntentType[]> = {};
  for (const t of rows) {
    if (t.parent_id) {
      if (!childTypesMap[t.parent_id]) childTypesMap[t.parent_id] = [];
      childTypesMap[t.parent_id].push(t);
    }
  }

  return <IntentTypesPage rootTypes={rootTypes} childTypesMap={childTypesMap} allTypes={rows} />;
}
