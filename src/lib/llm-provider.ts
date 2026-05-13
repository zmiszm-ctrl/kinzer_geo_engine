/**
 * LLM Provider - 动态读取数据库配置，智谱/DeepSeek 自动降级
 * 支持流式（SSE）和非流式调用
 */

import { getDb } from '@/lib/db';

// ── Types ──────────────────────────────────────────────
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMInvokeResult {
  content: string;
  model: string;
  provider: string;
}

interface LLMStreamChunk {
  content: string;
  done: boolean;
  model: string;
  provider: string;
}

interface ProviderConfig {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
  thinkingEnabled: boolean;
  reasoningEffort: string | null;
  temperature: number | null;
  maxTokens: number | null;
  topP: number | null;
  frequencyPenalty: number | null;
  presencePenalty: number | null;
}

// ── Fallback defaults (used when DB is unreachable) ────
const FALLBACK_CONFIGS: ProviderConfig[] = [
  {
    name: 'zhipu',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKey: 'b57f666d002c4819b7a37201eb55b7b5.X7ZupcNr37dANz62',
    model: 'glm-4.5-air',
    thinkingEnabled: false,
    reasoningEffort: null,
    temperature: null,
    maxTokens: null,
    topP: null,
    frequencyPenalty: null,
    presencePenalty: null,
  },
  {
    name: 'deepseek',
    baseURL: 'https://api.deepseek.com/chat/completions',
    apiKey: 'sk-450b6d7ce1324528bb4979e887192ca1',
    model: 'deepseek-v4-flash',
    thinkingEnabled: false,
    reasoningEffort: null,
    temperature: null,
    maxTokens: null,
    topP: null,
    frequencyPenalty: null,
    presencePenalty: null,
  },
];

// ── Load config from DB with cache ─────────────────────
let cachedProviders: ProviderConfig[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

async function loadProviders(): Promise<ProviderConfig[]> {
  const now = Date.now();
  if (cachedProviders && now - cacheTimestamp < CACHE_TTL) {
    return cachedProviders;
  }

  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM model_configs WHERE enabled = 1 ORDER BY priority ASC'
    ).all() as Record<string, unknown>[];

    if (!rows || rows.length === 0) {
      console.warn('[LLM] DB config unavailable, using fallback defaults');
      return FALLBACK_CONFIGS;
    }

    const providers: ProviderConfig[] = rows.map((row) => ({
      name: row.provider as string,
      baseURL: (row.base_url as string) || (row.provider === 'zhipu'
        ? 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
        : 'https://api.deepseek.com/chat/completions'),
      apiKey: (row.api_key as string) || '',
      model: row.model as string,
      thinkingEnabled: Boolean(row.thinking_enabled),
      reasoningEffort: row.reasoning_effort as string | null,
      temperature: row.temperature as number | null,
      maxTokens: row.max_tokens as number | null,
      topP: row.top_p as number | null,
      frequencyPenalty: row.frequency_penalty as number | null,
      presencePenalty: row.presence_penalty as number | null,
    }));

    cachedProviders = providers;
    cacheTimestamp = now;
    return providers;
  } catch {
    console.warn('[LLM] DB config error, using fallback defaults');
    return FALLBACK_CONFIGS;
  }
}

/** Clear provider cache - call after config update */
export function clearProviderCache(): void {
  cachedProviders = null;
  cacheTimestamp = 0;
}

// ── Build request body ─────────────────────────────────
function buildRequestBody(
  provider: ProviderConfig,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Record<string, unknown> {
  const temperature = options?.temperature ?? provider.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? provider.maxTokens ?? 4096;

  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (provider.topP !== null) body.top_p = provider.topP;
  if (provider.frequencyPenalty !== null) body.frequency_penalty = provider.frequencyPenalty;
  if (provider.presencePenalty !== null) body.presence_penalty = provider.presencePenalty;

  // DeepSeek Thinking Mode
  if (provider.name === 'deepseek' && provider.thinkingEnabled) {
    body.thinking = { type: 'enabled' };
    if (provider.reasoningEffort) {
      body.reasoning_effort = provider.reasoningEffort;
    }
  }

  return body;
}

// ── Helper: extract delta content from SSE data ────────
function extractDeltaContent(data: Record<string, unknown>, provider: string): string {
  try {
    const choices = data.choices as Array<{
      delta?: { content?: string; reasoning_content?: string };
      message?: { content?: string };
    }>;
    if (!choices || choices.length === 0) return '';

    const choice = choices[0];

    // Stream delta
    if (choice.delta) {
      return choice.delta.content || '';
    }

    // Non-stream message
    if (choice.message) {
      return choice.message.content || '';
    }

    return '';
  } catch {
    return '';
  }
}

// ── Non-streaming invoke with fallback ─────────────────
export async function llmInvoke(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<LLMInvokeResult> {
  const providers = await loadProviders();

  for (const provider of providers) {
    if (!provider.apiKey) continue;

    try {
      const body = buildRequestBody(provider, messages, options);
      body.stream = false;

      const response = await fetch(provider.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[LLM] ${provider.name} invoke failed (${response.status}): ${errText.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const content = extractDeltaContent(data, provider.name);

      return {
        content,
        model: provider.model,
        provider: provider.name,
      };
    } catch (err) {
      console.warn(`[LLM] ${provider.name} invoke error:`, err instanceof Error ? err.message : err);
      continue;
    }
  }

  throw new Error('所有LLM提供商调用失败');
}

// ── Streaming invoke with fallback ─────────────────────
export async function* llmStream(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): AsyncGenerator<LLMStreamChunk> {
  const providers = await loadProviders();

  for (const provider of providers) {
    if (!provider.apiKey) continue;

    let streamStarted = false;

    try {
      const body = buildRequestBody(provider, messages, options);
      body.stream = true;

      const response = await fetch(provider.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[LLM] ${provider.name} stream failed (${response.status}): ${errText.slice(0, 200)}`);
        continue;
      }

      if (!response.body) {
        console.warn(`[LLM] ${provider.name} no body in response`);
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]' || dataStr.length === 0) continue;

          try {
            const data = JSON.parse(dataStr);
            const content = extractDeltaContent(data, provider.name);
            if (content) {
              streamStarted = true;
              yield {
                content,
                done: false,
                model: provider.model,
                provider: provider.name,
              };
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        const dataStr = buffer.slice(6).trim();
        if (dataStr !== '[DONE]' && dataStr.length > 0) {
          try {
            const data = JSON.parse(dataStr);
            const content = extractDeltaContent(data, provider.name);
            if (content) {
              streamStarted = true;
              yield {
                content,
                done: false,
                model: provider.model,
                provider: provider.name,
              };
            }
          } catch {
            // skip
          }
        }
      }

      if (streamStarted) {
        yield { content: '', done: true, model: provider.model, provider: provider.name };
        return;
      }

      console.warn(`[LLM] ${provider.name} stream completed but no content received`);
    } catch (err) {
      console.warn(`[LLM] ${provider.name} stream error:`, err instanceof Error ? err.message : err);
      if (streamStarted) {
        yield { content: '', done: true, model: provider.model, provider: provider.name };
        return;
      }
      continue;
    }
  }

  throw new Error('所有LLM提供商调用失败');
}
