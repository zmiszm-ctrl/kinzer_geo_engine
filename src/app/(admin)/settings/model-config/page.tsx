import { ModelConfigPage } from './model-config-client';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ModelConfigRoute() {
  const { data: configs, error } = await supabase
    .from('model_configs')
    .select('*')
    .order('priority', { ascending: true });

  if (error) throw new Error(`查询模型配置失败: ${error.message}`);

  return <ModelConfigPage initialConfigs={configs || []} />;
}
