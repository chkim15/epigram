import { NextRequest, NextResponse } from 'next/server';
import { getLibraryViewer } from '@/lib/library/server';
import { getJobsFeed } from '@/lib/jobs/server';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  try {
    const viewer = await getLibraryViewer(request);
    if (!viewer) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401, headers: NO_STORE });
    }
    const feed = await getJobsFeed();
    if (!viewer.isPro) {
      // Free users see the size of the board, not the openings.
      return NextResponse.json(
        { error: 'Subscription required', total: feed.jobs.length, firms: feed.firms.filter((f) => f.ok).length },
        { status: 403, headers: NO_STORE }
      );
    }
    return NextResponse.json(feed, { headers: NO_STORE });
  } catch (error) {
    console.error('Jobs route error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500, headers: NO_STORE });
  }
}
