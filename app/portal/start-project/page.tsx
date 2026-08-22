'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export default function StartProjectPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('project_requests').insert({
      client_id: user.id,
      title,
      description,
      budget: budget ? parseFloat(budget) : null,
    })

    await createNotification(
      user.id,
      'project',
      'Project Request Submitted',
      'Your project request has been received. We will review it and get back to you shortly.',
      { title, budget }
    )

    // Telegram notification
    await fetch('https://api.telegram.org/bot8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: '8550312488',
        text: `📬 New Project Request\n👤 ${user.email}\n📝 ${title}\n💰 ${budget || 'N/A'}\n📄 ${description}`,
      }),
    })

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-500 mb-6">We&apos;ll review your project request and get back to you shortly.</p>
        <button onClick={() => router.push('/portal/dashboard')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Start a Project</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="e.g., Crypto Trading Bot"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe what you need..."
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget (USD, optional)</label>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="500"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}