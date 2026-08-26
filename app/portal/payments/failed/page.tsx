'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function FailedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference') || ''
  const reason = searchParams.get('reason') || ''

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full">
        {/* Failed Icon */}
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-red-400">[X]</span>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Payment Unsuccessful
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Your payment could not be completed. Please try again.
        </p>

        {/* Reference if available */}
        {reference && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
            <p className="text-sm text-white font-mono">{reference}</p>
          </div>
        )}

        {/* Notification per blueprint Section 23 */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400 text-center">
            Payment unsuccessful — Your payment could not be completed.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-[#E11D2E] hover:bg-[#F43F5E] text-white font-semibold rounded-xl transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/portal/payments"
            className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors text-center"
          >
            Back to Payments
          </Link>
          <Link
            href="/portal/support"
            className="block w-full py-3 text-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <FailedContent />
    </Suspense>
  )
}