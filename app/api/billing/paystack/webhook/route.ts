import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''

function verifySignature(signature: string, payload: string): boolean {
  try {
    const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex')
    return hash === signature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-paystack-signature') || ''
    const payload = await request.text()

    // Verify webhook signature
    if (!verifySignature(signature, payload)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload)

    // Check idempotency
    const eventId = String(event.id || event.data?.reference || Date.now())
    const { data: existingEvent } = await supabaseAdmin
      .from('payment_provider_events')
      .select('id')
      .eq('event_id', eventId)
      .single()

    if (existingEvent) {
      return NextResponse.json({ success: true, duplicate: true })
    }

    // Store raw event
    await supabaseAdmin.from('payment_provider_events').insert({
      provider: 'paystack',
      event_id: eventId,
      event_type: event.event || 'unknown',
      raw_payload: event,
      processed: false,
    })

    // Process payment
    const reference = event.data?.reference
    const status = event.data?.status
    const amount = event.data?.amount || 0
    const currency = event.data?.currency || 'USD'

    if (reference && status === 'success') {
      // Find payment by reference
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('provider_reference', reference)
        .single()

      if (payment) {
        // Update payment
        const now = new Date().toISOString()
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'success',
            paid_at: now,
          })
          .eq('id', payment.id)

        // Update invoice
        await supabaseAdmin
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: now,
            paystack_reference: reference,
            payment_gateway: 'paystack',
            updated_at: now,
          })
          .eq('id', payment.invoice_id)

        // Create receipt
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('client_id, total, amount, currency')
          .eq('id', payment.invoice_id)
          .single()

        if (invoice) {
          const receiptNumber = `RCT-${Date.now()}`
          await supabaseAdmin.from('receipts').insert({
            invoice_id: payment.invoice_id,
            payment_id: payment.id,
            client_id: invoice.client_id,
            receipt_number: receiptNumber,
            amount: invoice.total || invoice.amount,
            currency: invoice.currency || currency,
          })

          // Create notification
          await supabaseAdmin.from('notifications').insert({
            client_id: invoice.client_id,
            type: 'invoice',
            title: 'Payment Received',
            message: `Your invoice payment of ${invoice.total || invoice.amount} ${invoice.currency || currency} has been confirmed.`,
            data: { invoice_id: payment.invoice_id },
          })
        }

        // Log audit
        await supabaseAdmin.from('financial_audit_logs').insert({
          invoice_id: payment.invoice_id,
          payment_id: payment.id,
          action: 'payment_confirmed_via_webhook',
          after_data: { reference },
        })

        // Create transaction record
        await supabaseAdmin.from('payment_transactions').insert({
          payment_id: payment.id,
          invoice_id: payment.invoice_id,
          provider: 'paystack',
          provider_reference: reference,
          amount: amount / 100,
          currency: currency,
          status: 'success',
          raw_response: event,
        })
      } else {
        // Payment record not found - try to find by invoice reference
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('*')
          .eq('paystack_reference', reference)
          .single()

        if (invoice) {
          const now = new Date().toISOString()
          await supabaseAdmin
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: now,
              updated_at: now,
            })
            .eq('id', invoice.id)

          // Create payment record
          const { data: newPayment } = await supabaseAdmin
            .from('payments')
            .insert({
              invoice_id: invoice.id,
              client_id: invoice.client_id,
              amount: amount / 100,
              currency: currency,
              status: 'success',
              payment_method: 'paystack',
              provider_reference: reference,
              internal_reference: `OMX-PAY-${Date.now()}`,
              paid_at: now,
            })
            .select()
            .single()

          if (newPayment) {
            const receiptNumber = `RCT-${Date.now()}`
            await supabaseAdmin.from('receipts').insert({
              invoice_id: invoice.id,
              payment_id: newPayment.id,
              client_id: invoice.client_id,
              receipt_number: receiptNumber,
              amount: invoice.total || invoice.amount,
              currency: invoice.currency || currency,
            })
          }

          // Notify client
          await supabaseAdmin.from('notifications').insert({
            client_id: invoice.client_id,
            type: 'invoice',
            title: 'Payment Received',
            message: `Your invoice payment has been confirmed.`,
            data: { invoice_id: invoice.id },
          })
        }
      }
    }

    // Mark event as processed
    await supabaseAdmin
      .from('payment_provider_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', eventId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook API error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}