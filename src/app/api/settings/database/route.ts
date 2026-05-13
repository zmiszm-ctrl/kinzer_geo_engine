import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    // Get all table names
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string }[];

    const result: Record<string, { count: number; columns: string[]; rows: Record<string, unknown>[] }> = {};

    for (const { name } of tables) {
      const count = (db.prepare(`SELECT COUNT(*) as cnt FROM "${name}"`).get() as { cnt: number }).cnt;
      const cols = db.pragma(`table_info("${name}")`) as { name: string; type: string; notnull: number; pk: number }[];
      const rows = db.prepare(`SELECT * FROM "${name}" LIMIT 100`).all() as Record<string, unknown>[];

      result[name] = {
        count,
        columns: cols.map(c => `${c.name} (${c.type}${c.pk ? ', PK' : ''}${c.notnull ? ', NOT NULL' : ''})`),
        rows,
      };
    }

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
