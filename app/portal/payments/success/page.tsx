'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface PaymentDetails {
  id: number
  amount: number
  currency: string
  status: string
  payment_method: string
  provider_reference: string
  paid_at: string
  invoice_number: string
  receipt_number: string
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

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference') || ''

  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (reference) {
      fetchPaymentDetails(reference)
    } else {
      setLoading(false)
    }
  }, [reference])

  const fetchPaymentDetails = async (ref: string) => {
    try {
      const { data: paymentData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_reference', ref)
        .single()

      if (error || !paymentData) {
        console.error('Payment not found:', error)
        setLoading(false)
        return
      }

      let invoiceNumber = 'N/A'
      if (paymentData.invoice_id) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('id', paymentData.invoice_id)
          .single()
        invoiceNumber = invoice?.invoice_number || 'N/A'
      }

      let receiptNumber = ''
      if (paymentData.id) {
        const { data: receipt } = await supabase
          .from('receipts')
          .select('receipt_number')
          .eq('payment_id', paymentData.id)
          .single()
        receiptNumber = receipt?.receipt_number || ''
      }

      setPayment({
        id: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        status: paymentData.status,
        payment_method: paymentData.payment_method || 'Paystack',
        provider_reference: paymentData.provider_reference || ref,
        paid_at: paymentData.paid_at || paymentData.created_at,
        invoice_number: invoiceNumber,
        receipt_number: receiptNumber,
      })
      setLoading(false)
    } catch (err) {
      console.error('Fetch payment details error:', err)
      setLoading(false)
    }
  }

  const fmt = (n: number, c: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n || 0)
    } catch {
      return `${c} ${(n || 0).toLocaleString()}`
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '100%' }}>
        {/* Success Icon */}
        <div style={{
          width: '64px', height: '64px', background: 'rgba(34,197,94,0.2)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <span style={{ fontSize: '32px', color: C.green }}>✓</span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, textAlign: 'center', margin: '0 0 8px 0' }}>
          Payment Successful!
        </h1>
        <p style={{ fontSize: '14px', color: C.text2, textAlign: 'center', margin: '0 0 24px 0' }}>
          Your payment has been received and processed.
        </p>

        {/* Payment Details */}
        {payment && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: C.text2 }}>Amount</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: C.text }}>
                  {fmt(payment.amount, payment.currency)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: C.text2 }}>Invoice</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: C.text }}>{payment.invoice_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: C.text2 }}>Method</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: C.text }}>{payment.payment_method}</span>
              </div>
              {payment.receipt_number && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: C.text2 }}>Receipt</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: C.text, fontFamily: 'monospace' }}>
                    {payment.receipt_number}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: C.text2 }}>Reference</span>
                <span style={{ fontSize: '12px', color: C.text, fontFamily: 'monospace' }}>{payment.provider_reference}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: C.green, margin: 0 }}>
            Payment successful — Your payment has been received.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => router.push('/portal/payments')}
            style={{
              width: '100%', padding: '14px', background: C.blue, color: '#000',
              border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            View Payments
          </button>
          <Link
            href="/portal/invoices"
            style={{
              display: 'block', width: '100%', padding: '14px', background: C.surface,
              color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px',
              fontSize: '15px', fontWeight: '600', textAlign: 'center', textDecoration: 'none',
            }}
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#070A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
