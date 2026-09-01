import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId } = body

    console.log('=== PAYSTACK INITIALIZE ===')
    console.log('Received invoiceId:', invoiceId, 'Type:', typeof invoiceId)

    // Validate invoiceId
    if (!invoiceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice ID is required' 
      }, { status: 400 })
    }

    // Validate Paystack key
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json({ 
        success: false, 
        error: 'Paystack is not configured' 
      }, { status: 500 })
    }

    // Fetch invoice from database
    // invoice id is a BIGINT in database
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', Number(invoiceId))
      .single()

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice not found' 
      }, { status: 404 })
    }

    console.log('Invoice found:', invoice.invoice_number)
    console.log('Amount field:', invoice.amount)
    console.log('Total field:', invoice.total)
    console.log('Status:', invoice.status)
    console.log('Payment status:', invoice.payment_status)

    // Check if invoice is already paid
    if (invoice.payment_status === 'paid' || invoice.status === 'paid') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice is already paid' 
      }, { status: 400 })
    }

    // Determine amount to charge
    // Use amount field first (total is 0 in database)
    let totalAmount = invoice.amount || invoice.total || 0

    // If amount_paid exists, subtract it
    if (invoice.amount_paid && invoice.amount_paid > 0) {
      totalAmount = totalAmount - invoice.amount_paid
    }

    console.log('Amount to charge:', totalAmount)

    if (totalAmount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice has no outstanding balance' 
      }, { status: 400 })
    }

    const currency = invoice.currency || 'USD'

    // Fetch client email
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('email, full_name, company')
      .eq('id', invoice.client_id)
      .single()

    if (clientError || !client?.email) {
      console.error('Client email not found:', clientError)
      return NextResponse.json({ 
        success: false, 
        error: 'Client email not found. Please update the client profile with a valid email.' 
      }, { status: 400 })
    }

    console.log('Client email found:', client.email)

    const amountInKobo = Math.round(totalAmount * 100)
    const reference = `OMX-${invoice.invoice_number || invoice.id}-${Date.now()}`

    console.log('Paystack reference:', reference)
    console.log('Paystack amount (kobo):', amountInKobo)

    // Call Paystack API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: client.email,
        amount: amountInKobo,
        currency: currency,
        reference: reference,
        metadata: {
          invoice_id: String(invoice.id),
          invoice_number: invoice.invoice_number,
          client_id: invoice.client_id,
          client_name: client.full_name,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    console.log('Paystack response status:', paystackResponse.status)
    console.log('Paystack response:', JSON.stringify(paystackData))

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization failed:', paystackData.message)
      return NextResponse.json({ 
        success: false, 
        error: paystackData.message || 'Paystack initialization failed' 
      }, { status: 400 })
    }

    // Record payment in database
    try {
      const paymentRecord: any = {
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount: totalAmount,
        currency: currency,
        status: 'initiated',
        payment_method: 'Paystack',
        payment_channel: 'gateway',
        provider_reference: paystackData.data.reference,
        internal_reference: reference,
        created_at: new Date().toISOString(),
      }

      const { data: payment, error: insertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentRecord)
        .select()
        .single()

      if (insertError) {
        console.error('Payment insert error:', insertError.message)
      } else {
        console.log('Payment recorded with ID:', payment?.id)

        // Create payment event
        try {
          await supabaseAdmin.from('payment_events').insert({
            payment_id: payment.id,
            event_type: 'payment_initiated',
            description: 'Payment initiated via Paystack',
            metadata: {
              reference: reference,
              provider: 'Paystack',
            },
            created_at: new Date().toISOString(),
          })
          console.log('Payment event recorded')
        } catch (eventError) {
          console.log('Payment event error (non-fatal):', eventError)
        }
      }
    } catch (dbError) {
      console.error('Payment record error:', dbError)
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      access_code: paystackData.data.access_code,
    })

  } catch (error) {
    console.error('=== PAYSTACK INITIALIZE ERROR ===', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
