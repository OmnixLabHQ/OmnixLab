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

export default function PaymentMethodSelector({ 
  selectedMethod, 
  onSelect, 
  disabled = false 
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

  const getMethodIcon = (type: string) => {
    if (type === 'gateway') return '[CARD]'
    if (type === 'crypto') return '[USDT]'
    return '[BANK]'
  }

  const getMethodDescription = (type: string) => {
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
        <p className="text-gray-500">No payment methods available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.name)}
          disabled={disabled}
          className={`w-full text-left p-5 rounded-xl border transition-colors ${
            selectedMethod === method.name
              ? 'bg-blue-500/20 border-blue-500'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-sm shrink-0">
                {getMethodIcon(method.type)}
              </span>
              <div>
                <p className="text-white font-semibold">{method.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {getMethodDescription(method.type)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Estimated processing: {getProcessingTime(method.type)}
                </p>
              </div>
            </div>
            {selectedMethod === method.name ? (
              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs shrink-0">
                [OK]
              </span>
            ) : (
              <span className="w-6 h-6 border-2 border-white/20 rounded-full shrink-0"></span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}