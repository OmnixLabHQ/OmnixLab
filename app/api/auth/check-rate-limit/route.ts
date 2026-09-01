import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { email, ipAddress } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
    }

    const result = await checkRateLimit(email, ipAddress || 'unknown')
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ allowed: true, attempts: 0 })
  }
}
