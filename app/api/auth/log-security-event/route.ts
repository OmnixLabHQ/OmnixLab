import { NextResponse } from 'next/server'
import { logSecurityEvent } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { userId, eventType, metadata } = await request.json()
    await logSecurityEvent(userId, eventType, metadata || {})
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false })
  }
}