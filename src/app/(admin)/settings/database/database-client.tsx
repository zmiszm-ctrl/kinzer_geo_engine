'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Table, RefreshCw, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TableData {
  count: number;
  columns: string[];
  rows: Record<string, unknown>[];
}

type DbData = Record<string, TableData>;

export function DatabaseViewer() {
  const [data, setData] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/database');
      if (!res.ok) throw new Error('Failed to fetch database data');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTable = (name: string) => {
    setExpandedTable(prev => prev === name ? null : name);
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') {
      if (val.length > 80) return val.substring(0, 80) + '...';
      return val;
    }
    if (Array.isArray(val)) return JSON.stringify(val);
    return String(val);
  };

  const getColumnWidth = (col: string): string => {
    if (col === 'id') return 'w-36';
    if (col.includes('parent_id') || col.includes('intent_type_id') || col.includes('model_id')) return 'w-36';
    if (col === 'created_at' || col === 'updated_at') return 'w-40';
    return 'min-w-[120px]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings/model-config">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              数据库管理
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              SQLite 本地数据库 · 查看数据表和记录
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && !data && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">加载数据库信息...</p>
          </CardContent>
        </Card>
      )}

      {/* Tables Overview */}
      {data && (
        <div className="space-y-3">
          {/* Stats bar */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>共 <strong className="text-foreground">{Object.keys(data).length}</strong> 张表</span>
            <span>·</span>
            <span>共 <strong className="text-foreground">{Object.values(data).reduce((s, t) => s + t.count, 0)}</strong> 条记录</span>
          </div>

          {/* Table Cards */}
          {Object.entries(data).map(([tableName, tableData]) => (
            <Card key={tableName} className="overflow-hidden">
              {/* Table Header - clickable */}
              <button
                onClick={() => toggleTable(tableName)}
                className="w-full text-left"
              >
                <CardHeader className="py-3 px-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {expandedTable === tableName ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Table className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-medium">{tableName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {tableData.count} 条
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal">
                        {tableData.columns.length} 列
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </button>

              {/* Expanded Content */}
              {expandedTable === tableName && (
                <CardContent className="px-4 pb-4 pt-0">
                  {/* Column info */}
                  <div className="mb-3 p-3 bg-muted/30 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-2">字段结构</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tableData.columns.map((col, i) => (
                        <code key={i} className="text-xs bg-background px-2 py-0.5 rounded border">
                          {col}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Data Table */}
                  {tableData.rows.length > 0 ? (
                    <div className="overflow-x-auto border rounded-md">
                      <table className="text-xs w-full">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            {Object.keys(tableData.rows[0]).map((col) => (
                              <th
                                key={col}
                                className={`px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap ${getColumnWidth(col)}`}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                              {Object.entries(row).map(([key, val]) => (
                                <td key={key} className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate">
                                  {val === null ? (
                                    <span className="text-muted-foreground/50 italic">NULL</span>
                                  ) : key === 'api_key' ? (
                                    <span className="text-muted-foreground font-mono">
                                      {String(val).substring(0, 8)}•••••••
                                    </span>
                                  ) : key === 'content' ? (
                                    <span className="text-muted-foreground">
                                      [{String(val).length} chars]
                                    </span>
                                  ) : Array.isArray(val) ? (
                                    <div className="flex gap-0.5 flex-wrap">
                                      {(val as unknown[]).slice(0, 3).map((v, j) => (
                                        <Badge key={j} variant="secondary" className="text-[10px] px-1 py-0">
                                          {String(v)}
                                        </Badge>
                                      ))}
                                      {val.length > 3 && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                          +{val.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : typeof val === 'string' && val.length > 60 ? (
                                    <span title={val}>{val.substring(0, 60)}...</span>
                                  ) : (
                                    <span>{formatValue(val)}</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      暂无数据
                    </div>
                  )}

                  {tableData.count > 100 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      仅展示前 100 条记录（共 {tableData.count} 条）
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
