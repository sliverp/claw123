'use client';

import { useParams } from 'next/navigation';
import { ClawWithStats } from '@/lib/types';
import ItemDetailPage from '@/components/ItemDetailPage';

export default function ClawDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <ItemDetailPage<ClawWithStats> slug={slug} apiBase="/api/claws" />;
}
