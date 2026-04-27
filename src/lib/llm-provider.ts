/**
 * LLM Provider - 智谱优先，DeepSeek 备选
 * 支持流式（SSE）和非流式调用
 */

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
}

// ── Provider configs ───────────────────────────────────
const ZHIPU_CONFIG: ProviderConfig = {
  name: 'zhipu',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: process.env.BIGMODEL_API_KEY || 'b57f666d002c4819b7a37201eb55b7b5.X7ZupcNr37dANz62',
  model: process.env.BIGMODEL_MODEL || 'glm-4.5-air',
};

const DEEPSEEK_CONFIG: ProviderConfig = {
  name: 'deepseek',
  baseURL: 'https://api.deepseek.com/chat/completions',
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-450b6d7ce1324528bb4979e887192ca1',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
};

const PROVIDERS = [ZHIPU_CONFIG, DEEPSEEK_CONFIG];

// ── Helper: parse SSE stream from fetch Response ───────
function parseSSELines(text: string): string[] {
  return text
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6).trim())
    .filter((data) => data !== '[DONE]' && data.length > 0);
}

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
      // DeepSeek: skip reasoning_content, only return content
      if (provider === 'deepseek') {
        return choice.delta.content || '';
      }
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
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 4096;

  for (const provider of PROVIDERS) {
    try {
      const body = JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      });

      const response = await fetch(provider.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body,
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[LLM] ${provider.name} invoke failed (${response.status}): ${errText.slice(0, 200)}`);
        continue; // try next provider
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
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 4096;

  for (const provider of PROVIDERS) {
    let streamStarted = false;
    let streamError = false;

    try {
      const body = JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      const response = await fetch(provider.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body,
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

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line in buffer

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

      // If we successfully got at least some content, we're done
      if (streamStarted) {
        yield { content: '', done: true, model: provider.model, provider: provider.name };
        return;
      }

      // Stream completed but no content - try next provider
      console.warn(`[LLM] ${provider.name} stream completed but no content received`);
    } catch (err) {
      console.warn(`[LLM] ${provider.name} stream error:`, err instanceof Error ? err.message : err);
      if (streamStarted) {
        // If we already received some content before error, yield what we have and stop
        yield { content: '', done: true, model: provider.model, provider: provider.name };
        return;
      }
      streamError = true;
      continue; // try next provider
    }
  }

  throw new Error('所有LLM提供商调用失败');
}
