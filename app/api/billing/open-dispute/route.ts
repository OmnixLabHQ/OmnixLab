import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, clientId, reason, description } = body

    if (!paymentId || !clientId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify payment belongs to client
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('client_id', clientId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabaseAdmin
      .from('payment_disputes')
      .insert({
        payment_id: paymentId,
        client_id: clientId,
        reason: reason,
        description: description || null,
        status: 'open',
      })
      .select()
      .single()

    if (disputeError) {
      return NextResponse.json(
        { success: false, error: 'Failed to open dispute' },
        { status: 500 }
      )
    }

    // Update payment
    try {
      await supabaseAdmin
        .from('payments')
        .update({
          dispute_status: 'disputed',
          dispute_reason: reason,
        })
        .eq('id', paymentId)
    } catch (updateError) {
      console.error('Payment update error:', updateError)
    }

    // Create notification
    try {
      await supabaseAdmin.from('notifications').insert({
        client_id: clientId,
        type: 'payment',
        title: 'Dispute Opened',
        message: 'Your payment dispute has been opened. Our team will review it shortly.',
        data: { dispute_id: dispute.id, payment_id: paymentId },
      })
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    return NextResponse.json({ success: true, dispute })
  } catch (error) {
    console.error('Dispute API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
