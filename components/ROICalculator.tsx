'use client'
import { useState } from 'react'

export default function ROICalculator() {
  const [capital, setCapital] = useState('10000')
  const [monthlyReturn, setMonthlyReturn] = useState('12')
  const [months, setMonths] = useState('12')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculateROI = () => {
    const cap = parseFloat(capital) || 0
    const rate = (parseFloat(monthlyReturn) || 0) / 100
    const period = parseInt(months) || 0
    
    let total = cap
    for (let i = 0; i < period; i++) {
      total += total * rate
    }
    const profit = total - cap
    const roiPercent = cap > 0 ? ((profit / cap) * 100).toFixed(1) : '0'
    
    return {
      finalAmount: total.toFixed(2),
      profit: profit.toFixed(2),
      roiPercent,
      monthlyProfit: (profit / period).toFixed(2)
    }
  }

  const results = calculateROI()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Send to Telegram
      const msg = `📊 *New ROI Calculator Lead*\n\n💰 Capital: $${capital}\n📈 Expected Return: ${monthlyReturn}%/month\n📅 Period: ${months} months\n📧 Email: ${email}\n\n💵 Projected Profit: $${results.profit}\n🏆 Total ROI: ${results.roiPercent}%`
      
      await fetch('https://api.telegram.org/bot8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '8550312488',
          text: msg,
          parse_mode: 'Markdown',
        }),
      })

      setSubmitted(true)
    } catch (e) {
      setError('Failed to send. Please try again.')
    }
    setLoading(false)
  }

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">
            Free Tool
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Trading Bot ROI Calculator
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            See how much a custom trading bot could earn you based on your capital and expected returns.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Capital ($)
              </label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Monthly Return (%)
              </label>
              <input
                type="number"
                value={monthlyReturn}
                onChange={e => setMonthlyReturn(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="12"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Period (months)
              </label>
              <select
                value={months}
                onChange={e => setMonths(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <h3 className="text-xl font-bold mb-6">Your Projected Results</h3>
            <div className="space-y-4">
              <div>
                <p className="text-indigo-200 text-sm">Final Balance</p>
                <p className="text-3xl font-bold">${results.finalAmount}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-indigo-200 text-sm">Total Profit</p>
                  <p className="text-xl font-bold">${results.profit}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Total ROI</p>
                  <p className="text-xl font-bold">{results.roiPercent}%</p>
                </div>
              </div>
              <div>
                <p className="text-indigo-200 text-sm">Avg. Monthly Profit</p>
                <p className="text-xl font-bold">${results.monthlyProfit}</p>
              </div>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email for full report"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none"
                />
                {error && <p className="text-red-200 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Get Full Report →'}
                </button>
              </form>
            ) : (
              <div className="mt-6 bg-white/20 rounded-xl p-4 text-center">
                <p className="font-semibold">✅ Report Sent!</p>
                <p className="text-sm text-indigo-100 mt-1">We'll email your detailed report shortly. Want to discuss a custom bot?</p>
                <a
                  href="https://wa.me/2347033702874"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                >
                  💬 Chat on WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
