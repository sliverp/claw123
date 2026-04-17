'use client';

import { useParams } from 'next/navigation';
import { SkillWithStats } from '@/lib/types';
import ItemDetailPage from '@/components/ItemDetailPage';

export default function SkillDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <ItemDetailPage<SkillWithStats> slug={slug} apiBase="/api/skills" />;
}
