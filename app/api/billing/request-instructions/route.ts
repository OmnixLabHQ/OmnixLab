import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, clientId, amount, currency, method, message } = body

    if (!invoiceId || !clientId || !amount || !currency || !method) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const reference = `PMR-${Date.now()}`

    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        invoice_id: invoiceId,
        client_id: clientId,
        payment_method: method,
        amount: amount,
        currency: currency,
        message: message || null,
        status: 'awaiting_instructions',
        reference: reference,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}