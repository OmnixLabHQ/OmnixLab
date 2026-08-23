import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { text } = await request.json()
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8550312488'

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}