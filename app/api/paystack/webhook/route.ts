import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(request: Request) {
  try {
    console.log('=== PAYSTACK WEBHOOK RECEIVED ===')

    // Get the raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    console.log('Signature header:', signature)

    // If we have a webhook secret set, verify the signature
    // For now, we'll accept the webhook but log a warning
    if (!signature) {
      console.warn('No Paystack signature header received')
    }

    // Parse the body
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid webhook payload' 
      }, { status: 400 })
    }

    console.log('Webhook event:', payload.event)
    console.log('Webhook data:', JSON.stringify(payload.data))

    // Handle different event types
    const event = payload.event
    const data = payload.data

    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(data)
        break
      case 'charge.failed':
        await handleChargeFailed(data)
        break
      case 'transfer.success':
        console.log('Transfer success event')
        break
      case 'transfer.failed':
        console.log('Transfer failed event')
        break
      default:
        console.log('Unhandled event type:', event)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed' 
    })

  } catch (error) {
    console.error('=== PAYSTACK WEBHOOK ERROR ===', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing error' 
    }, { status: 500 })
  }
}

async function handleChargeSuccess(data: any) {
  try {
    const reference = data.reference
    const amount = data.amount / 100 // Convert from kobo/cents to main currency
    const currency = data.currency || 'USD'
    const paystackStatus = data.status

    console.log('=== CHARGE SUCCESS ===')
    console.log('Reference:', reference)
    console.log('Amount:', amount, currency)
    console.log('Status:', paystackStatus)

    if (paystackStatus !== 'success') {
      console.log('Charge not successful, skipping')
      return
    }

    // Find payment by provider reference
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_reference', reference)
      .single()

    if (paymentError || !payment) {
      console.error('Payment record not found for reference:', reference)
      return
    }

    console.log('Found payment record:', payment.id)

    // Check idempotency - don't process if already successful
    if (payment.status === 'success' || payment.status === 'successful') {
      console.log('Payment already processed (idempotent), skipping')
      return
    }

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
        gateway_response: JSON.stringify(data),
      })
      .eq('id', payment.id)

    console.log('Payment updated to success')

    // Update invoice
    if (payment.invoice_id) {
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', payment.invoice_id)
        .single()

      if (invoice) {
        const newAmountPaid = (invoice.amount_paid || 0) + amount
        const invoiceTotal = invoice.amount || invoice.total || 0
        const newPaymentStatus = newAmountPaid >= invoiceTotal ? 'paid' : 'partial'
        const newStatus = newPaymentStatus === 'paid' ? 'paid' : invoice.status

        await supabaseAdmin
          .from('invoices')
          .update({
            amount_paid: newAmountPaid,
            payment_status: newPaymentStatus,
            status: newStatus,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id)

        console.log('Invoice updated:', invoice.invoice_number, '->', newPaymentStatus)
      }
    }

    // Create payment event
    await supabaseAdmin.from('payment_events').insert({
      payment_id: payment.id,
      event_type: 'payment_success',
      description: 'Payment confirmed via Paystack webhook',
      metadata: {
        reference: reference,
        provider: 'Paystack',
        event: 'charge.success',
      },
      created_at: new Date().toISOString(),
    })

    // Generate receipt if not exists
    const { data: existingReceipt } = await supabaseAdmin
      .from('receipts')
      .select('id')
      .eq('payment_id', payment.id)
      .single()

    if (!existingReceipt) {
      const receiptNumber = `RCPT-${Date.now()}`
      await supabaseAdmin.from('receipts').insert({
        invoice_id: payment.invoice_id,
        payment_id: payment.id,
        client_id: payment.client_id,
        receipt_number: receiptNumber,
        amount: amount,
        currency: currency,
        created_at: new Date().toISOString(),
      })
      console.log('Receipt generated:', receiptNumber)
    }

    // Create notification for client
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: payment.client_id,
        type: 'payment_received',
        title: 'Payment Successful',
        message: `Your payment of ${amount} ${currency} has been received successfully.`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })
      console.log('Client notification created')
    } catch (notifError) {
      console.log('Notification error (non-fatal):', notifError)
    }

    // Create audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: payment.client_id,
        action_type: 'payment_success',
        description: `Payment ${reference} confirmed via Paystack webhook`,
        entity_type: 'payment',
        entity_id: String(payment.id),
        result: 'success',
        created_at: new Date().toISOString(),
      })
      console.log('Audit log created')
    } catch (auditError) {
      console.log('Audit log error (non-fatal):', auditError)
    }

    console.log('=== CHARGE SUCCESS COMPLETE ===')

  } catch (error) {
    console.error('Handle charge.success error:', error)
  }
}

async function handleChargeFailed(data: any) {
  try {
    const reference = data.reference
    const failureMessage = data.gateway_response || 'Payment failed'

    console.log('=== CHARGE FAILED ===')
    console.log('Reference:', reference)
    console.log('Failure:', failureMessage)

    // Find payment
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_reference', reference)
      .single()

    if (payment) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          gateway_response: JSON.stringify(data),
        })
        .eq('id', payment.id)

      // Create payment event
      await supabaseAdmin.from('payment_events').insert({
        payment_id: payment.id,
        event_type: 'payment_failed',
        description: failureMessage,
        metadata: {
          reference: reference,
          provider: 'Paystack',
        },
        created_at: new Date().toISOString(),
      })

      console.log('Payment marked as failed')
    }
  } catch (error) {
    console.error('Handle charge.failed error:', error)
  }
}