'use client'
import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setSubscribed(true)
        setEmail('')
      } else {
        setError(data.error || 'Failed to subscribe')
      }
    } catch {
      setError('Network error, please try again')
    }
    setLoading(false)
  }

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Stay Updated</h2>
        <p className="text-lg text-gray-400 mb-10">
          Get the latest insights on development, trading bots, and tech trends delivered to your inbox.
        </p>

        {subscribed ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-8">
            <span className="text-4xl mb-4 block">🎉</span>
            <h3 className="text-xl font-bold mb-2">You&apos;re In!</h3>
            <p className="text-gray-300">Thanks for subscribing. Stay tuned for valuable insights!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </section>
  )
}
