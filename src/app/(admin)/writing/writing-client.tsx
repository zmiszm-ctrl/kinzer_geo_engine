'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  FileText,
  PenTool,
  Minus,
  Plus,
} from 'lucide-react';


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
  source: string;
  status: string;
}

interface Props {
  intents: Intent[];
  intentTypes: IntentType[];
}

const WRITING_STYLES = [
  { id: 'xiaohongshu', name: '小红书', desc: '种草笔记风格，emoji丰富，轻松活泼', icon: '📕' },
  { id: 'wechat', name: '公众号', desc: '专业深度风格，结构清晰，权威可信', icon: '📱' },
  { id: 'toutiao', name: '头条新闻', desc: '资讯报道风格，标题吸引，信息密度高', icon: '📰' },
  { id: 'zhihu', name: '知乎', desc: '知识分享风格，逻辑严密，干货满满', icon: '💡' },
  { id: 'blog', name: '技术博客', desc: '技术文章风格，代码示例，专业严谨', icon: '📝' },
  { id: 'official', name: '官网文章', desc: '品牌官方风格，产品导向，SEO友好', icon: '🏢' },
] as const;

type StyleId = (typeof WRITING_STYLES)[number]['id'];

export function WritingPage({ intents, intentTypes }: Props) {
  const [selectedIntentIds, setSelectedIntentIds] = useState<Set<string>>(new Set());
  const [selectedStyles, setSelectedStyles] = useState<Set<StyleId>>(new Set(['xiaohongshu']));
  const [customRequirements, setCustomRequirements] = useState('');
  const [articleCount, setArticleCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<
    { style: StyleId; title: string; content: string; saved: boolean }[]
  >([]);
  const [streamingContent, setStreamingContent] = useState<{
    style: StyleId;
    content: string;
  } | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const typeMap = Object.fromEntries(intentTypes.map((t) => [t.id, t]));

  const toggleIntent = (id: string) => {
    const next = new Set(selectedIntentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIntentIds(next);
  };

  const toggleStyle = (id: StyleId) => {
    const next = new Set(selectedStyles);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStyles(next);
  };

  const handleGenerate = useCallback(async () => {
    if (selectedIntentIds.size === 0 || selectedStyles.size === 0) return;

    setGenerating(true);
    setGeneratedContents([]);
    setStreamingContent(null);

    const selectedIntents = intents.filter((i) => selectedIntentIds.has(i.id));
    const results: { style: StyleId; title: string; content: string; saved: boolean }[] = [];

    for (const styleId of Array.from(selectedStyles)) {
      const styleInfo = WRITING_STYLES.find((s) => s.id === styleId)!;
      setStreamingContent({ style: styleId, content: '' });

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch('/api/writing/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intents: selectedIntents.map((i) => ({
              name: i.name,
              query: i.query,
              keywords: Array.isArray(i.keywords) ? i.keywords as string[] : [],
            })),
            style: styleId,
            style_name: styleInfo.name,
            custom_requirements: customRequirements,
            article_count: articleCount,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('Generate failed');

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;
            setStreamingContent({ style: styleId, content: fullContent });
          }
        }

        // Split by "---" separator for multi-article results
        const articles = fullContent
          .split(/\n*---\n*/)
          .map((a) => a.trim())
          .filter((a) => a.length > 0);

        if (articles.length > 1) {
          // Multiple articles returned
          for (const article of articles) {
            const titleMatch = article.match(/^#\s*(.+)/m);
            const title = titleMatch ? titleMatch[1] : selectedIntents[0].name;
            results.push({ style: styleId, title, content: article, saved: false });
          }
        } else {
          // Single article
          const titleMatch = fullContent.match(/^#\s*(.+)/m);
          const title = titleMatch ? titleMatch[1] : selectedIntents[0].name;
          results.push({ style: styleId, title, content: fullContent, saved: false });
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error(e);
          results.push({
            style: styleId,
            title: '生成失败',
            content: '内容生成失败，请重试',
            saved: false,
          });
        }
      }
    }

    setGeneratedContents(results);
    setStreamingContent(null);
    setGenerating(false);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [selectedIntentIds, selectedStyles, intents, customRequirements, articleCount]);

  const handleCopy = async (content: string, idx: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSave = async (idx: number) => {
    const item = generatedContents[idx];
    try {
      const res = await fetch('/api/writing/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          content: item.content,
          style: item.style,
          intent_ids: Array.from(selectedIntentIds),
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setGeneratedContents((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, saved: true } : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Writing</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">GEO智能写作</h1>
        <p className="text-sm text-muted-foreground mt-1">
          选择意图和风格，AI自动生成符合不同平台调性的优质内容
        </p>
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-6">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Intent Selection */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              选择意图
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              选择一个或多个意图作为内容生成的基础
            </p>
            <div className="max-h-[280px] overflow-y-auto space-y-1.5">
              {intents.map((intent) => {
                const isSelected = selectedIntentIds.has(intent.id);
                const typeName = intent.intent_type_id
                  ? typeMap[intent.intent_type_id]?.name || ''
                  : '';
                const typeColor = intent.intent_type_id
                  ? typeMap[intent.intent_type_id]?.color || '#6b7280'
                  : '#6b7280';

                return (
                  <button
                    key={intent.id}
                    onClick={() => toggleIntent(intent.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/5 border border-primary/20'
                        : 'border border-transparent hover:bg-accent/50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground truncate block">{intent.name}</span>
                      {intent.query && intent.query !== intent.name && (
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {intent.query}
                        </span>
                      )}
                    </div>
                    {typeName && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: `${typeColor}15`,
                          color: typeColor,
                        }}
                      >
                        {typeName}
                      </span>
                    )}
                  </button>
                );
              })}
              {intents.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  暂无意图数据，请先在意图管理中创建
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                已选择 {selectedIntentIds.size} 个意图
              </span>
            </div>
          </div>

          {/* Style Selection */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-primary" />
              写作风格
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              选择内容的目标平台和风格，可多选
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WRITING_STYLES.map((style) => {
                const isSelected = selectedStyles.has(style.id);
                return (
                  <button
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/5 border border-primary/20'
                        : 'border border-border hover:bg-accent/50'
                    }`}
                  >
                    <span className="text-lg">{style.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-foreground block">{style.name}</span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        {style.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Article Count */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">生成数量</h3>
            <p className="text-xs text-muted-foreground mb-3">
              每种风格生成的文章数量，多篇文章将从不同角度撰写
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setArticleCount((c) => Math.max(1, c - 1))}
                disabled={articleCount <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-lg font-semibold text-foreground w-8 text-center">
                {articleCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setArticleCount((c) => Math.min(5, c + 1))}
                disabled={articleCount >= 5}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">篇</span>
            </div>
          </div>

          {/* Custom Requirements */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">补充要求</h3>
            <Textarea
              placeholder="可选：输入对生成内容的额外要求，如重点突出某个产品特性、特定用词偏好、目标受众等..."
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || selectedIntentIds.size === 0 || selectedStyles.size === 0}
            className="w-full h-11 gap-2"
            size="lg"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating
              ? '正在生成...'
              : `生成内容 (${selectedStyles.size}种风格 × ${articleCount}篇)`}
          </Button>
        </div>

        {/* Right: Results */}
        <div ref={resultRef}>
          {/* Streaming Content */}
          {streamingContent && (
            <div className="border border-primary/20 rounded-xl p-5 bg-card mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                <span className="text-xs font-medium text-primary">
                  正在生成 {WRITING_STYLES.find((s) => s.id === streamingContent.style)?.name} 风格内容...
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {streamingContent.content || '等待内容...'}
              </div>
            </div>
          )}

          {/* Generated Contents */}
          {generatedContents.map((item, idx) => {
            const styleInfo = WRITING_STYLES.find((s) => s.id === item.style);
            return (
              <div key={idx} className="border border-border rounded-xl p-5 bg-card mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{styleInfo?.icon}</span>
                    <span className="text-sm font-medium text-foreground">{styleInfo?.name}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-sm text-foreground font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.content, idx)}
                      className="h-7 gap-1"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedIdx === idx ? '已复制' : '复制'}
                    </Button>
                    <Button
                      variant={item.saved ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={() => handleSave(idx)}
                      disabled={item.saved}
                      className="h-7 gap-1"
                    >
                      <Check className={`h-3.5 w-3.5 ${item.saved ? 'text-green-500' : ''}`} />
                      {item.saved ? '已保存' : '保存'}
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {!generating && !streamingContent && generatedContents.length === 0 && (
            <div className="border border-dashed border-border rounded-xl py-20 flex flex-col items-center justify-center bg-card/50">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                选择意图和风格后，点击生成按钮
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI将根据意图生成不同平台风格的内容
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
