import { NextResponse } from 'next/server'
import { logLoginAttempt } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { email, ipAddress, success } = await request.json()
    await logLoginAttempt(email, ipAddress || 'unknown', 'browser', success)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false })
  }
}