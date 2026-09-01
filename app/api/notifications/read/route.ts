import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseSecretKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { notificationId, clientId, markAll } = body

    if (markAll && clientId) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('client_id', clientId)
        .eq('read', false)

      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
