import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, clientId, reason, description } = body

    if (!paymentId || !clientId || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Create dispute
    const { data: dispute, error } = await supabaseAdmin
      .from('payment_disputes')
      .insert({
        payment_id: paymentId,
        client_id: clientId,
        reason,
        description,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Update payment with dispute status
    await supabaseAdmin
      .from('payments')
      .update({
        dispute_status: 'disputed',
        dispute_reason: reason,
      })
      .eq('id', paymentId)

    // Create notification
    await supabaseAdmin.from('notifications').insert({
      client_id: clientId,
      type: 'payment',
      title: 'Dispute Opened',
      message: 'Your payment dispute has been opened. Our team will review it shortly.',
      data: { dispute_id: dispute.id, payment_id: paymentId },
    })

    return NextResponse.json({ success: true, dispute })
  } catch (error) {
    console.error('Dispute API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}