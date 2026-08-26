'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface PaymentMethod {
  id: number
  name: string
  type: string
  instructions: string
  active: boolean
}

interface PaymentMethodSelectorProps {
  selectedMethod: string
  onSelect: (method: string) => void
  disabled?: boolean
}

const C = {
  surface: '#0D1117',
  border: '#1E293B',
  text: '#F8FAFC',
  text2: '#94A3B8',
  blue: '#38BDF8',
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
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

  const getProcessingTime = (type: string) => {
    if (type === 'gateway') return 'Instant'
    return '1 business day'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '12px', padding: '24px', textAlign: 'center',
      }}>
        <p style={{ color: C.text2, margin: 0 }}>No payment methods available</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.name)}
          disabled={disabled}
          style={{
            background: selectedMethod === method.name ? 'rgba(56,189,248,0.15)' : C.surface,
            border: selectedMethod === method.name ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
            borderRadius: '12px',
            padding: '20px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
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
                Estimated processing: {getProcessingTime(method.type)}
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
  )
}