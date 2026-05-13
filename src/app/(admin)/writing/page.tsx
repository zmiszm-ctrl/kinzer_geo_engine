import { WritingPage } from './writing-client';
import { db } from '@/lib/db';

interface IntentType {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

interface Intent {
  id: string;
  name: string;
  query: string | null;
  intent_type_id: string | null;
  level: number;
  keywords: unknown;
  priority: number;
  tags: unknown;
  source: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

export const dynamic = 'force-dynamic';

export default function Page() {
  const intents = db.prepare('SELECT * FROM intents WHERE status = ? ORDER BY created_at DESC').all('active') as Intent[];
  const intentTypes = db.prepare('SELECT id, name, code, color FROM intent_types ORDER BY level, sort_order').all() as IntentType[];

  return <WritingPage intents={intents} intentTypes={intentTypes} />;
}
