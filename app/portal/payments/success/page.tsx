'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  useEffect(() => {
    verifyPayment()
  }, [])

  async function verifyPayment() {
    const reference = searchParams?.get('reference') || searchParams?.get('trxref')
    
    if (!reference) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/billing/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const result = await response.json()
      setPaymentInfo(result)
      setLoading(false)
    } catch (error) {
      console.error('Verification error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been confirmed. A receipt has been generated.
        </p>

        {paymentInfo?.amount && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">Amount Paid</p>
            <p className="text-2xl font-bold text-gray-900">
              {paymentInfo.currency} {paymentInfo.amount?.toLocaleString()}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/portal/payments"
            className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            View Payments
          </Link>
          <Link
            href="/portal/invoices"
            className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            View Invoices
          </Link>
          <Link
            href="/portal/dashboard"
            className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}