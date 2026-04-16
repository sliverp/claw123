'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClawWithStats } from '@/lib/types';
import StarDisplay from '@/components/StarDisplay';
import RatingWidget from '@/components/RatingWidget';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';

interface ReviewItem {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  gateway: '🚪 网关',
  proxy: '🔄 代理',
  aggregator: '🧩 聚合',
  tool: '🔧 工具',
  assistant: '🤖 助手',
  other: '📦 其他',
};

export default function ClawDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [claw, setClaw] = useState<ClawWithStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [clawRes, reviewsRes] = await Promise.all([
        fetch(`/api/claws/${slug}`),
        fetch(`/api/claws/${slug}/reviews`),
      ]);

      if (clawRes.ok) {
        setClaw(await clawRes.json());
      }
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        if (data.hasReviewed) setHasReviewed(true);
        if (data.hasRated) setHasRated(true);
        if (data.userRating) setUserRating(data.userRating);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  const handleRated = () => {
    setHasRated(true);
    // 重新拉取 claw 数据以刷新评分统计
    fetch(`/api/claws/${slug}`).then(res => { if (res.ok) res.json().then(setClaw); });
  };

  const handleReviewSubmit = () => {
    setHasReviewed(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!claw) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-slate-400">项目不存在</p>
        <a href="/" className="text-blue-500 hover:underline">返回首页</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-lg">
            🐾 Claw123
          </a>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">{claw.name}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* 项目信息卡 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
              {claw.icon ? (
                <img src={claw.icon} alt={claw.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-blue-500">{claw.name[0]}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{claw.name}</h1>
              <p className="mt-2 text-slate-500 leading-relaxed">{claw.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <StarDisplay rating={claw.avg_rating} size="lg" />
                <span className="text-slate-400">
                  {claw.avg_rating > 0
                    ? `${claw.avg_rating.toFixed(1)} 分 (${claw.review_count} 人评分)`
                    : '暂无评分'}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                  {CATEGORY_LABELS[claw.category] || claw.category}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={claw.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  访问主页
                </a>
                {claw.github && (
                  <a
                    href={claw.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
              </div>

              {claw.tags && claw.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(claw.tags as string[]).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs bg-slate-50 text-slate-500 rounded-full border border-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 评分区域（独立） */}
        <div className="mt-6">
          <RatingWidget slug={slug} onRated={handleRated} disabled={hasRated} initialRating={userRating} />
        </div>

        {/* 评论区域（独立） */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              用户评论 ({reviews.length})
            </h2>
            <ReviewList reviews={reviews} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">写评论</h2>
            <ReviewForm slug={slug} onSubmit={handleReviewSubmit} disabled={hasReviewed} />
          </div>
        </div>
      </main>
    </div>
  );
}
