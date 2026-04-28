'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Zap,
  ArrowUp,
  ArrowDown,
  Cpu,
  Link2,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';

interface ModelConfig {
  id: string;
  provider: string;
  api_key: string | null;
  model: string;
  base_url: string | null;
  thinking_enabled: boolean;
  reasoning_effort: string | null;
  temperature: number | null;
  max_tokens: number | null;
  top_p: number | null;
  frequency_penalty: number | null;
  presence_penalty: number | null;
  priority: number;
  enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface Props {
  initialConfigs: ModelConfig[];
}

const DEEPSEEK_MODELS = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', desc: '快速响应，适合批量生成' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', desc: '深度推理，适合高质量内容' },
];

const ZHIPU_MODELS = [
  { id: 'glm-4.5-air', name: 'GLM-4.5 Air', desc: '均衡性价比，推荐日常使用' },
  { id: 'glm-4.5', name: 'GLM-4.5', desc: '标准版，能力更全面' },
  { id: 'glm-4.6', name: 'GLM-4.6', desc: '增强版，推理能力更强' },
  { id: 'glm-4.7', name: 'GLM-4.7', desc: '最新版，旗舰级能力' },
  { id: 'glm-5', name: 'GLM-5', desc: 'GLM-5 标准版' },
  { id: 'glm-5-turbo', name: 'GLM-5 Turbo', desc: 'GLM-5 快速版' },
  { id: 'glm-5.1', name: 'GLM-5.1', desc: 'GLM-5.1 最新旗舰' },
];

const REASONING_EFFORT_OPTIONS = [
  { value: 'low', label: 'Low', desc: '快速推理' },
  { value: 'medium', label: 'Medium', desc: '均衡推理' },
  { value: 'high', label: 'High', desc: '深度推理' },
  { value: 'max', label: 'Max', desc: '极致推理' },
];

