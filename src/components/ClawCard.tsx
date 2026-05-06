'use client';

import { ItemWithStats } from '@/lib/types';
import StarDisplay from './StarDisplay';

interface Props {
  claw: ItemWithStats;
  detailHref?: string | null;
  visitEndpoint?: string | null;
  compact?: boolean;
}

export default function ClawCard({
  claw,
  detailHref = `/claw/${claw.slug}`,
  visitEndpoint = `/api/claws/${claw.slug}/visit`,
  compact = false,
}: Props) {
  const recordVisit = () => {
    if (!visitEndpoint) return;
    fetch(visitEndpoint, { method: 'POST' }).catch(() => {});
  };

  return (
    <div className="group relative h-full">
      {/* 整个卡片点击直接打开主页 */}
      <a
        href={claw.homepage}
        target="_blank"
        rel="noopener noreferrer"
        onClick={recordVisit}
        className={`flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_10px_24px_rgba(15,23,42,0.04)]
                   transition-all duration-300
                   hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(37,99,235,0.12)]
                   ${compact ? 'p-2.5 pb-9 sm:p-3.5 sm:pb-9' : 'p-3 pb-11 sm:p-5 sm:pb-12'}
                   `}
      >
        {/* 移动端：竖向布局（图标居中 + 名称） */}
        <div className="flex flex-col items-center text-center sm:hidden">
          <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner`}>
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
            <span className={`${compact ? 'text-base' : 'text-lg'} font-bold text-blue-500 ${claw.icon ? 'hidden' : ''}`}>
              {claw.name[0]}
            </span>
          </div>
          <h3 className={`font-semibold text-slate-800 truncate w-full ${compact ? 'text-[11px] mt-1.5' : 'text-xs mt-2'}`}>{claw.name}</h3>
          <div className={`flex items-center gap-1 ${compact ? 'mt-0' : 'mt-0.5'}`}>
            <StarDisplay rating={claw.avg_rating} size="sm" />
          </div>
          <p className={`${compact ? 'mt-1 text-[10px] line-clamp-4' : 'mt-1.5 text-[11px] line-clamp-4'} text-slate-500 leading-relaxed flex-1`}>
            {claw.description}
          </p>
        </div>

        {/* 桌面端：横向布局（图标 + 右侧信息） */}
        <div className={`hidden sm:flex items-start ${compact ? 'gap-2.5' : 'gap-3'}`}>
          <div className={`flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}>
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
            <span className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-blue-500 ${claw.icon ? 'hidden' : ''}`}>
              {claw.name[0]}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-slate-800 truncate ${compact ? 'text-[15px]' : ''}`}>{claw.name}</h3>
            <div className={`flex items-center gap-2 flex-wrap ${compact ? 'mt-0.5' : 'mt-1'}`}>
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

        <p className={`hidden sm:block text-slate-500 leading-relaxed flex-1 ${compact ? 'mt-1.5 text-xs line-clamp-4' : 'mt-3 text-sm line-clamp-4'}`}>
          {claw.description}
        </p>
      </a>

      {/* 底部操作栏 - 移动端常驻，桌面端悬停显示 */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-2xl
                      sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100
                      transition-all duration-300 z-10">
        <div className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-50 border-t border-slate-200 ${compact ? 'sm:py-1.5' : 'sm:py-2.5'}`}>
          {detailHref && (
            <a
              href={detailHref}
              className={`px-2 ${compact ? 'sm:px-3' : 'sm:px-3.5'} py-1 sm:py-1.5 bg-white text-slate-600 rounded-md text-[10px] sm:text-xs font-medium
                         border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200
                         transition-colors shadow-sm`}
              onClick={(e) => e.stopPropagation()}
            >
              详情
            </a>
          )}
          {claw.github && (
            <a
              href={claw.github}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-2 ${compact ? 'sm:px-3' : 'sm:px-3.5'} py-1 sm:py-1.5 bg-slate-800 text-white rounded-md text-[10px] sm:text-xs font-medium
                         hover:bg-slate-900 transition-colors shadow-sm`}
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
