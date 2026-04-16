'use client';

import { useState, useEffect } from 'react';

interface Props {
  slug: string;
  onRated: () => void;
  disabled?: boolean;
  initialRating?: number;
}

export default function RatingWidget({ slug, onRated, disabled, initialRating = 0 }: Props) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialRating > 0) setRating(initialRating);
  }, [initialRating]);

  const handleRate = async (score: number) => {
    if (disabled || submitting || success) return;
    setRating(score);
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/claws/${slug}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: score }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        onRated();
      } else {
        setError(data.error || '评分失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (disabled || success) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-600 mb-2">我的评分</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`text-xl ${i <= rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
            ))}
          </div>
          <span className="text-xs text-green-600 ml-2">✓ 已评分</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-medium text-slate-600 mb-2">为该项目评分</h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            disabled={submitting}
            onClick={() => handleRate(i)}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-2xl transition-transform hover:scale-125 disabled:cursor-not-allowed"
          >
            <span className={i <= (hoverRating || rating) ? 'text-amber-400' : 'text-slate-200'}>
              ★
            </span>
          </button>
        ))}
        {hoverRating > 0 && (
          <span className="text-sm text-slate-500 ml-2">{hoverRating} 分</span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1.5">点击星星即可评分</p>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
