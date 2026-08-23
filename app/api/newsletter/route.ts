import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')
const TELEGRAM_BOT = process.env.TELEGRAM_BOT_TOKEN || '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID || '8550312488'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
    }

    // Send Telegram notification
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: `📬 New Newsletter Subscriber\n📧 ${email}`,
      }),
    })

    // Send welcome email (optional)
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Omnix Lab <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to Omnix Lab Newsletter',
        html: `<p>Thanks for subscribing! We'll keep you updated with the latest news and insights.</p>`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}