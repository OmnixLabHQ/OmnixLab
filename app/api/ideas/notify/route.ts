import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { ideaId, ideaTitle, clientName, email } = await request.json()

    if (!email || !ideaTitle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #4F46E5; padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Idea Submitted Successfully! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Your idea has been submitted to the Omnix Lab team.</p>
              <p><strong>Idea:</strong> ${ideaTitle}</p>
              <p><strong>Reference:</strong> IDEA-${String(ideaId).padStart(4, '0')}</p>
              <p>Our team will review your idea and update its status in your portal.</p>
              <a href="https://omnixlab-production.up.railway.app/portal/ideas/${ideaId}" class="button">View Your Idea</a>
              <p>Best regards,<br/><strong>Omnix Lab Team</strong></p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await sendEmail({
      to: email,
      subject: `Omnix Lab — Idea Submitted: ${ideaTitle}`,
      html,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Idea notification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}