import { NextRequest, NextResponse } from 'next/server';
import { getLibraryItem, getLibraryViewer, isLibrarySection, logLibraryAccess } from '@/lib/library/server';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; slug: string }> }
) {
  const { section, slug } = await params;
  if (!isLibrarySection(section)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  }
  try {
    const viewer = await getLibraryViewer(request);
    if (!viewer) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401, headers: NO_STORE });
    }

    const item = await getLibraryItem(section, slug);
    if (!item || item.status !== 'published' || !item.html) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
    }
    if (!viewer.isPro && !item.is_free_sample) {
      return NextResponse.json({ error: 'Subscription required', title: item.title }, { status: 403, headers: NO_STORE });
    }

    await logLibraryAccess(viewer, section, slug);
    return NextResponse.json({ title: item.title, html: item.html, labs: item.labs ?? [], email: viewer.email }, { headers: NO_STORE });
  } catch (error) {
    console.error('Library content error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500, headers: NO_STORE });
  }
}
