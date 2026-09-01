'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Billing profile state
  const [billingProfile, setBillingProfile] = useState({
    company: '',
    billing_email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    tax_id: '',
    vat_id: '',
  })

  // Payment preferences
  const [preferredMethod, setPreferredMethod] = useState('paystack')

  const paymentMethods = [
    { key: 'paystack', label: 'Paystack (Online Payment)', available: true, description: 'Secure card and bank payment' },
    { key: 'flutterwave', label: 'Flutterwave', available: false, description: 'Multiple payment channels' },
    { key: 'bank_transfer', label: 'Bank Transfer', available: true, description: 'Direct bank transfer' },
    { key: 'wire_transfer', label: 'Wire Transfer', available: true, description: 'International wire transfer' },
    { key: 'fedwire', label: 'Fedwire', available: true, description: 'US Federal Reserve wire' },
    { key: 'remitly', label: 'Remitly', available: true, description: 'International remittance' },
    { key: 'worldremit', label: 'WorldRemit', available: true, description: 'Online money transfer' },
    { key: 'western_union', label: 'Western Union', available: true, description: 'Global money transfer' },
    { key: 'moneygram', label: 'MoneyGram', available: true, description: 'Global money transfer' },
    { key: 'usdt', label: 'USDT (Crypto)', available: true, description: 'Tether USD cryptocurrency' },
    { key: 'local_wire', label: 'Local Wire Transfer', available: true, description: 'Domestic wire transfer' },
  ]

  useEffect(() => {
    fetchBillingProfile()
  }, [])

  async function fetchBillingProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch client data
      const { data: client } = await supabase
        .from('clients')
        .select('company, email')
        .eq('id', user.id)
        .single()

      if (client) {
        setBillingProfile((prev) => ({
          ...prev,
          company: client.company || '',
          billing_email: client.email || '',
        }))
      }

      // Fetch billing address if exists
      const { data: address } = await supabase
        .from('billing_addresses')
        .select('*')
        .eq('client_id', user.id)
        .eq('is_default', true)
        .single()

      if (address) {
        setBillingProfile((prev) => ({
          ...prev,
          address_line1: address.address_line1 || '',
          address_line2: address.address_line2 || '',
          city: address.city || '',
          state: address.state || '',
          country: address.country || '',
          postal_code: address.postal_code || '',
          tax_id: address.tax_id || '',
        }))
      }

      // Fetch payment preference
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
      console.error('Billing fetch error:', error)
      setLoading(false)
    }
  }

  async function handleSaveBillingProfile() {
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

      // Check if billing address exists
      const { data: existingAddress } = await supabase
        .from('billing_addresses')
        .select('id')
        .eq('client_id', user.id)
        .eq('is_default', true)
        .single()

      if (existingAddress) {
        // Update existing
        const { error } = await supabase
          .from('billing_addresses')
          .update({
            address_line1: billingProfile.address_line1,
            address_line2: billingProfile.address_line2,
            city: billingProfile.city,
            state: billingProfile.state,
            country: billingProfile.country,
            postal_code: billingProfile.postal_code,
            tax_id: billingProfile.tax_id,
          })
          .eq('id', existingAddress.id)

        if (error) {
          setMessage('Failed to save billing address')
          setSaving(false)
          return
        }
      } else {
        // Insert new
        const { error } = await supabase.from('billing_addresses').insert({
          client_id: user.id,
          address_line1: billingProfile.address_line1,
          address_line2: billingProfile.address_line2,
          city: billingProfile.city,
          state: billingProfile.state,
          country: billingProfile.country,
          postal_code: billingProfile.postal_code,
          tax_id: billingProfile.tax_id,
          is_default: true,
        })

        if (error) {
          setMessage('Failed to create billing address')
          setSaving(false)
          return
        }
      }

      setMessage('Billing profile saved successfully')
    } catch (error) {
      console.error('Billing save error:', error)
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePaymentPreference() {
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
        setMessage('Failed to save payment preference')
      } else {
        setMessage('Payment preference saved successfully')
      }
    } catch (error) {
      console.error('Payment pref save error:', error)
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/settings" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Settings
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing Settings</h1>

        {message && (
          <div className={`p-4 rounded-lg mb-4 ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Billing Profile */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Billing Profile</h2>
            <button
              onClick={handleSaveBillingProfile}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={billingProfile.company}
                onChange={(e) => setBillingProfile({ ...billingProfile, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
              <input
                type="email"
                value={billingProfile.billing_email}
                onChange={(e) => setBillingProfile({ ...billingProfile, billing_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                type="text"
                value={billingProfile.address_line1}
                onChange={(e) => setBillingProfile({ ...billingProfile, address_line1: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (optional)</label>
              <input
                type="text"
                value={billingProfile.address_line2}
                onChange={(e) => setBillingProfile({ ...billingProfile, address_line2: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={billingProfile.city}
                  onChange={(e) => setBillingProfile({ ...billingProfile, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <input
                  type="text"
                  value={billingProfile.state}
                  onChange={(e) => setBillingProfile({ ...billingProfile, state: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={billingProfile.country}
                  onChange={(e) => setBillingProfile({ ...billingProfile, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={billingProfile.postal_code}
                  onChange={(e) => setBillingProfile({ ...billingProfile, postal_code: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (optional)</label>
                <input
                  type="text"
                  value={billingProfile.tax_id}
                  onChange={(e) => setBillingProfile({ ...billingProfile, tax_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT ID (optional)</label>
                <input
                  type="text"
                  value={billingProfile.vat_id}
                  onChange={(e) => setBillingProfile({ ...billingProfile, vat_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Preferred Payment Method</h2>
            <button
              onClick={handleSavePaymentPreference}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preference'}
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Select your preferred payment method for invoices. Individual invoices may still show
            other available payment options.
          </p>

          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.key}
                onClick={() => setPreferredMethod(method.key)}
                disabled={!method.available}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors text-left ${
                  preferredMethod === method.key
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div>
                  <p className="font-medium text-gray-900">{method.label}</p>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {method.available ? (
                    <span className="text-green-500 text-sm">✓ Available</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Coming soon</span>
                  )}
                  {preferredMethod === method.key && (
                    <span className="w-4 h-4 bg-blue-600 rounded-full border-2 border-blue-600"></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Security Notice:</strong> Omnix Lab will never ask you to send payment to
            an unofficial account or wallet. Always verify payment instructions displayed
            inside your portal or sent from official Omnix Lab channels.
          </p>
        </div>
      </div>
    </div>
  )
}
