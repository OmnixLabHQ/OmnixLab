'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    verifyPayment()
  }, [])

  async function verifyPayment() {
    const reference = searchParams?.get('reference')
    const trxref = searchParams?.get('trxref')

    const paymentReference = reference || trxref

    if (!paymentReference) {
      setStatus('failed')
      setMessage('No payment reference found.')
      return
    }

    try {
      const response = await fetch('/api/billing/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: paymentReference }),
      })

      const result = await response.json()

      if (result.success && result.status === 'success') {
        setStatus('success')
        setMessage('Payment confirmed! Your invoice has been updated.')
      } else if (result.success && result.status === 'pending') {
        setStatus('verifying')
        setMessage('Payment is still processing. We will update you once confirmed.')
      } else {
        setStatus('failed')
        setMessage(result.error || 'Payment verification failed.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('failed')
      setMessage('An error occurred during verification.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Successful</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/portal/invoices"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                View Invoices
              </Link>
              <Link
                href="/portal/dashboard"
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/portal/invoices"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Back to Invoices
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}