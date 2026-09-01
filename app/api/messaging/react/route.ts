import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { messageId, userId, reaction } = await request.json()
    if (!messageId || !userId || !reaction) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    // Check if already reacted
    const { data: existing } = await supabaseAdmin
      .from('message_reactions')
      .select('*')
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
    await supabaseAdmin.from('message_reactions').insert({
      message_id: messageId,
      user_id: userId,
      reaction,
    })

    return NextResponse.json({ success: true, added: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
