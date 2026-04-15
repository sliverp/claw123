'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ClawWithStats } from '@/lib/types';
import ClawCard from '@/components/ClawCard';
import Banner from '@/components/Banner';

const CATEGORY_LABELS: Record<string, string> = {
  gateway: 'AI 网关',
  proxy: '代理服务',
  aggregator: '聚合平台',
  tool: '工具',
  other: '其他',
};

const CATEGORY_ICONS: Record<string, string> = {
  gateway: '🚪',
  proxy: '🔄',
  aggregator: '🧩',
  tool: '🔧',
  other: '📦',
};

export default function HomePage() {
  const [claws, setClaws] = useState<ClawWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('');
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

  // 按分类分组，保持稳定顺序
  const grouped = useMemo(() => {
    const order = ['gateway', 'proxy', 'aggregator', 'tool', 'other'];
    const map: Record<string, ClawWithStats[]> = {};
    for (const claw of claws) {
      const cat = claw.category || 'other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(claw);
    }
    return order.filter((k) => map[k] && map[k].length > 0).map((k) => ({
      key: k,
      label: CATEGORY_LABELS[k] || k,
      items: map[k],
    }));
  }, [claws]);

  // 滚动监听 - 检测当前可见的分类区域
  const handleScroll = useCallback(() => {
    const offset = 120;
    let current = '';
    for (const group of grouped) {
      const el = sectionRefs.current[group.key];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset) {
          current = group.key;
        }
      }
    }
    if (current && current !== activeSection) {
      setActiveSection(current);
    }
  }, [grouped, activeSection]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 初始化第一个分类为活跃
  useEffect(() => {
    if (grouped.length > 0 && !activeSection) {
      setActiveSection(grouped[0].key);
    }
  }, [grouped, activeSection]);

  const scrollToSection = (key: string) => {
    const el = sectionRefs.current[key];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      <Banner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 左侧内容区 - 所有分类平铺展示 */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : grouped.length === 0 ? (
              <div className="text-center py-20 text-slate-400">暂无数据</div>
            ) : (
              <div className="space-y-12">
                {grouped.map((group) => (
                  <section
                    key={group.key}
                    ref={(el) => { sectionRefs.current[group.key] = el; }}
                    id={`section-${group.key}`}
                  >
                    {/* 分类标题 */}
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="text-xl">{CATEGORY_ICONS[group.key] || '📦'}</span>
                      <h2 className="text-lg font-semibold text-slate-800">{group.label}</h2>
                      <span className="text-sm text-slate-400">({group.items.length})</span>
                      <div className="flex-1 h-px bg-slate-100 ml-3" />
                    </div>

                    {/* 卡片网格 */}
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

          {/* 右侧竖向导航 - 随滚动高亮 */}
          <aside className="hidden md:block w-40 flex-shrink-0">
            <nav className="sticky top-8">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                导航
              </h3>
              <div className="flex flex-col gap-0.5">
                {grouped.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => scrollToSection(group.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                      activeSection === group.key
                        ? 'bg-blue-50 text-blue-700 font-medium border-r-[3px] border-blue-600'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-r-[3px] border-transparent'
                    }`}
                  >
                    <span className="text-base">{CATEGORY_ICONS[group.key] || '📦'}</span>
                    <span>{group.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      </div>

      <footer className="text-center py-8 text-sm text-slate-400 border-t border-slate-100">
        Claw123 · 发现更多 AI 网关与工具 ·{' '}
        <a
          href="https://github.com"
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
