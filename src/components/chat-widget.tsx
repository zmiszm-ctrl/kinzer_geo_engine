'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  RotateCcw,
  Trash2,
  Settings2,
  ChevronDown,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
}

interface QuickQuestion {
  label: string;
  prompt: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  { label: 'GEO 策略建议', prompt: '请给我一些GEO优化策略建议，帮助我的内容在AI搜索引擎中获得更高引用率' },
  { label: '意图分析', prompt: '帮我分析一下"云服务器"这个关键词背后的用户意图类型' },
  { label: '功能使用指引', prompt: '请介绍一下GEO引擎平台各模块的功能和使用流程' },
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [mounted, setMounted] = useState(false);

  // Initialize position after mount (client-only)
  useEffect(() => {
    setBtnPos({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
    setMounted(true);
  }, []);

  // Draggable state
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [panelSide, setPanelSide] = useState<'left' | 'right'>('right');

  // Derived: bottom offset for the floating button
  const btnBottom = mounted ? window.innerHeight - btnPos.y - 56 : 64;
  const dragRef = useRef<{ startX: number; startY: number; startBtnX: number; startBtnY: number; moved: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Today's date key
  const todayKey = new Date().toISOString().slice(0, 10);

  // Load today's history on open
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/history?date=${todayKey}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silently fail
    }
  }, [todayKey]);

