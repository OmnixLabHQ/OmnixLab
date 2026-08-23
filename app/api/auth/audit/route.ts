import { NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
  const logs = await getAuditLogs(userId)
  return NextResponse.json({ success: true, logs })
}