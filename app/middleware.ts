import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Simple check: if user has a session cookie
const hasSession = req.cookies.has('sb-fqeyrtjlfnsxgwczcrvx-auth-token')
  
  // Protect /portal routes except login
  if (req.nextUrl.pathname.startsWith('/portal') && !req.nextUrl.pathname.startsWith('/portal/login')) {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/portal/login', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*']
}