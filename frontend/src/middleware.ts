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

    // If on onboarding page and already completed, redirect to app
    if (request.nextUrl.pathname === '/auth/onboarding' && profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/app', request.url))
    }

    // If authenticated user hasn't completed onboarding and trying to access app or protected features
    if (!profile || !profile.onboarding_completed) {
      // Allow onboarding page itself
      if (request.nextUrl.pathname === '/auth/onboarding') {
        return response
      }
      
      // Redirect to onboarding for app and other protected routes
      if (request.nextUrl.pathname === '/app' || 
          request.nextUrl.pathname.startsWith('/api/chat') ||
          request.nextUrl.pathname.startsWith('/app/settings') ||
          request.nextUrl.pathname.startsWith('/app/practice')) {
        return NextResponse.redirect(new URL('/auth/onboarding', request.url))
      }
    }
  }
  
  // Allow unauthenticated users to access /app
  // They will have limited functionality but can browse

  return response
}

export const config = {
  matcher: [
    '/app',
    '/auth/onboarding',
    '/api/chat',
    '/app/settings',
    '/app/practice'
  ]
}