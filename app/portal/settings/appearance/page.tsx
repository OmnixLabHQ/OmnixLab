'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AppearanceSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Appearance settings
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('Africa/Lagos')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [currency, setCurrency] = useState('USD')

  // Dashboard widget preferences
  const [dashboardWidgets, setDashboardWidgets] = useState({
    activeProjects: true,
    upcoming: true,
    outstanding: true,
    recentFiles: true,
    messages: true,
    activity: true,
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
        .select('*')
        .eq('client_id', user.id)
        .single()

      if (prefs) {
        if (prefs.theme) setTheme(prefs.theme)
        if (prefs.language) setLanguage(prefs.language)
        if (prefs.timezone) setTimezone(prefs.timezone)
        if (prefs.date_format) setDateFormat(prefs.date_format)
        if (prefs.time_format) setTimeFormat(prefs.time_format)
        if (prefs.currency) setCurrency(prefs.currency)
        if (prefs.dashboard_widgets) {
          setDashboardWidgets({
            ...dashboardWidgets,
            ...prefs.dashboard_widgets,
          })
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Appearance fetch error:', error)
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
          theme,
          language,
          timezone,
          date_format: dateFormat,
          time_format: timeFormat,
          currency,
          dashboard_widgets: dashboardWidgets,
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
  }: {
    checked: boolean
    onChange: () => void
  }) {
    return (
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
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
          <h1 className="text-2xl font-bold text-gray-900">Appearance & Language</h1>
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

        {/* Theme */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Theme</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 transition-colors ${
                theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full h-16 bg-white border border-gray-200 rounded-lg mb-2"></div>
              <p className="font-medium text-gray-900 text-sm">Light</p>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 transition-colors ${
                theme === 'dark' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full h-16 bg-gray-800 border border-gray-700 rounded-lg mb-2"></div>
              <p className="font-medium text-gray-900 text-sm">Dark</p>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border-2 transition-colors ${
                theme === 'system' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full h-16 bg-gradient-to-b from-white to-gray-800 border border-gray-200 rounded-lg mb-2"></div>
              <p className="font-medium text-gray-900 text-sm">System</p>
            </button>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Language & Region</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
              >
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="Africa/Accra">Africa/Accra (GMT)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="GHS">GHS - Ghanaian Cedi</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="ZAR">ZAR - South African Rand</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This only affects how amounts are displayed. Invoice currency is set per invoice.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Dashboard Preferences</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose which widgets appear on your dashboard.
          </p>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Active Projects</p>
                <p className="text-xs text-gray-500">Show your active projects</p>
              </div>
              <ToggleSwitch
                checked={dashboardWidgets.activeProjects}
                onChange={() =>
                  setDashboardWidgets({
                    ...dashboardWidgets,
                    activeProjects: !dashboardWidgets.activeProjects,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Upcoming Schedule</p>
                <p className="text-xs text-gray-500">Show upcoming deadlines</p>
              </div>
              <ToggleSwitch
                checked={dashboardWidgets.upcoming}
                onChange={() =>
                  setDashboardWidgets({ ...dashboardWidgets, upcoming: !dashboardWidgets.upcoming })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Outstanding Invoices</p>
                <p className="text-xs text-gray-500">Show financial summary</p>
              </div>
              <ToggleSwitch
                checked={dashboardWidgets.outstanding}
                onChange={() =>
                  setDashboardWidgets({
                    ...dashboardWidgets,
                    outstanding: !dashboardWidgets.outstanding,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Recent Files</p>
                <p className="text-xs text-gray-500">Show recently uploaded files</p>
              </div>
              <ToggleSwitch
                checked={dashboardWidgets.recentFiles}
                onChange={() =>
                  setDashboardWidgets({
                    ...dashboardWidgets,
                    recentFiles: !dashboardWidgets.recentFiles,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Messages</p>
                <p className="text-xs text-gray-500">Show recent messages</p>
              </div>
              <ToggleSwitch
                checked={dashboardWidgets.messages}
                onChange={() =>
                  setDashboardWidgets({ ...dashboardWidgets, messages: !dashboardWidgets.messages })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Activity Timeline</p>
                <p className="text-xs text-gray-500">Show recent activity</p>
              </div>
              <ToggleSwitch
                checked={dashboardWidgets.activity}
                onChange={() =>
                  setDashboardWidgets({ ...dashboardWidgets, activity: !dashboardWidgets.activity })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}