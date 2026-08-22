import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, clientId, amount, currency, method, message } = body

    if (!invoiceId || !clientId || !amount || !currency || !method) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
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
        reference,
      })
      .select()
      .single()

    if (error) {
      console.error('Payment request error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create payment request' },
        { status: 500 }
      )
    }

    // Log audit
    await supabaseAdmin.from('financial_audit_logs').insert({
      invoice_id: invoiceId,
      actor_id: clientId,
      action: 'payment_instructions_requested',
      after_data: { method, reference },
    })

    // Notify client
    await supabaseAdmin.from('notifications').insert({
      client_id: clientId,
      type: 'invoice',
      title: 'Payment Request Submitted',
      message: `Your request for ${method} payment instructions has been received.`,
      data: { request_reference: reference },
    })

    return NextResponse.json({ success: true, request: data })
  } catch (error) {
    console.error('Request instructions API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}