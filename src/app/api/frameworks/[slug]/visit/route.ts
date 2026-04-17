import { NextRequest, NextResponse } from 'next/server';
import { execute, get, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();

    const framework = await get<{ id: number }>('SELECT id FROM frameworks WHERE slug = ?', [params.slug]);
    if (!framework) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await execute(
      'UPDATE frameworks_stats SET visit_count = visit_count + 1 WHERE item_id = ?',
      [framework.id]
    );

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Failed to record framework visit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
