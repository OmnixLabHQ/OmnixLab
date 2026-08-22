import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseServiceKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')
    const currency = searchParams.get('currency') || 'USD'

    let query = supabaseAdmin
      .from('payment_instructions')
      .select('*')
      .eq('is_active', true)

    if (method) {
      query = query.eq('method', method)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, instructions: data })
  } catch (error) {
    console.error('Payment instructions API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}