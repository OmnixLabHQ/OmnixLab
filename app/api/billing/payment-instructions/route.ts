import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')

    let query = supabaseAdmin
      .from('payment_instructions')
      .select('*')
      .eq('is_active', true)

    if (method) {
      query = query.eq('method', method)
    }

    const { data, error } = await query

    if (error) {
      console.error('Payment instructions fetch error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, instructions: data || [] })
  } catch (error) {
    console.error('Payment instructions API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      method,
      bank_name,
      account_name,
      account_number,
      routing_number,
      swift_bic,
      iban,
      wallet_address,
      network,
      memo_tag,
      instructions,
    } = body

    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Missing payment method' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('payment_instructions')
      .insert({
        method,
        bank_name: bank_name || null,
        account_name: account_name || null,
        account_number: account_number || null,
        routing_number: routing_number || null,
        swift_bic: swift_bic || null,
        iban: iban || null,
        wallet_address: wallet_address || null,
        network: network || null,
        memo_tag: memo_tag || null,
        instructions: instructions || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Payment instructions insert error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, instruction: data })
  } catch (error) {
    console.error('Payment instructions POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}