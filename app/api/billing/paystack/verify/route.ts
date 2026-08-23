import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(request: Request) {
  try {
    const { reference } = await request.json()
    if (!reference) {
      return NextResponse.json({ success: false, error: 'Missing reference' }, { status: 400 })
    }

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json({ success: false, error: paystackData.message || 'Verification failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      status: paystackData.data.status,
      amount: paystackData.data.amount / 100,
      currency: paystackData.data.currency,
      providerReference: paystackData.data.reference,
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}