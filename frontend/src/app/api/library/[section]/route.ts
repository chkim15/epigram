import { NextRequest, NextResponse } from 'next/server';
import { isLibrarySection, listLibraryItems } from '@/lib/library/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isLibrarySection(section)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    return NextResponse.json({ items: await listLibraryItems(section) });
  } catch (error) {
    console.error('Library list error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
