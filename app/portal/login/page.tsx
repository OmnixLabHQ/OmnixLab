'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [lockoutMessage, setLockoutMessage] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLockoutMessage('')

    const ipAddress = 'client-browser'

    // Check rate limit
    try {
      const rateCheck = await fetch('/api/auth/check-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ipAddress }),
      })
      const rateResult = await rateCheck.json()

      if (!rateResult.allowed) {
        const minutes = Math.ceil((rateResult.retryAfter || 60) / 60)
        setLockoutMessage(
          `Your account has been temporarily locked due to too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
        )
        setLoading(false)
        return
      }
    } catch (e) {
      // Continue even if rate limit check fails
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      try {
        await fetch('/api/auth/log-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, ipAddress, success: false }),
        })
      } catch (e) {}

      setError('The email or password you entered is incorrect.')
      setLoading(false)
      return
    }

    if (data.user) {
      try {
        await fetch('/api/auth/log-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, ipAddress, success: true }),
        })
      } catch (e) {}

      try {
        await fetch('/api/auth/log-security-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            eventType: 'LOGIN_SUCCESS',
            metadata: { email },
          }),
        })
      } catch (e) {}

      try {
        await fetch('/api/auth/track-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            userAgent: navigator.userAgent,
            ipAddress,
            isCurrent: true,
          }),
        })
      } catch (e) {}

      try {
        await fetch('/api/auth/login-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            userId: data.user.id,
            userAgent: navigator.userAgent,
          }),
        })
      } catch (e) {}

      // Check account status
      const { data: accountStatus } = await supabase
        .from('account_status')
        .select('status')
        .eq('user_id', data.user.id)
        .single()

      if (accountStatus?.status === 'suspended') {
        await supabase.auth.signOut()
        setError('Your account has been suspended. Please contact Omnix Lab support.')
        setLoading(false)
        return
      }

      // Check if client is approved
      const { data: client } = await supabase
        .from('clients')
        .select('approved')
        .eq('id', data.user.id)
        .single()

      if (!client?.approved) {
        await supabase.auth.signOut()
        setError('Your account is pending approval. You will be notified once approved.')
        setLoading(false)
        return
      }

      router.push('/portal/dashboard?welcome=1')
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal/dashboard?welcome=1`,
        },
      })

      if (oauthError) {
        setError('Failed to sign in with Google. Please try again.')
        setGoogleLoading(false)
      }
      // No need to setGoogleLoading(false) on success - page redirects
    } catch (error) {
      setError('An error occurred with Google sign-in.')
      setGoogleLoading(false)
    }
  }

  async function handleResendVerification() {
    setLoading(true)
    setError('')
    setVerificationSent(false)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      setError('Failed to resend verification email. Please try again.')
    } else {
      setVerificationSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold">Omnix Lab</h1>
        </div>
        <div className="max-w-md">
          <h2 className="text-white text-4xl font-bold leading-tight">Build. Automate. Scale.</h2>
          <p className="text-indigo-200 mt-4 text-lg">
            Access your Omnix Lab workspace, projects, files, invoices and communications from one secure platform.
          </p>
        </div>
        <p className="text-indigo-300 text-sm">© 2026 Omnix Lab. All rights reserved.</p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-600 mt-2">Sign in to your Omnix Lab account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mt-6">
              {error}
            </div>
          )}

          {lockoutMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm mt-6">
              🔒 {lockoutMessage}
            </div>
          )}

          {verificationSent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm mt-6">
              ✓ Verification email sent. Please check your inbox.
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="mt-6 w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a href="/portal/forgot-password" className="text-sm text-indigo-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Didn&apos;t receive verification email?{' '}
            <button onClick={handleResendVerification} className="text-indigo-600 hover:underline">
              Resend
            </button>
          </p>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a href="/portal/register" className="text-indigo-600 font-medium hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}