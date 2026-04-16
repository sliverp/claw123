'use client';

import { ClawWithStats } from '@/lib/types';
import StarDisplay from './StarDisplay';

interface Props {
  claw: ClawWithStats;
}

export default function ClawCard({ claw }: Props) {
  const recordVisit = () => {
    fetch(`/api/claws/${claw.slug}/visit`, { method: 'POST' }).catch(() => {});
  };

  return (
    <div className="group relative h-full">
      {/* 整个卡片点击直接打开主页 */}
      <a
        href={claw.homepage}
        target="_blank"
        rel="noopener noreferrer"
        onClick={recordVisit}
        className="flex flex-col h-full bg-white rounded-xl border border-slate-200 p-4 sm:p-5 pb-14 sm:pb-12 transition-all duration-300
                   hover:shadow-lg hover:shadow-blue-100 hover:border-blue-200 hover:-translate-y-1"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
            {claw.icon ? (
              <img
                src={claw.icon}
                alt={claw.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-lg sm:text-xl font-bold text-blue-500 ${claw.icon ? 'hidden' : ''}`}>
              {claw.name[0]}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate text-sm sm:text-base">{claw.name}</h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
              <StarDisplay rating={claw.avg_rating} size="sm" />
              <span className="text-xs text-slate-400">
                {claw.review_count > 0 ? `${claw.review_count} 条评价` : '暂无评价'}
              </span>
              {claw.visit_count > 0 && (
                <span className="text-xs text-slate-300">· {claw.visit_count} 次访问</span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {claw.description}
        </p>
      </a>

      {/* 底部操作栏 - 移动端常驻，桌面端悬停显示 */}
      <div className="absolute bottom-0 left-0 right-0 rounded-b-xl overflow-hidden
                      sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100
                      transition-all duration-300 z-10">
        <div className="flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-slate-50 border-t border-slate-200">
          <a
            href={`/claw/${claw.slug}`}
            className="px-3 sm:px-3.5 py-1.5 bg-white text-slate-600 rounded-md text-xs font-medium
                       border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200
                       transition-colors shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            详情 & 评价
          </a>
          {claw.github && (
            <a
              href={claw.github}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-3.5 py-1.5 bg-slate-800 text-white rounded-md text-xs font-medium
                         hover:bg-slate-900 transition-colors shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
