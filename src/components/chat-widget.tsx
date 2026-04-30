'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Trash2, RotateCcw, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
}

// ── Floating Button ────────────────────────────────────
function FloatingButton({
  position,
  onClick,
  onDragEnd,
}: {
  position: { x: number; y: number };
  onClick: () => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      hasMoved.current = false;
      dragStart.current = { x: e.clientX, y: e.clientY };
      posStart.current = { ...position };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }
      const newX = posStart.current.x + dx;
      const newY = posStart.current.y + dy;
      if (btnRef.current) {
        btnRef.current.style.left = `${newX}px`;
        btnRef.current.style.top = `${newY}px`;
      }
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (hasMoved.current && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        // Snap to nearest edge
        const snapX = rect.left + rect.width / 2 < vw / 2 ? 20 : vw - rect.width - 20;
        const clampY = Math.max(20, Math.min(rect.top, window.innerHeight - rect.height - 20));
        btnRef.current.style.left = `${snapX}px`;
        btnRef.current.style.top = `${clampY}px`;
        onDragEnd({ x: snapX, y: clampY });
      } else {
        onClick();
      }
    },
    [onClick, onDragEnd],
  );

  return (
    <button
      ref={btnRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed z-[9999] flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow duration-200 hover:shadow-xl active:cursor-grabbing select-none touch-none"
      style={{ left: position.x, top: position.y }}
      aria-label="打开 AI 助手"
    >
      <MessageSquare className="h-6 w-6" />
    </button>
  );
}

// ── Chat Panel ─────────────────────────────────────────
function ChatPanel({
  anchor,
  onClose,
  onMinimize,
}: {
  anchor: { x: number; y: number };
  onClose: () => void;
  onMinimize: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Determine panel position based on anchor
  const isRightSide = anchor.x > window.innerWidth / 2;
  const panelX = isRightSide ? anchor.x - 380 : anchor.x + 64;
  const panelY = Math.max(20, Math.min(anchor.y - 200, window.innerHeight - 560));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    try {
      abortRef.current = new AbortController();
      const chatMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || '请求失败');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取流');

      const decoder = new TextDecoder();
      let buffer = '';
      let provider = '';
      let model = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: `错误: ${data.error}` } : m,
                ),
              );
              break;
            }
            if (data.provider) provider = data.provider;
            if (data.model) model = data.model;
            if (data.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + data.content } : m,
                ),
              );
            }
            if (data.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, provider, model } : m,
                ),
              );
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      const msg = error instanceof Error ? error.message : '未知错误';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `请求失败: ${msg}` } : m,
        ),
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [input, isStreaming, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  const clearChat = useCallback(() => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setIsStreaming(false);
  }, [isStreaming]);

  const regenerateLast = useCallback(() => {
    if (isStreaming) return;
    // Find last user message and remove everything after it
    const lastUserIdx = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const userMsg = messages[lastUserIdx];
    const trimmed = messages.slice(0, lastUserIdx);
    setMessages(trimmed);
    // Re-send
    setInput(userMsg.content);
    setTimeout(() => {
      // Trigger send via ref
      const textarea = inputRef.current;
      if (textarea) {
        textarea.value = userMsg.content;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 50);
  }, [isStreaming, messages]);

  return (
    <div
      className="fixed z-[9998] flex h-[540px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      style={{ left: panelX, top: panelY }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">GEO AI 助手</h3>
            <p className="text-xs text-muted-foreground">智能优化 · 随时问答</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={regenerateLast}
            disabled={isStreaming || messages.length === 0}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            title="重新生成"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            title="清空对话"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onMinimize}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="最小化"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">GEO AI 助手</p>
            <p className="mt-1 text-xs text-muted-foreground">
              我可以帮你解答 GEO 优化策略、内容写作建议、平台功能等问题
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 w-full">
              {[
                '如何提升内容在AI搜索中的可见性？',
                '小红书和公众号的GEO策略有什么不同？',
                '意图挖掘功能怎么使用？',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-3 w-3 text-primary" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              <div className="whitespace-pre-wrap break-words">
                {msg.content || (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:0.4s]" />
                  </span>
                )}
              </div>
              {msg.role === 'assistant' && msg.content && msg.provider && (
                <div className="mt-1.5 text-[10px] text-muted-foreground/60">
                  {msg.provider} · {msg.model}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
          AI 助手可能产生不准确的信息，请注意甄别
        </p>
      </div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize position on first render (bottom-right)
  useEffect(() => {
    setBtnPos({
      x: window.innerWidth - 84,
      y: window.innerHeight - 84,
    });
  }, []);

  if (!btnPos) return null;

  return (
    <>
      {!isOpen && (
        <FloatingButton
          position={btnPos}
          onClick={() => setIsOpen(true)}
          onDragEnd={(pos) => setBtnPos(pos)}
        />
      )}
      {isOpen && (
        <ChatPanel
          anchor={btnPos}
          onClose={() => setIsOpen(false)}
          onMinimize={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
