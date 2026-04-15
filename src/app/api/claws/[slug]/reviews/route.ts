import { NextRequest, NextResponse } from 'next/server';
import { query, execute, initDatabase } from '@/lib/db';

// GET /api/claws/[slug]/reviews - 获取评价列表
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    initDatabase();
    const { slug } = params;

    const clawRows = query<{ id: number }>('SELECT id FROM claws WHERE slug = ?', [slug]);
    if (clawRows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const reviews = query(
      'SELECT * FROM reviews WHERE claw_id = ? ORDER BY created_at DESC',
      [clawRows[0].id]
    );

    return NextResponse.json(reviews);
  } catch (error: unknown) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/claws/[slug]/reviews - 提交评价
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    initDatabase();
    const { slug } = params;
    const body = await request.json();
    const { nickname, rating, content } = body;

    // 参数校验
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '评分必须在 1-5 之间' }, { status: 400 });
    }
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '评价内容不能为空' }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: '评价内容不能超过 1000 字' }, { status: 400 });
    }

    const clawRows = query<{ id: number }>('SELECT id FROM claws WHERE slug = ?', [slug]);
    if (clawRows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const clawId = clawRows[0].id;
    const safeNickname = (nickname || '匿名用户').slice(0, 100);

    // 插入评价
    execute(
      'INSERT INTO reviews (claw_id, nickname, rating, content) VALUES (?, ?, ?, ?)',
      [clawId, safeNickname, Math.floor(Number(rating)), content.trim()]
    );

    // 更新统计
    const stats = query<{ avg_r: number; cnt: number }>(
      'SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE claw_id = ?',
      [clawId]
    );

    if (stats.length > 0) {
      execute(
        `INSERT INTO claw_stats (claw_id, avg_rating, review_count) VALUES (?, ?, ?)
         ON CONFLICT(claw_id) DO UPDATE SET avg_rating = excluded.avg_rating, review_count = excluded.review_count`,
        [clawId, stats[0].avg_r, stats[0].cnt]
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
