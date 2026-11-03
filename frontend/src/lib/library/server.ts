import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export const LIBRARY_SECTIONS = ['notebooks', 'projects'] as const;
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number];

export interface LibraryLab {
  id: string;
  title: string;
  instructions: string;
  starter: string;
}

export interface LibraryItem {
  section: LibrarySection;
  slug: string;
  title: string;
  summary: string;
  status: 'published' | 'coming_soon';
  is_free_sample: boolean;
  sort_order: number;
  html: string | null;
  labs?: LibraryLab[];
}

export type LibrarySummary = Omit<LibraryItem, 'html' | 'labs'>;

export interface LibraryViewer {
  userId: string;
  email: string;
  isPro: boolean;
}

const LIST_COLUMNS = 'section, slug, title, summary, status, is_free_sample, sort_order';

// Local testing only: LIBRARY_DEV_ACCESS=guest|free|pro in .env.development.local reads the
// gitignored JSON and skips auth. It can never apply outside `next dev`.
function devAccess(): string | null {
  return process.env.NODE_ENV === 'development' ? process.env.LIBRARY_DEV_ACCESS ?? null : null;
}

function readDevItems(): LibraryItem[] {
  const file = path.join(process.cwd(), '.protected-content', 'library.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as LibraryItem[];
}

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isLibrarySection(value: string): value is LibrarySection {
  return (LIBRARY_SECTIONS as readonly string[]).includes(value);
}

export async function listLibraryItems(section: LibrarySection): Promise<LibrarySummary[]> {
  if (devAccess()) {
    return readDevItems()
      .filter((item) => item.section === section)
      .map((item): LibrarySummary => ({
        section: item.section,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        status: item.status,
        is_free_sample: item.is_free_sample,
        sort_order: item.sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await getAdmin()
    .from('library_content')
    .select(LIST_COLUMNS)
    .eq('section', section)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as LibrarySummary[];
}

export async function getLibraryItem(section: LibrarySection, slug: string): Promise<LibraryItem | null> {
  if (devAccess()) {
    return readDevItems().find((item) => item.section === section && item.slug === slug) ?? null;
  }
  const { data, error } = await getAdmin()
    .from('library_content')
    .select('*')
    .eq('section', section)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as LibraryItem | null;
}

// Mirrors the isPro rule in stores/subscriptionStore.ts, checked on the server.
export async function getLibraryViewer(request: NextRequest): Promise<LibraryViewer | null> {
  const dev = devAccess();
  if (dev) {
    return dev === 'guest' ? null : { userId: 'dev', email: 'dev@example.test', isPro: dev === 'pro' };
  }
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const admin = getAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;

  const [{ data: subscription }, { data: profile }] = await Promise.all([
    admin.from('user_subscriptions').select('status, plan_id').eq('user_id', user.id).maybeSingle(),
    admin.from('user_profiles').select('is_team').eq('user_id', user.id).maybeSingle(),
  ]);
  const isPaid =
    (subscription?.status === 'active' || subscription?.status === 'trialing') &&
    subscription?.plan_id !== 'free';

  return { userId: user.id, email: user.email ?? '', isPro: Boolean(profile?.is_team) || isPaid };
}

export async function logLibraryAccess(viewer: LibraryViewer, section: LibrarySection, slug: string) {
  if (devAccess()) return;
  const { error } = await getAdmin()
    .from('library_access_log')
    .insert({ user_id: viewer.userId, section, slug });
  if (error) console.error('Library access log error:', error.message);
}
