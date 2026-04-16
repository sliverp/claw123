import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/claws/[slug] - 获取单个 claw 详情
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();
    const { slug } = params;

    const rows = await query(
      `SELECT c.*, COALESCE(s.avg_rating, 0) as avg_rating, COALESCE(s.review_count, 0) as review_count, COALESCE(s.visit_count, 0) as visit_count
       FROM claws c
       LEFT JOIN claw_stats s ON c.id = s.claw_id
       WHERE c.slug = ?`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const row = rows[0] as Record<string, unknown>;
    const claw = {
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags || [],
      avg_rating: Number(row.avg_rating),
      review_count: Number(row.review_count),
      visit_count: Number(row.visit_count),
    };

    return NextResponse.json(claw);
  } catch (error: unknown) {
    console.error('Failed to fetch claw:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
