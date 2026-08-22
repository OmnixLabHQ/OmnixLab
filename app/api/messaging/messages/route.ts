import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

    const body = await request.json()
    const { conversationId, senderId, body: messageBody, messageType, replyToId, attachments } = body

    if (!conversationId || !senderId || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: message, error: msgError } = await supabaseAdmin
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: 'client',
        body: messageBody,
        message_type: messageType || 'text',
        reply_to_id: replyToId || null,
      })
      .select()
      .single()

    if (msgError) {
      console.error('Message insert error:', msgError)
      return NextResponse.json(
        { success: false, error: msgError.message },
        { status: 500 }
      )
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        await supabaseAdmin.from('message_attachments').insert({
          message_id: message.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_size: att.file_size || null,
          file_type: att.file_type || null,
          uploaded_by: senderId,
        })
      }
    }

    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Message API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}