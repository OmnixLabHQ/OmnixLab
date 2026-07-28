import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TELEGRAM_BOT = '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
const TELEGRAM_CHAT = '8550312488'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, service, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // 1. Save to Supabase
    try {
      await supabase.from('contact_submissions').insert([{ name, email, service, message }])
    } catch (e) {
      console.log('DB save skipped')
    }

    // 2. Send Telegram notification
    const telegramMsg = `🚀 *New Project Inquiry!*\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n🔧 *Service:* ${service || 'Not specified'}\n💬 *Message:* ${message}\n\n📅 _${new Date().toLocaleString()}_`

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: telegramMsg,
        parse_mode: 'Markdown',
      }),
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully!' 
    })

  } catch (error) {
    console.error('Form error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send. Please try again.' 
    }, { status: 500 })
  }
}