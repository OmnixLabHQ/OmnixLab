import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  const formData = await request.formData()
  const clientId = formData.get('client_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string

  const { data, error } = await supabase.from('invoices').insert({
    client_id: clientId,
    amount,
    description,
    status: 'unpaid'
  }).select('id').single()

  if (error) {
    return NextResponse.redirect(new URL('/admin/invoices?error=1', request.url))
  }

  if (data && clientId) {
    await createNotification(
      clientId,
      'invoice',
      'New Invoice Received',
      `A new invoice for $${amount} has been issued. Please review and pay.`,
      { invoiceId: data.id }
    )
  }

  return NextResponse.redirect(new URL('/admin/invoices?success=1', request.url))
}