'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Sparkles,
  Search,
  Trash2,
  Pencil,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';


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
  parent_id: string | null;
  keywords: unknown;
  priority: number;
  tags: unknown;
  source: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

interface Props {
  initialIntents: Intent[];
  intentTypes: IntentType[];
}

export function CustomIntentsPage({ initialIntents, intentTypes }: Props) {
  const router = useRouter();
  const [intents, setIntents] = useState<Intent[]>(initialIntents);
  const [search, setSearch] = useState('');
  const [miningOpen, setMiningOpen] = useState(false);
  const [miningKeyword, setMiningKeyword] = useState('');
  const [miningLoading, setMiningLoading] = useState(false);
  const [minedIntents, setMinedIntents] = useState<
    { name: string; query: string; intent_type_code: string; keywords: string[] }[]
  >([]);
  const [selectedMined, setSelectedMined] = useState<Set<number>>(new Set());
  const [savingMined, setSavingMined] = useState(false);

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Partial<Intent>;
  }>({ open: false, mode: 'create', data: {} });

  const typeMap = Object.fromEntries(intentTypes.map((t) => [t.id, t]));

  const filteredIntents = intents.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.query && i.query.toLowerCase().includes(search.toLowerCase()))
  );

  const handleMineIntents = useCallback(async () => {
    if (!miningKeyword.trim()) return;
    setMiningLoading(true);
    setMinedIntents([]);
    setSelectedMined(new Set());
    try {
      const res = await fetch('/api/intents/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: miningKeyword.trim() }),
      });
      if (!res.ok) throw new Error('Mining failed');
      const data = await res.json();
      setMinedIntents(data.intents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMiningLoading(false);
    }
  }, [miningKeyword]);

  const toggleMinedSelection = (idx: number) => {
    const next = new Set(selectedMined);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedMined(next);
  };

  const selectAllMined = () => {
    if (selectedMined.size === minedIntents.length) {
      setSelectedMined(new Set());
    } else {
      setSelectedMined(new Set(minedIntents.map((_, i) => i)));
    }
  };

  const handleSaveMined = async () => {
    if (selectedMined.size === 0) return;
    setSavingMined(true);
    try {
      const toSave = Array.from(selectedMined).map((idx) => minedIntents[idx]);
      const res = await fetch('/api/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intents: toSave }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setIntents((prev) => [...data.saved, ...prev]);
      setMiningOpen(false);
      setMiningKeyword('');
      setMinedIntents([]);
      setSelectedMined(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMined(false);
    }
  };

  const handleDeleteIntent = async (id: string) => {
    try {
      const res = await fetch(`/api/intents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setIntents((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSingle = async () => {
    const { name, query, intent_type_id } = editDialog.data;
    if (!name) return;
    try {
      if (editDialog.mode === 'edit' && editDialog.data.id) {
        const res = await fetch('/api/intents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editDialog.data.id, name, query, intent_type_id }),
        });
        if (!res.ok) throw new Error('Update failed');
        const updated = (await res.json()).intent;
        setIntents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const res = await fetch('/api/intents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intents: [{ name, query: query || name, intent_type_code: intent_type_id || 'informational' }],
          }),
        });
        if (!res.ok) throw new Error('Create failed');
        const data = await res.json();
        setIntents((prev) => [...data.saved, ...prev]);
      }
      setEditDialog({ open: false, mode: 'create', data: {} });
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeColor = (typeId: string | null) => {
    if (!typeId) return '#6b7280';
    return typeMap[typeId]?.color || '#6b7280';
  };

  const getTypeName = (typeId: string | null) => {
    if (!typeId) return '未分类';
    return typeMap[typeId]?.name || '未分类';
  };

  const formatKeywords = (kw: unknown): string[] => {
    if (Array.isArray(kw)) return kw as string[];
    return [];
  };

  const formatTags = (tags: unknown): string[] => {
    if (Array.isArray(tags)) return tags as string[];
    return [];
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Intent</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">自定义意图</h1>
        <p className="text-sm text-muted-foreground mt-1">
          创建和管理用户意图列表，支持输入关键词通过AI自动挖掘意图
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索意图..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setMiningOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI挖掘意图
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              setEditDialog({ open: true, mode: 'create', data: {} })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            手动创建
          </Button>
        </div>
      </div>

      {/* Intent List */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_120px_120px_100px_120px_80px] items-center gap-4 px-5 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
          <span>意图名称</span>
          <span>意图类型</span>
          <span>关键词</span>
          <span>来源</span>
          <span>创建时间</span>
          <span className="text-right">操作</span>
        </div>

        <div className="divide-y divide-border/50">
          {filteredIntents.map((intent) => (
            <div
              key={intent.id}
              className="grid grid-cols-[1fr_120px_120px_100px_120px_80px] items-center gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{intent.name}</span>
                {intent.query && intent.query !== intent.name && (
                  <span className="text-xs text-muted-foreground truncate">
                    &ldquo;{intent.query}&rdquo;
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: getTypeColor(intent.intent_type_id) }}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {getTypeName(intent.intent_type_id)}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {formatKeywords(intent.keywords).slice(0, 2).map((kw, i) => (
                  <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    {kw}
                  </span>
                ))}
                {formatKeywords(intent.keywords).length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{formatKeywords(intent.keywords).length - 2}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {intent.source === 'ai' ? (
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    AI挖掘
                  </span>
                ) : (
                  '手动创建'
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {intent.created_at
                  ? new Date(intent.created_at).toLocaleDateString('zh-CN')
                  : '-'}
              </span>
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() =>
                    setEditDialog({ open: true, mode: 'edit', data: { ...intent } })
                  }
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteIntent(intent.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredIntents.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              {search ? '没有匹配的意图' : '暂无意图数据，点击上方按钮创建或AI挖掘'}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>共 {intents.length} 个意图</span>
        <span>AI挖掘 {intents.filter((i) => i.source === 'ai').length} 个</span>
        <span>手动创建 {intents.filter((i) => i.source === 'manual').length} 个</span>
      </div>

      {/* AI Mining Dialog */}
      <Dialog open={miningOpen} onOpenChange={setMiningOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI意图挖掘
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="输入行业关键词，如：CRM系统、智能硬件、GEO优化..."
                value={miningKeyword}
                onChange={(e) => setMiningKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMineIntents()}
                className="pl-9"
                disabled={miningLoading}
              />
            </div>
            <Button
              onClick={handleMineIntents}
              disabled={miningLoading || !miningKeyword.trim()}
              className="gap-1.5 shrink-0"
            >
              {miningLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {miningLoading ? '挖掘中...' : '开始挖掘'}
            </Button>
          </div>

          {minedIntents.length > 0 && (
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  发现 {minedIntents.length} 个意图
                </span>
                <button
                  onClick={selectAllMined}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedMined.size === minedIntents.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="space-y-2">
                {minedIntents.map((intent, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedMined.has(idx)
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMined.has(idx)}
                      onChange={() => toggleMinedSelection(idx)}
                      className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{intent.name}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {intent.intent_type_code}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        搜索查询: &ldquo;{intent.query}&rdquo;
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {intent.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!miningLoading && minedIntents.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              输入关键词并点击挖掘，AI将自动发现相关意图
            </div>
          )}

          {minedIntents.length > 0 && (
            <DialogFooter>
              <Button variant="secondary" onClick={() => setMiningOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSaveMined}
                disabled={selectedMined.size === 0 || savingMined}
                className="gap-1.5"
              >
                {savingMined ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                保存选中 ({selectedMined.size})
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) setEditDialog({ open: false, mode: 'create', data: {} });
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {editDialog.mode === 'edit' ? '编辑意图' : '手动创建意图'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                意图名称 <span className="text-destructive">*</span>
              </label>
              <Input
                value={editDialog.data.name || ''}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, data: { ...prev.data, name: e.target.value } }))
                }
                placeholder="如：如何选择CRM系统"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">搜索查询</label>
              <Input
                value={editDialog.data.query || ''}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, data: { ...prev.data, query: e.target.value } }))
                }
                placeholder="用户搜索时的查询词"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">意图类型</label>
              <select
                value={editDialog.data.intent_type_id || ''}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    data: { ...prev.data, intent_type_id: e.target.value || null },
                  }))
                }
                className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm text-foreground"
              >
                <option value="">未分类</option>
                {intentTypes
                  .filter((t) => !t.code.includes('_'))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditDialog({ open: false, mode: 'create', data: {} })}
            >
              取消
            </Button>
            <Button onClick={handleSaveSingle}>
              {editDialog.mode === 'edit' ? '保存修改' : '创建意图'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
