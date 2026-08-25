import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    return res
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

    // Check if user is admin
    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  // Protect /portal routes (except public auth pages)
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