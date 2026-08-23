import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, clientId, amount, reason } = body

    if (!paymentId || !clientId || !amount || !reason) {
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

    // Check if payment is refundable
    if (!['success', 'partially_refunded'].includes(payment.status)) {
      return NextResponse.json(
        { success: false, error: 'Payment is not eligible for refund' },
        { status: 400 }
      )
    }

    // Create refund record
    const { data: refund, error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert({
        payment_id: paymentId,
        invoice_id: payment.invoice_id,
        client_id: clientId,
        amount: amount,
        reason: reason,
        status: 'requested',
      })
      .select()
      .single()

    if (refundError) {
      console.error('Refund insert error:', refundError)
      return NextResponse.json(
        { success: false, error: 'Failed to create refund request' },
        { status: 500 }
      )
    }

    // Create notification
    try {
      await supabaseAdmin.from('notifications').insert({
        client_id: clientId,
        type: 'payment',
        title: 'Refund Requested',
        message: `Your refund request for ${amount} ${payment.currency} has been submitted and is under review.`,
        data: { refund_id: refund.id, payment_id: paymentId },
      })
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    // Log audit
    try {
      await supabaseAdmin.from('financial_audit_logs').insert({
        invoice_id: payment.invoice_id,
        payment_id: paymentId,
        actor_id: clientId,
        action: 'refund_requested',
        after_data: { amount, reason },
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json({ success: true, refund })
  } catch (error) {
    console.error('Refund API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}