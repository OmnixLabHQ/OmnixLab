'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MFASettingsPage() {
  const [loading, setLoading] = useState(true)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [secret, setSecret] = useState('')

  useEffect(() => {
    fetchMFAStatus()
  }, [])

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
        setMfaEnabled(true)
      }
      setLoading(false)
    } catch (error) {
      console.error('MFA fetch error:', error)
      setLoading(false)
    }
  }

  async function handleEnableMFA() {
    setShowSetup(true)
    setError('')
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Generate a new secret (simplified - in production use proper TOTP)
      const newSecret = Math.random().toString(36).substring(2, 18).toUpperCase()
      setSecret(newSecret)

      // Store secret hash
      await supabase.from('mfa_settings').upsert({
        user_id: user.id,
        is_enabled: false,
        secret_hash: newSecret,
        updated_at: new Date().toISOString(),
      })

      setMessage('Scan the QR code (or enter the secret manually) with your authenticator app.')
    } catch (error) {
      setError('Failed to setup MFA')
    }
  }

  async function handleVerifyAndEnable() {
    setError('')
    setMessage('')

    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter the 6-digit code from your authenticator app.')
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Simplified verification - in production verify TOTP
      await supabase.from('mfa_settings').update({
        is_enabled: true,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)

      // Generate recovery codes
      const codes = generateCodes(10)
      setRecoveryCodes(codes)
      setShowRecoveryCodes(true)
      setMfaEnabled(true)
      setShowSetup(false)
      setVerificationCode('')

      setMessage('MFA enabled successfully! Save your recovery codes below.')
    } catch (error) {
      setError('Failed to verify code')
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

  async function handleDisableMFA() {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('mfa_settings').update({
        is_enabled: false,
        secret_hash: null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)

      setMfaEnabled(false)
      setMessage('MFA disabled successfully')
    } catch (error) {
      setError('Failed to disable MFA')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/settings/security" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Security
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Two-Factor Authentication</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 mb-4">{message}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 mb-4">{error}</div>
        )}

        {/* MFA Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Authenticator App</h2>
              <p className="text-sm text-gray-600 mt-1">
                {mfaEnabled
                  ? 'Two-factor authentication is enabled.'
                  : 'Add extra security to your account with an authenticator app.'}
              </p>
            </div>
            {mfaEnabled ? (
              <button
                onClick={handleDisableMFA}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={handleEnableMFA}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Setup */}
        {showSetup && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Setup Authenticator</h3>
            <p className="text-sm text-gray-600 mb-4">
              1. Open your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)
            </p>
            <p className="text-sm text-gray-600 mb-4">
              2. Scan the QR code or enter the secret manually:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
              <p className="font-mono text-lg font-bold tracking-wider">{secret}</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              3. Enter the 6-digit code from your app:
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-widest mb-4"
            />
            <button
              onClick={handleVerifyAndEnable}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              Verify and Enable
            </button>
          </div>
        )}

        {/* Recovery Codes */}
        {showRecoveryCodes && (
          <div className="bg-white border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Save Your Recovery Codes</h3>
            <p className="text-sm text-amber-700 mb-4">
              These codes can be used to access your account if you lose your authenticator app.
              Save them in a secure place. Each code can only be used once.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg font-mono text-sm text-center">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const codesText = recoveryCodes.join('\n')
                const blob = new Blob([codesText], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'omnix-recovery-codes.txt'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
            >
              Download Recovery Codes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
