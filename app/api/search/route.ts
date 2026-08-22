import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseSecretKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const clientId = searchParams.get('clientId') || ''

    if (!query || !clientId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    const searchTerm = `%${query.toLowerCase()}%`
    const results: Record<string, any[]> = {
      projects: [],
      files: [],
      invoices: [],
      payments: [],
      ideas: [],
      messages: [],
      tickets: [],
    }

    // Search Projects
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, description, status')
      .eq('client_id', clientId)
      .ilike('name', searchTerm)
      .limit(10)

    if (projects) {
      results.projects = projects.map((p) => ({
        id: p.id,
        title: p.name,
        description: p.description || '',
        type: 'Project',
        url: `/portal/projects/${p.id}`,
      }))
    }

    // Search Files
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('id, file_name, file_type, status')
      .eq('client_id', clientId)
      .ilike('file_name', searchTerm)
      .limit(10)

    if (files) {
      results.files = files.map((f) => ({
        id: f.id,
        title: f.file_name,
        description: f.file_type || '',
        type: 'File',
        url: `/portal/files`,
      }))
    }

    // Search Invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, amount, currency, status')
      .eq('client_id', clientId)
      .or(`invoice_number.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10)

    if (invoices) {
      results.invoices = invoices.map((inv) => ({
        id: inv.id,
        title: inv.invoice_number || `Invoice ${inv.id}`,
        description: `${inv.amount} ${inv.currency} • ${inv.status}`,
        type: 'Invoice',
        url: `/portal/invoices/${inv.id}`,
      }))
    }

    // Search Payments
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('id, internal_reference, amount, currency, status')
      .eq('client_id', clientId)
      .ilike('internal_reference', searchTerm)
      .limit(10)

    if (payments) {
      results.payments = payments.map((p) => ({
        id: p.id,
        title: p.internal_reference,
        description: `${p.amount} ${p.currency} • ${p.status}`,
        type: 'Payment',
        url: `/portal/payments/${p.id}`,
      }))
    }

    // Search Ideas
    const { data: ideas } = await supabaseAdmin
      .from('ideas')
      .select('id, title, description, status')
      .eq('client_id', clientId)
      .ilike('title', searchTerm)
      .limit(10)

    if (ideas) {
      results.ideas = ideas.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description || '',
        type: 'Idea',
        url: `/portal/ideas/${i.id}`,
      }))
    }

    // Search Messages
    const { data: messages } = await supabaseAdmin
      .from('conversation_messages')
      .select('id, body, conversation_id')
      .eq('sender_type', 'client')
      .ilike('body', searchTerm)
      .limit(10)

    if (messages) {
      // For each message, get conversation title
      for (const msg of messages) {
        const { data: convo } = await supabaseAdmin
          .from('conversations')
          .select('id, title, client_id')
          .eq('id', msg.conversation_id)
          .eq('client_id', clientId)
          .single()

        if (convo) {
          results.messages.push({
            id: msg.id,
            title: convo.title,
            description: msg.body.slice(0, 100),
            type: 'Message',
            url: `/portal/messages`,
          })
        }
      }
    }

    // Search Support Tickets
    const { data: tickets } = await supabaseAdmin
      .from('support_tickets')
      .select('id, subject, description, status')
      .eq('client_id', clientId)
      .ilike('subject', searchTerm)
      .limit(10)

    if (tickets) {
      results.tickets = tickets.map((t) => ({
        id: t.id,
        title: t.subject,
        description: t.description || '',
        type: 'Support Ticket',
        url: `/portal/support/${t.id}`,
      }))
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}