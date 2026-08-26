'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface SettingsData {
  general: {
    company_name: string
    support_email: string
    support_phone: string
    timezone: string
    language: string
    currency: string
  }
  brand: {
    logo_url: string
    favicon_url: string
    primary_color: string
    secondary_color: string
  }
  security: {
    two_factor_required: boolean
    password_min_length: number
    session_timeout: number
    max_login_attempts: number
    ip_whitelist: string
  }
  email: {
    from_name: string
    from_email: string
    smtp_host: string
    smtp_port: string
    email_provider: string
  }
  notifications: {
    email_notifications: boolean
    telegram_notifications: boolean
    whatsapp_notifications: boolean
    payment_alerts: boolean
    project_alerts: boolean
    support_alerts: boolean
  }
  payments: {
    paystack_secret_key: string
    paystack_public_key: string
    flutterwave_secret_key: string
    flutterwave_public_key: string
    default_currency: string
    auto_verify_payments: boolean
  }
  invoices: {
    invoice_prefix: string
    default_due_days: number
    late_fee_percentage: number
    tax_rate: number
    footer_note: string
  }
  projects: {
    default_project_status: string
    auto_create_milestones: boolean
    require_client_approval: boolean
  }
  files: {
    max_file_size: number
    allowed_file_types: string
    auto_scan_files: boolean
  }
  integrations: {
    supabase: { connected: boolean; status: string }
    paystack: { connected: boolean; status: string }
    flutterwave: { connected: boolean; status: string }
    resend: { connected: boolean; status: string }
    telegram: { connected: boolean; status: string }
    whatsapp: { connected: boolean; status: string }
  }
}

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: '[G]' },
  { id: 'brand', label: 'Brand', icon: '[B]' },
  { id: 'security', label: 'Security', icon: '[S]' },
  { id: 'email', label: 'Email', icon: '[E]' },
  { id: 'notifications', label: 'Notifications', icon: '[N]' },
  { id: 'payments', label: 'Payments', icon: '[P]' },
  { id: 'invoices', label: 'Invoices', icon: '[I]' },
  { id: 'projects', label: 'Projects', icon: '[P]' },
  { id: 'files', label: 'Files', icon: '[F]' },
  { id: 'integrations', label: 'Integrations', icon: '[+]' },
  { id: 'system', label: 'System', icon: '[S]' },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Singapore',
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR']

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    general: {
      company_name: 'Omnix Lab',
      support_email: 'support@omnixlab.com',
      support_phone: '',
      timezone: 'UTC',
      language: 'en',
      currency: 'USD',
    },
    brand: {
      logo_url: '',
      favicon_url: '',
      primary_color: '#E11D2E',
      secondary_color: '#070A0F',
    },
    security: {
      two_factor_required: false,
      password_min_length: 8,
      session_timeout: 60,
      max_login_attempts: 5,
      ip_whitelist: '',
    },
    email: {
      from_name: 'Omnix Lab',
      from_email: 'noreply@omnixlab.com',
      smtp_host: '',
      smtp_port: '587',
      email_provider: 'resend',
    },
    notifications: {
      email_notifications: true,
      telegram_notifications: false,
      whatsapp_notifications: false,
      payment_alerts: true,
      project_alerts: true,
      support_alerts: true,
    },
    payments: {
      paystack_secret_key: '',
      paystack_public_key: '',
      flutterwave_secret_key: '',
      flutterwave_public_key: '',
      default_currency: 'USD',
      auto_verify_payments: false,
    },
    invoices: {
      invoice_prefix: 'INV',
      default_due_days: 14,
      late_fee_percentage: 0,
      tax_rate: 0,
      footer_note: 'Thank you for your business.',
    },
    projects: {
      default_project_status: 'planning',
      auto_create_milestones: true,
      require_client_approval: true,
    },
    files: {
      max_file_size: 50,
      allowed_file_types: 'pdf,doc,docx,png,jpg,jpeg,zip',
      auto_scan_files: true,
    },
    integrations: {
      supabase: { connected: true, status: 'operational' },
      paystack: { connected: true, status: 'operational' },
      flutterwave: { connected: false, status: 'not_configured' },
      resend: { connected: true, status: 'operational' },
      telegram: { connected: false, status: 'not_configured' },
      whatsapp: { connected: false, status: 'not_configured' },
    },
  })
  
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  
  // System info
  const [systemInfo, setSystemInfo] = useState({
    database: 'operational',
    storage: 'operational',
    api: 'operational',
    authentication: 'operational',
    payment_gateway: 'operational',
    email: 'operational',
    notifications: 'operational',
    webhooks: 'operational',
    cron_jobs: 'operational',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .single()

      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
        }))
      }
      setLoading(false)
    } catch (error) {
      console.error('Fetch settings error:', error)
      setLoading(false)
    }
  }, [])

  function updateSetting(category: keyof SettingsData, field: string, value: any) {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    setSavedMessage('')
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'global',
          ...settings,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        alert('Failed to save settings: ' + error.message)
        setSaving(false)
        return
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: null,
        action_type: 'settings_changed',
        description: `Settings updated: ${activeTab}`,
        entity_type: 'settings',
        entity_id: 'global',
        result: 'success',
        created_at: new Date().toISOString(),
      })

      setSavedMessage('Settings saved successfully!')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Save settings error:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function getIntegrationStatusColor(status: string) {
    const map: Record<string, string> = {
      operational: 'bg-green-500/20 text-green-300',
      not_configured: 'bg-gray-500/20 text-gray-300',
      error: 'bg-red-500/20 text-red-300',
      warning: 'bg-yellow-500/20 text-yellow-300',
    }
    return map[status] || 'bg-gray-500/20 text-gray-300'
  }

  function getSystemStatusColor(status: string) {
    const map: Record<string, string> = {
      operational: 'bg-green-500/20 text-green-300',
      warning: 'bg-yellow-500/20 text-yellow-300',
      critical: 'bg-red-500/20 text-red-300',
    }
    return map[status] || 'bg-gray-500/20 text-gray-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Platform configuration and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedMessage && (
            <span className="px-4 py-2 bg-green-500/20 text-green-300 text-sm font-medium rounded-lg">
              {savedMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={settings.general.company_name}
                  onChange={(e) => updateSetting('general', 'company_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.general.support_email}
                  onChange={(e) => updateSetting('general', 'support_email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={settings.general.support_phone}
                  onChange={(e) => updateSetting('general', 'support_phone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz} className="bg-gray-900">{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Language</label>
                <select
                  value={settings.general.language}
                  onChange={(e) => updateSetting('general', 'language', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="en" className="bg-gray-900">English</option>
                  <option value="fr" className="bg-gray-900">French</option>
                  <option value="es" className="bg-gray-900">Spanish</option>
                  <option value="ar" className="bg-gray-900">Arabic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Default Currency</label>
                <select
                  value={settings.general.currency}
                  onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  {CURRENCIES.map(c => (
                    <option key={c} value={c} className="bg-gray-900">{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Settings */}
      {activeTab === 'brand' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Brand Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={settings.brand.logo_url}
                  onChange={(e) => updateSetting('brand', 'logo_url', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Favicon URL</label>
                <input
                  type="text"
                  value={settings.brand.favicon_url}
                  onChange={(e) => updateSetting('brand', 'favicon_url', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand.primary_color}
                    onChange={(e) => updateSetting('brand', 'primary_color', e.target.value)}
                    className="w-12 h-10 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.brand.primary_color}
                    onChange={(e) => updateSetting('brand', 'primary_color', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand.secondary_color}
                    onChange={(e) => updateSetting('brand', 'secondary_color', e.target.value)}
                    className="w-12 h-10 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.brand.secondary_color}
                    onChange={(e) => updateSetting('brand', 'secondary_color', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.security.two_factor_required}
                  onChange={(e) => updateSetting('security', 'two_factor_required', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <label className="text-sm text-gray-300">Require 2FA for all admins</label>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Minimum Password Length</label>
                <input
                  type="number"
                  value={settings.security.password_min_length}
                  onChange={(e) => updateSetting('security', 'password_min_length', parseInt(e.target.value) || 8)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.session_timeout}
                  onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value) || 60)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.max_login_attempts}
                  onChange={(e) => updateSetting('security', 'max_login_attempts', parseInt(e.target.value) || 5)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">IP Whitelist (comma separated)</label>
                <input
                  type="text"
                  value={settings.security.ip_whitelist}
                  onChange={(e) => updateSetting('security', 'ip_whitelist', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="192.168.1.1, 10.0.0.1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Email Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">From Name</label>
                <input
                  type="text"
                  value={settings.email.from_name}
                  onChange={(e) => updateSetting('email', 'from_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">From Email</label>
                <input
                  type="email"
                  value={settings.email.from_email}
                  onChange={(e) => updateSetting('email', 'from_email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email Provider</label>
                <select
                  value={settings.email.email_provider}
                  onChange={(e) => updateSetting('email', 'email_provider', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="resend" className="bg-gray-900">Resend</option>
                  <option value="smtp" className="bg-gray-900">SMTP</option>
                  <option value="sendgrid" className="bg-gray-900">SendGrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={settings.email.smtp_host}
                  onChange={(e) => updateSetting('email', 'smtp_host', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="smtp.example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">SMTP Port</label>
                <input
                  type="text"
                  value={settings.email.smtp_port}
                  onChange={(e) => updateSetting('email', 'smtp_port', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email_notifications}
                  onChange={(e) => updateSetting('notifications', 'email_notifications', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">Email Notifications</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.telegram_notifications}
                  onChange={(e) => updateSetting('notifications', 'telegram_notifications', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">Telegram Notifications</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.whatsapp_notifications}
                  onChange={(e) => updateSetting('notifications', 'whatsapp_notifications', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">WhatsApp Notifications</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.payment_alerts}
                  onChange={(e) => updateSetting('notifications', 'payment_alerts', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">Payment Alerts</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.project_alerts}
                  onChange={(e) => updateSetting('notifications', 'project_alerts', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">Project Alerts</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.support_alerts}
                  onChange={(e) => updateSetting('notifications', 'support_alerts', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">Support Alerts</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Payments Settings */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Paystack Secret Key</label>
                <input
                  type="password"
                  value={settings.payments.paystack_secret_key}
                  onChange={(e) => updateSetting('payments', 'paystack_secret_key', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="sk_live_..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Paystack Public Key</label>
                <input
                  type="text"
                  value={settings.payments.paystack_public_key}
                  onChange={(e) => updateSetting('payments', 'paystack_public_key', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="pk_live_..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Flutterwave Secret Key</label>
                <input
                  type="password"
                  value={settings.payments.flutterwave_secret_key}
                  onChange={(e) => updateSetting('payments', 'flutterwave_secret_key', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="FLWSECK-..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Flutterwave Public Key</label>
                <input
                  type="text"
                  value={settings.payments.flutterwave_public_key}
                  onChange={(e) => updateSetting('payments', 'flutterwave_public_key', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="FLWPUBK-..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Default Currency</label>
                <select
                  value={settings.payments.default_currency}
                  onChange={(e) => updateSetting('payments', 'default_currency', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  {CURRENCIES.map(c => (
                    <option key={c} value={c} className="bg-gray-900">{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.payments.auto_verify_payments}
                  onChange={(e) => updateSetting('payments', 'auto_verify_payments', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <label className="text-sm text-gray-300">Auto-verify payments via webhook</label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Important: Payment keys are stored server-side only and never exposed to the frontend.
            </p>
          </div>
        </div>
      )}

      {/* Invoices Settings */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Invoice Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={settings.invoices.invoice_prefix}
                  onChange={(e) => updateSetting('invoices', 'invoice_prefix', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Default Due Days</label>
                <input
                  type="number"
                  value={settings.invoices.default_due_days}
                  onChange={(e) => updateSetting('invoices', 'default_due_days', parseInt(e.target.value) || 14)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Late Fee Percentage</label>
                <input
                  type="number"
                  value={settings.invoices.late_fee_percentage}
                  onChange={(e) => updateSetting('invoices', 'late_fee_percentage', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.invoices.tax_rate}
                  onChange={(e) => updateSetting('invoices', 'tax_rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Footer Note</label>
                <textarea
                  value={settings.invoices.footer_note}
                  onChange={(e) => updateSetting('invoices', 'footer_note', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Settings */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Project Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Default Project Status</label>
                <select
                  value={settings.projects.default_project_status}
                  onChange={(e) => updateSetting('projects', 'default_project_status', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="planning" className="bg-gray-900">Planning</option>
                  <option value="active" className="bg-gray-900">Active</option>
                  <option value="awaiting_requirements" className="bg-gray-900">Awaiting Requirements</option>
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.projects.auto_create_milestones}
                  onChange={(e) => updateSetting('projects', 'auto_create_milestones', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">Auto-create default milestones</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.projects.require_client_approval}
                  onChange={(e) => updateSetting('projects', 'require_client_approval', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <span className="text-sm text-white">Require client approval for milestones</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Files Settings */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">File Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Max File Size (MB)</label>
                <input
                  type="number"
                  value={settings.files.max_file_size}
                  onChange={(e) => updateSetting('files', 'max_file_size', parseInt(e.target.value) || 50)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Allowed File Types</label>
                <input
                  type="text"
                  value={settings.files.allowed_file_types}
                  onChange={(e) => updateSetting('files', 'allowed_file_types', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="pdf,doc,docx,png,jpg"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.files.auto_scan_files}
                  onChange={(e) => updateSetting('files', 'auto_scan_files', e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <label className="text-sm text-gray-300">Auto-scan files for malware</label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Integrations</h3>
            <div className="space-y-3">
              {Object.entries(settings.integrations).map(([name, integration]) => (
                <div key={name} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{name}</p>
                    <p className="text-xs text-gray-400">
                      {integration.connected ? 'Connected' : 'Not configured'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getIntegrationStatusColor(integration.status)}`}>
                    {integration.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {Object.entries(systemInfo).map(([service, status]) => (
                <div key={service} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
                  <p className="text-sm text-white capitalize">{service.replace(/_/g, ' ')}</p>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getSystemStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}