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

    console.log('Paystack init - invoiceId:', invoiceId, 'type:', typeof invoiceId)

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 })
    }

    // Fetch invoice - invoice id is a NUMBER in database
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', Number(invoiceId))
      .single()

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError)
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    console.log('Found invoice:', invoice.invoice_number, 'Amount:', invoice.amount)

    // Use amount field (total is 0 in DB)
    let totalAmount = invoice.total || invoice.amount || 0
    if (totalAmount === 0 && invoice.amount > 0) {
      totalAmount = invoice.amount
    }

    const currency = invoice.currency || 'USD'

    // Fetch client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', invoice.client_id)
      .single()

    if (clientError || !client?.email) {
      console.error('Client email missing:', clientError)
      return NextResponse.json({ success: false, error: 'Client email not found' }, { status: 400 })
    }

    const amountInKobo = Math.round(totalAmount * 100)
    const reference = `OMX-${invoice.invoice_number || Date.now()}-${Date.now()}`

    console.log('Paystack request:', { email: client.email, amount: amountInKobo, currency })

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: client.email,
        amount: amountInKobo,
        currency,
        reference,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_id: invoice.client_id,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json({ 
        success: false, 
        error: paystackData.message || 'Paystack failed' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })

  } catch (error) {
    console.error('Paystack error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}