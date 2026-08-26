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

      // Fetch payment
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

      // Get invoice number
      let invoiceNumber = 'N/A'
      if (paymentData.invoice_id) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('id', paymentData.invoice_id)
          .single()
        invoiceNumber = invoice?.invoice_number || 'N/A'
      }

      setPayment({
        ...paymentData,
        invoice_number: invoiceNumber,
      })

      // Fetch payment events (timeline)
      const { data: eventsData } = await supabase
        .from('payment_events')
        .select('*')
        .eq('payment_id', paymentData.id)
        .order('created_at', { ascending: true })

      setEvents(eventsData || [])

      // Fetch receipt
      const { data: receiptData } = await supabase
        .from('receipts')
        .select('*')
        .eq('payment_id', paymentData.id)
        .single()

      if (receiptData) {
        setReceipt(receiptData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Fetch payment detail error:', error)
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      initiated: 'bg-blue-500/20 text-blue-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      pending_review: 'bg-yellow-500/20 text-yellow-300',
      processing: 'bg-purple-500/20 text-purple-300',
      under_review: 'bg-cyan-500/20 text-cyan-300',
      success: 'bg-green-500/20 text-green-300',
      successful: 'bg-green-500/20 text-green-300',
      paid: 'bg-green-500/20 text-green-300',
      failed: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-300',
      refunded: 'bg-orange-500/20 text-orange-300',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function getEventIcon(eventType: string) {
    const map: Record<string, string> = {
      payment_initiated: '[>]',
      payment_submitted: '[^]',
      payment_verified: '[OK]',
      payment_success: '[OK]',
      payment_failed: '[X]',
      payment_rejected: '[X]',
      payment_approved: '[OK]',
      webhook_received: '[>]',
      receipt_generated: '[R]',
    }
    return map[eventType] || '[*]'
  }

  function formatCurrency(amount: number, currency: string = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount || 0)
    } catch {
      return `${currency} ${(amount || 0).toLocaleString()}`
    }
  }

  function formatDate(date: string) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-gray-400 mb-4">Payment not found</p>
        <Link href="/portal/payments" className="text-blue-400 hover:underline">
          Back to Payments
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href="/portal/payments"
        className="text-gray-400 hover:text-white text-sm mb-6 inline-block"
      >
        ← Back to Payments
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Payment Details</h1>

      {/* Payment Status Card per blueprint Section 21 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 text-center">
        <span className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
        <p className="text-4xl font-bold text-white mt-4">
          {formatCurrency(payment.amount, payment.currency)}
        </p>
        {payment.paid_at && (
          <p className="text-sm text-green-400 mt-2">
            Paid on {formatDate(payment.paid_at)}
          </p>
        )}
      </div>

      {/* Payment Details */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Invoice</p>
            <p className="text-sm text-white font-medium">{payment.invoice_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Method</p>
            <p className="text-sm text-white font-medium">{payment.payment_method || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Channel</p>
            <p className="text-sm text-white font-medium">{payment.payment_channel || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Currency</p>
            <p className="text-sm text-white font-medium">{payment.currency || 'USD'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Provider Reference</p>
            <p className="text-sm text-white font-mono text-xs">{payment.provider_reference || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Internal Reference</p>
            <p className="text-sm text-white font-mono text-xs">{payment.internal_reference || '-'}</p>
          </div>
        </div>
      </div>

      {/* Receipt per blueprint Section 22 */}
      {receipt && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-4">Receipt</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Receipt Number</p>
              <p className="text-white font-medium font-mono">{receipt.receipt_number}</p>
            </div>
            <Link
              href={`/portal/invoices/${payment.invoice_id}/receipt-print`}
              target="_blank"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
            >
              Download Receipt
            </Link>
          </div>
        </div>
      )}

      {/* Payment Timeline per blueprint Section 38 */}
      {events.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Payment Timeline</h3>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs">
                    {getEventIcon(event.event_type)}
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-px h-8 bg-white/10"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-400">{event.description || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(event.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}