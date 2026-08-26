'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PaymentMethodSelector from '../components/PaymentMethodSelector'

function MethodContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const invoiceId = searchParams.get('invoiceId') || ''
  const [selectedMethod, setSelectedMethod] = useState('')

  const handleContinue = () => {
    if (!selectedMethod) {
      alert('Please select a payment method')
      return
    }
    router.push(`/portal/payments/make?invoiceId=${invoiceId}&method=${selectedMethod}`)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-2">Select Payment Method</h1>
      <p className="text-sm text-gray-400 mb-6">Choose how you would like to pay</p>

      <div className="mb-6">
        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onSelect={setSelectedMethod}
        />
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedMethod}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}

export default function PaymentMethodPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <MethodContent />
    </Suspense>
  )
}