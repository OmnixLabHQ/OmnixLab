'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const reference = searchParams.get('reference') || searchParams.get('trxref') || ''
  const status = searchParams.get('status') || ''

  useEffect(() => {
    if (reference) {
      // Verify payment
      fetch(`/api/billing/paystack/verify?reference=${reference}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            router.push('/portal/payments/success?reference=' + reference)
          } else {
            router.push('/portal/payments/failed?reference=' + reference)
          }
        })
        .catch(() => {
          router.push('/portal/payments/failed')
        })
    } else {
      router.push('/portal/payments/failed')
    }
  }, [reference, router])

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Verifying payment...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  )
}