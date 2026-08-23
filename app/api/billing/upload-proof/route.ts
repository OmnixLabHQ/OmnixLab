import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const invoiceId = formData.get('invoiceId') as string
    const clientId = formData.get('clientId') as string
    const amount = formData.get('amount') as string
    const paymentDate = formData.get('paymentDate') as string
    const senderName = formData.get('senderName') as string
    const transactionReference = formData.get('transactionReference') as string
    const notes = formData.get('notes') as string

    if (!file || !invoiceId || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fileName = `proof-${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('payment-proofs')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
      })

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload proof' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('payment-proofs')
      .getPublicUrl(fileName)

    const fileUrl = urlData?.publicUrl || ''

    // Insert proof record
    const { data: proof, error: proofError } = await supabaseAdmin
      .from('payment_proofs')
      .insert({
        invoice_id: invoiceId,
        client_id: clientId,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        amount: amount ? parseFloat(amount) : null,
        payment_date: paymentDate || null,
        sender_name: senderName || null,
        transaction_reference: transactionReference || null,
        notes: notes || null,
        status: 'pending_review',
      })
      .select()
      .single()

    if (proofError) {
      return NextResponse.json(
        { success: false, error: proofError.message },
        { status: 500 }
      )
    }

    // Create notification
    try {
      await supabaseAdmin.from('notifications').insert({
        client_id: clientId,
        type: 'payment',
        title: 'Payment Proof Uploaded',
        message: 'Your payment proof has been submitted and is awaiting verification.',
        data: { proof_id: proof.id, invoice_id: invoiceId },
      })
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    return NextResponse.json({ success: true, proof })
  } catch (error) {
    console.error('Upload proof API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}