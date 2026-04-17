'use client';

import { useParams } from 'next/navigation';
import { FrameworkWithStats } from '@/lib/types';
import ItemDetailPage from '@/components/ItemDetailPage';

export default function FrameworkDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <ItemDetailPage<FrameworkWithStats> slug={slug} apiBase="/api/frameworks" />;
}
