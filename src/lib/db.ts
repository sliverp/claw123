import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

function getSectionTableName(section: string): string {
  return section.replace(/-/g, '_');
}

// ======== 数据库类型判断 ========
const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();
const isMySQL = DB_TYPE === 'mysql';

// ======== 统一返回类型 ========
export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

// ======== SQLite 实现 ========
let sqliteDb: import('better-sqlite3').Database | null = null;

function getSqliteDb(): import('better-sqlite3').Database {
  if (!sqliteDb) {
    const Database = require('better-sqlite3');
    const dbPath = process.env.DB_PATH
      ? path.resolve(process.cwd(), process.env.DB_PATH)
      : path.resolve(process.cwd(), 'data', 'claw123.db');

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    sqliteDb = new Database(dbPath);
    sqliteDb!.pragma('journal_mode = WAL');
    sqliteDb!.pragma('foreign_keys = ON');
  }
  return sqliteDb!;
}

// ======== MySQL 实现 ========
let mysqlPool: import('mysql2/promise').Pool | null = null;

function getMysqlPool(): import('mysql2/promise').Pool {
  if (!mysqlPool) {
    const mysql = require('mysql2/promise');
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || process.env.DB_DATABASE || 'claw123',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return mysqlPool!;
}

// mysql2 类型兼容：execute 的 sql 参数需要 QueryOptions 类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mysqlExec(target: any, sql: string, params?: unknown[]): Promise<[any, any]> {
  return target.execute({ sql }, params || []);
}

// ======== 统一 API ========
let synced = false;

/**
 * 初始化数据库（建表 + 同步 YAML）
 */
export async function initDatabase(): Promise<void> {
  if (isMySQL) {
    await initMySQL();
  } else {
    initSQLite();
  }

  if (!synced) {
    await syncClawConfigs();
    await syncSectionConfigs('skills');
    await syncSectionConfigs('frameworks');
    await syncSectionConfigs('benchmarks');
    await syncSectionConfigs('token-coding-plans');
    synced = true;
  }
}

function initSQLite(): void {
  const db = getSqliteDb();

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
      rating INTEGER DEFAULT NULL,
      content TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      approved INTEGER NOT NULL DEFAULT 0,
      fingerprint TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS claw_stats (
      claw_id INTEGER PRIMARY KEY,
      avg_rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      visit_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE
    )
  `);

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

  // 迁移
  try { db.exec(`ALTER TABLE reviews ADD COLUMN ip TEXT DEFAULT ''`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE reviews ADD COLUMN approved INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE reviews ADD COLUMN fingerprint TEXT DEFAULT ''`); } catch { /* exists */ }
  // migration 001: add visit_count
  try { db.exec(`ALTER TABLE claw_stats ADD COLUMN visit_count INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }

  // ======== 新板块表 ========
  const sections = ['skills', 'frameworks', 'benchmarks', 'token-coding-plans'] as const;
  for (const section of sections) {
    const tableName = getSectionTableName(section);
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT NOT NULL DEFAULT 'other',
        homepage TEXT DEFAULT '',
        github TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName}_stats (
        item_id INTEGER PRIMARY KEY,
        avg_rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        visit_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES ${tableName}(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName}_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        ip TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES ${tableName}(id) ON DELETE CASCADE,
        UNIQUE(item_id, ip)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName}_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        nickname TEXT NOT NULL DEFAULT '匿名用户',
        rating INTEGER DEFAULT NULL,
        content TEXT DEFAULT '',
        ip TEXT DEFAULT '',
        approved INTEGER NOT NULL DEFAULT 0,
        fingerprint TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES ${tableName}(id) ON DELETE CASCADE
      )
    `);
  }
}

