import { NextResponse } from 'next/server'
import { trackDeviceSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { userId, userAgent, ipAddress, isCurrent } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    await trackDeviceSession(userId, userAgent || 'unknown', ipAddress || 'unknown', isCurrent || false)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
