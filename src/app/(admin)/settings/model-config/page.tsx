import { ModelConfigPage } from './model-config-client';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ModelConfigRow {
  id: string;
  provider: string;
  api_key: string | null;
  model: string;
  base_url: string;
  thinking_enabled: number;
  reasoning_effort: string | null;
  temperature: number | null;
  max_tokens: number | null;
  top_p: number | null;
  frequency_penalty: number | null;
  presence_penalty: number | null;
  priority: number;
  enabled: number;
  created_at: string | null;
  updated_at: string | null;
}

export default function ModelConfigRoute() {
  const configs = db.prepare('SELECT * FROM model_configs ORDER BY priority ASC').all() as ModelConfigRow[];

  return <ModelConfigPage initialConfigs={configs.map(c => ({
    ...c,
    enabled: Boolean(c.enabled),
    thinking_enabled: Boolean(c.thinking_enabled),
  }))} />;
}
