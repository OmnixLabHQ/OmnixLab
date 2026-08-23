'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Failed to send. Please email us directly at helloafrica@omnixlab-production.up.railway.app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Get in touch</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Ready to start your project? Fill out the form or reach out directly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent!</h3>
                <p className="text-green-700 mb-2">We&apos;ll get back to you within 24 hours.</p>
                <p className="text-green-600 text-sm mb-6">You can also reach us directly:</p>
                <div className="flex flex-col gap-3">
                  <a 
                    href="https://t.me/OmnixLab" 
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors"
                  >
                    <span>📱</span> Chat on Telegram
                  </a>
                  <a 
                    href="https://wa.me/2347033702874" 
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors"
                  >
                    <span>💬</span> Chat on WhatsApp
                  </a>
                </div>
                <button 
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({ name: '', email: '', phone: '', service: '', message: '' })
                  }}
                  className="block mx-auto mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  ← Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="+234 703 370 2874"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select 
                    value={formData.service}
                    onChange={(e) => setFormData({...formData, service: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Select a service</option>
                    <option>Web Development</option>
                    <option>Trading Bot Development</option>
                    <option>Software Development</option>
                    <option>Mobile Applications</option>
                    <option>AI & Automation</option>
                    <option>Cloud & DevOps</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                    placeholder="Tell us about your project..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <a href="mailto:helloafrica@omnixlab-production.up.railway.app" className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors group">
                  <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg group-hover:bg-indigo-100 transition-colors">✉️</span>
                  <span className="text-sm">helloafrica@omnixlab-production.up.railway.app</span>
                </a>
                <a href="https://wa.me/2347033702874" target="_blank" className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors group">
                  <span className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg group-hover:bg-green-100 transition-colors">💬</span>
                  <span className="text-sm">+234 703 370 2874</span>
                </a>
                <a href="https://t.me/OmnixLab" target="_blank" className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors group">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg group-hover:bg-blue-100 transition-colors">📱</span>
                  <span className="text-sm">@OmnixLab</span>
                </a>
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">📍</span>
                  <span className="text-sm">Available Worldwide — Remote</span>
                </div>
              </div>
            </div>

            <a 
              href="https://t.me/OmnixLab" 
              target="_blank"
              className="block w-full p-5 rounded-2xl bg-blue-500 hover:bg-blue-600 transition-colors text-center group"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <p className="text-white font-bold">Chat on Telegram</p>
                  <p className="text-blue-100 text-sm">@OmnixLab</p>
                </div>
              </div>
            </a>

            <a 
              href="https://wa.me/2347033702874?text=Hello%20Omnix%20Lab,%20I'm%20interested%20in%20your%20services" 
              target="_blank"
              className="block w-full p-5 rounded-2xl bg-green-500 hover:bg-green-600 transition-colors text-center group"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">💬</span>
                <div className="text-left">
                  <p className="text-white font-bold">Chat on WhatsApp</p>
                  <p className="text-green-100 text-sm">Instant response</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}