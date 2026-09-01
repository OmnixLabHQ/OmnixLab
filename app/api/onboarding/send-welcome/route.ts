import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Missing clientId' }, { status: 400 })
    }

    // Fetch client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
    }

    // Send welcome email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Omnix Lab! 🎉</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">Hi ${client.full_name},</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Great news! Your Omnix Lab account has been approved.
          </p>
          <p style="font-size: 16px; color: #374151;">
            You can now access your client portal and start managing your projects.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://omnixlabssupport.com/portal/dashboard" 
               style="display: inline-block; padding: 14px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Access Your Portal
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            Questions? Reply to this email or reach us on WhatsApp at +234 703 370 2874.
          </p>
        </div>
      </div>
    `

    const emailResult = await sendEmail({
      to: client.email,
      subject: 'Welcome to Omnix Lab — Your Account Is Approved!',
      html: emailHtml,
    })

    // Update client
    await supabaseAdmin
      .from('clients')
      .update({
        welcome_email_sent: true,
        onboarding_completed: true,
      })
      .eq('id', clientId)

    return NextResponse.json({ success: true, emailResult })
  } catch (error) {
    console.error('Send welcome API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