async function initMySQL(): Promise<void> {
  const pool = getMysqlPool();

  await mysqlExec(pool, `
    CREATE TABLE IF NOT EXISTS claws (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT (''),
      category VARCHAR(50) NOT NULL DEFAULT 'gateway',
      homepage VARCHAR(512) DEFAULT '',
      github VARCHAR(512) DEFAULT '',
      icon VARCHAR(512) DEFAULT '',
      tags JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await mysqlExec(pool, `
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      claw_id INT NOT NULL,
      nickname VARCHAR(100) NOT NULL DEFAULT '匿名用户',
      rating INT NULL DEFAULT NULL,
      content TEXT DEFAULT (''),
      ip VARCHAR(64) DEFAULT '',
      approved TINYINT NOT NULL DEFAULT 0,
      fingerprint VARCHAR(255) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE
    )
  `);

  await mysqlExec(pool, `
    CREATE TABLE IF NOT EXISTS claw_stats (
      claw_id INT PRIMARY KEY,
      avg_rating DOUBLE DEFAULT 0,
      review_count INT DEFAULT 0,
      visit_count INT NOT NULL DEFAULT 0,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE
    )
  `);

  await mysqlExec(pool, `
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      claw_id INT NOT NULL,
      ip VARCHAR(64) NOT NULL,
      rating INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claw_id) REFERENCES claws(id) ON DELETE CASCADE,
      UNIQUE KEY uq_claw_ip (claw_id, ip),
      CHECK (rating >= 1 AND rating <= 5)
    )
  `);

  // 迁移：安全添加列（MySQL 需要用 information_schema 判断）
  const db = process.env.MYSQL_DATABASE || 'claw123';
  const cols = ['ip', 'approved', 'fingerprint'];
  for (const col of cols) {
    const [rows] = await mysqlExec(pool,
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reviews' AND COLUMN_NAME = ?`,
      [db, col]
    );
    if ((rows as unknown[]).length === 0) {
      const typeDef = col === 'approved' ? 'TINYINT NOT NULL DEFAULT 0' : col === 'ip' ? "VARCHAR(64) DEFAULT ''" : "VARCHAR(255) DEFAULT ''";
      await mysqlExec(pool, `ALTER TABLE reviews ADD COLUMN ${col} ${typeDef}`);
    }
  }

  // migration 001: add visit_count to claw_stats
  const [vcRows] = await mysqlExec(pool,
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'claw_stats' AND COLUMN_NAME = 'visit_count'`,
    [db]
  );
  if ((vcRows as unknown[]).length === 0) {
    await mysqlExec(pool, `ALTER TABLE claw_stats ADD COLUMN visit_count INT NOT NULL DEFAULT 0`);
  }

  // migration 002: make reviews.rating nullable and drop CHECK constraint
  // Check if rating column is still NOT NULL
  const [ratingCol] = await mysqlExec(pool,
    `SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'rating'`,
    [db]
  );
  if ((ratingCol as Array<{ IS_NULLABLE: string }>).length > 0 && (ratingCol as Array<{ IS_NULLABLE: string }>)[0].IS_NULLABLE === 'NO') {
    try { await mysqlExec(pool, `ALTER TABLE reviews DROP CHECK reviews_chk_1`); } catch { /* constraint may not exist */ }
    await mysqlExec(pool, `ALTER TABLE reviews MODIFY COLUMN rating INT NULL DEFAULT NULL`);
  }

  // ======== 新板块表 ========
  const sections = ['skills', 'frameworks', 'benchmarks', 'token-coding-plans'] as const;
  for (const section of sections) {
    const tableName = getSectionTableName(section);
    await mysqlExec(pool, `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT (''),
        category VARCHAR(50) NOT NULL DEFAULT 'other',
        homepage VARCHAR(512) DEFAULT '',
        github VARCHAR(512) DEFAULT '',
        icon VARCHAR(512) DEFAULT '',
        tags JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlExec(pool, `
      CREATE TABLE IF NOT EXISTS ${tableName}_stats (
        item_id INT PRIMARY KEY,
        avg_rating DOUBLE DEFAULT 0,
        review_count INT DEFAULT 0,
        visit_count INT NOT NULL DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES ${tableName}(id) ON DELETE CASCADE
      )
    `);

    await mysqlExec(pool, `
      CREATE TABLE IF NOT EXISTS ${tableName}_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        ip VARCHAR(64) NOT NULL,
        rating INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES ${tableName}(id) ON DELETE CASCADE,
        UNIQUE KEY uq_item_ip (item_id, ip),
        CHECK (rating >= 1 AND rating <= 5)
      )
    `);

    await mysqlExec(pool, `
      CREATE TABLE IF NOT EXISTS ${tableName}_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        nickname VARCHAR(100) NOT NULL DEFAULT '匿名用户',
        rating INT NULL DEFAULT NULL,
        content TEXT DEFAULT (''),
        ip VARCHAR(64) DEFAULT '',
        approved TINYINT NOT NULL DEFAULT 0,
        fingerprint VARCHAR(255) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES ${tableName}(id) ON DELETE CASCADE
      )
    `);
  }
}

