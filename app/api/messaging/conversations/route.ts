import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Missing clientId' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversations: data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, title, subject, category, priority, projectId, message } = body

    if (!clientId || !title) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const { data: conversation, error: convoError } = await supabaseAdmin
      .from('conversations')
      .insert({
        client_id: clientId,
        title: title,
        subject: subject || title,
        category: category || 'general',
        priority: priority || 'normal',
        project_id: projectId || null,
        status: 'open',
      })
      .select()
      .single()

    if (convoError) {
      return NextResponse.json({ success: false, error: convoError.message }, { status: 500 })
    }

    await supabaseAdmin.from('conversation_participants').insert({
      conversation_id: conversation.id,
      user_id: clientId,
      user_type: 'client',
      role: 'owner',
    })

    if (message && message.trim()) {
      await supabaseAdmin.from('conversation_messages').insert({
        conversation_id: conversation.id,
        sender_id: clientId,
        sender_type: 'client',
        body: message,
        message_type: 'text',
      })

      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id)
    }

    return NextResponse.json({ success: true, conversation })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}