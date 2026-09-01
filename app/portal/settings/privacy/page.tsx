'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PrivacySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'private',
    activity_visibility: 'organization',
    analytics_enabled: true,
    personalization_enabled: true,
    show_email: false,
    show_phone: false,
  })

  useEffect(() => {
    fetchPrivacySettings()
  }, [])

  async function fetchPrivacySettings() {
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
        .select('privacy_settings')
        .eq('client_id', user.id)
        .single()

      if (prefs?.privacy_settings) {
        setPrivacySettings({
          ...privacySettings,
          ...prefs.privacy_settings,
        })
      }

      setLoading(false)
    } catch (error) {
      console.error('Privacy fetch error:', error)
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
          privacy_settings: privacySettings,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Save error:', error)
        setMessage('Failed to save privacy settings')
      } else {
        setMessage('Privacy settings saved successfully')
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
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Data</h1>
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

        {/* Profile Visibility */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile Visibility</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPrivacySettings({ ...privacySettings, profile_visibility: 'private' })}
              className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                privacySettings.profile_visibility === 'private'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">Private</p>
              <p className="text-sm text-gray-600">Only you and Omnix Lab can see your profile</p>
            </button>
            <button
              onClick={() => setPrivacySettings({ ...privacySettings, profile_visibility: 'organization' })}
              className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                privacySettings.profile_visibility === 'organization'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">Organization</p>
              <p className="text-sm text-gray-600">Members of your organization can see your profile</p>
            </button>
          </div>
        </div>

        {/* Activity Visibility */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Activity Visibility</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPrivacySettings({ ...privacySettings, activity_visibility: 'private' })}
              className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                privacySettings.activity_visibility === 'private'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">Private</p>
              <p className="text-sm text-gray-600">Only you can see your activity</p>
            </button>
            <button
              onClick={() => setPrivacySettings({ ...privacySettings, activity_visibility: 'organization' })}
              className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                privacySettings.activity_visibility === 'organization'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">Organization</p>
              <p className="text-sm text-gray-600">Organization members can see your activity</p>
            </button>
          </div>
        </div>

        {/* Data Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Data Controls</h2>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Analytics</p>
                <p className="text-xs text-gray-500">Allow usage analytics to improve your experience</p>
              </div>
              <ToggleSwitch
                checked={privacySettings.analytics_enabled}
                onChange={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    analytics_enabled: !privacySettings.analytics_enabled,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Personalization</p>
                <p className="text-xs text-gray-500">Personalize your dashboard and recommendations</p>
              </div>
              <ToggleSwitch
                checked={privacySettings.personalization_enabled}
                onChange={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    personalization_enabled: !privacySettings.personalization_enabled,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Show Email to Team</p>
                <p className="text-xs text-gray-500">Allow team members to see your email</p>
              </div>
              <ToggleSwitch
                checked={privacySettings.show_email}
                onChange={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    show_email: !privacySettings.show_email,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Show Phone to Team</p>
                <p className="text-xs text-gray-500">Allow team members to see your phone number</p>
              </div>
              <ToggleSwitch
                checked={privacySettings.show_phone}
                onChange={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    show_phone: !privacySettings.show_phone,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Data & Documents */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Data & Documents</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 text-sm">Document Retention</p>
              <p className="text-sm text-gray-600">According to organization policy</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 text-sm">File Versioning</p>
              <p className="text-sm text-gray-600">Enabled</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 text-sm">Automatic Deletion</p>
              <p className="text-sm text-gray-600">Disabled</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 text-sm">Download History</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Export Your Data</h2>
          <p className="text-sm text-gray-600 mb-4">
            Request a copy of your data. We'll prepare the export and notify you when it's ready.
          </p>
          <button
            onClick={() => setMessage('Data export requested. You will be notified when ready.')}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Request Data Export
          </button>
        </div>
      </div>
    </div>
  )
}