// ======== 同步 YAML 配置 ========
async function syncClawConfigs(): Promise<void> {
  const clawsDir = path.resolve(process.cwd(), 'claws');
  if (!fs.existsSync(clawsDir)) return;

  const files = fs.readdirSync(clawsDir).filter(
    (f) => (f.endsWith('.yaml') || f.endsWith('.yml')) && !f.startsWith('_')
  );

  const slugs: string[] = [];

  if (isMySQL) {
    const pool = getMysqlPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(clawsDir, file), 'utf-8');
          const data = yaml.load(content) as Record<string, unknown> | null;
          if (!data || !data.slug || !data.name) continue;

          await mysqlExec(conn,
            `INSERT INTO claws (slug, name, description, category, homepage, github, icon, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               name = VALUES(name), description = VALUES(description),
               category = VALUES(category), homepage = VALUES(homepage),
               github = VALUES(github), icon = VALUES(icon), tags = VALUES(tags),
               updated_at = CURRENT_TIMESTAMP`,
            [
              data.slug, data.name,
              (data.description as string) || '',
              (data.category as string) || 'other',
              (data.homepage as string) || '',
              (data.github as string) || '',
              (data.icon as string) || '',
              JSON.stringify(data.tags || []),
            ]
          );
          await mysqlExec(conn,
            `INSERT IGNORE INTO claw_stats (claw_id, avg_rating, review_count)
             SELECT id, 0, 0 FROM claws WHERE slug = ?`,
            [data.slug]
          );
          slugs.push(data.slug as string);
        } catch { /* skip invalid yaml */ }
      }

      if (slugs.length > 0) {
        const placeholders = slugs.map(() => '?').join(',');
        await mysqlExec(conn, `DELETE FROM claws WHERE slug NOT IN (${placeholders})`, slugs);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } else {
    const db = getSqliteDb();
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

    const syncTx = db.transaction(() => {
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(clawsDir, file), 'utf-8');
          const data = yaml.load(content) as Record<string, unknown> | null;
          if (!data || !data.slug || !data.name) continue;

          upsert.run(
            data.slug, data.name,
            (data.description as string) || '',
            (data.category as string) || 'other',
            (data.homepage as string) || '',
            (data.github as string) || '',
            (data.icon as string) || '',
            JSON.stringify(data.tags || [])
          );
          ensureStats.run(data.slug);
          slugs.push(data.slug as string);
        } catch { /* skip invalid yaml */ }
      }

      if (slugs.length > 0) {
        const placeholders = slugs.map(() => '?').join(',');
        db.prepare(`DELETE FROM claws WHERE slug NOT IN (${placeholders})`).run(...slugs);
      }
    });
    syncTx();
  }

  console.log(`[claw123] Synced ${slugs.length} claws from YAML configs (${DB_TYPE})`);
}

