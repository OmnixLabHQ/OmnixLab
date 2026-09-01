// ============================================
// OMNIX LAB NOTIFICATION ENGINE
// Central service for all notifications
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseSecretKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export type NotificationType =
  | 'account'
  | 'project'
  | 'milestone'
  | 'file'
  | 'message'
  | 'invoice'
  | 'payment'
  | 'idea'
  | 'security'
  | 'system'

interface CreateNotificationInput {
  clientId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  checkPreference?: string
}

interface NotificationPreference {
  client_id: string
  project_updates: boolean
  milestone_completed: boolean
  milestone_delayed: boolean
  new_message: boolean
  new_file: boolean
  invoice_created: boolean
  invoice_due_soon: boolean
  invoice_overdue: boolean
  payment_received: boolean
  payment_failed: boolean
  idea_status_changed: boolean
  security_alerts: boolean
  email_notifications: boolean
}

export class NotificationEngine {
  /**
   * Create a notification if the client has enabled this preference
   */
  async createNotification(input: CreateNotificationInput): Promise<{ success: boolean }> {
    try {
      // Check preference if specified
      if (input.checkPreference) {
        const { data: prefs } = await supabaseAdmin
          .from('notification_preferences')
          .select('*')
          .eq('client_id', input.clientId)
          .single()

        if (prefs && prefs[input.checkPreference] === false) {
          return { success: true, skipped: true } as any
        }
      }

      // Insert notification
      const { error } = await supabaseAdmin.from('notifications').insert({
        client_id: input.clientId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || {},
      })

      if (error) {
        console.error('Notification insert error:', error)
        return { success: false }
      }

      return { success: true }
    } catch (error) {
      console.error('Notification engine error:', error)
      return { success: false }
    }
  }

  /**
   * Create multiple notifications for different events
   */
  async createBulkNotifications(
    notifications: CreateNotificationInput[]
  ): Promise<{ success: boolean }> {
    for (const notif of notifications) {
      await this.createNotification(notif)
    }
    return { success: true }
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(clientId: string): Promise<NotificationPreference | null> {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (error) return null
    return data
  }

  /**
   * Ensure user has notification preferences (create default if missing)
   */
  async ensurePreferences(clientId: string): Promise<void> {
    const { data: existing } = await supabaseAdmin
      .from('notification_preferences')
      .select('id')
      .eq('client_id', clientId)
      .single()

    if (!existing) {
      await supabaseAdmin.from('notification_preferences').insert({
        client_id: clientId,
      })
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(clientId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('read', false)

    if (error) return 0
    return count || 0
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(clientId: string): Promise<void> {
    await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('client_id', clientId)
      .eq('read', false)
  }

  /**
   * Mark single notification as read
   */
  async markRead(notificationId: string): Promise<void> {
    await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
  }

  /**
   * Send email notification (via Resend)
   */
  async sendEmailNotification(
    email: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean }> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY || ''

      if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured')
        return { success: false }
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Omnix Lab <onboarding@resend.dev>',
          to: email,
          subject,
          html,
        }),
      })

      if (!response.ok) {
        console.error('Email send failed:', await response.json())
        return { success: false }
      }

      return { success: true }
    } catch (error) {
      console.error('Email notification error:', error)
      return { success: false }
    }
  }

  /**
   * Create notification AND send email if enabled
   */
  async notifyWithEmail(input: CreateNotificationInput, email: string, emailSubject: string, emailHtml: string): Promise<void> {
    await this.createNotification(input)

    const prefs = await this.getPreferences(input.clientId)
    if (prefs?.email_notifications !== false && email) {
      await this.sendEmailNotification(email, emailSubject, emailHtml)
    }
  }
}

// Singleton
export const notificationEngine = new NotificationEngine()
