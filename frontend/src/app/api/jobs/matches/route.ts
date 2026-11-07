import { NextRequest, NextResponse } from 'next/server';
import { getLibraryViewer } from '@/lib/library/server';
import { matchesWithOpenings } from '@/lib/jobs/refresh';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  try {
    const viewer = await getLibraryViewer(request);
    if (!viewer) return NextResponse.json({ error: 'Sign in required' }, { status: 401, headers: NO_STORE });
    if (!viewer.isPro) return NextResponse.json({ error: 'Subscription required' }, { status: 403, headers: NO_STORE });
    return NextResponse.json(await matchesWithOpenings(viewer.userId), { headers: NO_STORE });
  } catch (error) {
    console.error('Job matches error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500, headers: NO_STORE });
  }
}
