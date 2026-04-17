import { NextRequest, NextResponse } from 'next/server';
import { get, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();

    const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();
    const isMySQL = dbType === 'mysql';
    const uniqueExpr = `COUNT(DISTINCT CASE WHEN fingerprint IS NOT NULL AND fingerprint != '' THEN fingerprint ELSE ip END)`;
    const todayCondition = isMySQL
      ? 'DATE(created_at) = CURDATE()'
      : "DATE(created_at, 'localtime') = DATE('now', 'localtime')";

    const total = await get<{ pv: number; uv: number }>(
      `SELECT COUNT(*) as pv, ${uniqueExpr} as uv FROM site_pageviews`
    );

    const today = await get<{ pv: number; uv: number }>(
      `SELECT COUNT(*) as pv, ${uniqueExpr} as uv FROM site_pageviews WHERE ${todayCondition}`
    );

    const topPages = await (async () => {
      const { query } = await import('@/lib/db');
      return query<{ path: string; pv: number; uv: number }>(
        `SELECT path, COUNT(*) as pv, ${uniqueExpr} as uv
         FROM site_pageviews
         GROUP BY path
         ORDER BY pv DESC
         LIMIT 10`
      );
    })();

    return NextResponse.json({
      total_pv: Number(total?.pv || 0),
      total_uv: Number(total?.uv || 0),
      today_pv: Number(today?.pv || 0),
      today_uv: Number(today?.uv || 0),
      top_pages: topPages.map((row) => ({
        path: row.path,
        pv: Number(row.pv),
        uv: Number(row.uv),
      })),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch admin analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
