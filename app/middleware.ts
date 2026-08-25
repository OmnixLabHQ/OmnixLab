import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('sb-fqeyrtjlfnsxgwczcrvx-auth-token')

  // Protect /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/portal/login', req.url))
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
    if (!hasSession) {
      return NextResponse.redirect(new URL('/portal/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
}