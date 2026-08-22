import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function POST(request: Request) {
  try {
    const { messageIds, userId } = await request.json()

    if (!messageIds || !userId || !Array.isArray(messageIds)) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    for (const messageId of messageIds) {
      await supabaseAdmin.from('message_reads').upsert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}