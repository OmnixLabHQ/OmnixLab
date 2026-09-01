import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    // Get authenticated user from request
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch client profile
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
    }

    // Fetch all data in parallel
    const [
      projectsData,
      invoicesData,
      paymentsData,
      filesData,
      ideasData,
      messagesData,
      notificationsData,
      activitiesData,
    ] = await Promise.all([
      supabaseAdmin.from('projects').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('invoices').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('payments').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('files').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('ideas').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('messages').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('notifications').select('*').eq('user_id', client.id).order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('activity_logs').select('*').eq('user_id', client.id).order('created_at', { ascending: false }).limit(10),
    ])

    const projects = projectsData.data || []
    const invoices = invoicesData.data || []
    const payments = paymentsData.data || []
    const files = filesData.data || []
    const ideas = ideasData.data || []
    const messages = messagesData.data || []
    const notifications = notificationsData.data || []
    const activities = activitiesData.data || []

    // Calculate financial summary
    const outstanding = invoices
      .filter((inv: any) => ['sent', 'viewed', 'partially_paid', 'unpaid'].includes(inv.status))
      .reduce((sum: number, inv: any) => {
        const total = inv.total || inv.amount || 0
        const paid = inv.amount_paid || 0
        return sum + Math.max(0, total - paid)
      }, 0)

    const paid = invoices
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + (inv.amount_paid || inv.amount || inv.total || 0), 0)

    const pending = payments
      .filter((p: any) => ['pending', 'initiated', 'processing', 'under_review', 'needs_review'].includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    const overdue = invoices
      .filter((inv: any) => inv.status === 'overdue')
      .reduce((sum: number, inv: any) => {
        const total = inv.total || inv.amount || 0
        const paid = inv.amount_paid || 0
        return sum + Math.max(0, total - paid)
      }, 0)

    // Calculate active projects
    const activeProjects = projects.filter((p: any) => 
      ['planning', 'active', 'development', 'in_progress'].includes(p.status)
    )

    // Attention items
    const attentionItems: any[] = []

    // Invoice due soon or overdue
    invoices
      .filter((inv: any) => ['sent', 'viewed', 'overdue'].includes(inv.status))
      .forEach((inv: any) => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : null
        const now = new Date()
        const daysDiff = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

        if (daysDiff !== null && daysDiff <= 7) {
          attentionItems.push({
            type: 'invoice_due',
            title: daysDiff < 0 ? `Invoice ${inv.invoice_number} is overdue` : `Invoice ${inv.invoice_number} due in ${daysDiff} days`,
            link: `/portal/invoices/${inv.id}`,
            severity: daysDiff < 0 ? 'critical' : 'warning',
          })
        }
      })

    // Unread messages
    const unreadMessages = messages.filter((m: any) => !m.is_read && m.sender_type !== 'client')
    if (unreadMessages.length > 0) {
      attentionItems.push({
        type: 'unread_message',
        title: `${unreadMessages.length} new message${unreadMessages.length > 1 ? 's' : ''} from Omnix Lab`,
        link: '/portal/messages',
        severity: 'info',
      })
    }

    // Unread notifications
    const unreadNotifications = notifications.filter((n: any) => !n.read)
    if (unreadNotifications.length > 0) {
      attentionItems.push({
        type: 'notification',
        title: `${unreadNotifications.length} unread notification${unreadNotifications.length > 1 ? 's' : ''}`,
        link: '/portal/notifications',
        severity: 'info',
      })
    }

    // Next action
    let nextAction = null
    if (attentionItems.some((item: any) => item.type === 'invoice_due' && item.severity === 'critical')) {
      nextAction = { title: 'Review overdue invoice', link: attentionItems.find((i: any) => i.severity === 'critical')?.link }
    } else if (unreadMessages.length > 0) {
      nextAction = { title: 'Read new messages', link: '/portal/messages' }
    } else {
      nextAction = { title: "You're all caught up", link: null }
    }

    // Recent activity
    const recentActivity = activities.slice(0, 10).map((a: any) => ({
      id: a.id,
      description: a.description,
      action_type: a.action_type,
      created_at: a.created_at,
    }))

    // Recent files
    const recentFiles = files.slice(0, 5).map((f: any) => ({
      id: f.id,
      file_name: f.file_name,
      file_type: f.file_type,
      created_at: f.created_at,
    }))

    // Recent ideas
    const recentIdeas = ideas.slice(0, 5).map((i: any) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      created_at: i.created_at,
    }))

    return NextResponse.json({
      success: true,
      dashboard: {
        profile: {
          name: client.full_name,
          company: client.company,
          email: client.email,
        },
        attention: attentionItems,
        financial: {
          outstanding,
          paid,
          pending,
          overdue,
          outstandingCount: invoices.filter((inv: any) => ['sent', 'viewed', 'unpaid', 'overdue'].includes(inv.status)).length,
          paidCount: invoices.filter((inv: any) => inv.status === 'paid').length,
          pendingCount: payments.filter((p: any) => ['pending', 'initiated', 'processing'].includes(p.status)).length,
          overdueCount: invoices.filter((inv: any) => inv.status === 'overdue').length,
        },
        projects: activeProjects.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          progress: p.progress || 0,
          due_date: p.expected_completion_date || p.due_date,
          created_at: p.created_at,
        })),
        recentActivity,
        messages: unreadMessages.slice(0, 3).map((m: any) => ({
          id: m.id,
          content: m.content,
          sender_name: m.sender_name,
          created_at: m.created_at,
        })),
        recentFiles,
        recentIdeas,
        notifications: unreadNotifications.slice(0, 5),
        nextAction,
      },
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
