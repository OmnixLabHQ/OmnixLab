import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, method, reference, proofUrl } = body

    if (!invoiceId || !method) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice ID and payment method are required' 
      }, { status: 400 })
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice not found' 
      }, { status: 404 })
    }

    // Determine amount
    let totalAmount = invoice.total || invoice.amount || 0
    if (totalAmount === 0 && invoice.amount > 0) {
      totalAmount = invoice.amount
    }

    // Create payment record with pending status
    const paymentRecord: any = {
      invoice_id: invoice.id,
      client_id: invoice.client_id,
      amount: totalAmount,
      currency: invoice.currency || 'USD',
      method: method,
      payment_method: method,
      status: 'pending',
      provider_reference: reference || null,
      internal_reference: `MANUAL-${Date.now()}`,
      proof_url: proofUrl || null,
      created_at: new Date().toISOString(),
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single()

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to record payment: ' + paymentError.message 
      }, { status: 500 })
    }

    // Update invoice payment status
    await supabaseAdmin
      .from('invoices')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    console.log('Manual payment recorded:', payment?.id)

    return NextResponse.json({
      success: true,
      payment: payment,
      message: 'Payment proof submitted successfully. We will verify your payment shortly.',
    })

  } catch (error) {
    console.error('Upload proof error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}