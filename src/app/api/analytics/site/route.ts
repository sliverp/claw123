import { NextRequest, NextResponse } from 'next/server';
import { execute, get, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}

function getFingerprint(request: NextRequest): string {
  return request.cookies.get('claw123_site_fp')?.value || '';
}

function setFingerprintCookie(response: NextResponse, fp: string): NextResponse {
  response.cookies.set('claw123_site_fp', fp, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return response;
}

function generateFingerprint(): string {
  return `site_fp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest) {
  try {
    await initDatabase();

    const body = await request.json().catch(() => ({}));
    const path = typeof body.path === 'string' && body.path ? body.path.slice(0, 512) : '/';
    const ip = getClientIp(request);
    let fp = getFingerprint(request);

    if (!fp) {
      fp = generateFingerprint();
    }

    const latest = await get<{ created_at: string }>(
      `SELECT created_at
       FROM site_pageviews
       WHERE path = ? AND ((fingerprint != '' AND fingerprint = ?) OR (fingerprint = '' AND ip = ?))
       ORDER BY created_at DESC
       LIMIT 1`,
      [path, fp, ip]
    );

    const latestAt = latest?.created_at ? new Date(latest.created_at).getTime() : 0;
    if (!latestAt || Date.now() - latestAt > 3000) {
      await execute(
        'INSERT INTO site_pageviews (path, ip, fingerprint) VALUES (?, ?, ?)',
        [path, ip, fp]
      );
    }

    const response = NextResponse.json({ ok: true });
    return setFingerprintCookie(response, fp);
  } catch (error: unknown) {
    console.error('Failed to record site pageview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
