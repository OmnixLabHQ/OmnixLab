import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    console.log('=== MANUAL PAYMENT SUBMISSION ===')

    const body = await request.json()
    const {
      invoiceId,
      method,
      amount,
      paymentDate,
      senderName,
      transactionReference,
      notes,
      proofUrl,
      proofFileName,
      proofFileSize,
    } = body

    console.log('Submission details:', {
      invoiceId,
      method,
      amount,
      paymentDate,
      senderName,
      transactionReference,
      proofUrl,
    })

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice ID is required' 
      }, { status: 400 })
    }

    if (!method) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment method is required' 
      }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid amount is required' 
      }, { status: 400 })
    }

    // Fetch invoice
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

    // Check if invoice is already paid
    if (invoice.payment_status === 'paid' || invoice.status === 'paid') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice is already paid' 
      }, { status: 400 })
    }

    // Validate amount doesn't exceed outstanding balance
    const invoiceTotal = invoice.amount || invoice.total || 0
    const amountPaid = invoice.amount_paid || 0
    const outstandingBalance = invoiceTotal - amountPaid

    if (amount > outstandingBalance) {
      return NextResponse.json({ 
        success: false, 
        error: `Amount exceeds outstanding balance of ${outstandingBalance}` 
      }, { status: 400 })
    }

    // Create payment record with pending status
    const paymentRecord: any = {
      invoice_id: invoice.id,
      client_id: invoice.client_id,
      amount: amount,
      currency: invoice.currency || 'USD',
      status: 'pending',
      payment_method: method,
      payment_channel: 'manual',
      internal_reference: `MANUAL-${Date.now()}`,
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

    console.log('Payment record created with ID:', payment.id)

    // Create payment proof record
    if (proofUrl) {
      try {
        await supabaseAdmin.from('payment_proofs').insert({
          invoice_id: invoice.id,
          client_id: invoice.client_id,
          file_name: proofFileName || 'proof.pdf',
          file_url: proofUrl,
          file_size: proofFileSize || 0,
          amount: amount,
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          sender_name: senderName || null,
          transaction_reference: transactionReference || null,
          notes: notes || null,
          status: 'pending_review',
          created_at: new Date().toISOString(),
        })
        console.log('Payment proof recorded')
      } catch (proofError) {
        console.error('Proof insert error (non-fatal):', proofError)
      }
    }

    // Create payment event
    try {
      await supabaseAdmin.from('payment_events').insert({
        payment_id: payment.id,
        event_type: 'payment_submitted',
        description: `Manual payment submitted via ${method}`,
        metadata: {
          method: method,
          amount: amount,
          reference: transactionReference || null,
          has_proof: !!proofUrl,
        },
        created_at: new Date().toISOString(),
      })
      console.log('Payment event recorded')
    } catch (eventError) {
      console.log('Event insert error (non-fatal):', eventError)
    }

    // Update invoice payment_status to pending
    await supabaseAdmin
      .from('invoices')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    console.log('Invoice payment_status updated to pending')

    // Create notification for admin
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: null,
        type: 'payment_pending_verification',
        title: 'Payment Awaiting Verification',
        message: `${method} payment of ${amount} ${invoice.currency || 'USD'} submitted for invoice ${invoice.invoice_number}`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })
      console.log('Admin notification created')
    } catch (notifError) {
      console.log('Notification error (non-fatal):', notifError)
    }

    // Create audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: invoice.client_id,
        action_type: 'payment_submitted',
        description: `Manual payment submitted via ${method} for invoice ${invoice.invoice_number}`,
        entity_type: 'payment',
        entity_id: String(payment.id),
        result: 'pending',
        created_at: new Date().toISOString(),
      })
      console.log('Audit log created')
    } catch (auditError) {
      console.log('Audit error (non-fatal):', auditError)
    }

    return NextResponse.json({
      success: true,
      payment: payment,
      message: 'Payment submitted successfully. We will verify your payment shortly.',
    })

  } catch (error) {
    console.error('=== MANUAL PAYMENT ERROR ===', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
