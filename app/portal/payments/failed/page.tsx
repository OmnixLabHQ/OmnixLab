'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const [reference, setReference] = useState('')

  useEffect(() => {
    const ref = searchParams?.get('reference') || searchParams?.get('trxref') || ''
    setReference(ref)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Unsuccessful</h1>
        <p className="text-gray-600 mb-6">
          We couldn't complete your payment. This could be due to insufficient funds, bank decline, or network issues.
        </p>

        {reference && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500">Reference</p>
            <p className="font-mono text-sm text-gray-700">{reference}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/portal/payments/make"
            className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/portal/payments/methods"
            className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Choose Another Method
          </Link>
          <Link
            href="/portal/invoices"
            className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    </div>
  )
}