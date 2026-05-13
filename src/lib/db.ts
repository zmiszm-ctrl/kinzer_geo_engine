import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'geo.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('busy_timeout = 5000');

  initializeSchema(_db);
  seedData(_db);

  return _db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS intent_types (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT DEFAULT '#6366f1',
      parent_id TEXT,
      level INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_builtin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (parent_id) REFERENCES intent_types(id)
    );

    CREATE TABLE IF NOT EXISTS intents (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      name TEXT NOT NULL,
      query TEXT,
      intent_type_id TEXT,
      level INTEGER NOT NULL DEFAULT 1,
      parent_id TEXT,
      keywords TEXT DEFAULT '[]',
      priority INTEGER NOT NULL DEFAULT 0,
      tags TEXT DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'ai' CHECK(source IN ('ai','manual')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (intent_type_id) REFERENCES intent_types(id),
      FOREIGN KEY (parent_id) REFERENCES intents(id)
    );

    CREATE TABLE IF NOT EXISTS generated_contents (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'article',
      intent_ids TEXT DEFAULT '[]',
      style TEXT,
      model_id TEXT,
      quality_score REAL,
      version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS model_configs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      provider TEXT NOT NULL UNIQUE,
      api_key TEXT NOT NULL,
      model TEXT NOT NULL,
      base_url TEXT NOT NULL,
      thinking_enabled INTEGER NOT NULL DEFAULT 0,
      reasoning_effort TEXT CHECK(reasoning_effort IS NULL OR reasoning_effort IN ('low','medium','high','max')),
      temperature REAL,
      max_tokens INTEGER,
      top_p REAL,
      frequency_penalty REAL,
      presence_penalty REAL,
      priority INTEGER NOT NULL DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_intent_types_parent ON intent_types(parent_id);
    CREATE INDEX IF NOT EXISTS idx_intent_types_level ON intent_types(level);
    CREATE INDEX IF NOT EXISTS idx_intents_type ON intents(intent_type_id);
    CREATE INDEX IF NOT EXISTS idx_intents_source ON intents(source);
    CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);
    CREATE INDEX IF NOT EXISTS idx_generated_status ON generated_contents(status);
    CREATE INDEX IF NOT EXISTS idx_model_priority ON model_configs(priority);
  `);
}

function seedData(db: Database.Database): void {
  // Check if seed data already exists
  const count = db.prepare('SELECT COUNT(*) as cnt FROM intent_types').get() as { cnt: number };
  if (count.cnt > 0) return;

  const insertType = db.prepare(`
    INSERT INTO intent_types (id, name, code, description, icon, color, parent_id, level, sort_order, is_builtin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertConfig = db.prepare(`
    INSERT INTO model_configs (provider, api_key, model, base_url, priority, enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // L1 categories
    const l1Data: Array<{id: string; name: string; code: string; desc: string; icon: string; color: string; sort: number}> = [
      { id: 'l1-info', name: '信息型', code: 'informational', desc: '用户寻求信息、知识和理解', icon: 'BookOpen', color: '#3b82f6', sort: 1 },
      { id: 'l1-nav', name: '导航型', code: 'navigational', desc: '用户寻找特定网站或品牌', icon: 'Compass', color: '#8b5cf6', sort: 2 },
      { id: 'l1-comm', name: '商业型', code: 'commercial', desc: '用户在购买前进行比较和研究', icon: 'ShoppingCart', color: '#f59e0b', sort: 3 },
      { id: 'l1-trans', name: '交易型', code: 'transactional', desc: '用户准备执行购买或下载操作', icon: 'CreditCard', color: '#10b981', sort: 4 },
    ];
    for (const d of l1Data) {
      insertType.run(d.id, d.name, d.code, d.desc, d.icon, d.color, null, 1, d.sort, 1);
    }

    // L2 subcategories
    const l2Data: Array<{id: string; name: string; code: string; desc: string; icon: string; color: string; parentId: string; sort: number}> = [
      { id: 'l2-info-understand', name: '理解型', code: 'informational_understand', desc: '用户希望理解某个概念或现象', icon: 'Lightbulb', color: '#3b82f6', parentId: 'l1-info', sort: 1 },
      { id: 'l2-info-explain', name: '解释型', code: 'informational_explain', desc: '用户需要详细的解释或说明', icon: 'FileText', color: '#3b82f6', parentId: 'l1-info', sort: 2 },
      { id: 'l2-info-compare', name: '比较型', code: 'informational_compare', desc: '用户对比不同选项的优劣', icon: 'GitCompare', color: '#3b82f6', parentId: 'l1-info', sort: 3 },
      { id: 'l2-info-howto', name: '教程型', code: 'informational_howto', desc: '用户寻找步骤指引或操作方法', icon: 'ListChecks', color: '#3b82f6', parentId: 'l1-info', sort: 4 },
      { id: 'l2-nav-brand', name: '品牌导航', code: 'navigational_brand', desc: '用户寻找特定品牌或网站', icon: 'Globe', color: '#8b5cf6', parentId: 'l1-nav', sort: 1 },
      { id: 'l2-comm-research', name: '商业调研', code: 'commercial_research', desc: '用户在购买前进行深入调研', icon: 'Search', color: '#f59e0b', parentId: 'l1-comm', sort: 1 },
      { id: 'l2-comm-compare', name: '商业比较', code: 'commercial_compare', desc: '用户比较不同产品的性价比', icon: 'Scale', color: '#f59e0b', parentId: 'l1-comm', sort: 2 },
      { id: 'l2-trans-buy', name: '购买型', code: 'transactional_buy', desc: '用户准备立即购买', icon: 'ShoppingBag', color: '#10b981', parentId: 'l1-trans', sort: 1 },
      { id: 'l2-trans-download', name: '下载型', code: 'transactional_download', desc: '用户准备下载软件或资源', icon: 'Download', color: '#10b981', parentId: 'l1-trans', sort: 2 },
    ];
    for (const d of l2Data) {
      insertType.run(d.id, d.name, d.code, d.desc, d.icon, d.color, d.parentId, 2, d.sort, 1);
    }

    // Model configs (read from model.md if available, otherwise use defaults)
    let zhipuKey = '';
    let deepseekKey = '';
    try {
      const modelMd = fs.readFileSync(path.join(process.cwd(), 'model.md'), 'utf8');
      const zk = modelMd.match(/智谱[^\n]*?key[^\n]*?[:=]\s*(.+)/i) || modelMd.match(/BIGMODEL_API_KEY[^\n]*?[:=]\s*(.+)/i);
      const dk = modelMd.match(/deepseek[^\n]*?key[^\n]*?[:=]\s*(.+)/i) || modelMd.match(/DEEPSEEK_API_KEY[^\n]*?[:=]\s*(.+)/i);
      if (zk) zhipuKey = zk[1].trim();
      if (dk) deepseekKey = dk[1].trim();
    } catch {}

    if (!zhipuKey) zhipuKey = process.env.BIGMODEL_API_KEY || '';
    if (!deepseekKey) deepseekKey = process.env.DEEPSEEK_API_KEY || '';

    insertConfig.run('zhipu', zhipuKey, 'glm-4.5-air', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 1, 1);
    insertConfig.run('deepseek', deepseekKey, 'deepseek-v4-flash', 'https://api.deepseek.com/chat/completions', 2, 1);
  });

  transaction();
}

// Helper: convert SQLite row to camelCase
export function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    // Parse JSON fields
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        result[camelKey] = JSON.parse(value);
      } catch {
        result[camelKey] = value;
      }
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

// Helper: convert camelCase to snake_case for INSERT/UPDATE
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    // Stringify array/object fields
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      result[snakeKey] = JSON.stringify(value);
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

// Generate UUID v4
export function generateId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export default getDb;
export const db = getDb();
