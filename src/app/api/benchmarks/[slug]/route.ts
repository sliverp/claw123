import { NextRequest, NextResponse } from 'next/server';
import { get, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();

    const row = await get<Record<string, unknown>>(
      `SELECT b.*, COALESCE(st.avg_rating, 0) as avg_rating, COALESCE(st.review_count, 0) as review_count, COALESCE(st.visit_count, 0) as visit_count
       FROM benchmarks b
       LEFT JOIN benchmarks_stats st ON b.id = st.item_id
       WHERE b.slug = ?`,
      [params.slug]
    );

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const benchmark = {
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags || [],
      avg_rating: Number(row.avg_rating),
      review_count: Number(row.review_count),
      visit_count: Number(row.visit_count),
    };

    return NextResponse.json(benchmark);
  } catch (error: unknown) {
    console.error('Failed to fetch benchmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
