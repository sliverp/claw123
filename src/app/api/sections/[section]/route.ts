import { NextResponse } from 'next/server';
import { initDatabase, query } from '@/lib/db';
import { SectionKey } from '@/lib/types';

const VALID_SECTIONS: SectionKey[] = ['skills', 'frameworks', 'benchmarks', 'token-coding-plans'];

function getSectionTableName(section: string): string {
  return section.replace(/-/g, '_');
}

export async function GET(
  _req: Request,
  { params }: { params: { section: string } }
) {
  const section = params.section as SectionKey;
  if (!VALID_SECTIONS.includes(section)) {
    return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
  }

  await initDatabase();
  const tableName = getSectionTableName(section);

  const rows = await query(
    `SELECT t.*, COALESCE(s.avg_rating, 0) as avg_rating, COALESCE(s.review_count, 0) as review_count, COALESCE(s.visit_count, 0) as visit_count
     FROM ${tableName} t
     LEFT JOIN ${tableName}_stats s ON t.id = s.item_id
     ORDER BY t.name ASC`
  );

  const items = rows.map((row: Record<string, unknown>) => ({
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags || [],
    avg_rating: Number(row.avg_rating),
    review_count: Number(row.review_count),
    visit_count: Number(row.visit_count),
  }));

  return NextResponse.json(items);
}
