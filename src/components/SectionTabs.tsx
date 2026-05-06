'use client';

import { SectionKey, SECTIONS } from '@/lib/types';

interface Props {
  active: SectionKey;
  onChange: (key: SectionKey) => void;
}

export default function SectionTabs({ active, onChange }: Props) {
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/78 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <nav className="grid grid-cols-5 gap-1 py-2 sm:hidden">
          {SECTIONS.map((sec, index) => {
            const isActive = active === sec.key;

            return (
              <button
                key={sec.key}
                onClick={() => onChange(sec.key)}
                className={`
                  flex items-center justify-center rounded-lg px-1 py-2 text-[11px] font-medium
                  border transition-all duration-200 min-w-0 leading-tight
                  ${isActive
                    ? 'border-blue-500/80 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-white/90 text-slate-500'
                  }
                `}
                title={sec.label}
              >
                <span className="truncate">{index === SECTIONS.length - 1 ? 'Token Plan' : sec.label}</span>
              </button>
            );
          })}
        </nav>

        <nav className="hidden sm:flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {SECTIONS.map((sec) => {
            const isActive = active === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => onChange(sec.key)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2.5 sm:py-3
                  text-xs sm:text-sm font-medium whitespace-nowrap
                  border transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
                    : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700'
                  }
                `}
              >
                <span className="text-[15px] sm:text-base">{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
