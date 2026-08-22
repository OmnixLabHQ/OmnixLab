import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://fqeyrtjlfnsxgwczcrvx.supabase.co',
  'YOUR_ENV_VARIABLE_HERE'
)

export async function POST(request: Request) {
  try {
    const { messageId, userId, reaction } = await request.json()

    if (!messageId || !userId || !reaction) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    // Check if reaction already exists
    const { data: existing } = await supabaseAdmin
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('reaction', reaction)
      .single()

    if (existing) {
      // Remove reaction (toggle)
      await supabaseAdmin.from('message_reactions').delete().eq('id', existing.id)
      return NextResponse.json({ success: true, removed: true })
    }

    // Add reaction
    const { data, error } = await supabaseAdmin
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: userId, reaction })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reaction: data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}