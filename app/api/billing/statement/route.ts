import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, dateFrom, dateTo, format = 'csv' } = body

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Missing clientId' }, { status: 400 })
    }

    // Fetch payments within date range
    let query = supabaseAdmin
      .from('payments')
      .select('*, invoices(invoice_number, project_id)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data: payments, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Create export record
    const { data: exportRecord, error: exportError } = await supabaseAdmin
      .from('payment_statement_exports')
      .insert({
        client_id: clientId,
        date_from: dateFrom,
        date_to: dateTo,
        format,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (exportError) {
      return NextResponse.json({ success: false, error: exportError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      export: exportRecord,
      payments: payments || [],
    })
  } catch (error) {
    console.error('Statement API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}