'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    project_updates: true,
    milestone_completed: true,
    milestone_delayed: true,
    new_message: true,
    new_file: true,
    invoice_created: true,
    invoice_due_soon: true,
    invoice_overdue: true,
    payment_received: true,
    payment_failed: true,
    idea_status_changed: true,
    security_alerts: true,
  })

  // Email preferences state
  const [emailPrefs, setEmailPrefs] = useState({
    product_updates: true,
    tips_resources: true,
    marketing: false,
    newsletter: true,
  })

  // Communication preferences
  const [communicationPrefs, setCommunicationPrefs] = useState({
    portal_messages: true,
    email: true,
    sms: false,
    whatsapp: false,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('notification_preferences, email_preferences')
        .eq('client_id', user.id)
        .single()

      if (prefs) {
        if (prefs.notification_preferences) {
          setNotificationPrefs({
            ...notificationPrefs,
            ...prefs.notification_preferences,
          })
        }
        if (prefs.email_preferences) {
          setEmailPrefs({
            ...emailPrefs,
            ...prefs.email_preferences,
          })
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Preferences fetch error:', error)
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          client_id: user.id,
          notification_preferences: notificationPrefs,
          email_preferences: emailPrefs,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Save error:', error)
        setMessage('Failed to save preferences')
      } else {
        setMessage('Preferences saved successfully')
      }
    } catch (error) {
      console.error('Save exception:', error)
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean
    onChange: () => void
    disabled?: boolean
  }) {
    return (
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  function NotificationRow({
    title,
    description,
    checked,
    onChange,
    disabled = false,
  }: {
    title: string
    description: string
    checked: boolean
    onChange: () => void
    disabled?: boolean
  }) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <p className="font-medium text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/settings" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Settings
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-4 ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Project Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Project Notifications</h2>
          <div className="divide-y divide-gray-100">
            <NotificationRow
              title="Project Updates"
              description="Get notified when there are updates to your projects"
              checked={notificationPrefs.project_updates}
              onChange={() =>
                setNotificationPrefs({ ...notificationPrefs, project_updates: !notificationPrefs.project_updates })
              }
            />
            <NotificationRow
              title="Milestone Completed"
              description="Notify me when a milestone is completed"
              checked={notificationPrefs.milestone_completed}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  milestone_completed: !notificationPrefs.milestone_completed,
                })
              }
            />
            <NotificationRow
              title="Milestone Delayed"
              description="Notify me when a milestone is delayed"
              checked={notificationPrefs.milestone_delayed}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  milestone_delayed: !notificationPrefs.milestone_delayed,
                })
              }
            />
            <NotificationRow
              title="New Messages"
              description="Notify me when I receive a new message"
              checked={notificationPrefs.new_message}
              onChange={() =>
                setNotificationPrefs({ ...notificationPrefs, new_message: !notificationPrefs.new_message })
              }
            />
            <NotificationRow
              title="New Files"
              description="Notify me when files are uploaded"
              checked={notificationPrefs.new_file}
              onChange={() =>
                setNotificationPrefs({ ...notificationPrefs, new_file: !notificationPrefs.new_file })
              }
            />
          </div>
        </div>

        {/* Invoice Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Invoice & Payment Notifications</h2>
          <div className="divide-y divide-gray-100">
            <NotificationRow
              title="Invoice Created"
              description="Notify me when a new invoice is issued"
              checked={notificationPrefs.invoice_created}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  invoice_created: !notificationPrefs.invoice_created,
                })
              }
            />
            <NotificationRow
              title="Invoice Due Soon"
              description="Remind me before an invoice is due"
              checked={notificationPrefs.invoice_due_soon}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  invoice_due_soon: !notificationPrefs.invoice_due_soon,
                })
              }
            />
            <NotificationRow
              title="Invoice Overdue"
              description="Notify me when an invoice becomes overdue"
              checked={notificationPrefs.invoice_overdue}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  invoice_overdue: !notificationPrefs.invoice_overdue,
                })
              }
            />
            <NotificationRow
              title="Payment Received"
              description="Confirm when my payment has been received"
              checked={notificationPrefs.payment_received}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  payment_received: !notificationPrefs.payment_received,
                })
              }
            />
            <NotificationRow
              title="Payment Failed"
              description="Notify me when a payment fails"
              checked={notificationPrefs.payment_failed}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  payment_failed: !notificationPrefs.payment_failed,
                })
              }
            />
          </div>
        </div>

        {/* Idea Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Idea Notifications</h2>
          <div className="divide-y divide-gray-100">
            <NotificationRow
              title="Idea Status Changes"
              description="Notify me when the status of my ideas changes"
              checked={notificationPrefs.idea_status_changed}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  idea_status_changed: !notificationPrefs.idea_status_changed,
                })
              }
            />
          </div>
        </div>

        {/* Security Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Security Notifications</h2>
          <p className="text-xs text-gray-500 mb-4">
            These notifications cannot be disabled for your security.
          </p>
          <div className="divide-y divide-gray-100">
            <NotificationRow
              title="Security Alerts"
              description="New login, password changes, and suspicious activity"
              checked={notificationPrefs.security_alerts}
              onChange={() =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  security_alerts: !notificationPrefs.security_alerts,
                })
              }
              disabled={true}
            />
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Communication Channels</h2>
          <div className="divide-y divide-gray-100">
            <NotificationRow
              title="Portal Messages"
              description="Receive notifications in your portal"
              checked={communicationPrefs.portal_messages}
              onChange={() =>
                setCommunicationPrefs({
                  ...communicationPrefs,
                  portal_messages: !communicationPrefs.portal_messages,
                })
              }
            />
            <NotificationRow
              title="Email"
              description="Receive notifications via email"
              checked={communicationPrefs.email}
              onChange={() =>
                setCommunicationPrefs({ ...communicationPrefs, email: !communicationPrefs.email })
              }
            />
            <NotificationRow
              title="SMS"
              description="Receive notifications via SMS"
              checked={communicationPrefs.sms}
              onChange={() =>
                setCommunicationPrefs({ ...communicationPrefs, sms: !communicationPrefs.sms })
              }
            />
            <NotificationRow
              title="WhatsApp"
              description="Receive notifications via WhatsApp"
              checked={communicationPrefs.whatsapp}
              onChange={() =>
                setCommunicationPrefs({
                  ...communicationPrefs,
                  whatsapp: !communicationPrefs.whatsapp,
                })
              }
            />
          </div>
        </div>

        {/* Email Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Email Preferences</h2>
          <div className="divide-y divide-gray-100">
            <NotificationRow
              title="Product Updates"
              description="News about Omnix Lab features and improvements"
              checked={emailPrefs.product_updates}
              onChange={() =>
                setEmailPrefs({ ...emailPrefs, product_updates: !emailPrefs.product_updates })
              }
            />
            <NotificationRow
              title="Tips & Resources"
              description="Helpful guides and best practices"
              checked={emailPrefs.tips_resources}
              onChange={() =>
                setEmailPrefs({ ...emailPrefs, tips_resources: !emailPrefs.tips_resources })
              }
            />
            <NotificationRow
              title="Marketing"
              description="Promotional offers and announcements"
              checked={emailPrefs.marketing}
              onChange={() =>
                setEmailPrefs({ ...emailPrefs, marketing: !emailPrefs.marketing })
              }
            />
            <NotificationRow
              title="Newsletter"
              description="Monthly Omnix Lab newsletter"
              checked={emailPrefs.newsletter}
              onChange={() =>
                setEmailPrefs({ ...emailPrefs, newsletter: !emailPrefs.newsletter })
              }
            />
          </div>
        </div>

        {/* Save Button (bottom) */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
