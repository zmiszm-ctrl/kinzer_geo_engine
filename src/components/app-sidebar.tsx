'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Search,
  PenTool,
  Send,
  BarChart3,
  FlaskConical,
  Settings,
  Database,
  BookOpen,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  enabled: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: '平台总览',
    href: '/overview',
    icon: <LayoutDashboard className="h-4 w-4" />,
    enabled: true,
  },
  {
    label: '知识资产管理',
    href: '/knowledge',
    icon: <Database className="h-4 w-4" />,
    enabled: false,
  },
  {
    label: '内容结构化',
    href: '/structuring',
    icon: <Layers className="h-4 w-4" />,
    enabled: false,
  },
  {
    label: '意图挖掘',
    href: '/intent',
    icon: <Search className="h-4 w-4" />,
    enabled: true,
    children: [
      { label: '意图分类体系', href: '/intent/types', icon: <BookOpen className="h-4 w-4" />, enabled: true },
      { label: '自定义意图', href: '/intent/custom', icon: <Search className="h-4 w-4" />, enabled: true },
    ],
  },
  {
    label: 'GEO智能写作',
    href: '/writing',
    icon: <PenTool className="h-4 w-4" />,
    enabled: true,
  },
  {
    label: '发布管理',
    href: '/publish',
    icon: <Send className="h-4 w-4" />,
    enabled: false,
  },
  {
    label: 'GEO监测',
    href: '/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    enabled: false,
  },
  {
    label: 'A/B测试',
    href: '/testing',
    icon: <FlaskConical className="h-4 w-4" />,
    enabled: false,
  },
  {
    label: '系统设置',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
    enabled: true,
    children: [
      { label: '模型配置', href: '/settings/model-config', icon: <Settings className="h-4 w-4" />, enabled: true },
      { label: '数据库管理', href: '/settings/database', icon: <Database className="h-4 w-4" />, enabled: true },
    ],
  },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const isActive = pathname === item.href || (item.children && pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;

  if (!item.enabled && !hasChildren) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 cursor-not-allowed rounded-lg"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <span className="opacity-40">{item.icon}</span>
        <span>{item.label}</span>
        <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">高级订阅</span>
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive
              ? 'text-primary bg-primary/5 font-medium'
              : 'text-gray-600 hover:text-foreground hover:bg-accent'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className={isActive ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
          <span>{item.label}</span>
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 ml-auto text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 ml-auto text-gray-400" />
          )}
        </button>
        {expanded && (
          <div className="mt-0.5">
            {item.children!.map((child) => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
        isActive
          ? 'text-primary bg-primary/5 font-medium'
          : 'text-gray-600 hover:text-foreground hover:bg-accent'
      }`}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      <span className={isActive ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
          <span className="text-white text-xs font-bold">G</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-none">GEO引擎</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">AI内容优化平台</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavItemComponent key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[10px] text-gray-400">MVP v0.1.0</p>
      </div>
    </aside>
  );
}
