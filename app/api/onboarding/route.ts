import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, fullName } = body

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing email or name' },
        { status: 400 }
      )
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Omnix Lab! 🚀</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">Hi ${fullName},</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Thank you for registering with Omnix Lab — your global software development partner.
          </p>
          <p style="font-size: 16px; color: #374151;">
            Your account is currently <strong>pending approval</strong>. You will receive another email once your account has been approved.
          </p>
          <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4F46E5; margin: 0 0 10px;">What happens next?</h3>
            <ol style="color: #374151; line-height: 1.8;">
              <li>Our team reviews your registration</li>
              <li>You receive an approval email</li>
              <li>You can then access your portal dashboard</li>
            </ol>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            Questions? Reply to this email or reach us on WhatsApp at +234 703 370 2874.
          </p>
          <p style="font-size: 16px; color: #374151; margin-top: 20px;">
            Best regards,<br/>
            <strong>Akomolafe Nathaniel</strong><br/>
            Founder & CEO, Omnix Lab
          </p>
        </div>
      </div>
    `

    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to Omnix Lab — Registration Received!',
      html: emailHtml,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding email error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}