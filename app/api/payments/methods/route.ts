import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Fetch all active payment methods from database
    const { data: methods, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('active', true)
      .order('id', { ascending: true })

    if (error) {
      console.error('Fetch payment methods error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch payment methods' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      methods: methods || [],
    })

  } catch (error) {
    console.error('Payment methods API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}