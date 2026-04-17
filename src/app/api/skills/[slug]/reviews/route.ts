import { NextRequest, NextResponse } from 'next/server';
import { execute, get, query, initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}

function getFingerprint(request: NextRequest): string {
  return request.cookies.get('claw123_fp')?.value || '';
}

function setFingerprintCookie(response: NextResponse, fp: string): NextResponse {
  response.cookies.set('claw123_fp', fp, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return response;
}

function generateFingerprint(): string {
  return `fp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();

    const skill = await get<{ id: number }>('SELECT id FROM skills WHERE slug = ?', [params.slug]);
    if (!skill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const reviews = await query(
      'SELECT id, nickname, content, created_at FROM skills_reviews WHERE item_id = ? AND approved = 1 ORDER BY created_at DESC',
      [skill.id]
    );

    const ip = getClientIp(request);
    const fp = getFingerprint(request);

    let hasReviewed = false;
    if (fp) {
      const existing = await get(
        'SELECT id FROM skills_reviews WHERE item_id = ? AND (ip = ? OR fingerprint = ?)',
        [skill.id, ip, fp]
      );
      hasReviewed = !!existing;
    } else {
      const existing = await get(
        'SELECT id FROM skills_reviews WHERE item_id = ? AND ip = ?',
        [skill.id, ip]
      );
      hasReviewed = !!existing;
    }

    let hasRated = false;
    let userRating = 0;
    const existingRating = await get<{ id: number; rating: number }>(
      'SELECT id, rating FROM skills_ratings WHERE item_id = ? AND ip = ?',
      [skill.id, ip]
    );
    if (existingRating) {
      hasRated = true;
      userRating = existingRating.rating;
    }

    return NextResponse.json({ reviews, hasReviewed, hasRated, userRating });
  } catch (error: unknown) {
    console.error('Failed to fetch skill reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();
    const body = await request.json();
    const { nickname, content } = body;
    const ip = getClientIp(request);
    let fp = getFingerprint(request);

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: '评论内容不能超过 1000 字' }, { status: 400 });
    }

    const skill = await get<{ id: number }>('SELECT id FROM skills WHERE slug = ?', [params.slug]);
    if (!skill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (fp) {
      const existing = await get(
        'SELECT id FROM skills_reviews WHERE item_id = ? AND (ip = ? OR fingerprint = ?)',
        [skill.id, ip, fp]
      );
      if (existing) {
        return NextResponse.json({ error: '你已经评论过该项目了' }, { status: 429 });
      }
    } else {
      const existing = await get(
        'SELECT id FROM skills_reviews WHERE item_id = ? AND ip = ?',
        [skill.id, ip]
      );
      if (existing) {
        return NextResponse.json({ error: '你已经评论过该项目了' }, { status: 429 });
      }
      fp = generateFingerprint();
    }

    const safeNickname = (nickname || '匿名用户').slice(0, 100);

    await execute(
      'INSERT INTO skills_reviews (item_id, nickname, content, ip, fingerprint, approved) VALUES (?, ?, ?, ?, ?, 0)',
      [skill.id, safeNickname, content.trim(), ip, fp]
    );

    const response = NextResponse.json(
      { success: true, message: '评论已提交，待管理员审核后展示' },
      { status: 201 }
    );
    return setFingerprintCookie(response, fp);
  } catch (error: unknown) {
    console.error('Failed to create skill review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
