import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://fqeyrtjlfnsxgwczcrvx.supabase.co',
  'YOUR_ENV_VARIABLE_HERE'
)

export async function POST(request: Request) {
  try {
    const { messageId, userId } = await request.json()

    if (!messageId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    // Soft delete
    const { data, error } = await supabaseAdmin
      .from('conversation_messages')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', userId)
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
