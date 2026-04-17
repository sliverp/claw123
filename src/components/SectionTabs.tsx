'use client';

import { SectionKey, SECTIONS } from '@/lib/types';

interface Props {
  active: SectionKey;
  onChange: (key: SectionKey) => void;
}

export default function SectionTabs({ active, onChange }: Props) {
  return (
    <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
          {SECTIONS.map((sec) => {
            const isActive = active === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => onChange(sec.key)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4
                  text-xs sm:text-sm font-medium whitespace-nowrap
                  border-b-2 transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <span className="text-base sm:text-lg">{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
