'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter'

const TELEGRAM_BOT = '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
const TELEGRAM_CHAT = '8550312488'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => router.push('/portal/login'), 5000)
      return () => clearTimeout(timer)
    }
  }, [submitted, router])

  const sendTelegramAlert = async (name: string, companyName: string, userEmail: string, userPhone: string, userId: string) => {
    const msg = `🆕 *New Portal Signup!*\n\n👤 *Name:* ${name}\n🏢 *Company:* ${companyName}\n📧 *Email:* ${userEmail}${userPhone ? `\n📞 *Phone:* ${userPhone}` : ''}\n🆔 *User ID:* \`${userId}\`\n🕐 *Time:* ${new Date().toLocaleString()}\n\n⚠️ *Action Required:* Approve or reject this user.`

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT,
          text: msg,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve:${userId}` },
                { text: '❌ Reject', callback_data: `reject:${userId}` }
              ]
            ]
          }
        }),
      })
    } catch (e) {}
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company: company,
          phone: phone,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: insertError } = await supabase.from('clients').insert({
        id: data.user.id,
        full_name: fullName,
        company: company,
        phone: phone,
        email: email,
        approved: false,
      })

      if (insertError) {
        setError('Database error: ' + insertError.message)
        setLoading(false)
        return
      }

      try {
        await supabase.from('notifications').insert({
          client_id: data.user.id,
          type: 'system',
          title: 'Welcome to Omnix Lab! 🎉',
          message: 'Your account has been created. It is pending approval. You will be notified once approved.',
          data: { status: 'pending_approval' },
        })
      } catch (e) {}

      await sendTelegramAlert(fullName, company, email, phone, data.user.id)

// Send welcome email to client
try {
  await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, fullName }),
  })
} catch (emailError) {
  console.error('Welcome email error:', emailError)
}

setSubmitted(true)
setLoading(false)

    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-950">
      {/* Left visual panel (same as login) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black" />
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/40 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
            OMNIX LAB
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-4">Start your journey.</h2>
            <p className="text-gray-300 text-lg">
              Create your Omnix Lab account and gain access to a secure workspace for projects, files, payments, and communication.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="px-3 py-1 bg-white/10 rounded-full">Secure</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Enterprise</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Collaborative</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            © 2026 Omnix Lab. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="w-2 h-2 bg-indigo-600 rounded-full" />
              OMNIX LAB
            </div>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
              <p className="text-gray-500 mb-4">Your account is pending approval. Check your email for next steps.</p>
              <p className="text-gray-400 text-sm mb-6">Redirecting to sign-in page in 5 seconds...</p>
              <button
                onClick={() => router.push('/portal/login')}
                className="text-indigo-600 font-medium hover:underline"
              >
                Go to Sign In now →
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <p className="text-gray-600 mt-2">Start managing your projects, communication, files and payments.</p>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    placeholder="Your company name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 703 370 2874"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
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
                  <PasswordStrengthMeter password={password} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the <a href="/terms" className="text-indigo-600 hover:underline">Terms of Service</a> and{' '}
                    <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !agreeTerms}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/portal/login" className="text-indigo-600 font-medium hover:underline">
                  Sign In
                </a>
              </p>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Secure authentication. Your information is protected.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}