import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const TO_EMAIL = process.env.TO_EMAIL || 'Akomolafenathaniel123@gmail.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

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

    // 1. Send notification to YOU (the owner)
    await resend.emails.send({
      from: `Omnix Lab Leads <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      subject: `🚀 New Project Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 25px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">🚀 New Project Inquiry!</h2>
            <p style="color: #C7D2FE; margin: 5px 0 0;">Someone wants to work with you</p>
          </div>
          <div style="background: #ffffff; padding: 25px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; background: #F9FAFB; font-weight: bold; color: #374151; border-radius: 6px;">👤 Name</td>
                <td style="padding: 12px; color: #111827; font-size: 16px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #F9FAFB; font-weight: bold; color: #374151; border-radius: 6px;">📧 Email</td>
                <td style="padding: 12px; color: #4F46E5; font-size: 16px;">
                  <a href="mailto:${email}" style="color: #4F46E5;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #F9FAFB; font-weight: bold; color: #374151; border-radius: 6px;">🔧 Service</td>
                <td style="padding: 12px; color: #111827; font-size: 16px;">${service || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #F9FAFB; font-weight: bold; color: #374151; border-radius: 6px;">💬 Message</td>
                <td style="padding: 12px; color: #374151; font-size: 14px; line-height: 1.6;">${message}</td>
              </tr>
            </table>
            
            <div style="margin-top: 25px; padding: 20px; background: #EEF2FF; border-radius: 10px; border-left: 4px solid #4F46E5;">
              <p style="margin: 0 0 8px; color: #4338CA; font-weight: bold;">⚡ Quick Actions:</p>
              <a href="mailto:${email}?subject=Re: Project Inquiry - Omnix Lab" style="display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; margin-right: 10px; margin-bottom: 8px;">Reply via Email</a>
              <a href="https://wa.me/2347033702874?text=Hi%20${encodeURIComponent(name)},%20I%20received%20your%20inquiry%20about%20${encodeURIComponent(service || 'your project')}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 8px;">Message on WhatsApp</a>
            </div>
            
            <p style="margin-top: 20px; color: #9CA3AF; font-size: 12px; text-align: center;">
              📩 Sent via Omnix Lab Contact System • ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    })

    // 2. Send confirmation to the CLIENT
    await resend.emails.send({
      from: `Omnix Lab <${FROM_EMAIL}>`,
      to: email,
      subject: '✅ We received your inquiry - Omnix Lab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #111827; padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Omnix<span style="color: #9CA3AF;">Lab</span></h1>
          </div>
          <div style="background: #ffffff; padding: 25px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827;">Hi ${name},</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for reaching out to Omnix Lab! We've received your inquiry regarding 
              <strong>${service || 'your project'}</strong>.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Our team will review your message and get back to you within <strong>24 hours</strong>.
            </p>
            
            <div style="margin: 25px 0; padding: 20px; background: #F9FAFB; border-radius: 10px;">
              <p style="margin: 0; color: #6B7280; font-size: 14px;"><strong>Your message:</strong></p>
              <p style="margin: 8px 0 0; color: #374151; font-style: italic;">"${message}"</p>
            </div>
            
            <p style="color: #374151; font-size: 16px;">
              In the meantime, feel free to reach us directly:
            </p>
            <p style="color: #374151;">
              📧 Akomolafenathaniel123@gmail.com<br/>
              💬 +234 703 370 2874 (WhatsApp)
            </p>
            
            <p style="margin-top: 25px; color: #6B7280; font-size: 14px;">
              Best regards,<br/>
              <strong>Akomolafe Nathaniel</strong><br/>
              Founder, Omnix Lab
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully! Check your email for confirmation.' 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send message. Please try again or email us directly.' 
    }, { status: 500 })
  }
}