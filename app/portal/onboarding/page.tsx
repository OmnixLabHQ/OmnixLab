'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [interests, setInterests] = useState<string[]>([])

  const interestOptions = [
    'Website',
    'SaaS Platform',
    'Mobile Application',
    'Trading Bot',
    'AI Solution',
    'Custom Software',
    'Other',
  ]

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  async function handleComplete() {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('account_onboarding').upsert({
        client_id: user.id,
        company_name: companyName,
        job_title: jobTitle,
        industry,
        website,
        company_size: companySize,
        interests,
        onboarding_completed: true,
        completed_at: new Date().toISOString(),
      })

      if (insertError) {
        setError('Failed to save onboarding data')
        setLoading(false)
        return
      }

      await supabase
        .from('clients')
        .update({ onboarding_completed: true, onboarding_started_at: new Date().toISOString() })
        .eq('id', user.id)

      router.push('/portal/dashboard?onboarded=1')
    } catch (e) {
      setError('An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Omnix Lab</h1>
          <p className="text-gray-600 mt-2">Let&apos;s set up your workspace.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= i ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i}
              </div>
              {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Job Title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
                <option value="">Select Industry</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button onClick={() => setStep(2)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
                <option value="">Select Size</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
            <button onClick={() => setStep(3)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="font-medium text-gray-900">What are you interested in?</p>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    interests.includes(interest)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <button onClick={handleComplete} disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {loading ? 'Completing...' : 'Complete Setup'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}