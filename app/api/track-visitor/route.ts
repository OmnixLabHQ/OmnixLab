import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TELEGRAM_BOT = '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
const TELEGRAM_CHAT = '8550312488'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { page, timestamp, referrer, userAgent } = body

    // 1. Save to Supabase
    try {
      await supabase.from('visitors').insert([{ 
        page, 
        timestamp, 
        referrer, 
        user_agent: userAgent 
      }])
    } catch (e) {
      console.log('DB save skipped')
    }

    // 2. Send Telegram for important pages
    const importantPages = ['/contact', '/services', '/work', '/about']
    
    if (importantPages.includes(page)) {
      const pageNames: Record<string, string> = {
        '/contact': '📞 Contact Page',
        '/services': '🔧 Services Page',
        '/work': '💼 Portfolio Page',
        '/about': 'ℹ️ About Page',
      }

      const telegramMsg = `👀 *Page Visit Alert!*\n\n📄 ${pageNames[page] || page}\n🔗 *Source:* ${referrer || 'Direct Visit'}\n🕐 *Time:* ${new Date(timestamp).toLocaleString()}\n🌐 *Device:* ${userAgent?.substring(0, 80) || 'Unknown'}`

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT,
          text: telegramMsg,
          parse_mode: 'Markdown',
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tracker error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}