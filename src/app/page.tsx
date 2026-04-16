'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ClawWithStats } from '@/lib/types';
import ClawCard from '@/components/ClawCard';
import Banner from '@/components/Banner';

type SortMode = 'alpha' | 'stars' | 'rating';

export default function HomePage() {
  const [claws, setClaws] = useState<ClawWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLetter, setActiveLetter] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    fetch('/api/claws')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClaws(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 按排序模式处理数据
  const sortedClaws = useMemo(() => {
    const arr = [...claws];
    switch (sortMode) {
      case 'stars':
        arr.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      case 'rating':
        arr.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
      case 'alpha':
      default:
        arr.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
        break;
    }
    return arr;
  }, [claws, sortMode]);

  // 按首字母分组（仅字母排序模式下分组）
  const grouped = useMemo(() => {
    if (sortMode !== 'alpha') {
      return [{ letter: 'ALL', items: sortedClaws }];
    }
    const map: Record<string, ClawWithStats[]> = {};
    for (const claw of sortedClaws) {
      const first = claw.name[0].toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : '#';
      if (!map[letter]) map[letter] = [];
      map[letter].push(claw);
    }
    const letters = Object.keys(map).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
    return letters.map((l) => ({ letter: l, items: map[l] }));
  }, [sortedClaws, sortMode]);

  // 所有出现的字母
  const availableLetters = useMemo(() => {
    if (sortMode !== 'alpha') return [];
    return grouped.map((g) => g.letter);
  }, [grouped, sortMode]);

  // 全量字母表
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

  // 滚动监听
  const handleScroll = useCallback(() => {
    if (sortMode !== 'alpha') return;
    const offset = 120;
    let current = '';
    for (const group of grouped) {
      const el = sectionRefs.current[group.letter];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset) {
          current = group.letter;
        }
      }
    }
    if (current && current !== activeLetter) {
      setActiveLetter(current);
    }
  }, [grouped, activeLetter, sortMode]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (grouped.length > 0 && !activeLetter && sortMode === 'alpha') {
      setActiveLetter(grouped[0].letter);
    }
  }, [grouped, activeLetter, sortMode]);

  const scrollToLetter = (letter: string) => {
    const el = sectionRefs.current[letter];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const sortOptions: { key: SortMode; label: string; icon: string }[] = [
    { key: 'alpha', label: 'A-Z 排序', icon: '🔤' },
    { key: 'rating', label: '评分最高', icon: '⭐' },
    { key: 'stars', label: '评价最多', icon: '💬' },
  ];

  return (
    <div className="min-h-screen">
      <Banner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部排序栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortMode(opt.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  sortMode === opt.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <span className="text-sm text-slate-400">
            共 {claws.length} 个项目
          </span>
        </div>

        <div className="flex gap-6">
          {/* 主内容区 */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sortedClaws.length === 0 ? (
              <div className="text-center py-20 text-slate-400">暂无数据</div>
            ) : (
              <div className="space-y-10">
                {grouped.map((group) => (
                  <section
                    key={group.letter}
                    ref={(el) => { sectionRefs.current[group.letter] = el; }}
                    id={`section-${group.letter}`}
                  >
                    {/* 字母标题（仅字母排序模式） */}
                    {sortMode === 'alpha' && (
                      <div className="flex items-center gap-3 mb-5">
                        <span className="text-2xl font-bold text-blue-500 w-8 text-center">
                          {group.letter}
                        </span>
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-xs text-slate-300">{group.items.length}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.items.map((claw) => (
                        <ClawCard key={claw.slug} claw={claw} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </main>

          {/* 右侧 A-Z 字母导航条（仅字母排序模式） */}
          {sortMode === 'alpha' && (
            <aside className="hidden md:block w-8 flex-shrink-0">
              <nav className="sticky top-8 flex flex-col items-center gap-0.5">
                {allLetters.map((letter) => {
                  const isAvailable = availableLetters.includes(letter);
                  const isActive = activeLetter === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => isAvailable && scrollToLetter(letter)}
                      disabled={!isAvailable}
                      className={`
                        w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold
                        transition-all duration-200 select-none
                        ${isAvailable
                          ? isActive
                            ? 'bg-blue-500 text-white scale-125 shadow-md shadow-blue-200'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:scale-150 cursor-pointer'
                          : 'text-slate-200 cursor-default'
                        }
                      `}
                    >
                      {letter}
                    </button>
                  );
                })}
              </nav>
            </aside>
          )}
        </div>
      </div>

      <footer className="text-center py-8 text-sm text-slate-400 border-t border-slate-100">
        Claw123 · 发现更多 AI 网关与工具 ·{' '}
        <a
          href="https://github.com/sliverp/claw123/pulls"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          提交新项目
        </a>
      </footer>
    </div>
  );
}
