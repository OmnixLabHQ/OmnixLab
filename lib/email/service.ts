// ============================================
// OMNIX LAB EMAIL SERVICE
// Central email service using Resend
// ============================================

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Omnix Lab <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Email send failed:', errorData)
      return { success: false, error: 'Failed to send email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error: 'Email service error' }
  }
}

// ============================================
// Email Templates
// ============================================

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      padding: 40px 30px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 12px 12px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #4F46E5;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #9ca3af;
    }
    .info-box {
      background: #EEF2FF;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .warning-box {
      background: #FEF3C7;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .success-box {
      background: #D1FAE5;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 Omnix Lab. All rights reserved.</p>
      <p>Global Software Development Partner</p>
    </div>
  </div>
</body>
</html>
`

export const emailTemplates = {
  welcome: (name: string, dashboardUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
      Welcome to Omnix Lab! Your client portal is now active.
    </p>
    <div class="info-box">
      <h3 style="margin: 0 0 10px; color: #4F46E5;">🚀 Quick Start</h3>
      <ol style="line-height: 1.8;">
        <li>Access your dashboard</li>
        <li>Complete your profile</li>
        <li>Start your first project</li>
        <li>Upload requirements</li>
      </ol>
    </div>
    <a href="${dashboardUrl}" class="button">Access Your Portal</a>
    <p style="font-size: 14px; color: #6b7280;">
      Questions? Reply to this email or reach us on WhatsApp at +234 703 370 2874.
    </p>
  `, 'Welcome to Omnix Lab'),

  invoiceCreated: (clientName: string, invoiceNumber: string, amount: string, currency: string, dueDate: string, invoiceUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">A new invoice has been issued for your project.</p>
    <div class="info-box">
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p><strong>Amount:</strong> ${amount} ${currency}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
    </div>
    <a href="${invoiceUrl}" class="button">View Invoice</a>
  `, 'New Invoice Available'),

  invoiceOverdue: (clientName: string, invoiceNumber: string, amount: string, currency: string, dueDate: string, invoiceUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">This is a reminder that the following invoice is now overdue.</p>
    <div class="warning-box">
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p><strong>Amount:</strong> ${amount} ${currency}</p>
      <p><strong>Was Due:</strong> ${dueDate}</p>
    </div>
    <p style="color: #dc2626;">Please arrange payment as soon as possible.</p>
    <a href="${invoiceUrl}" class="button">Pay Invoice</a>
  `, 'Invoice Overdue'),

  paymentReceived: (clientName: string, invoiceNumber: string, amount: string, currency: string, receiptUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <div class="success-box">
      <p style="font-size: 18px; font-weight: bold; color: #059669;">✓ Payment Received</p>
    </div>
    <p style="font-size: 16px;">Your payment has been confirmed.</p>
    <div class="info-box">
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p><strong>Amount Paid:</strong> ${amount} ${currency}</p>
    </div>
    <a href="${receiptUrl}" class="button">Download Receipt</a>
  `, 'Payment Confirmed'),

  paymentFailed: (clientName: string, invoiceNumber: string, amount: string, currency: string, retryUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <div class="warning-box">
      <p style="font-weight: bold; color: #dc2626;">⚠ Payment Unsuccessful</p>
    </div>
    <p style="font-size: 16px;">Your payment attempt could not be completed.</p>
    <div class="info-box">
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p><strong>Amount:</strong> ${amount} ${currency}</p>
    </div>
    <a href="${retryUrl}" class="button">Try Again</a>
  `, 'Payment Failed'),

  newMessage: (clientName: string, senderName: string, conversationTitle: string, messagesUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">You have a new message from ${senderName}.</p>
    <div class="info-box">
      <p><strong>Conversation:</strong> ${conversationTitle}</p>
    </div>
    <a href="${messagesUrl}" class="button">View Message</a>
    <p style="font-size: 14px; color: #6b7280;">
      For security, please view the full message in your portal.
    </p>
  `, 'New Message Received'),

  milestoneCompleted: (clientName: string, milestoneTitle: string, projectName: string, projectUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <div class="success-box">
      <p style="font-weight: bold; color: #059669;">✓ Milestone Completed</p>
    </div>
    <div class="info-box">
      <p><strong>Milestone:</strong> ${milestoneTitle}</p>
      <p><strong>Project:</strong> ${projectName}</p>
    </div>
    <a href="${projectUrl}" class="button">View Project</a>
  `, 'Milestone Completed'),

  approvalRequested: (clientName: string, approvalTitle: string, projectName: string, projectUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">Your review is required.</p>
    <div class="warning-box">
      <p><strong>Approval:</strong> ${approvalTitle}</p>
      <p><strong>Project:</strong> ${projectName}</p>
    </div>
    <a href="${projectUrl}" class="button">Review Now</a>
  `, 'Approval Required'),

  fileUploaded: (clientName: string, fileName: string, projectName: string, filesUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">A new file has been uploaded to your project.</p>
    <div class="info-box">
      <p><strong>File:</strong> ${fileName}</p>
      <p><strong>Project:</strong> ${projectName}</p>
    </div>
    <a href="${filesUrl}" class="button">View Files</a>
  `, 'New File Uploaded'),

  projectStatusChanged: (clientName: string, projectName: string, oldStatus: string, newStatus: string, projectUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">Your project status has been updated.</p>
    <div class="info-box">
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Status:</strong> ${oldStatus} → ${newStatus}</p>
    </div>
    <a href="${projectUrl}" class="button">View Project</a>
  `, 'Project Status Updated'),

  ideaStatusChanged: (clientName: string, ideaTitle: string, newStatus: string, ideaUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">Your idea status has been updated.</p>
    <div class="info-box">
      <p><strong>Idea:</strong> ${ideaTitle}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
    </div>
    <a href="${ideaUrl}" class="button">View Idea</a>
  `, 'Idea Status Updated'),

  ticketCreated: (clientName: string, ticketSubject: string, ticketId: string, ticketUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <p style="font-size: 16px;">Your support ticket has been created.</p>
    <div class="info-box">
      <p><strong>Ticket:</strong> ${ticketSubject}</p>
      <p><strong>Reference:</strong> ${ticketId}</p>
    </div>
    <a href="${ticketUrl}" class="button">View Ticket</a>
  `, 'Support Ticket Created'),

  ticketResolved: (clientName: string, ticketSubject: string, resolution: string, ticketUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <div class="success-box">
      <p style="font-weight: bold; color: #059669;">✓ Ticket Resolved</p>
    </div>
    <div class="info-box">
      <p><strong>Ticket:</strong> ${ticketSubject}</p>
      <p><strong>Resolution:</strong> ${resolution}</p>
    </div>
    <a href="${ticketUrl}" class="button">View Ticket</a>
  `, 'Support Ticket Resolved'),

  securityAlert: (clientName: string, alertType: string, details: string, settingsUrl: string) => baseTemplate(`
    <p style="font-size: 16px;">Hi ${clientName},</p>
    <div class="warning-box">
      <p style="font-weight: bold; color: #dc2626;">⚠ Security Alert</p>
    </div>
    <div class="info-box">
      <p><strong>Event:</strong> ${alertType}</p>
      <p><strong>Details:</strong> ${details}</p>
    </div>
    <a href="${settingsUrl}" class="button">Review Security Settings</a>
  `, 'Security Alert'),
}