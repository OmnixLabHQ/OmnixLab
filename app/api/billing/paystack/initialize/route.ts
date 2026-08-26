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

    console.log('Paystack initialize called with invoiceId:', invoiceId)

    if (!invoiceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice ID is required' 
      }, { status: 400 })
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json({ 
        success: false, 
        error: 'Paystack is not configured' 
      }, { status: 500 })
    }

    // Fetch invoice from database
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice not found' 
      }, { status: 404 })
    }

    console.log('Invoice found:', invoice.invoice_number, 'Amount field:', invoice.amount, 'Total field:', invoice.total)

    // Determine the correct amount to charge
    // Use total if it's greater than 0, otherwise use amount
    let totalAmount = invoice.total || invoice.amount || 0
    
    // If total is 0 but amount is greater, use amount
    if (totalAmount === 0 && invoice.amount > 0) {
      totalAmount = invoice.amount
    }
    
    // If amount_paid exists, subtract it
    if (invoice.amount_paid > 0) {
      totalAmount = totalAmount - invoice.amount_paid
    }

    const currency = invoice.currency || 'USD'

    console.log('Final amount to charge:', totalAmount, currency)

    if (totalAmount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice has no outstanding balance' 
      }, { status: 400 })
    }

    // Fetch client email
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', invoice.client_id)
      .single()

    if (clientError || !client?.email) {
      console.error('Client email not found:', clientError)
      return NextResponse.json({ 
        success: false, 
        error: 'Client email not found. Please update the client profile.' 
      }, { status: 400 })
    }

    console.log('Client email found:', client.email)

    const amountInKobo = Math.round(totalAmount * 100)
    const reference = `OMX-${invoice.invoice_number || invoice.id}-${Date.now()}`

    console.log('Paystack request:', {
      email: client.email,
      amount: amountInKobo,
      currency: currency,
      reference: reference,
    })

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
          invoice_id: invoice.id,
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

    // Try to record payment, but don't fail if table doesn't have these fields
    try {
      const paymentRecord: any = {
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount: totalAmount,
        currency: currency,
        method: 'paystack',
        payment_method: 'paystack',
        status: 'initiated',
        provider_reference: paystackData.data.reference,
        internal_reference: reference,
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentRecord)

      if (insertError) {
        console.log('Payment record insert error (non-fatal):', insertError.message)
      } else {
        console.log('Payment record created successfully')
      }
    } catch (dbError) {
      console.log('Payment record error (non-fatal):', dbError)
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      access_code: paystackData.data.access_code,
    })

  } catch (error) {
    console.error('Paystack initialize error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}