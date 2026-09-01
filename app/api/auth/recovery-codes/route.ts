import { NextResponse } from 'next/server'
import { generateRecoveryCodes, storeRecoveryCodes, verifyRecoveryCode } from '@/lib/auth'

export async function POST(request: Request) {
  const { userId, action, code } = await request.json()

  if (action === 'generate') {
    const codes = generateRecoveryCodes(10)
    await storeRecoveryCodes(userId, codes)
    return NextResponse.json({ success: true, codes })
  }

  if (action === 'verify') {
    const isValid = await verifyRecoveryCode(userId, code)
    return NextResponse.json({ success: true, isValid })
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
}
