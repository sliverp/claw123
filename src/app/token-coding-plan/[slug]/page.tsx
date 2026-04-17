'use client';

import { useParams } from 'next/navigation';
import { TokenCodingPlanWithStats } from '@/lib/types';
import ItemDetailPage from '@/components/ItemDetailPage';

export default function TokenCodingPlanDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <ItemDetailPage<TokenCodingPlanWithStats> slug={slug} apiBase="/api/token-coding-plans" />;
}
