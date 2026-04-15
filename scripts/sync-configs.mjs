/**
 * 配置同步脚本 - 读取 claws/ 目录下的 YAML 配置并同步到 SQLite
 * 用法: node scripts/sync-configs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CLAWS_DIR = path.join(__dirname, '..', 'claws');
const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './data/claw123.db');

// 确保数据目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
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

// 读取配置
const files = fs.readdirSync(CLAWS_DIR).filter(
  (f) => (f.endsWith('.yaml') || f.endsWith('.yml')) && !f.startsWith('_')
);

console.log(`Found ${files.length} config files`);

const upsertClaw = db.prepare(`
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

const syncAll = db.transaction(() => {
  for (const file of files) {
    const content = fs.readFileSync(path.join(CLAWS_DIR, file), 'utf-8');
    const data = yaml.load(content);

    if (!data || !data.slug || !data.name) {
      console.warn(`  ✗ Skipping invalid config: ${file}`);
      continue;
    }

    upsertClaw.run(
      data.slug,
      data.name,
      data.description || '',
      data.category || 'other',
      data.homepage || '',
      data.github || '',
      data.icon || '',
      JSON.stringify(data.tags || [])
    );

    ensureStats.run(data.slug);
    console.log(`  ✓ ${data.slug} (${data.name})`);
  }
});

syncAll();
console.log('Sync complete!');
db.close();
