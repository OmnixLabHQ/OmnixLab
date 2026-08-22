import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseSecretKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params

    const { data: conversation, error: convoError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convoError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const { data: messages, error: msgError } = await supabaseAdmin
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) {
      return NextResponse.json(
        { success: false, error: msgError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, conversation, messages })
  } catch (error) {
    console.error('Conversation detail error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}