'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SettingsOverviewPage() {
  const [client, setClient] = useState<any>(null)
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch client profile
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', user.id)
        .single()

      if (clientData) setClient(clientData)

      // Fetch preferences (or create default if none)
      let { data: prefsData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('client_id', user.id)
        .single()

      if (!prefsData) {
        // Create default preferences
        const { data: newPrefs } = await supabase
          .from('user_preferences')
          .insert({ client_id: user.id })
          .select()
          .single()

        prefsData = newPrefs
      }

      if (prefsData) setPreferences(prefsData)

      setLoading(false)
    } catch (error) {
      console.error('Settings fetch error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account, security, workspace, notifications, billing preferences and portal experience.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Last account activity: Today, {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Quick Stats / Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{client?.full_name || 'Profile'}</p>
                <p className="text-sm text-gray-500">✓ Email verified</p>
              </div>
            </div>
            <Link href="/portal/settings/profile" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Edit Profile →
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Security</p>
                <p className="text-sm text-gray-500">2FA {preferences?.two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <Link href="/portal/settings/security" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Manage Security →
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🔔</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">Email notifications {preferences?.email_preferences?.marketing ? 'On' : 'Off'}</p>
              </div>
            </div>
            <Link href="/portal/settings/notifications" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Notification Settings →
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Billing Profile</p>
                <p className="text-sm text-gray-500">Complete ✓</p>
              </div>
            </div>
            <Link href="/portal/settings/billing" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Billing Settings →
            </Link>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/portal/settings/profile"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">👤</span>
            <h3 className="font-semibold text-gray-900 mt-2">Profile</h3>
            <p className="text-sm text-gray-600">Update your personal information, photo, and contact details.</p>
          </Link>

          <Link
            href="/portal/settings/security"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">🔒</span>
            <h3 className="font-semibold text-gray-900 mt-2">Security</h3>
            <p className="text-sm text-gray-600">Manage password, two-factor authentication, and recovery codes.</p>
          </Link>

          <Link
            href="/portal/settings/notifications"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">🔔</span>
            <h3 className="font-semibold text-gray-900 mt-2">Notifications</h3>
            <p className="text-sm text-gray-600">Choose what you want to be notified about and how.</p>
          </Link>

          <Link
            href="/portal/settings/appearance"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">🎨</span>
            <h3 className="font-semibold text-gray-900 mt-2">Appearance</h3>
            <p className="text-sm text-gray-600">Set theme, language, time zone, and date/time format.</p>
          </Link>

          <Link
            href="/portal/settings/billing"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">💳</span>
            <h3 className="font-semibold text-gray-900 mt-2">Billing Profile</h3>
            <p className="text-sm text-gray-600">Manage billing address, tax ID, and preferred payment method.</p>
          </Link>

          <Link
            href="/portal/settings/sessions"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">📱</span>
            <h3 className="font-semibold text-gray-900 mt-2">Sessions & Devices</h3>
            <p className="text-sm text-gray-600">View and manage active sessions across your devices.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}