import { NextRequest, NextResponse } from 'next/server';
import { execute, get, query, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();
const isMySQL = DB_TYPE === 'mysql';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}

// POST /api/claws/[slug]/rate - 提交打分（IP限制，每个claw只能打一次）
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();
    const { slug } = params;
    const body = await request.json();
    const { rating } = body;
    const ip = getClientIp(request);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '评分必须在 1-5 之间' }, { status: 400 });
    }

    const claw = await get<{ id: number }>('SELECT id FROM claws WHERE slug = ?', [slug]);
    if (!claw) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 检查该 IP 是否已经对这个 claw 打过分
    const existing = await get<{ id: number }>(
      'SELECT id FROM ratings WHERE claw_id = ? AND ip = ?',
      [claw.id, ip]
    );

    if (existing) {
      return NextResponse.json({ error: '您已经为该项目打过分了' }, { status: 409 });
    }

    // 插入评分
    await execute(
      'INSERT INTO ratings (claw_id, ip, rating) VALUES (?, ?, ?)',
      [claw.id, ip, Math.floor(Number(rating))]
    );

    // 更新统计（基于 ratings 表）
    const stats = await query<{ avg_r: number; cnt: number }>(
      'SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM ratings WHERE claw_id = ?',
      [claw.id]
    );

    if (stats.length > 0) {
      const upsertSQL = isMySQL
        ? `INSERT INTO claw_stats (claw_id, avg_rating, review_count) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE avg_rating = VALUES(avg_rating), review_count = VALUES(review_count)`
        : `INSERT INTO claw_stats (claw_id, avg_rating, review_count) VALUES (?, ?, ?)
           ON CONFLICT(claw_id) DO UPDATE SET avg_rating = excluded.avg_rating, review_count = excluded.review_count`;
      await execute(upsertSQL, [claw.id, stats[0].avg_r, stats[0].cnt]);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to rate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
