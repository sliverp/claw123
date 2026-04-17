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

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();
    const body = await request.json();
    const { rating } = body;
    const ip = getClientIp(request);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '评分必须在 1-5 之间' }, { status: 400 });
    }

    const benchmark = await get<{ id: number }>('SELECT id FROM benchmarks WHERE slug = ?', [params.slug]);
    if (!benchmark) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const existing = await get<{ id: number }>(
      'SELECT id FROM benchmarks_ratings WHERE item_id = ? AND ip = ?',
      [benchmark.id, ip]
    );
    if (existing) {
      return NextResponse.json({ error: '您已经为该项目打过分了' }, { status: 409 });
    }

    await execute(
      'INSERT INTO benchmarks_ratings (item_id, ip, rating) VALUES (?, ?, ?)',
      [benchmark.id, ip, Math.floor(Number(rating))]
    );

    const stats = await query<{ avg_r: number; cnt: number }>(
      'SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM benchmarks_ratings WHERE item_id = ?',
      [benchmark.id]
    );

    if (stats.length > 0) {
      const upsertSQL = isMySQL
        ? `INSERT INTO benchmarks_stats (item_id, avg_rating, review_count) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE avg_rating = VALUES(avg_rating), review_count = VALUES(review_count)`
        : `INSERT INTO benchmarks_stats (item_id, avg_rating, review_count) VALUES (?, ?, ?)
           ON CONFLICT(item_id) DO UPDATE SET avg_rating = excluded.avg_rating, review_count = excluded.review_count`;
      await execute(upsertSQL, [benchmark.id, stats[0].avg_r, stats[0].cnt]);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to rate benchmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
