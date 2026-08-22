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

  const handleNextStep = () => {
    if (step === 1 && fullName && company && email && email.includes('@')) {
      setStep(2)
    } else if (step === 2 && password.length >= 8 && password === confirmPassword) {
      setStep(3)
    } else {
      setError('Please fill in all required fields correctly')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
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
          title: 'Welcome to Omnix Lab!',
          message: 'Your account has been created. It is pending approval.',
          data: { status: 'pending_approval' },
        })
      } catch (e) {}

      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT,
            text: `New signup: ${fullName} (${email})`,
          }),
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
            <div className="text-5xl mb-4">OK</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
            <p className="text-gray-500 mb-4">Your account is pending approval.</p>
            <button onClick={() => router.push('/portal/login')} className="text-indigo-600 font-medium hover:underline">
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Create Account</h1>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{error}</div>}

            {step === 1 && (
              <div className="space-y-4">
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name *" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company *" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                <button onClick={handleNextStep} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl">Continue</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 characters)" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                <button onClick={handleNextStep} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl">Continue</button>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleRegister} className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1" />
                  <span className="text-sm text-gray-600">I agree to the Terms of Service and Privacy Policy</span>
                </label>
                <button type="submit" disabled={loading || !agreeTerms} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Create Account'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}