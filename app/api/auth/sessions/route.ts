import { NextResponse } from 'next/server'
import { getActiveSessions, revokeSession, revokeAllOtherSessions } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
  const sessions = await getActiveSessions(userId)
  return NextResponse.json({ success: true, sessions })
}

export async function DELETE(request: Request) {
  const { sessionId, userId, revokeAll, currentSessionId } = await request.json()
  
  if (revokeAll && currentSessionId) {
    await revokeAllOtherSessions(userId, currentSessionId)
  } else if (sessionId && userId) {
    await revokeSession(sessionId, userId)
  }
  
  return NextResponse.json({ success: true })
}
