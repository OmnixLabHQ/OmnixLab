'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [show2FAInfo, setShow2FAInfo] = useState(false)

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [processingMFA, setProcessingMFA] = useState(false)
  const [processingCodes, setProcessingCodes] = useState(false)
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  // Security overview
  const [securityStatus, setSecurityStatus] = useState({
    twoFactor: false,
    passwordStrength: 'Not set',
    activeSessions: 1,
    suspiciousActivity: false,
  })

  useEffect(() => {
    fetchSecurityStatus()
    fetchMFAStatus()
  }, [])

  async function fetchSecurityStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setSecurityStatus({
        twoFactor: twoFactorEnabled,
        passwordStrength: 'Good',
        activeSessions: 1,
        suspiciousActivity: false,
      })

      setLoading(false)
    } catch (error) {
      console.error('Security fetch error:', error)
      setLoading(false)
    }
  }

  async function fetchMFAStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('mfa_settings')
        .select('is_enabled')
        .eq('user_id', user.id)
        .single()

      if (data?.is_enabled) {
        setTwoFactorEnabled(true)
      }
    } catch (error) {
      console.error('MFA status fetch error:', error)
    }
  }

  async function handlePasswordChange() {
    setSaving(true)
    setMessage('')

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match')
      setSaving(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) {
        console.error('Password update error:', error)
        setMessage(error.message || 'Failed to change password')
      } else {
        setMessage('Password changed successfully')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setShowPasswordForm(false)
      }
    } catch (error) {
      console.error('Password change error:', error)
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisableMFA() {
    if (!confirm('Are you sure you want to disable two-factor authentication? This reduces your account security.')) return

    setProcessingMFA(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setProcessingMFA(false)
        return
      }

      const { error } = await supabase
        .from('mfa_settings')
        .update({
          is_enabled: false,
          secret_hash: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      // Delete recovery codes
      await supabase
        .from('recovery_codes')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        setMessage('Failed to disable MFA')
      } else {
        setTwoFactorEnabled(false)
        setMessage('Two-factor authentication disabled successfully')
      }
    } catch (error) {
      setMessage('An error occurred')
    } finally {
      setProcessingMFA(false)
    }
  }

  async function handleGenerateRecoveryCodes() {
    setProcessingCodes(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setProcessingCodes(false)
        return
      }

      const codes = generateCodes(10)
      setRecoveryCodes(codes)
      setShowRecoveryCodes(true)

      // Delete old unused codes
      await supabase
        .from('recovery_codes')
        .delete()
        .eq('user_id', user.id)
        .eq('is_used', false)

      // Store hashed codes in database
      for (const code of codes) {
        const codeHash = await hashCode(code)
        await supabase.from('recovery_codes').insert({
          user_id: user.id,
          code_hash: codeHash,
        })
      }

      setMessage('New recovery codes generated successfully')
    } catch (error) {
      setMessage('Failed to generate recovery codes')
    } finally {
      setProcessingCodes(false)
    }
  }

  function generateCodes(count: number): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = Array.from({ length: 4 }, () =>
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-')
      codes.push(code)
    }
    return codes
  }

  async function hashCode(code: string): Promise<string> {
    let hash = 0
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  function handleDownloadRecoveryCodes() {
    const codesText = recoveryCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'omnix-recovery-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function getPasswordStrength(password: string): string {
    if (!password) return 'Not set'
    if (password.length < 8) return 'Weak'
    if (password.length < 12) return 'Fair'
    if (password.length < 16) return 'Good'
    return 'Strong'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
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

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Security</h1>

        {message && (
          <div className={`p-4 rounded-lg mb-4 ${message.includes('success') || message.includes('generated') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Security Overview */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Security Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl mb-1">{twoFactorEnabled ? '🟢' : '🟡'}</p>
              <p className="font-medium text-gray-900">Two-Factor Auth</p>
              <p className="text-sm text-gray-500">{twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl mb-1">🟢</p>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">{securityStatus.passwordStrength}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl mb-1">📱</p>
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-500">{securityStatus.activeSessions}</p>
            </div>
          </div>

          {securityStatus.suspiciousActivity && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-red-800">⚠️ Suspicious activity detected on your account</p>
            </div>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Two-Factor Authentication</h2>
            <button
              onClick={() => setShow2FAInfo(!show2FAInfo)}
              className="text-sm text-blue-600 hover:underline"
            >
              {show2FAInfo ? 'Hide Info' : 'Learn More'}
            </button>
          </div>

          {show2FAInfo && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Two-factor authentication adds an extra layer of security to your account.
                When enabled, you&apos;ll need to enter a code from your authenticator app
                in addition to your password when signing in.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Authenticator App</p>
              <p className="text-sm text-gray-500">
                {twoFactorEnabled ? '✓ Enabled' : 'Not configured'}
              </p>
            </div>
            {twoFactorEnabled ? (
              <button
                onClick={handleDisableMFA}
                disabled={processingMFA}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {processingMFA ? 'Processing...' : 'Disable'}
              </button>
            ) : (
              <Link
                href="/portal/settings/security/mfa"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Enable
              </Link>
            )}
          </div>

          {/* Recovery Codes */}
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Recovery Codes</p>
              <p className="text-sm text-gray-500">
                {twoFactorEnabled
                  ? 'Generate new recovery codes for your account'
                  : 'Available when 2FA is enabled'}
              </p>
            </div>
            {twoFactorEnabled ? (
              <button
                onClick={handleGenerateRecoveryCodes}
                disabled={processingCodes}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {processingCodes ? 'Generating...' : 'Generate Codes'}
              </button>
            ) : (
              <span className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
                Unavailable
              </span>
            )}
          </div>

          {/* Recovery Codes Display */}
          {showRecoveryCodes && recoveryCodes.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900 mb-2">
                Save these recovery codes in a secure place. Each code can only be used once.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg font-mono text-sm text-center border border-amber-200">
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadRecoveryCodes}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Download Codes
                </button>
                <button
                  onClick={() => setShowRecoveryCodes(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Password Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Password</h2>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {!showPasswordForm ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Current Password</p>
                <p className="text-sm text-gray-500">••••••••••••</p>
              </div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="Enter new password"
                />
                {passwordForm.newPassword && (
                  <p className="text-xs text-gray-500 mt-1">
                    Strength: {getPasswordStrength(passwordForm.newPassword)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Navigation Links */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Additional Security</h2>
          <div className="space-y-2">
            <Link
              href="/portal/settings/security/mfa"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Two-Factor Authentication Setup</p>
              <p className="text-sm text-gray-600">Setup authenticator app and recovery codes</p>
            </Link>
            <Link
              href="/portal/settings/security/events"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Security Events</p>
              <p className="text-sm text-gray-600">View your security history and activity</p>
            </Link>
            <Link
              href="/portal/settings/sessions"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Sessions & Devices</p>
              <p className="text-sm text-gray-600">Manage your active sessions</p>
            </Link>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Security Recommendations</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <p className="text-sm text-gray-600">Use a strong, unique password</p>
            </div>
            <div className="flex items-start gap-3">
              <span className={twoFactorEnabled ? 'text-green-500' : 'text-amber-500'}>
                {twoFactorEnabled ? '✓' : '⚠️'}
              </span>
              <p className="text-sm text-gray-600">
                {twoFactorEnabled
                  ? 'Two-factor authentication is enabled'
                  : 'Enable two-factor authentication for added security'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <p className="text-sm text-gray-600">Review active sessions regularly</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <p className="text-sm text-gray-600">Never share your password or recovery codes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}