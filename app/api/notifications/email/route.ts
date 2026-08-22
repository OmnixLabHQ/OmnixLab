import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/service'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseSecretKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, templateType, data } = body

    if (!clientId || !templateType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Check notification preferences
    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('email_notifications')
      .eq('client_id', clientId)
      .single()

    if (prefs && prefs.email_notifications === false) {
      return NextResponse.json({ success: true, skipped: true })
    }

    // Fetch client email
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', clientId)
      .single()

    if (clientError || !client?.email) {
      return NextResponse.json({ success: false, error: 'Client email not found' }, { status: 404 })
    }

    const { emailTemplates } = await import('@/lib/email/service')

    let html = ''
    let subject = ''

    switch (templateType) {
      case 'invoice_created':
        html = emailTemplates.invoiceCreated(
          client.full_name,
          data.invoiceNumber,
          data.amount,
          data.currency,
          data.dueDate,
          data.invoiceUrl
        )
        subject = `Omnix Lab — New Invoice ${data.invoiceNumber}`
        break
      case 'invoice_overdue':
        html = emailTemplates.invoiceOverdue(
          client.full_name,
          data.invoiceNumber,
          data.amount,
          data.currency,
          data.dueDate,
          data.invoiceUrl
        )
        subject = `Omnix Lab — Invoice Overdue: ${data.invoiceNumber}`
        break
      case 'payment_received':
        html = emailTemplates.paymentReceived(
          client.full_name,
          data.invoiceNumber,
          data.amount,
          data.currency,
          data.receiptUrl
        )
        subject = 'Omnix Lab — Payment Confirmed'
        break
      case 'payment_failed':
        html = emailTemplates.paymentFailed(
          client.full_name,
          data.invoiceNumber,
          data.amount,
          data.currency,
          data.retryUrl
        )
        subject = 'Omnix Lab — Payment Unsuccessful'
        break
      case 'new_message':
        html = emailTemplates.newMessage(
          client.full_name,
          data.senderName,
          data.conversationTitle,
          data.messagesUrl
        )
        subject = 'Omnix Lab — New Message'
        break
      case 'milestone_completed':
        html = emailTemplates.milestoneCompleted(
          client.full_name,
          data.milestoneTitle,
          data.projectName,
          data.projectUrl
        )
        subject = 'Omnix Lab — Milestone Completed'
        break
      case 'approval_requested':
        html = emailTemplates.approvalRequested(
          client.full_name,
          data.approvalTitle,
          data.projectName,
          data.projectUrl
        )
        subject = 'Omnix Lab — Approval Required'
        break
      case 'file_uploaded':
        html = emailTemplates.fileUploaded(
          client.full_name,
          data.fileName,
          data.projectName,
          data.filesUrl
        )
        subject = 'Omnix Lab — New File Uploaded'
        break
      case 'project_status_changed':
        html = emailTemplates.projectStatusChanged(
          client.full_name,
          data.projectName,
          data.oldStatus,
          data.newStatus,
          data.projectUrl
        )
        subject = 'Omnix Lab — Project Status Updated'
        break
      case 'idea_status_changed':
        html = emailTemplates.ideaStatusChanged(
          client.full_name,
          data.ideaTitle,
          data.newStatus,
          data.ideaUrl
        )
        subject = 'Omnix Lab — Idea Status Updated'
        break
      case 'ticket_created':
        html = emailTemplates.ticketCreated(
          client.full_name,
          data.ticketSubject,
          data.ticketId,
          data.ticketUrl
        )
        subject = 'Omnix Lab — Support Ticket Created'
        break
      case 'ticket_resolved':
        html = emailTemplates.ticketResolved(
          client.full_name,
          data.ticketSubject,
          data.resolution,
          data.ticketUrl
        )
        subject = 'Omnix Lab — Support Ticket Resolved'
        break
      case 'security_alert':
        html = emailTemplates.securityAlert(
          client.full_name,
          data.alertType,
          data.details,
          data.settingsUrl
        )
        subject = 'Omnix Lab — Security Alert'
        break
      default:
        return NextResponse.json({ success: false, error: 'Unknown template type' }, { status: 400 })
    }

    const result = await sendEmail({
      to: client.email,
      subject,
      html,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Email notification API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}