'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-500 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Get the latest insights on development, trading bots, and tech trends delivered to your inbox.
          </p>

          {subscribed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-500/20 border border-green-500/30 rounded-2xl p-8"
            >
              <span className="text-4xl mb-4 block">🎉</span>
              <h3 className="text-xl font-bold text-white mb-2">You&apos;re In!</h3>
              <p className="text-gray-300">Thanks for subscribing. Stay tuned for valuable insights!</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/30 whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </form>
          )}
          
          <p className="text-gray-500 text-sm mt-4">No spam. Unsubscribe anytime.</p>
        </motion.div>
      </div>
    </section>
  )
}