'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter'

const TELEGRAM_BOT = '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
const TELEGRAM_CHAT = '8550312488'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
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
    } catch (e) {
      console.error('Telegram alert failed:', e)
    }
  }

  const validateStep1 = () => {
    if (!fullName.trim() || !company.trim() || !email.trim() || !email.includes('@')) {
      setError('Please fill in all required fields with valid information.')
      return false
    }
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    setError('')
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.')
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
        setError('Registration succeeded, but profile creation failed: ' + insertError.message)
        setLoading(false)
        return
      }

      await sendTelegramAlert(fullName, company, email, phone, data.user.id)

      try {
        await supabase.from('notifications').insert({
          client_id: data.user.id,
          type: 'system',
          title: 'Welcome to Omnix Lab! 🎉',
          message: 'Your account has been created. It is pending approval. You will be notified once approved.',
          data: { status: 'pending_approval' },
        })
      } catch (e) {}

      try {
        await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName }),
        })
      } catch (e) {}

      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full p-8">
        {submitted ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
            <p className="text-gray-500 mb-4">
              Your account is pending approval. Check your email for next steps.
            </p>
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
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
                <span className="text-white font-bold text-2xl">O</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-500 text-sm mt-1">Register for the Omnix Lab Client Portal</p>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= i ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i}
                  </div>
                  {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 703 370 2874"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <button
                  onClick={handleNextStep}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
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
                  {/* Password Strength Meter */}
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
                <button
                  onClick={handleNextStep}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
                >
                  Continue
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Back
                </button>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
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
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading || !agreeTerms}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Back
                </button>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <a href="/portal/login" className="text-indigo-600 font-medium hover:underline">
                Sign In
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}