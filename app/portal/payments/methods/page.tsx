'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface PaymentMethod {
  key: string
  label: string
  description: string
  category: string
  available: boolean
}

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [preferredMethod, setPreferredMethod] = useState('paystack')

  const paymentMethods: PaymentMethod[] = [
    // Online Checkout
    { key: 'paystack', label: 'Paystack', description: 'Secure card and bank payment', category: 'Online Checkout', available: true },
    { key: 'flutterwave', label: 'Flutterwave', description: 'Multiple payment channels', category: 'Online Checkout', available: false },
    // Bank Payments
    { key: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank transfer', category: 'Bank Payments', available: true },
    { key: 'wire_transfer', label: 'Wire Transfer', description: 'International wire transfer', category: 'Bank Payments', available: true },
    { key: 'fedwire', label: 'Fedwire', description: 'US Federal Reserve wire', category: 'Bank Payments', available: true },
    { key: 'local_wire', label: 'Local Wire Transfer', description: 'Domestic wire transfer', category: 'Bank Payments', available: true },
    // Remittance
    { key: 'remitly', label: 'Remitly', description: 'International remittance', category: 'Remittance', available: true },
    { key: 'worldremit', label: 'WorldRemit', description: 'Online money transfer', category: 'Remittance', available: true },
    { key: 'western_union', label: 'Western Union', description: 'Global money transfer', category: 'Remittance', available: true },
    { key: 'moneygram', label: 'MoneyGram', description: 'Global money transfer', category: 'Remittance', available: true },
    // Cryptocurrency
    { key: 'usdt', label: 'USDT (Tether)', description: 'Tether USD cryptocurrency', category: 'Cryptocurrency', available: true },
  ]

  useEffect(() => {
    fetchPreference()
  }, [])

  async function fetchPreference() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('preferred_payment_method')
        .eq('client_id', user.id)
        .single()

      if (prefs?.preferred_payment_method) {
        setPreferredMethod(prefs.preferred_payment_method)
      }

      setLoading(false)
    } catch (error) {
      console.error('Preference fetch error:', error)
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          client_id: user.id,
          preferred_payment_method: preferredMethod,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setMessage('Failed to save preference')
      } else {
        setMessage('Payment preference saved successfully')
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const categories = ['Online Checkout', 'Bank Payments', 'Remittance', 'Cryptocurrency']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/payments" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Payments
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preference'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-4 ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {categories.map((category) => (
          <div key={category} className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">{category}</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="divide-y divide-gray-100">
                {paymentMethods
                  .filter((m) => m.category === category)
                  .map((method) => (
                    <button
                      key={method.key}
                      onClick={() => setPreferredMethod(method.key)}
                      disabled={!method.available}
                      className={`w-full p-4 flex items-center justify-between transition-colors text-left ${
                        preferredMethod === method.key
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {method.available ? (
                          <span className="text-green-500 text-sm">✓ Available</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Coming Soon</span>
                        )}
                        {preferredMethod === method.key && (
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                            Preferred
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ))}

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Security Notice:</strong> Omnix Lab will never ask you to send payment to an
            unofficial account or wallet. Always verify payment instructions inside your portal.
          </p>
        </div>
      </div>
    </div>
  )
}