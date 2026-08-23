import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', supabaseSecretKey)

export async function POST(request: Request) {
  try {
    const { conversationId, clientId, format = 'csv' } = await request.json()

    if (!conversationId || !clientId) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) {
      return NextResponse.json({ success: false, error: msgError.message }, { status: 500 })
    }

    // Create export record
    const { data: exportRecord, error: exportError } = await supabaseAdmin
      .from('conversation_exports')
      .insert({
        conversation_id: conversationId,
        client_id: clientId,
        format,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (exportError) {
      return NextResponse.json({ success: false, error: exportError.message }, { status: 500 })
    }

    // Generate CSV
    const csvRows = ['Sender,Type,Body,Timestamp']
    messages?.forEach((msg: any) => {
      csvRows.push(`${msg.sender_type},${msg.message_type},${msg.body.replace(/,/g, ' ')},${new Date(msg.created_at).toISOString()}`)
    })
    const csvContent = csvRows.join('\n')

    return NextResponse.json({
      success: true,
      export: exportRecord,
      csvContent,
      messages,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}