import { NextResponse } from 'next/server'

export async function GET() {
  const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN

  if (!X_ACCESS_TOKEN) {
    return NextResponse.json({ success: false, error: 'X_ACCESS_TOKEN not set' })
  }

  const tweet = `🚀 Omnix Lab — Nigeria's Most Trusted Software Company

We build: Trading Bots • Web Apps • SaaS • AI Solutions

🌐 omnixlabsupport.com
#NigeriaTech #SoftwareDevelopment #OmnixLab`

  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${X_ACCESS_TOKEN}`
      },
      body: JSON.stringify({ text: tweet })
    })

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}