import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Omnix Lab <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    
    if (error) {
      console.error('Email send failed:', error)
      return { success: false, error }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(email: string, fullName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #ffffff; }
          .quick-start { background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .quick-start h2 { color: #4F46E5; margin: 0 0 15px; font-size: 18px; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 20px 30px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Omnix Lab! 🚀</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Hi ${fullName},</p>
            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for choosing Omnix Lab — your global software development partner.
            </p>
            
            <div class="quick-start">
              <h2>Quick Start Guide</h2>
              <ol style="line-height: 1.8;">
                <li><strong>Access your portal:</strong> <a href="https://omnixlab-production.up.railway.app/portal/dashboard" style="color: #4F46E5;">Go to your dashboard</a></li>
                <li><strong>Complete your profile:</strong> Add your company details</li>
                <li><strong>Upload requirements:</strong> Share documents in the Files section</li>
                <li><strong>Book a consultation:</strong> <a href="https://calendly.com/helloafrica-omnixlabsupport/30min" style="color: #4F46E5;">Schedule a call</a></li>
              </ol>
            </div>
            
            <a href="https://omnixlab-production.up.railway.app/portal/dashboard" class="button">Access Your Portal</a>
            
            <p style="font-size: 16px;">
              If you have any questions, reply to this email or reach us on WhatsApp at +234 703 370 2874.
            </p>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Best regards,<br/>
              <strong>Akomolafe Nathaniel</strong><br/>
              Founder & CEO, Omnix Lab
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Omnix Lab. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to Omnix Lab — Let\'s Get Started!',
    html,
  })
}