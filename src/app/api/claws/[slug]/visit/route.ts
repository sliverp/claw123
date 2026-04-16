import { NextRequest, NextResponse } from 'next/server';
import { execute, get, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/claws/[slug]/visit - 记录一次访问
export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();
    const { slug } = params;

    const claw = await get<{ id: number }>('SELECT id FROM claws WHERE slug = ?', [slug]);
    if (!claw) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await execute(
      'UPDATE claw_stats SET visit_count = visit_count + 1 WHERE claw_id = ?',
      [claw.id]
    );

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Failed to record visit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
