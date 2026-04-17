'use client';

import { ItemWithStats } from '@/lib/types';
import StarDisplay from './StarDisplay';

interface Props {
  claw: ItemWithStats;
  detailHref?: string | null;
  visitEndpoint?: string | null;
}

export default function ClawCard({ claw, detailHref = `/claw/${claw.slug}`, visitEndpoint = `/api/claws/${claw.slug}/visit` }: Props) {
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
        className="flex flex-col h-full bg-white rounded-xl border border-slate-200
                   p-3 pb-11 sm:p-5 sm:pb-12 transition-all duration-300
                   hover:shadow-lg hover:shadow-blue-100 hover:border-blue-200 hover:-translate-y-1"
      >
        {/* 移动端：竖向布局（图标居中 + 名称） */}
        <div className="flex flex-col items-center text-center sm:hidden">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
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
            <span className={`text-lg font-bold text-blue-500 ${claw.icon ? 'hidden' : ''}`}>
              {claw.name[0]}
            </span>
          </div>
          <h3 className="font-semibold text-slate-800 truncate w-full text-xs mt-2">{claw.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <StarDisplay rating={claw.avg_rating} size="sm" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed flex-1">
            {claw.description}
          </p>
        </div>

        {/* 桌面端：横向布局（图标 + 右侧信息） */}
        <div className="hidden sm:flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
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
            <span className={`text-xl font-bold text-blue-500 ${claw.icon ? 'hidden' : ''}`}>
              {claw.name[0]}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">{claw.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
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

        <p className="hidden sm:block mt-3 text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {claw.description}
        </p>
      </a>

      {/* 底部操作栏 - 移动端常驻，桌面端悬停显示 */}
      <div className="absolute bottom-0 left-0 right-0 rounded-b-xl overflow-hidden
                      sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100
                      transition-all duration-300 z-10">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 bg-slate-50 border-t border-slate-200">
          {detailHref && (
            <a
              href={detailHref}
              className="px-2 sm:px-3.5 py-1 sm:py-1.5 bg-white text-slate-600 rounded-md text-[10px] sm:text-xs font-medium
                         border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200
                         transition-colors shadow-sm"
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
              className="px-2 sm:px-3.5 py-1 sm:py-1.5 bg-slate-800 text-white rounded-md text-[10px] sm:text-xs font-medium
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
