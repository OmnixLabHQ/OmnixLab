import { NextResponse } from 'next/server'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export async function GET() {
  const X_API_KEY = process.env.X_API_KEY || ''
  const X_API_SECRET = process.env.X_API_SECRET || ''
  const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || ''
  const X_ACCESS_SECRET = process.env.X_ACCESS_SECRET || ''

  const oauth = new OAuth({
    consumer: { key: X_API_KEY, secret: X_API_SECRET },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64')
    },
  })

  const tweet = `🚀 Omnix Lab — Nigeria's Most Trusted Software Company\n\nWe build: Trading Bots • Web Apps • SaaS • AI Solutions\n\n🌐 omnixlab-production.up.railway.app\n#NigeriaTech #SoftwareDevelopment #OmnixLab`

  const requestData = {
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST',
  }

  const token = { key: X_ACCESS_TOKEN, secret: X_ACCESS_SECRET }
  const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

  try {
    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweet }),
    })

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}
