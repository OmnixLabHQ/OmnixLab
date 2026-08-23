import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnixlab-production.up.railway.app'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, clientId, amount, currency } = body

    if (!invoiceId || !clientId || !amount || !currency) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'Paystack not configured' }, { status: 500 })
    }

    const { data: client } = await supabaseAdmin.from('clients').select('email').eq('id', clientId).single()
    if (!client?.email) {
      return NextResponse.json({ success: false, error: 'Client email not found' }, { status: 404 })
    }

    const reference = `OMX-${Date.now()}`
    const amountInKobo = Math.round(amount * 100)

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
        callback_url: `${APP_URL}/portal/payments/callback`,
        metadata: { invoice_id: invoiceId, client_id: clientId },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json({ success: false, error: paystackData.message || 'Failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error('Initialize error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}