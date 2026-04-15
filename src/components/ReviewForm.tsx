'use client';

import { useState } from 'react';

interface Props {
  slug: string;
  onSubmit: () => void;
}

export default function ReviewForm({ slug, onSubmit }: Props) {
  const [nickname, setNickname] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('请选择评分');
      return;
    }
    if (!content.trim()) {
      setError('请输入评价内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/claws/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim() || '匿名用户',
          rating,
          content: content.trim(),
        }),
      });

      if (res.ok) {
        setNickname('');
        setRating(0);
        setContent('');
        onSubmit();
      } else {
        const data = await res.json();
        setError(data.error || '提交失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      {/* 昵称 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1.5">昵称</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="匿名用户"
          maxLength={100}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 评分 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1.5">评分</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl transition-transform hover:scale-110"
            >
              <span className={i <= (hoverRating || rating) ? 'text-amber-400' : 'text-slate-200'}>
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-slate-500 ml-2 self-center">{rating} 分</span>
          )}
        </div>
      </div>

      {/* 评价内容 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1.5">评价</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的使用体验..."
          maxLength={1000}
          rows={4}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="text-right text-xs text-slate-400 mt-1">{content.length}/1000</div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? '提交中...' : '提交评价'}
      </button>
    </form>
  );
}
