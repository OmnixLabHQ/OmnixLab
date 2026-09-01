import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://fqeyrtjlfnsxgwczcrvx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { conversationId, clientId, body, replyToId } = await request.json()

    if (!conversationId || !clientId || !body) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    // Check if draft exists
    const { data: existingDraft } = await supabaseAdmin
      .from('message_drafts')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('client_id', clientId)
      .single()

    if (existingDraft) {
      const { data, error } = await supabaseAdmin
        .from('message_drafts')
        .update({ body, reply_to_id: replyToId || null, updated_at: new Date().toISOString() })
        .eq('id', existingDraft.id)
        .select()
        .single()

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, draft: data })
    }

    const { data, error } = await supabaseAdmin
      .from('message_drafts')
      .insert({ conversation_id: conversationId, client_id: clientId, body, reply_to_id: replyToId || null })
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, draft: data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { draftId, clientId } = await request.json()

    if (!draftId || !clientId) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    await supabaseAdmin.from('message_drafts').delete().eq('id', draftId).eq('client_id', clientId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
