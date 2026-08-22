// ============================================
// NOTIFICATION HELPER FUNCTIONS
// Easy-to-use functions for common events
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnixlab-production.up.railway.app'

export async function notifyInvoiceCreated(invoiceId: string) {
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return

  // In-app notification
  await supabaseAdmin.from('notifications').insert({
    client_id: invoice.client_id,
    type: 'invoice',
    title: 'New Invoice Available',
    message: `Invoice ${invoice.invoice_number || invoiceId} has been issued for $${(invoice.total || invoice.amount).toLocaleString()}.`,
    data: { invoice_id: invoiceId },
  })

  // Email notification
  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: invoice.client_id,
      templateType: 'invoice_created',
      data: {
        invoiceNumber: invoice.invoice_number || invoiceId,
        amount: (invoice.total || invoice.amount).toString(),
        currency: invoice.currency || 'USD',
        dueDate: invoice.due_date || 'N/A',
        invoiceUrl: `${APP_URL}/portal/invoices/${invoiceId}`,
      },
    }),
  })
}

export async function notifyPaymentReceived(paymentId: string) {
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (!payment) return

  await supabaseAdmin.from('notifications').insert({
    client_id: payment.client_id,
    type: 'payment',
    title: 'Payment Received',
    message: `Your payment of ${payment.amount} ${payment.currency} has been confirmed.`,
    data: { payment_id: paymentId },
  })

  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: payment.client_id,
      templateType: 'payment_received',
      data: {
        invoiceNumber: payment.invoice_id,
        amount: payment.amount.toString(),
        currency: payment.currency,
        receiptUrl: `${APP_URL}/portal/payments/${paymentId}`,
      },
    }),
  })
}

export async function notifyNewMessage(conversationId: string, senderName: string) {
  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (!conversation) return

  await supabaseAdmin.from('notifications').insert({
    client_id: conversation.client_id,
    type: 'message',
    title: 'New Message',
    message: `You have a new message from ${senderName}.`,
    data: { conversation_id: conversationId },
  })

  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: conversation.client_id,
      templateType: 'new_message',
      data: {
        senderName,
        conversationTitle: conversation.title,
        messagesUrl: `${APP_URL}/portal/messages`,
      },
    }),
  })
}

export async function notifyMilestoneCompleted(milestoneId: string) {
  const { data: milestone } = await supabaseAdmin
    .from('milestones')
    .select('*, projects(name, client_id)')
    .eq('id', milestoneId)
    .single()

  if (!milestone || !milestone.projects) return

  await supabaseAdmin.from('notifications').insert({
    client_id: milestone.projects.client_id,
    type: 'milestone',
    title: 'Milestone Completed',
    message: `Milestone "${milestone.title}" has been completed.`,
    data: { milestone_id: milestoneId, project_id: milestone.project_id },
  })

  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: milestone.projects.client_id,
      templateType: 'milestone_completed',
      data: {
        milestoneTitle: milestone.title,
        projectName: milestone.projects.name,
        projectUrl: `${APP_URL}/portal/projects/${milestone.project_id}`,
      },
    }),
  })
}

export async function notifyFileUploaded(fileId: string) {
  const { data: file } = await supabaseAdmin
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (!file || !file.client_id) return

  await supabaseAdmin.from('notifications').insert({
    client_id: file.client_id,
    type: 'file',
    title: 'New File Uploaded',
    message: `File "${file.file_name}" has been uploaded.`,
    data: { file_id: fileId },
  })

  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: file.client_id,
      templateType: 'file_uploaded',
      data: {
        fileName: file.file_name,
        projectName: file.project_id || 'General',
        filesUrl: `${APP_URL}/portal/files`,
      },
    }),
  })
}

export async function notifyIdeaStatusChanged(ideaId: string, newStatus: string) {
  const { data: idea } = await supabaseAdmin
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single()

  if (!idea) return

  await supabaseAdmin.from('notifications').insert({
    client_id: idea.client_id,
    type: 'idea',
    title: 'Idea Status Updated',
    message: `Your idea "${idea.title}" is now ${newStatus.replace(/_/g, ' ')}.`,
    data: { idea_id: ideaId },
  })

  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: idea.client_id,
      templateType: 'idea_status_changed',
      data: {
        ideaTitle: idea.title,
        newStatus: newStatus.replace(/_/g, ' '),
        ideaUrl: `${APP_URL}/portal/ideas/${ideaId}`,
      },
    }),
  })
}

export async function notifyTicketCreated(ticketId: string) {
  const { data: ticket } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (!ticket) return

  await supabaseAdmin.from('notifications').insert({
    client_id: ticket.client_id,
    type: 'system',
    title: 'Support Ticket Created',
    message: `Your support ticket "${ticket.subject}" has been created.`,
    data: { ticket_id: ticketId },
  })

  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: ticket.client_id,
      templateType: 'ticket_created',
      data: {
        ticketSubject: ticket.subject,
        ticketId: ticket.id,
        ticketUrl: `${APP_URL}/portal/support/${ticketId}`,
      },
    }),
  })
}

export async function notifySecurityAlert(clientId: string, alertType: string, details: string) {
  await supabaseAdmin.from('notifications').insert({
    client_id: clientId,
    type: 'security',
    title: 'Security Alert',
    message: details,
    data: { alert_type: alertType },
  })

  await fetch(`${APP_URL}/api/notifications/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      templateType: 'security_alert',
      data: {
        alertType,
        details,
        settingsUrl: `${APP_URL}/portal/settings/security`,
      },
    }),
  })
}