// ======== 通用板块 YAML 同步 ========
async function syncSectionConfigs(section: string): Promise<void> {
  const dir = path.resolve(process.cwd(), section);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(
    (f) => (f.endsWith('.yaml') || f.endsWith('.yml')) && !f.startsWith('_')
  );

  const slugs: string[] = [];
  const tableName = getSectionTableName(section);
  const statsTable = `${tableName}_stats`;

  if (isMySQL) {
    const pool = getMysqlPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          const data = yaml.load(content) as Record<string, unknown> | null;
          if (!data || !data.slug || !data.name) continue;

          await mysqlExec(conn,
            `INSERT INTO ${tableName} (slug, name, description, category, homepage, github, icon, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               name = VALUES(name), description = VALUES(description),
               category = VALUES(category), homepage = VALUES(homepage),
               github = VALUES(github), icon = VALUES(icon), tags = VALUES(tags),
               updated_at = CURRENT_TIMESTAMP`,
            [
              data.slug, data.name,
              (data.description as string) || '',
              (data.category as string) || 'other',
              (data.homepage as string) || '',
              (data.github as string) || '',
              (data.icon as string) || '',
              JSON.stringify(data.tags || []),
            ]
          );
          await mysqlExec(conn,
            `INSERT IGNORE INTO ${statsTable} (item_id, avg_rating, review_count)
             SELECT id, 0, 0 FROM ${tableName} WHERE slug = ?`,
            [data.slug]
          );
          slugs.push(data.slug as string);
        } catch { /* skip invalid yaml */ }
      }

      if (slugs.length > 0) {
        const placeholders = slugs.map(() => '?').join(',');
        await mysqlExec(conn, `DELETE FROM ${tableName} WHERE slug NOT IN (${placeholders})`, slugs);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } else {
    const db = getSqliteDb();
    const upsert = db.prepare(`
      INSERT INTO ${tableName} (slug, name, description, category, homepage, github, icon, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name, description = excluded.description,
        category = excluded.category, homepage = excluded.homepage,
        github = excluded.github, icon = excluded.icon, tags = excluded.tags,
        updated_at = CURRENT_TIMESTAMP
    `);
    const ensureStats = db.prepare(`
      INSERT OR IGNORE INTO ${statsTable} (item_id, avg_rating, review_count)
      SELECT id, 0, 0 FROM ${tableName} WHERE slug = ?
    `);

    const syncTx = db.transaction(() => {
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          const data = yaml.load(content) as Record<string, unknown> | null;
          if (!data || !data.slug || !data.name) continue;

          upsert.run(
            data.slug, data.name,
            (data.description as string) || '',
            (data.category as string) || 'other',
            (data.homepage as string) || '',
            (data.github as string) || '',
            (data.icon as string) || '',
            JSON.stringify(data.tags || [])
          );
          ensureStats.run(data.slug);
          slugs.push(data.slug as string);
        } catch { /* skip invalid yaml */ }
      }

      if (slugs.length > 0) {
        const placeholders = slugs.map(() => '?').join(',');
        db.prepare(`DELETE FROM ${tableName} WHERE slug NOT IN (${placeholders})`).run(...slugs);
      }
    });
    syncTx();
  }

  console.log(`[claw123] Synced ${slugs.length} ${section} from YAML configs (${DB_TYPE})`);
}

// ======== 统一查询接口 ========

export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  if (isMySQL) {
    const pool = getMysqlPool();
    const [rows] = await mysqlExec(pool, sql, params);
    return rows as T[];
  } else {
    const stmt = getSqliteDb().prepare(sql);
    return (params ? stmt.all(...params) : stmt.all()) as T[];
  }
}

export async function execute(sql: string, params?: unknown[]): Promise<RunResult> {
  if (isMySQL) {
    const pool = getMysqlPool();
    const [result] = await mysqlExec(pool, sql, params);
    const r = result as { affectedRows: number; insertId: number };
    return { changes: r.affectedRows, lastInsertRowid: r.insertId };
  } else {
    const stmt = getSqliteDb().prepare(sql);
    const r = params ? stmt.run(...params) : stmt.run();
    return { changes: r.changes, lastInsertRowid: r.lastInsertRowid };
  }
}

export async function get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined> {
  if (isMySQL) {
    const pool = getMysqlPool();
    const [rows] = await mysqlExec(pool, sql, params);
    return (rows as T[])[0];
  } else {
    const stmt = getSqliteDb().prepare(sql);
    return (params ? stmt.get(...params) : stmt.get()) as T | undefined;
  }
}
