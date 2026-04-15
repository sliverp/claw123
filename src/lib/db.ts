import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH
      ? path.resolve(process.cwd(), process.env.DB_PATH)
      : path.resolve(process.cwd(), 'data', 'claw123.db');

    // 确保目录存在
    const fs = require('fs');
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
