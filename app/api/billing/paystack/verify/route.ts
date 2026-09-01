import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    console.log('=== PAYSTACK VERIFY ===')
    console.log('Reference:', reference)

    if (!reference) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction reference is required' 
      }, { status: 400 })
    }

    // Verify with Paystack API
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const verifyData = await verifyResponse.json()

    console.log('Paystack verify response:', JSON.stringify(verifyData))

    if (!verifyResponse.ok || !verifyData.status) {
      return NextResponse.json({ 
        success: false, 
        error: verifyData.message || 'Verification failed' 
      }, { status: 400 })
    }

    const transactionData = verifyData.data

    // Check if payment was successful
    if (transactionData.status !== 'success') {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment was not successful' 
      }, { status: 400 })
    }

    // Find payment record by provider reference
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_reference', reference)
      .single()

    if (paymentError || !payment) {
      console.error('Payment record not found:', paymentError)
      return NextResponse.json({ 
        success: false, 
        error: 'Payment record not found' 
      }, { status: 404 })
    }

    // Check if payment is already successful (idempotency)
    if (payment.status === 'success' || payment.status === 'successful') {
      return NextResponse.json({ 
        success: true, 
        already_processed: true,
        payment: payment,
      })
    }

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
        gateway_response: JSON.stringify(transactionData),
      })
      .eq('id', payment.id)

    // Update invoice
    if (payment.invoice_id) {
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', payment.invoice_id)
        .single()

      if (invoice) {
        const newAmountPaid = (invoice.amount_paid || 0) + payment.amount
        const newPaymentStatus = newAmountPaid >= (invoice.amount || invoice.total || 0) ? 'paid' : 'partial'
        const newStatus = newPaymentStatus === 'paid' ? 'paid' : invoice.status

        await supabaseAdmin
          .from('invoices')
          .update({
            amount_paid: newAmountPaid,
            payment_status: newPaymentStatus,
            status: newStatus,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id)

        console.log('Invoice updated:', invoice.invoice_number, 'New status:', newPaymentStatus)
      }
    }

    // Create payment event
    await supabaseAdmin.from('payment_events').insert({
      payment_id: payment.id,
      event_type: 'payment_verified',
      description: 'Payment verified via Paystack',
      metadata: {
        reference: reference,
        provider: 'Paystack',
        paystack_status: transactionData.status,
      },
      created_at: new Date().toISOString(),
    })

    // Generate receipt
    const receiptNumber = `RCPT-${Date.now()}`
    const { data: receipt } = await supabaseAdmin
      .from('receipts')
      .insert({
        invoice_id: payment.invoice_id,
        payment_id: payment.id,
        client_id: payment.client_id,
        receipt_number: receiptNumber,
        amount: payment.amount,
        currency: payment.currency || 'USD',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    console.log('Receipt generated:', receiptNumber)

    return NextResponse.json({
      success: true,
      payment: payment,
      receipt: receipt,
      message: 'Payment verified successfully',
    })

  } catch (error) {
    console.error('=== PAYSTACK VERIFY ERROR ===', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
