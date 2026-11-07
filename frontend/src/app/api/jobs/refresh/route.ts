import { NextRequest, NextResponse } from 'next/server';
import { refreshOpeningsAndMatches } from '@/lib/jobs/refresh';
import { FIRM_TYPES, type FirmType } from '@/lib/jobs/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called once a day by Vercel Cron, which sends `Authorization: Bearer <CRON_SECRET>`. Two
// scheduled calls split the work: ?group=trading and ?group=banks (no group = all firms).
// In local development with the file store it can be called directly.
function authorized(request: NextRequest) {
  if (process.env.NODE_ENV === 'development' && process.env.JOBS_DEV_STORE === 'file') return true;
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const group = request.nextUrl.searchParams.get('group');
    const firmType: FirmType | undefined =
      group === 'trading' ? FIRM_TYPES[0] : group === 'banks' ? FIRM_TYPES[1] : undefined;
    return NextResponse.json(await refreshOpeningsAndMatches(firmType));
  } catch (error) {
    console.error('Jobs refresh failed:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
