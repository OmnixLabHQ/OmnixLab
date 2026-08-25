import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZXlydGpsZm5zeGd3Y3pjcnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDYxMDAsImV4cCI6MjEwMTY4MjEwMH0.ylDt8pkzovy8ARlzQaAk22N7jKzD61xYXB3F-iQ_nTc'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        res.cookies.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/portal/login', req.url))
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  // Protect /portal routes
  const publicPortalPaths = [
    '/portal',
    '/portal/login',
    '/portal/register',
    '/portal/forgot-password',
    '/portal/reset-password',
    '/portal/verify-email',
    '/portal/accept-invitation',
  ]

  if (
    req.nextUrl.pathname.startsWith('/portal') &&
    !publicPortalPaths.includes(req.nextUrl.pathname)
  ) {
    if (!user) {
      return NextResponse.redirect(new URL('/portal/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
}