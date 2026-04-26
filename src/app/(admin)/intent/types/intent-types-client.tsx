'use client';

import { useState } from 'react';
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
  Pencil,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IntentType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  level: number;
  sort_order: number;
  is_builtin: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface Props {
  rootTypes: IntentType[];
  childTypesMap: Record<string, IntentType[]>;
  allTypes: IntentType[];
}

export function IntentTypesPage({ rootTypes, childTypesMap, allTypes }: Props) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    rootTypes.forEach((t) => ids.add(t.id));
    return ids;
  });
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Partial<IntentType>;
  }>({ open: false, mode: 'create', data: {} });

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const filteredRootTypes = rootTypes.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      (childTypesMap[t.id] || []).some(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
  );

  const handleSave = async () => {
    const { name, code, description, color, parent_id } = editDialog.data;
    if (!name || !code) return;

    try {
      if (editDialog.mode === 'edit' && editDialog.data.id) {
        const res = await fetch('/api/intent-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editDialog.data.id, name, code, description, color }),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch('/api/intent-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            code,
            description,
            color,
            parent_id: parent_id || null,
            level: parent_id ? 2 : 1,
          }),
        });
        if (!res.ok) throw new Error('Failed to create');
      }
      setEditDialog({ open: false, mode: 'create', data: {} });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (type: IntentType) => {
    setEditDialog({ open: true, mode: 'edit', data: { ...type } });
  };

  const handleCreateChild = (parentId: string) => {
    setEditDialog({ open: true, mode: 'create', data: { parent_id: parentId, level: 2 } });
  };

  const handleCreateRoot = () => {
    setEditDialog({ open: true, mode: 'create', data: { level: 1 } });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Intent</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">意图分类体系</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理意图分类标签，用于意图的分类和标注。支持自定义扩展。
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索分类名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button onClick={handleCreateRoot} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          新增分类
        </Button>
      </div>

      {/* Classification Tree */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_140px_140px_100px_80px] items-center gap-4 px-5 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
          <span>分类名称</span>
          <span>编码</span>
          <span>层级</span>
          <span>状态</span>
          <span className="text-right">操作</span>
        </div>

        {/* Tree Content */}
        <div className="divide-y divide-border/50">
          {filteredRootTypes.map((root) => {
            const children = childTypesMap[root.id] || [];
            const isExpanded = expandedIds.has(root.id);

            return (
              <div key={root.id}>
                {/* Root Item */}
                <div className="grid grid-cols-[1fr_140px_140px_100px_80px] items-center gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {children.length > 0 && (
                      <button
                        onClick={() => toggleExpand(root.id)}
                        className="p-0.5 hover:bg-accent rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    {children.length === 0 && <span className="w-[18px]" />}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: root.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium text-foreground">{root.name}</span>
                    {root.is_builtin && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        内置
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{root.code}</span>
                  <span className="text-xs text-muted-foreground">Level {root.level}</span>
                  <span className="inline-flex">
                    <span className="text-[11px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                      启用
                    </span>
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleCreateChild(root.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      title="添加子分类"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleEdit(root)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      title="编辑"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                {isExpanded &&
                  children.map((child) => (
                    <div
                      key={child.id}
                      className="grid grid-cols-[1fr_140px_140px_100px_80px] items-center gap-4 px-5 py-3 bg-muted/20 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 pl-6">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: child.color || root.color || '#6366f1' }}
                        />
                        <span className="text-sm text-foreground">{child.name}</span>
                        {child.is_builtin && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                            内置
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{child.code}</span>
                      <span className="text-xs text-muted-foreground">Level {child.level}</span>
                      <span className="inline-flex">
                        <span className="text-[11px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          启用
                        </span>
                      </span>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(child)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                          title="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}

          {filteredRootTypes.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              {search ? '没有匹配的分类' : '暂无分类数据'}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>共 {allTypes.length} 个分类</span>
        <span>一级分类 {rootTypes.length} 个</span>
        <span>二级分类 {allTypes.length - rootTypes.length} 个</span>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) setEditDialog({ open: false, mode: 'create', data: {} });
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {editDialog.mode === 'edit' ? '编辑分类' : '新增分类'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                分类名称 <span className="text-destructive">*</span>
              </label>
              <Input
                value={editDialog.data.name || ''}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, data: { ...prev.data, name: e.target.value } }))
                }
                placeholder="输入分类名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                编码 <span className="text-destructive">*</span>
              </label>
              <Input
                value={editDialog.data.code || ''}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    data: { ...prev.data, code: e.target.value.replace(/\s/g, '_').toLowerCase() },
                  }))
                }
                placeholder="输入英文编码，如 informational_custom"
                disabled={editDialog.mode === 'edit' && !!editDialog.data.is_builtin}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">描述</label>
              <Input
                value={editDialog.data.description || ''}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, data: { ...prev.data, description: e.target.value } }))
                }
                placeholder="简短描述此分类的用途"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editDialog.data.color || '#6366f1'}
                  onChange={(e) =>
                    setEditDialog((prev) => ({ ...prev, data: { ...prev.data, color: e.target.value } }))
                  }
                  className="w-8 h-8 rounded-md border border-border cursor-pointer"
                />
                <Input
                  value={editDialog.data.color || '#6366f1'}
                  onChange={(e) =>
                    setEditDialog((prev) => ({ ...prev, data: { ...prev.data, color: e.target.value } }))
                  }
                  className="w-32 font-mono text-xs"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditDialog({ open: false, mode: 'create', data: {} })}
            >
              取消
            </Button>
            <Button onClick={handleSave}>
              {editDialog.mode === 'edit' ? '保存修改' : '创建分类'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
