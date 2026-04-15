import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

let db: Database.Database | null = null;
let synced = false;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH
      ? path.resolve(process.cwd(), process.env.DB_PATH)
      : path.resolve(process.cwd(), 'data', 'claw123.db');

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS claws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'gateway',
      homepage TEXT DEFAULT '',
      github TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claw_id INTEGER NOT NULL,
      nickname TEXT NOT NULL DEFAULT '匿名用户',
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      content TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      approved INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS claw_stats (
      claw_id INTEGER PRIMARY KEY,
      avg_rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE
    )
  `);

  // 评分记录表 - 按 IP 限制每个 claw 只能打一次分
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claw_id INTEGER NOT NULL,
      ip TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE,
      UNIQUE(claw_id, ip)
    )
  `);

  // 迁移：给旧 reviews 表加缺失列（如果不存在）
  try {
    db.exec(`ALTER TABLE reviews ADD COLUMN ip TEXT DEFAULT ''`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE reviews ADD COLUMN approved INTEGER NOT NULL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE reviews ADD COLUMN fingerprint TEXT DEFAULT ''`);
  } catch { /* column already exists */ }

  // 启动时自动同步 YAML 配置到数据库（仅执行一次）
  if (!synced) {
    syncClawConfigs(db);
    synced = true;
  }
}

/**
 * 读取 claws/ 目录下的 YAML 配置，upsert 到数据库
 * 同时清理数据库中已不存在对应 YAML 的 claw 记录
 */
function syncClawConfigs(db: Database.Database): void {
  const clawsDir = path.resolve(process.cwd(), 'claws');
  if (!fs.existsSync(clawsDir)) return;

  const files = fs.readdirSync(clawsDir).filter(
    (f) => (f.endsWith('.yaml') || f.endsWith('.yml')) && !f.startsWith('_')
  );

  const upsert = db.prepare(`
    INSERT INTO claws (slug, name, description, category, homepage, github, icon, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name, description = excluded.description,
      category = excluded.category, homepage = excluded.homepage,
      github = excluded.github, icon = excluded.icon, tags = excluded.tags,
      updated_at = CURRENT_TIMESTAMP
  `);

  const ensureStats = db.prepare(`
    INSERT OR IGNORE INTO claw_stats (claw_id, avg_rating, review_count)
    SELECT id, 0, 0 FROM claws WHERE slug = ?
  `);

  const slugs: string[] = [];

  const syncTx = db.transaction(() => {
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(clawsDir, file), 'utf-8');
        const data = yaml.load(content) as Record<string, unknown> | null;
        if (!data || !data.slug || !data.name) continue;

        upsert.run(
          data.slug,
          data.name,
          (data.description as string) || '',
          (data.category as string) || 'other',
          (data.homepage as string) || '',
          (data.github as string) || '',
          (data.icon as string) || '',
          JSON.stringify(data.tags || [])
        );
        ensureStats.run(data.slug);
        slugs.push(data.slug as string);
      } catch {
        // skip invalid yaml
      }
    }

    // 删除数据库中已不存在对应 YAML 的 claw（保留评论数据会级联删除）
    if (slugs.length > 0) {
      const placeholders = slugs.map(() => '?').join(',');
      db.prepare(`DELETE FROM claws WHERE slug NOT IN (${placeholders})`).run(...slugs);
    }
  });

  syncTx();
  console.log(`[claw123] Synced ${slugs.length} claws from YAML configs`);
}

export function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
  const stmt = getDb().prepare(sql);
  return (params ? stmt.all(...params) : stmt.all()) as T[];
}

export function execute(sql: string, params?: unknown[]): Database.RunResult {
  const stmt = getDb().prepare(sql);
  return params ? stmt.run(...params) : stmt.run();
}

export function get<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined {
  const stmt = getDb().prepare(sql);
  return (params ? stmt.get(...params) : stmt.get()) as T | undefined;
}
