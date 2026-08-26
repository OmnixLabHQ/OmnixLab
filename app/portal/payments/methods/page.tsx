'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PaymentMethod {
  id: number
  name: string
  type: string
  instructions: string
  active: boolean
}

function MethodContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const invoiceId = searchParams.get('invoiceId') || ''
  
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true })

      if (error) {
        console.error('Fetch methods error:', error)
        setLoading(false)
        return
      }

      setMethods(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Fetch methods error:', err)
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!selectedMethod) {
      alert('Please select a payment method')
      return
    }

    const methodName = selectedMethod.toLowerCase().replace(/\s+/g, '_')
    const url = invoiceId 
      ? `/portal/payments/make?invoiceId=${invoiceId}&method=${methodName}`
      : `/portal/payments/make?method=${methodName}`
    
    router.push(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => router.back()}
        className="text-gray-400 hover:text-white text-sm mb-6"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-2">Select Payment Method</h1>
      <p className="text-sm text-gray-400 mb-6">Choose how you would like to pay</p>

      {/* Method Cards per blueprint Section 35 */}
      <div className="space-y-3 mb-6">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.name)}
            className={`w-full text-left p-5 rounded-xl border transition-colors ${
              selectedMethod === method.name
                ? 'bg-blue-500/20 border-blue-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-sm">
                  {method.type === 'gateway' ? '[CARD]' : method.type === 'crypto' ? '[USDT]' : '[BANK]'}
                </span>
                <div>
                  <p className="text-white font-semibold">{method.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {method.type === 'gateway' 
                      ? 'Fast online payment. Cards and supported payment methods.'
                      : method.type === 'crypto'
                      ? 'Crypto payment. Manual verification required.'
                      : 'Manual verification. Processing usually within 1 business day.'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated processing: {method.type === 'gateway' ? 'Instant' : '1 business day'}
                  </p>
                </div>
              </div>
              {selectedMethod === method.name ? (
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                  [OK]
                </span>
              ) : (
                <span className="w-6 h-6 border-2 border-white/20 rounded-full"></span>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedMethod}
        className="w-full py-4 bg-[#E11D2E] hover:bg-[#F43F5E] text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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