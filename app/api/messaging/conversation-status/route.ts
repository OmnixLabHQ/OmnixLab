import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://fqeyrtjlfnsxgwczcrvx.supabase.co',
  'YOUR_ENV_VARIABLE_HERE'
)

export async function POST(request: Request) {
  try {
    const { conversationId, status, priority, archived } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Missing conversationId' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (archived !== undefined) updates.archived = archived
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversation: data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