  // Load system prompt
  const loadSystemPrompt = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/system-prompt');
      if (res.ok) {
        const data = await res.json();
        setSystemPrompt(data.content || '');
      }
    } catch {
      // silently fail
    }
  }, []);

  // Save messages to history
  const saveHistory = useCallback(async (msgs: ChatMessage[]) => {
    try {
      await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayKey, messages: msgs }),
      });
    } catch {
      // silently fail
    }
  }, [todayKey]);

  // Save system prompt
  const saveSystemPrompt = useCallback(async (content: string) => {
    try {
      await fetch('/api/chat/system-prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setSystemPrompt(content);
    } catch {
      // silently fail
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load data when opening
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    loadHistory();
    loadSystemPrompt();
  }, [loadHistory, loadSystemPrompt]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowPromptEditor(false);
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startBtnX: btnPos.x,
      startBtnY: btnPos.y,
      moved: false,
    };
  }, [btnPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.moved = true;
    }
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragRef.current.startBtnX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, dragRef.current.startBtnY + dy));
    setBtnPos({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return;
    if (!dragRef.current.moved) {
      // Click - toggle panel
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    } else {
      // Snap to nearest edge
      setBtnPos(prev => {
        const snapX = prev.x > window.innerWidth / 2 ? window.innerWidth - 80 : 16;
        setPanelSide(snapX > window.innerWidth / 2 ? 'right' : 'left');
        return { ...prev, x: snapX };
      });
    }
    dragRef.current = null;
  }, [isOpen, handleClose, handleOpen]);

  // Update panel side based on button position
  useEffect(() => {
    setPanelSide(btnPos.x > window.innerWidth / 2 ? 'right' : 'left');
  }, [btnPos.x]);

  // Streaming chat
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: content.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let lastProvider = '';
      let lastModel = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                fullContent += `\n\n⚠️ 错误: ${data.error}`;
                break;
              }
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.provider) lastProvider = data.provider;
              if (data.model) lastModel = data.model;
              if (data.done) break;
            } catch {
              // skip malformed SSE
            }
          }
        }
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        provider: lastProvider,
        model: lastModel,
      };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);
      setStreamingContent('');
      saveHistory(updatedMessages);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: '抱歉，请求出错了，请稍后重试。',
        timestamp: Date.now(),
      };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming, saveHistory]);

  const handleRegenerate = useCallback(() => {
    if (messages.length < 2 || isStreaming) return;
    const lastUserIdx = [...messages].map((m, i) => m.role === 'user' ? i : -1).filter(i => i >= 0).pop();
    if (lastUserIdx === undefined) return;
    const lastUserMsg = messages[lastUserIdx];
    const trimmed = messages.slice(0, lastUserIdx);
    setMessages(trimmed);
    saveHistory(trimmed);
    setTimeout(() => sendMessage(lastUserMsg.content), 100);
  }, [messages, isStreaming, saveHistory, sendMessage]);

  const handleClear = useCallback(async () => {
    setMessages([]);
    saveHistory([]);
  }, [saveHistory]);

  const handleSavePrompt = useCallback(() => {
    saveSystemPrompt(editedPrompt);
    setShowPromptEditor(false);
  }, [editedPrompt, saveSystemPrompt]);

  // Quick question click
  const handleQuickQuestion = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  // Panel position
  const panelStyle: React.CSSProperties = panelSide === 'right'
    ? { right: 16, bottom: 80 }
    : { left: 16, bottom: 80 };

  // Format time
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="fixed z-[9999] cursor-grab active:cursor-grabbing touch-none"
        style={{ left: btnPos.x, bottom: btnBottom, width: 56, height: 56 }}
      >
        <div className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 ${isOpen ? 'bg-slate-500' : 'bg-primary hover:bg-primary/90'}`}>
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </div>

      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div
          className="fixed z-[9998] flex flex-col bg-white border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ ...panelStyle, width: 400, height: 560 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">GEO AI 助手</div>
                <div className="text-[10px] text-muted-foreground">{todayKey} 对话</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditedPrompt(systemPrompt); setShowPromptEditor(true); }} title="编辑系统提示词">
                <Settings2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMinimize} title="最小化">
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose} title="关闭">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* System Prompt Editor */}
          {showPromptEditor ? (
            <div className="flex-1 flex flex-col p-4 gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">系统提示词</h3>
                <span className="text-[10px] text-muted-foreground">
                  编辑 chat-system-prompt.md
                </span>
              </div>
              <Textarea
                value={editedPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedPrompt(e.target.value)}
                className="flex-1 text-xs font-mono resize-none leading-relaxed"
                placeholder="输入系统提示词内容..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSavePrompt} className="flex-1 text-xs h-8">
                  保存
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPromptEditor(false)} className="flex-1 text-xs h-8">
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {messages.length === 0 && !isStreaming ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-primary/60" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      有任何关于 GEO 的问题，<br />随时向我提问
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                      {QUICK_QUESTIONS.map((q) => (
                        <button
                          key={q.label}
                          onClick={() => handleQuickQuestion(q.prompt)}
                          className="text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs text-foreground/80 transition-colors"
                        >
                          <span className="font-medium text-primary/70">{q.label}</span>
                          <ChevronDown className="w-3 h-3 inline ml-1 rotate-[-90deg]" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-end gap-1.5 max-w-[85%]">
                          {msg.role === 'assistant' && (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-4">
                              <MessageSquare className="w-2.5 h-2.5 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted/70 text-foreground rounded-bl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                              <span className="text-[9px] text-muted-foreground/60">{formatTime(msg.timestamp)}</span>
                              {msg.role === 'assistant' && msg.provider && (
                                <span className="text-[9px] text-muted-foreground/40">{msg.provider} · {msg.model}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Streaming content */}
                    {isStreaming && streamingContent && (
                      <div className="flex flex-col items-start">
                        <div className="flex items-end gap-1.5 max-w-[85%]">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-4">
                            <MessageSquare className="w-2.5 h-2.5 text-primary" />
                          </div>
                          <div>
                            <div className="px-3 py-2 rounded-xl rounded-bl-sm bg-muted/70 text-foreground text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {streamingContent}
                              <span className="inline-block w-1.5 h-3.5 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Loading dots */}
                    {isStreaming && !streamingContent && (
                      <div className="flex items-start gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <div className="px-3 py-2 rounded-xl rounded-bl-sm bg-muted/70">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Toolbar */}
              {messages.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 border-t border-border/50">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRegenerate} disabled={isStreaming} title="重新生成">
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear} disabled={isStreaming} title="清空对话">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <div className="flex-1" />
                  <span className="text-[9px] text-muted-foreground/50">AI 可能产生不准确信息</span>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border px-3 py-2">
                <div className="flex gap-2 items-end">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder="输入消息... (Enter 发送)"
                    className="min-h-[36px] max-h-[100px] text-xs resize-none leading-relaxed"
                    rows={1}
                    disabled={isStreaming}
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isStreaming}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Minimized indicator */}
      {isOpen && isMinimized && (
        <div
          className="fixed z-[9998] cursor-pointer"
          style={{ ...panelStyle }}
          onClick={() => setIsMinimized(false)}
        >
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
            <MessageSquare className="w-3 h-3" />
            AI 对话
          </div>
        </div>
      )}
    </>
  );
}
