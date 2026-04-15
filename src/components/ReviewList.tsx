import { Review } from '@/lib/types';
import StarDisplay from './StarDisplay';

interface Props {
  reviews: Review[];
}

export default function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 shadow-sm">
        还没有评价，来做第一个评价者吧！
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-medium">
                {review.nickname[0]}
              </div>
              <span className="font-medium text-slate-700 text-sm">{review.nickname}</span>
            </div>
            <StarDisplay rating={review.rating} size="sm" />
          </div>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{review.content}</p>
          <div className="mt-3 text-xs text-slate-400">
            {new Date(review.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
