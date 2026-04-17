'use client';

import { useParams } from 'next/navigation';
import { BenchmarkWithStats } from '@/lib/types';
import ItemDetailPage from '@/components/ItemDetailPage';

export default function BenchmarkDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <ItemDetailPage<BenchmarkWithStats> slug={slug} apiBase="/api/benchmarks" />;
}
