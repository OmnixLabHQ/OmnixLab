'use client'

import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function FailedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || ''

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-red-400">[X]</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
        <p className="text-gray-400 mb-4">
          Your payment could not be processed. Please try again.
        </p>
        {reference && (
          <p className="text-xs text-gray-500 mb-6">
            Reference: {reference}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/portal/invoices')}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FailedPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <FailedContent />
    </Suspense>
  )
}