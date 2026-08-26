'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const reference = searchParams.get('reference') || searchParams.get('trxref') || ''
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (reference) {
      verifyPayment(reference)
    } else {
      router.push('/portal/payments/failed?reason=no_reference')
    }
  }, [reference, router])

  const verifyPayment = async (ref: string) => {
    setVerifying(true)
    setError('')

    try {
      const response = await fetch(`/api/billing/paystack/verify?reference=${encodeURIComponent(ref)}`)
      const data = await response.json()

      if (data.success) {
        // Payment verified successfully
        router.push(`/portal/payments/success?reference=${encodeURIComponent(ref)}`)
      } else {
        // Payment verification failed
        setError(data.error || 'Payment verification failed')
        setTimeout(() => {
          router.push(`/portal/payments/failed?reference=${encodeURIComponent(ref)}`)
        }, 2000)
      }
    } catch (err) {
      console.error('Verify payment error:', err)
      setError('Failed to verify payment')
      setTimeout(() => {
        router.push(`/portal/payments/failed?reference=${encodeURIComponent(ref)}`)
      }, 2000)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        {verifying ? (
          <>
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-white mb-2">Verifying Payment...</h1>
            <p className="text-sm text-gray-400">
              Please wait while we confirm your payment with Paystack.
            </p>
            {reference && (
              <p className="text-xs text-gray-500 mt-4 font-mono">
                Reference: {reference}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-400">[X]</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-sm text-red-400 mb-4">{error || 'Something went wrong'}</p>
            <button
              onClick={() => router.push('/portal/payments/failed')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}