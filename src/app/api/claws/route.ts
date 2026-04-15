import { NextResponse } from 'next/server';
import { query, execute, initDatabase } from '@/lib/db';
import { loadAllConfigs } from '@/lib/config-loader';

// GET /api/claws - 获取所有 claw 列表（含评分统计）
export async function GET() {
  try {
    initDatabase();

    // 自动同步配置文件到数据库
    const configs = loadAllConfigs();
    for (const config of configs) {
      execute(
        `INSERT INTO claws (slug, name, description, category, homepage, github, icon, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           name = excluded.name, description = excluded.description,
           category = excluded.category, homepage = excluded.homepage,
           github = excluded.github, icon = excluded.icon, tags = excluded.tags,
           updated_at = CURRENT_TIMESTAMP`,
        [config.slug, config.name, config.description, config.category,
         config.homepage, config.github, config.icon || '', JSON.stringify(config.tags || [])]
      );

      // 确保 stats 行存在
      execute(
        `INSERT OR IGNORE INTO claw_stats (claw_id, avg_rating, review_count)
         SELECT id, 0, 0 FROM claws WHERE slug = ?`,
        [config.slug]
      );
    }

    const rows = query(
      `SELECT c.*, COALESCE(s.avg_rating, 0) as avg_rating, COALESCE(s.review_count, 0) as review_count
       FROM claws c
       LEFT JOIN claw_stats s ON c.id = s.claw_id
       ORDER BY s.avg_rating DESC, c.name ASC`
    );

    // 解析 tags JSON
    const claws = rows.map((row: Record<string, unknown>) => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags || [],
      avg_rating: Number(row.avg_rating),
      review_count: Number(row.review_count),
    }));

    return NextResponse.json(claws);
  } catch (error: unknown) {
    console.error('Failed to fetch claws:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
