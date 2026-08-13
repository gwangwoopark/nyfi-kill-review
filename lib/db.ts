/**
 * One table, two drivers. DATABASE_URL decides:
 *   file:./x.db        -> node:sqlite (built into Node >= 22.5, no install)
 *   postgres://...     -> pg
 * Swap by changing the env var. Nothing else in the app knows which one is live.
 */
export type Row = Record<string, unknown>;

export interface Db {
  exec(sql: string): Promise<void>;
  /** `?` placeholders in the SQL; translated to $1..$n for postgres. */
  run(sql: string, params?: unknown[]): Promise<void>;
  all(sql: string, params?: unknown[]): Promise<Row[]>;
}

export function isPostgres(url: string): boolean {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

/** `select * from t where a = ? and b = ?` -> `... a = $1 and b = $2` */
export function toPgPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

let cached: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL ?? "file:./prototype.db";
  let db: Db;

  if (isPostgres(url)) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    db = {
      async exec(sql) {
        await pool.query(sql);
      },
      async run(sql, params = []) {
        await pool.query(toPgPlaceholders(sql), params);
      },
      async all(sql, params = []) {
        const r = await pool.query(toPgPlaceholders(sql), params);
        return r.rows as Row[];
      },
    };
  } else {
    const { DatabaseSync } = await import("node:sqlite");
    const sqlite = new DatabaseSync(url.replace(/^file:/, ""));
    db = {
      async exec(sql) {
        sqlite.exec(sql);
      },
      async run(sql, params = []) {
        sqlite.prepare(sql).run(...(params as never[]));
      },
      async all(sql, params = []) {
        return sqlite.prepare(sql).all(...(params as never[])) as Row[];
      },
    };
  }

  await db.exec(
    `create table if not exists events (
      id text primary key,
      name text not null,
      prototype text not null,
      props text,
      created_at text not null
    )`
  );
  cached = db;
  return db;
}
