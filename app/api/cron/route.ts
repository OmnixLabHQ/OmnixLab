import { NextResponse } from 'next/server'
import { postToAllPlatforms } from '@/lib/scheduler'

export async function GET() {
  try {
    const result = await postToAllPlatforms()
    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}