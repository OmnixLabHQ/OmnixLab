import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnixlab-production.up.railway.app'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, clientId } = body

    if (!paymentId || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch original payment
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

    // Check if retryable
    if (!['failed', 'abandoned', 'expired'].includes(payment.status)) {
      return NextResponse.json(
        { success: false, error: 'Payment cannot be retried' },
        { status: 400 }
      )
    }

    // Fetch client email
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single()

    if (clientError || !client?.email) {
      return NextResponse.json(
        { success: false, error: 'Client email not found' },
        { status: 404 }
      )
    }

    // Create new Paystack transaction
    const newReference = `OMX-RETRY-${paymentId}-${Date.now()}`
    const amountInKobo = Math.round((payment.amount || 0) * 100)

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: client.email,
        amount: amountInKobo,
        currency: payment.currency || 'USD',
        reference: newReference,
        callback_url: `${APP_URL}/portal/payments/callback`,
        metadata: {
          payment_id: paymentId,
          invoice_id: payment.invoice_id,
          client_id: clientId,
          is_retry: true,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json(
        { success: false, error: paystackData.message || 'Failed to initialize retry' },
        { status: 400 }
      )
    }

    // Update payment with retry info
    try {
      await supabaseAdmin
        .from('payments')
        .update({
          retry_count: (payment.retry_count || 0) + 1,
          last_retry_at: new Date().toISOString(),
          provider_reference: newReference,
          status: 'initiated',
        })
        .eq('id', paymentId)
    } catch (updateError) {
      console.error('Payment update error:', updateError)
    }

    // Create payment event
    try {
      await supabaseAdmin.from('payment_events').insert({
        payment_id: paymentId,
        event_type: 'PAYMENT_RETRIED',
        description: `Payment retry initiated (attempt ${(payment.retry_count || 0) + 1})`,
        metadata: { new_reference: newReference },
      })
    } catch (eventError) {
      console.error('Event log error:', eventError)
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: newReference,
    })
  } catch (error) {
    console.error('Retry API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}