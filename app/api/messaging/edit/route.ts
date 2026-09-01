import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://fqeyrtjlfnsxgwczcrvx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { messageId, userId, body } = await request.json()

    if (!messageId || !userId || !body) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    // Verify sender
    const { data: message, error: msgError } = await supabaseAdmin
      .from('conversation_messages')
      .select('sender_id, created_at')
      .eq('id', messageId)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 })
    }

    if (message.sender_id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Check if within edit window (10 minutes)
    const createdTime = new Date(message.created_at).getTime()
    const now = Date.now()
    const editWindow = 10 * 60 * 1000 // 10 minutes

    if (now - createdTime > editWindow) {
      return NextResponse.json({ success: false, error: 'Edit window expired' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('conversation_messages')
      .update({ body, is_edited: true, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
