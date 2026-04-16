import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === process.env.ADMIN_TOKEN;
}

// GET /api/admin/reviews?status=pending|approved|rejected
// 获取评论列表（需要管理员 token）
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();

    const status = request.nextUrl.searchParams.get('status') || 'pending';

    let approvedValue: number;
    switch (status) {
      case 'approved': approvedValue = 1; break;
      case 'rejected': approvedValue = 2; break;
      default: approvedValue = 0; break;
    }

    const reviews = await query(
      `SELECT r.id, r.claw_id, r.nickname, r.rating, r.content, r.ip, r.fingerprint, r.approved, r.created_at,
              c.name AS claw_name, c.slug AS claw_slug
       FROM reviews r
       LEFT JOIN claws c ON c.id = r.claw_id
       WHERE r.approved = ?
       ORDER BY r.created_at DESC`,
      [approvedValue]
    );

    return NextResponse.json(reviews);
  } catch (error: unknown) {
    console.error('Failed to fetch reviews for admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
