import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.event === 'charge.success') {
      const { reference, authorization, metadata } = body.data
      const invoiceId = metadata?.invoiceId

      if (invoiceId) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_gateway: 'paystack',
            paystack_reference: reference,
            receipt_url: authorization?.receipt_url || `https://paystack.com/receipt/${reference}`,
          })
          .eq('id', invoiceId)

        // Fetch client_id from invoice
        const { data: invoice } = await supabase
          .from('invoices')
          .select('client_id')
          .eq('id', invoiceId)
          .single()

        if (invoice) {
          await createNotification(
            invoice.client_id,
            'payment',
            'Payment Received',
            'Your payment has been received successfully.',
            { invoiceId, reference }
          )
        }

        // Telegram notification
        await fetch(`https://api.telegram.org/bot8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: '8550312488',
            text: `💰 Payment received for invoice #${invoiceId}\nAmount: ${body.data.amount / 100} NGN\nReference: ${reference}`,
          }),
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}