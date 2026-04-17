'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TokenCodingPlanWithStats } from '@/lib/types';
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
  pricing: '💳 定价',
  'coding-plan': '💻 Coding Plan',
  bundle: '📦 套餐',
  comparison: '📊 对比',
  other: '📁 其他',
};

export default function TokenCodingPlanDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [item, setItem] = useState<TokenCodingPlanWithStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [itemRes, reviewsRes] = await Promise.all([
        fetch(`/api/token-coding-plans/${slug}`),
        fetch(`/api/token-coding-plans/${slug}/reviews`),
      ]);

      if (itemRes.ok) {
        setItem(await itemRes.json());
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
    fetch(`/api/token-coding-plans/${slug}`).then((res) => { if (res.ok) res.json().then(setItem); });
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

  if (!item) {
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
          <span className="text-slate-600">{item.name}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
              {item.icon ? (
                <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-blue-500">{item.name[0]}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{item.name}</h1>
              <p className="mt-2 text-slate-500 leading-relaxed">{item.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <StarDisplay rating={item.avg_rating} size="lg" />
                <span className="text-slate-400">
                  {item.avg_rating > 0
                    ? `${item.avg_rating.toFixed(1)} 分 (${item.review_count} 人评分)`
                    : '暂无评分'}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                  {CATEGORY_LABELS[item.category] || item.category}
                </span>
                {item.visit_count > 0 && (
                  <span className="text-xs text-slate-400">已访问 {item.visit_count} 次</span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={item.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  访问主页
                </a>
                {item.github && (
                  <a
                    href={item.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    GitHub
                  </a>
                )}
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(item.tags as string[]).map((tag: string) => (
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

        <div className="mt-6">
          <RatingWidget
            slug={slug}
            onRated={handleRated}
            disabled={hasRated}
            initialRating={userRating}
            apiBase="/api/token-coding-plans"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              用户评论 ({reviews.length})
            </h2>
            <ReviewList reviews={reviews} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">写评论</h2>
            <ReviewForm
              slug={slug}
              onSubmit={handleReviewSubmit}
              disabled={hasReviewed}
              apiBase="/api/token-coding-plans"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
