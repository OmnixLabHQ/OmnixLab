import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const TO_EMAIL = process.env.TO_EMAIL || 'Akomolafenathaniel123@gmail.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { page, timestamp, referrer, userAgent } = body

    // Only send email for first visit or important pages
    // This prevents spam from every page view
    const importantPages = ['/contact', '/services', '/']
    const isImportantPage = importantPages.includes(page)

    if (isImportantPage) {
      await resend.emails.send({
        from: `Omnix Lab Tracker <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        subject: `👀 New visitor on ${page} - Omnix Lab`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #4F46E5; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">🔔 Omnix Lab - New Visitor</h2>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #374151;">📄 Page Visited:</td>
                  <td style="padding: 10px; color: #4F46E5; font-weight: bold;">${page}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #374151;">🕐 Time:</td>
                  <td style="padding: 10px; color: #6b7280;">${new Date(timestamp).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #374151;">🔗 Source:</td>
                  <td style="padding: 10px; color: #6b7280;">${referrer || 'Direct Visit'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #374151;">🌐 Browser:</td>
                  <td style="padding: 10px; color: #6b7280;">${userAgent || 'Unknown'}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding: 15px; background: #EEF2FF; border-radius: 8px;">
                <p style="margin: 0; color: #4338CA; font-size: 14px;">
                  💡 <strong>Tip:</strong> Follow up with this lead! They're interested in your services.
                </p>
              </div>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to track' }, { status: 500 })
  }
}