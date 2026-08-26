import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, method, message } = body

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

    // Fetch client info for notification
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('full_name, email')
      .eq('id', invoice.client_id)
      .single()

    // Create notification for admin
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: invoice.client_id,
        type: 'payment_requested',
        title: 'Payment Instructions Requested',
        message: `${client?.full_name || 'Client'} requested ${method} payment instructions for invoice ${invoice.invoice_number}`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })
    } catch (notifError) {
      console.log('Notification creation failed (non-fatal):', notifError)
    }

    // Try to create audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: invoice.client_id,
        action_type: 'payment_requested',
        description: `Payment instructions requested for ${method} on invoice ${invoice.invoice_number}`,
        entity_type: 'invoice',
        entity_id: String(invoice.id),
        result: 'success',
        created_at: new Date().toISOString(),
      })
    } catch (auditError) {
      console.log('Audit log creation failed (non-fatal):', auditError)
    }

    console.log('Payment request recorded:', { invoiceId, method, message })

    return NextResponse.json({
      success: true,
      message: 'Payment instructions request submitted successfully.',
    })

  } catch (error) {
    console.error('Request instructions error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}