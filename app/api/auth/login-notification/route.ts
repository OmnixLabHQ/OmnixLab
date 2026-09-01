import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email, userId, userAgent } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 })
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">New Login Detected</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="color: #374151;">Hello,</p>
          <p style="color: #374151;">A new login was detected on your Omnix Lab account.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #374151;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Device:</strong> ${userAgent || 'Unknown device'}</p>
          </div>
          <p style="color: #374151;">If this was you, no action is needed.</p>
          <p style="color: #DC2626;">If this wasn't you, please secure your account immediately.</p>
          <a href="https://omnixlabssupport.com/portal/settings/security" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">
            Review Security
          </a>
        </div>
      </div>
    `

    await sendEmail({
      to: email,
      subject: 'New Login Detected — Omnix Lab',
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login notification error:', error)
    return NextResponse.json({ success: false })
  }
}
