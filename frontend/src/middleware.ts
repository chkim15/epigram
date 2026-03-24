import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options?: { [key: string]: unknown }) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options?: { [key: string]: unknown }) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the session
  const { data: { session } } = await supabase.auth.getSession()

  // Check if authenticated user needs to complete onboarding
  if (session) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .single()

    // If on onboarding page and already completed, redirect to problems
    if (request.nextUrl.pathname === '/auth/onboarding' && profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/problems', request.url))
    }

    // If authenticated user hasn't completed onboarding and trying to access protected features
    if (!profile || !profile.onboarding_completed) {
      // Allow onboarding page itself
      if (request.nextUrl.pathname === '/auth/onboarding') {
        return response
      }

      // Redirect to onboarding for protected routes
      if (request.nextUrl.pathname === '/problems' ||
          request.nextUrl.pathname === '/practice' ||
          request.nextUrl.pathname === '/bookmarks' ||
          request.nextUrl.pathname === '/home' ||
          request.nextUrl.pathname.startsWith('/api/chat')) {
        return NextResponse.redirect(new URL('/auth/onboarding', request.url))
      }
    }
  }

  // Allow unauthenticated users to access pages
  // They will have limited functionality but can browse

  return response
}

export const config = {
  matcher: [
    '/home',
    '/problems',
    '/practice',
    '/bookmarks',
    '/auth/onboarding',
    '/api/chat',
  ]
}
