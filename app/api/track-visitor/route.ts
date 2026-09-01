import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8550312488'

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  return realIp || null
}

async function getLocationFromIp(ip: string) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`)
    if (!res.ok) return null
    const data = await res.json()
    return data.status === 'success' ? data : null
  } catch {
    return null
  }
}

function parseUserAgent(ua: string) {
  const result: any = {
    device: { type: 'unknown', vendor: 'unknown', model: 'unknown' },
    browser: { name: 'unknown', version: 'unknown' },
    os: { name: 'unknown', version: 'unknown' },
  }

  // Browser detection
  if (/edg/i.test(ua)) {
    result.browser.name = 'Edge'
    result.browser.version = ua.match(/edg\/([0-9.]+)/i)?.[1] || 'unknown'
  } else if (/opr\//i.test(ua)) {
    result.browser.name = 'Opera'
    result.browser.version = ua.match(/opr\/([0-9.]+)/i)?.[1] || 'unknown'
  } else if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
    result.browser.name = 'Chrome'
    result.browser.version = ua.match(/chrome\/([0-9.]+)/i)?.[1] || 'unknown'
  } else if (/firefox/i.test(ua)) {
    result.browser.name = 'Firefox'
    result.browser.version = ua.match(/firefox\/([0-9.]+)/i)?.[1] || 'unknown'
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    result.browser.name = 'Safari'
    result.browser.version = ua.match(/version\/([0-9.]+)/i)?.[1] || 'unknown'
  }

  // OS detection
  if (/windows nt 10/i.test(ua)) result.os.name = 'Windows 10'
  else if (/windows nt 6.3/i.test(ua)) result.os.name = 'Windows 8.1'
  else if (/windows nt 6.1/i.test(ua)) result.os.name = 'Windows 7'
  else if (/android/i.test(ua)) {
    result.os.name = 'Android'
    result.os.version = ua.match(/android ([0-9.]+)/i)?.[1] || 'unknown'
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    result.os.name = 'iOS'
    result.os.version = ua.match(/os ([0-9_]+)/i)?.[1]?.replace(/_/g, '.') || 'unknown'
  } else if (/mac os x/i.test(ua)) result.os.name = 'macOS'
  else if (/linux/i.test(ua)) result.os.name = 'Linux'

  // Device detection
  if (/iphone/i.test(ua)) {
    result.device.type = 'mobile'
    result.device.vendor = 'Apple'
    result.device.model = 'iPhone'
  } else if (/ipad/i.test(ua)) {
    result.device.type = 'tablet'
    result.device.vendor = 'Apple'
    result.device.model = 'iPad'
  } else if (/android/i.test(ua)) {
    result.device.type = /mobile/i.test(ua) ? 'mobile' : 'tablet'
    result.device.vendor = /samsung/i.test(ua) ? 'Samsung' : /pixel/i.test(ua) ? 'Google' : 'Android'
    const modelMatch = ua.match(/\((.*?)\)/)
    if (modelMatch && modelMatch[1]) {
      const parts = modelMatch[1].split(';')
      if (parts.length >= 2) {
        result.device.model = parts[parts.length - 1].trim()
      }
    }
  } else if (/windows/i.test(ua)) {
    result.device.type = 'desktop'
    result.device.vendor = 'Microsoft'
    result.device.model = 'PC'
  } else if (/macintosh/i.test(ua)) {
    result.device.type = 'desktop'
    result.device.vendor = 'Apple'
    result.device.model = 'Mac'
  } else if (/linux/i.test(ua)) {
    result.device.type = 'desktop'
    result.device.vendor = 'Linux'
    result.device.model = 'PC'
  }

  return result
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { page, timestamp, referrer, userAgent, language, screen, platform, connection } = body

    const parsed = parseUserAgent(userAgent || '')
    const ip = getClientIp(request)
    const location = ip ? await getLocationFromIp(ip) : null

    const details = {
      page,
      timestamp,
      referrer,
      userAgent,
      language,
      screen,
      platform,
      connection,
      ip,
      device: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
      location: location || null,
    }

    await supabase.from('visitors').insert({
      page,
      timestamp,
      referrer,
      user_agent: userAgent,
      details,
    })

    const locationText = location
      ? `📍 ${location.city || ''}, ${location.regionName || ''}, ${location.country || ''} (${location.timezone || 'unknown timezone'})`
      : '📍 Location unavailable'
    const deviceText = `📱 ${parsed.device.vendor} ${parsed.device.model} (${parsed.device.type})`
    const browserText = `🌐 ${parsed.browser.name} ${parsed.browser.version}`
    const osText = `💻 ${parsed.os.name} ${parsed.os.version}`
    const networkText = `📶 ${connection || 'unknown connection'}`
    const screenText = `🖥️ ${screen || 'unknown screen'}`

    const telegramMsg = `👀 *New Visit!*\n\n📄 *Page:* ${page}\n${locationText}\n${deviceText}\n${browserText}\n${osText}\n${networkText}\n${screenText}\n🔗 *Source:* ${referrer || 'Direct'}\n🕐 *Time:* ${new Date(timestamp).toLocaleString()}`

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMsg,
        parse_mode: 'Markdown',
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Visitor tracking error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
