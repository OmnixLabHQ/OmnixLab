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

const C = {
  bg: '#070A0F',
  surface: '#0D1117',
  border: '#1E293B',
  text: '#F8FAFC',
  text2: '#94A3B8',
  accent: '#E11D2E',
  green: '#22C55E',
  blue: '#38BDF8',
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

      if (error) throw error
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

  const getIcon = (type: string) => {
    if (type === 'gateway') return '💳'
    if (type === 'crypto') return '🪙'
    return '🏦'
  }

  const getDescription = (type: string) => {
    if (type === 'gateway') return 'Fast online payment. Cards and supported payment methods.'
    if (type === 'crypto') return 'Crypto payment. Manual verification required.'
    return 'Manual verification. Processing usually within 1 business day.'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: C.text2, fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}
        >
          &larr; Back
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.text, margin: '0 0 8px 0' }}>
          Select Payment Method
        </h1>
        <p style={{ fontSize: '14px', color: C.text2, margin: '0 0 24px 0' }}>
          Choose how you would like to pay
        </p>

        {/* Method Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.name)}
              style={{
                background: selectedMethod === method.name ? 'rgba(56,189,248,0.15)' : C.surface,
                border: selectedMethod === method.name ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '28px' }}>{getIcon(method.type)}</span>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: 0 }}>
                    {method.name}
                  </p>
                  <p style={{ fontSize: '13px', color: C.text2, margin: '4px 0 0 0' }}>
                    {getDescription(method.type)}
                  </p>
                  <p style={{ fontSize: '12px', color: C.text2, margin: '4px 0 0 0', opacity: 0.7 }}>
                    Estimated processing: {method.type === 'gateway' ? 'Instant' : '1 business day'}
                  </p>
                </div>
              </div>
              {selectedMethod === method.name ? (
                <span style={{
                  width: '24px', height: '24px', background: C.blue, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#000', fontSize: '12px', fontWeight: '700', flexShrink: 0,
                }}>
                  ✓
                </span>
              ) : (
                <span style={{
                  width: '24px', height: '24px', border: `2px solid ${C.border}`,
                  borderRadius: '50%', flexShrink: 0,
                }} />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedMethod}
          style={{
            width: '100%',
            padding: '16px',
            background: C.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: selectedMethod ? 'pointer' : 'not-allowed',
            opacity: selectedMethod ? 1 : 0.5,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { if (selectedMethod) e.currentTarget.style.background = '#F43F5E' }}
          onMouseLeave={(e) => { if (selectedMethod) e.currentTarget.style.background = C.accent }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default function PaymentMethodPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#070A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <MethodContent />
    </Suspense>
  )
}