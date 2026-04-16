import { NextRequest, NextResponse } from 'next/server';
import { query, execute, get, initDatabase } from '@/lib/db';

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

// GET /api/claws/[slug]/reviews - 获取已审核的评价列表 + 用户状态
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();
    const { slug } = params;

    const claw = await get<{ id: number }>('SELECT id FROM claws WHERE slug = ?', [slug]);
    if (!claw) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 只返回已审核通过的评论
    const reviews = await query(
      'SELECT id, claw_id, nickname, content, created_at FROM reviews WHERE claw_id = ? AND approved = 1 ORDER BY created_at DESC',
      [claw.id]
    );

    // 检查当前用户是否已评论过
    const ip = getClientIp(request);
    const fp = getFingerprint(request);

    let hasReviewed = false;
    if (fp) {
      const existing = await get(
        'SELECT id FROM reviews WHERE claw_id = ? AND (ip = ? OR fingerprint = ?)',
        [claw.id, ip, fp]
      );
      hasReviewed = !!existing;
    } else {
      const existing = await get(
        'SELECT id FROM reviews WHERE claw_id = ? AND ip = ?',
        [claw.id, ip]
      );
      hasReviewed = !!existing;
    }

    // 检查当前用户是否已评分过
    let hasRated = false;
    const existingRating = await get(
      'SELECT id FROM ratings WHERE claw_id = ? AND ip = ?',
      [claw.id, ip]
    );
    hasRated = !!existingRating;

    return NextResponse.json({ reviews, hasReviewed, hasRated });
  } catch (error: unknown) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/claws/[slug]/reviews - 提交评论（纯文字，不含评分）
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await initDatabase();
    const { slug } = params;
    const body = await request.json();
    const { nickname, content } = body;
    const ip = getClientIp(request);
    let fp = getFingerprint(request);

    // 验证：评论内容必填
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: '评论内容不能超过 1000 字' }, { status: 400 });
    }

    const claw = await get<{ id: number }>('SELECT id FROM claws WHERE slug = ?', [slug]);
    if (!claw) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 防刷检查：每人每 claw 只能评论一次
    if (fp) {
      const existing = await get(
        'SELECT id FROM reviews WHERE claw_id = ? AND (ip = ? OR fingerprint = ?)',
        [claw.id, ip, fp]
      );
      if (existing) {
        return NextResponse.json({ error: '你已经评论过该项目了' }, { status: 429 });
      }
    } else {
      const existing = await get(
        'SELECT id FROM reviews WHERE claw_id = ? AND ip = ?',
        [claw.id, ip]
      );
      if (existing) {
        return NextResponse.json({ error: '你已经评论过该项目了' }, { status: 429 });
      }
      fp = generateFingerprint();
    }

    const safeNickname = (nickname || '匿名用户').slice(0, 100);

    // 评论不再包含 rating 字段
    await execute(
      'INSERT INTO reviews (claw_id, nickname, content, ip, fingerprint, approved) VALUES (?, ?, ?, ?, ?, 0)',
      [claw.id, safeNickname, content.trim(), ip, fp]
    );

    const response = NextResponse.json(
      { success: true, message: '评论已提交，待管理员审核后展示' },
      { status: 201 }
    );
    return setFingerprintCookie(response, fp);
  } catch (error: unknown) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