export function ModelConfigPage({ initialConfigs }: Props) {
  const [configs, setConfigs] = useState<ModelConfig[]>(initialConfigs);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, Partial<ModelConfig>>>({});

  const getEditValue = (config: ModelConfig, field: keyof ModelConfig): unknown => {
    const edit = editValues[config.id];
    if (edit && field in edit) return edit[field];
    return config[field];
  };

  const updateEditValue = (id: string, field: string, value: unknown) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (config: ModelConfig) => {
    const edits = editValues[config.id];
    if (!edits) return;

    setSaving(config.provider);
    try {
      const res = await fetch('/api/settings/model-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, ...edits }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { config: updated } = await res.json();

      setConfigs((prev) => prev.map((c) => (c.id === config.id ? updated : c)));
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[config.id];
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (config: ModelConfig) => {
    const edits = editValues[config.id];
    const apiKey = (edits?.api_key as string) ?? config.api_key ?? '';
    const model = (edits?.model as string) ?? config.model;
    const baseUrl = (edits?.base_url as string) ?? config.base_url ?? '';

    setTesting(config.provider);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/model-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          api_key: apiKey,
          model,
          base_url: baseUrl,
        }),
      });
      const data = await res.json();
      setTestResult({ provider: config.provider, success: data.success, message: data.message });
    } catch (e) {
      setTestResult({ provider: config.provider, success: false, message: '请求失败' });
    } finally {
      setTesting(null);
    }
  };

  const handleTogglePriority = async (config: ModelConfig) => {
    // Toggle priority: set this provider to 1 (primary), others to 2+
    const newPriority = config.priority === 1 ? 2 : 1;
    setSaving(config.provider);
    try {
      // Update this provider
      const res = await fetch('/api/settings/model-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, priority: newPriority }),
      });
      if (!res.ok) throw new Error('Save failed');

      // If setting to primary, demote others
      if (newPriority === 1) {
        const others = configs.filter((c) => c.id !== config.id && c.priority === 1);
        for (const other of others) {
          await fetch('/api/settings/model-config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: other.id, priority: 2 }),
          });
        }
      }

      // Reload all configs
      const reloadRes = await fetch('/api/settings/model-config');
      const { configs: newConfigs } = await reloadRes.json();
      setConfigs(newConfigs);
      setEditValues({});
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleEnabled = async (config: ModelConfig) => {
    setSaving(config.provider);
    try {
      const res = await fetch('/api/settings/model-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, enabled: !config.enabled }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { config: updated } = await res.json();
      setConfigs((prev) => prev.map((c) => (c.id === config.id ? updated : c)));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const isDeepSeek = (provider: string) => provider === 'deepseek';
  const modelOptions = (provider: string) => isDeepSeek(provider) ? DEEPSEEK_MODELS : ZHIPU_MODELS;

  const maskApiKey = (key: string | null) => {
    if (!key) return '';
    if (key.length <= 12) return '••••••••';
    return key.slice(0, 6) + '••••••••' + key.slice(-4);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Settings</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">模型配置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          配置大语言模型提供商、API密钥和参数，优先级最高的模型将优先调用
        </p>
      </div>

      {/* Priority Explanation */}
      <div className="mb-6 p-4 border border-border rounded-xl bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">调用优先级</span>
        </div>
        <p className="text-xs text-muted-foreground">
          系统按优先级顺序调用模型，优先级1的模型将首先被调用。如果调用失败，将自动降级到下一个可用模型。
          点击「设为优先」按钮切换主备模型。
        </p>
        <div className="flex items-center gap-3 mt-3">
          {configs.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                c.priority === 1
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <span>{c.priority === 1 ? '1st' : '2nd'}</span>
              <span>{c.provider === 'zhipu' ? '智谱' : 'DeepSeek'}</span>
              {c.enabled ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <span className="text-[10px] text-gray-400">(已禁用)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Provider Config Cards */}
      <div className="space-y-6">
        {configs.map((config) => {
          const isDS = isDeepSeek(config.provider);
          const providerName = isDS ? 'DeepSeek' : '智谱 (ZhiPu)';
          const providerIcon = isDS ? '🤖' : '🔮';
          const models = modelOptions(config.provider);
          const currentModel = (getEditValue(config, 'model') as string) || config.model;
          const thinkingEnabled = (getEditValue(config, 'thinking_enabled') as boolean) ?? config.thinking_enabled;
          const currentEffort = (getEditValue(config, 'reasoning_effort') as string) || config.reasoning_effort || 'high';
          const hasEdits = !!editValues[config.id];

          return (
            <div
              key={config.id}
              className={`border rounded-xl bg-card transition-colors ${
                config.priority === 1 ? 'border-primary/30' : 'border-border'
              } ${!config.enabled ? 'opacity-60' : ''}`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{providerIcon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{providerName}</h3>
                      {config.priority === 1 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          优先调用
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isDS ? 'DeepSeek API，支持深度推理模式' : '智谱 AI GLM 系列模型'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePriority(config)}
                    disabled={saving !== null}
                    className="h-7 gap-1 text-xs"
                  >
                    {config.priority === 1 ? (
                      <>
                        <ArrowDown className="h-3 w-3" />
                        设为备选
                      </>
                    ) : (
                      <>
                        <ArrowUp className="h-3 w-3" />
                        设为优先
                      </>
                    )}
                  </Button>
                  <Button
                    variant={config.enabled ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleEnabled(config)}
                    disabled={saving !== null}
                    className="h-7 text-xs"
                  >
                    {config.enabled ? '禁用' : '启用'}
                  </Button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-5">
                {/* API Key */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">API Key</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showApiKey[config.id] ? 'text' : 'password'}
                        value={(getEditValue(config, 'api_key') as string) ?? config.api_key ?? ''}
                        onChange={(e) => updateEditValue(config.id, 'api_key', e.target.value)}
                        placeholder="输入 API Key"
                        className="pr-10 text-sm font-mono"
                      />
                      <button
                        onClick={() => setShowApiKey((prev) => ({ ...prev, [config.id]: !prev[config.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey[config.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(config)}
                      disabled={testing !== null}
                      className="h-9 gap-1.5 shrink-0"
                    >
                      {testing === config.provider ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                      测试连接
                    </Button>
                  </div>
                  {testResult && testResult.provider === config.provider && (
                    <p className={`text-xs mt-1.5 ${testResult.success ? 'text-green-600' : 'text-red-500'}`}>
                      {testResult.message}
                    </p>
                  )}
                </div>

                {/* Model Selection */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" />
                    模型选择
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => updateEditValue(config.id, 'model', m.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-lg text-left transition-colors ${
                          currentModel === m.id
                            ? 'bg-primary/5 border border-primary/20'
                            : 'border border-border hover:bg-accent/50'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                            currentModel === m.id ? 'border-primary bg-primary' : 'border-gray-300'
                          }`}
                        >
                          {currentModel === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground block">{m.name}</span>
                          <span className="text-[11px] text-muted-foreground block mt-0.5">{m.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DeepSeek Thinking Mode */}
                {isDS && (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-foreground">Thinking Mode (深度推理)</span>
                      </div>
                      <button
                        onClick={() => updateEditValue(config.id, 'thinking_enabled', !thinkingEnabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          thinkingEnabled ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            thinkingEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      启用后模型将进行深度推理，输出质量更高但耗时更长。仅 DeepSeek V4 Pro 推荐启用。
                    </p>

                    {thinkingEnabled && (
                      <div>
                        <label className="text-xs font-medium text-foreground mb-2 block">
                          reasoning_effort (推理深度)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {REASONING_EFFORT_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateEditValue(config.id, 'reasoning_effort', opt.value)}
                              className={`p-2 rounded-lg text-center transition-colors ${
                                currentEffort === opt.value
                                  ? 'bg-primary/5 border border-primary/20'
                                  : 'border border-border hover:bg-accent/50'
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground block">{opt.label}</span>
                              <span className="text-[10px] text-muted-foreground block">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Advanced Parameters */}
                <details className="group">
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                    <Settings className="h-3.5 w-3.5" />
                    高级参数
                    <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        temperature
                        <span className="ml-1 text-[10px]">(0-200 = 0.0-2.0)</span>
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        value={(getEditValue(config, 'temperature') as number) ?? config.temperature ?? ''}
                        onChange={(e) => updateEditValue(config.id, 'temperature', e.target.value ? Number(e.target.value) : null)}
                        placeholder="默认 70"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        max_tokens
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={65536}
                        value={(getEditValue(config, 'max_tokens') as number) ?? config.max_tokens ?? ''}
                        onChange={(e) => updateEditValue(config.id, 'max_tokens', e.target.value ? Number(e.target.value) : null)}
                        placeholder="默认 4096"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        top_p
                        <span className="ml-1 text-[10px]">(0-100 = 0.0-1.0)</span>
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={(getEditValue(config, 'top_p') as number) ?? config.top_p ?? ''}
                        onChange={(e) => updateEditValue(config.id, 'top_p', e.target.value ? Number(e.target.value) : null)}
                        placeholder="默认 -"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        frequency_penalty
                        <span className="ml-1 text-[10px]">(0-200)</span>
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        value={(getEditValue(config, 'frequency_penalty') as number) ?? config.frequency_penalty ?? ''}
                        onChange={(e) => updateEditValue(config.id, 'frequency_penalty', e.target.value ? Number(e.target.value) : null)}
                        placeholder="默认 -"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        presence_penalty
                        <span className="ml-1 text-[10px]">(0-200)</span>
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        value={(getEditValue(config, 'presence_penalty') as number) ?? config.presence_penalty ?? ''}
                        onChange={(e) => updateEditValue(config.id, 'presence_penalty', e.target.value ? Number(e.target.value) : null)}
                        placeholder="默认 -"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        base_url (接口地址)
                      </label>
                      <Input
                        type="text"
                        value={(getEditValue(config, 'base_url') as string) ?? config.base_url ?? ''}
                        onChange={(e) => updateEditValue(config.id, 'base_url', e.target.value)}
                        placeholder="默认地址"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </details>

                {/* Save Button */}
                {hasEdits && (
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Button
                      onClick={() => handleSave(config)}
                      disabled={saving !== null}
                      className="gap-1.5"
                      size="sm"
                    >
                      {saving === config.provider ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      保存配置
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditValues((prev) => {
                        const next = { ...prev };
                        delete next[config.id];
                        return next;
                      })}
                    >
                      取消
                    </Button>
                    <span className="text-xs text-muted-foreground">有未保存的更改</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
