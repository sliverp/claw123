'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionKey } from '@/lib/types';
import Banner from '@/components/Banner';
import SectionTabs from '@/components/SectionTabs';
import ClawSection from '@/components/ClawSection';
import GenericSection from '@/components/GenericSection';

type SortMode = 'alpha' | 'stars' | 'rating' | 'visits';

const VALID_SECTIONS: SectionKey[] = ['claws', 'skills', 'frameworks', 'benchmarks', 'token-coding-plans'];
const VALID_SORTS: SortMode[] = ['alpha', 'stars', 'rating', 'visits'];

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSection = VALID_SECTIONS.includes(searchParams.get('section') as SectionKey)
    ? (searchParams.get('section') as SectionKey)
    : 'claws';
  const sortMode = VALID_SORTS.includes(searchParams.get('sort') as SortMode)
    ? (searchParams.get('sort') as SortMode)
    : 'alpha';

  const updateViewState = (section: SectionKey, sort: SortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    params.set('sort', sort);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleSectionChange = (section: SectionKey) => {
    updateViewState(section, sortMode);
  };

  const handleSortChange = (sort: SortMode) => {
    updateViewState(activeSection, sort);
  };

  return (
    <div className="min-h-screen">
      <Banner />
      <SectionTabs active={activeSection} onChange={handleSectionChange} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeSection === 'claws' ? (
          <ClawSection sortMode={sortMode} onSortChange={handleSortChange} />
        ) : (
          <GenericSection sectionKey={activeSection} sortMode={sortMode} onSortChange={handleSortChange} />
        )}
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

function HomePageFallback() {
  return (
    <div className="min-h-screen">
      <Banner />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 text-center text-slate-400">
        加载中...
      </div>
    </div>
  );
}
