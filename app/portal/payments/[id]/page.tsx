'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Payment {
  id: number
  invoice_id: number
  client_id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  payment_channel: string
  provider_reference: string
  internal_reference: string
  paid_at: string
  created_at: string
  invoice_number: string
}

interface PaymentEvent {
  id: number
  payment_id: number
  event_type: string
  description: string
  metadata: any
  created_at: string
}

interface Receipt {
  id: number
  receipt_number: string
  amount: number
  currency: string
  created_at: string
}

const C = {
  bg: '#070A0F',
  surface: '#0D1117',
  border: '#1E293B',
  text: '#F8FAFC',
  text2: '#94A3B8',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#F59E0B',
  blue: '#38BDF8',
  purple: '#A78BFA',
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params?.id as string

  const [payment, setPayment] = useState<Payment | null>(null)
  const [events, setEvents] = useState<PaymentEvent[]>([])
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetail()
    }
  }, [paymentId])

  const fetchPaymentDetail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: paymentData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', Number(paymentId))
        .eq('client_id', user.id)
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

      setPayment({ ...paymentData, invoice_number: invoiceNumber })

      const { data: eventsData } = await supabase
        .from('payment_events')
        .select('*')
        .eq('payment_id', paymentData.id)
        .order('created_at', { ascending: true })

      setEvents(eventsData || [])

      const { data: receiptData } = await supabase
        .from('receipts')
        .select('*')
        .eq('payment_id', paymentData.id)
        .single()

      if (receiptData) setReceipt(receiptData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch payment detail error:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      success: 'rgba(34,197,94,0.2)',
      successful: 'rgba(34,197,94,0.2)',
      paid: 'rgba(34,197,94,0.2)',
      failed: 'rgba(239,68,68,0.2)',
      pending: 'rgba(245,158,11,0.2)',
      pending_review: 'rgba(245,158,11,0.2)',
      initiated: 'rgba(56,189,248,0.2)',
      processing: 'rgba(167,139,250,0.2)',
      refunded: 'rgba(239,68,68,0.2)',
      cancelled: 'rgba(148,163,184,0.2)',
    }
    return map[status?.toLowerCase()] || 'rgba(148,163,184,0.2)'
  }

  const getStatusTextColor = (status: string) => {
    const map: Record<string, string> = {
      success: C.green,
      successful: C.green,
      paid: C.green,
      failed: C.red,
      pending: C.yellow,
      pending_review: C.yellow,
      initiated: C.blue,
      processing: C.purple,
      refunded: C.red,
      cancelled: C.text2,
    }
    return map[status?.toLowerCase()] || C.text2
  }

  const getEventIcon = (eventType: string) => {
    const map: Record<string, string> = {
      payment_initiated: '>',
      payment_submitted: '^',
      payment_verified: '✓',
      payment_success: '✓',
      payment_failed: '✕',
      payment_rejected: '✕',
      payment_approved: '✓',
      webhook_received: '>',
      receipt_generated: 'R',
    }
    return map[eventType] || '*'
  }

  const fmt = (n: number, c: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n || 0)
    } catch {
      return `${c} ${(n || 0).toLocaleString()}`
    }
  }

  const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.text2, marginBottom: '16px' }}>Payment not found</p>
          <Link href="/portal/payments" style={{ color: C.blue, textDecoration: 'none' }}>
            Back to Payments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <Link href="/portal/payments" style={{ color: C.text2, fontSize: '14px', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          &larr; Back to Payments
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.text, margin: '0 0 24px 0' }}>
          Payment Details
        </h1>

        {/* Status Card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', padding: '6px 20px', borderRadius: '9999px',
            fontSize: '14px', fontWeight: '600', background: getStatusColor(payment.status), color: getStatusTextColor(payment.status),
          }}>
            {payment.status}
          </span>
          <p style={{ fontSize: '40px', fontWeight: '700', color: C.text, margin: '16px 0 4px 0' }}>
            {fmt(payment.amount, payment.currency)}
          </p>
          {payment.paid_at && (
            <p style={{ fontSize: '13px', color: C.green, margin: 0 }}>
              Paid on {formatDate(payment.paid_at)}
            </p>
          )}
        </div>

        {/* Details */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: '0 0 16px 0' }}>Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Invoice</p>
              <p style={{ fontSize: '14px', fontWeight: '500', color: C.text, margin: 0 }}>{payment.invoice_number}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Payment Method</p>
              <p style={{ fontSize: '14px', fontWeight: '500', color: C.text, margin: 0 }}>{payment.payment_method || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Channel</p>
              <p style={{ fontSize: '14px', fontWeight: '500', color: C.text, margin: 0 }}>{payment.payment_channel || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Currency</p>
              <p style={{ fontSize: '14px', fontWeight: '500', color: C.text, margin: 0 }}>{payment.currency || 'USD'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Provider Reference</p>
              <p style={{ fontSize: '12px', color: C.text, fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>{payment.provider_reference || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Internal Reference</p>
              <p style={{ fontSize: '12px', color: C.text, fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>{payment.internal_reference || '-'}</p>
            </div>
          </div>
        </div>

        {/* Receipt */}
        {receipt && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: '0 0 16px 0' }}>Receipt</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Receipt Number</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: C.text, fontFamily: 'monospace', margin: 0 }}>
                  {receipt.receipt_number}
                </p>
              </div>
              <Link
                href={`/portal/invoices/${payment.invoice_id}/receipt-print`}
                target="_blank"
                style={{
                  padding: '10px 20px', background: C.green, color: '#fff',
                  borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none',
                }}
              >
                Download Receipt
              </Link>
            </div>
          </div>
        )}

        {/* Timeline */}
        {events.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: '0 0 16px 0' }}>Payment Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {events.map((event, index) => (
                <div key={event.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '28px', height: '28px', background: C.bg, border: `1px solid ${C.border}`,
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: C.blue, fontWeight: '700', flexShrink: 0,
                    }}>
                      {getEventIcon(event.event_type)}
                    </div>
                    {index < events.length - 1 && (
                      <div style={{ width: '2px', height: '32px', background: C.border }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: '20px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: '0 0 2px 0' }}>
                      {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 2px 0' }}>{event.description || '-'}</p>
                    <p style={{ fontSize: '11px', color: C.text2, opacity: 0.7, margin: 0 }}>{formatDate(event.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}