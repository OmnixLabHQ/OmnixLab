import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseSecretKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function POST(request: Request) {
  try {
    const { clientId, email, role, createdBy } = await request.json()

    if (!clientId || !email || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Generate token
    const token = randomBytes(32).toString('hex')

    // Create invitation
    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .insert({
        client_id: clientId,
        email,
        role,
        token,
        status: 'pending',
        created_by: createdBy,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Send invitation email
    const inviteUrl = `https://omnixlabsupport.com/portal/accept-invitation?token=${token}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">You're Invited to Omnix Lab</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="color: #374151;">You've been invited to join Omnix Lab as a <strong>${role}</strong>.</p>
          <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">
            Accept Invitation
          </a>
          <p style="color: #6B7280; font-size: 14px;">This invitation expires in 7 days.</p>
        </div>
      </div>
    `

    await sendEmail({
      to: email,
      subject: 'Invitation to Join Omnix Lab',
      html,
    })

    return NextResponse.json({ success: true, invitation })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}