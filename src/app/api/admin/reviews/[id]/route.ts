import { NextRequest, NextResponse } from 'next/server';
import { execute, get, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();
const isMySQL = DB_TYPE === 'mysql';

function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === process.env.ADMIN_TOKEN;
}

// PATCH /api/admin/reviews/[id] - 审批评论
// body: { action: 'approve' | 'reject' }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();

    const reviewId = Number(params.id);
    if (!reviewId || isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action, must be "approve" or "reject"' }, { status: 400 });
    }

    const review = await get<{ id: number; claw_id: number; rating: number }>(
      'SELECT id, claw_id, rating FROM reviews WHERE id = ?',
      [reviewId]
    );
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const approvedValue = action === 'approve' ? 1 : 2;
    await execute('UPDATE reviews SET approved = ? WHERE id = ?', [approvedValue, reviewId]);

    // 重新计算该 claw 的评分统计（基于 ratings 表，而非 reviews 表）
    const ratingStats = await get<{ avg_r: number; cnt: number }>(
      'SELECT COALESCE(AVG(rating), 0) AS avg_r, COUNT(*) AS cnt FROM ratings WHERE claw_id = ?',
      [review.claw_id]
    );

    const upsertSQL = isMySQL
      ? `INSERT INTO claw_stats (claw_id, avg_rating, review_count) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE avg_rating = VALUES(avg_rating), review_count = VALUES(review_count)`
      : `INSERT INTO claw_stats (claw_id, avg_rating, review_count) VALUES (?, ?, ?)
         ON CONFLICT(claw_id) DO UPDATE SET avg_rating = excluded.avg_rating, review_count = excluded.review_count`;
    await execute(upsertSQL, [review.claw_id, ratingStats?.avg_r || 0, ratingStats?.cnt || 0]);

    return NextResponse.json({ success: true, action, reviewId });
  } catch (error: unknown) {
    console.error('Failed to update review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
