'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Payment {
  id: string
  invoice_id: string
  client_id: string
  amount: number
  currency: string
  method: string
  payment_method: string
  status: string
  provider_reference: string
  internal_reference: string
  proof_url: string
  created_at: string
  paid_at: string
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params?.id as string

  const [payment, setPayment] = useState<Payment | null>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (paymentId) {
      fetchPayment()
    }
  }, [paymentId])

  const fetchPayment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: paymentData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('client_id', user.id)
        .single()

      if (error || !paymentData) {
        console.error('Payment not found:', error)
        setLoading(false)
        return
      }

      setPayment(paymentData)

      // Fetch invoice
      if (paymentData.invoice_id) {
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', paymentData.invoice_id)
          .single()

        if (invoiceData) {
          setInvoice(invoiceData)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Fetch payment error:', error)
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      initiated: 'bg-blue-500/20 text-blue-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      processing: 'bg-purple-500/20 text-purple-300',
      success: 'bg-green-500/20 text-green-300',
      successful: 'bg-green-500/20 text-green-300',
      failed: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-300',
      refunded: 'bg-orange-500/20 text-orange-300',
      under_review: 'bg-cyan-500/20 text-cyan-300',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0)
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/portal/payments" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
        &lt;- Back to Payments
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Payment Details</h1>

      {/* Payment Status Card */}
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
            <p className="text-xs text-gray-500">Payment Method</p>
            <p className="text-sm text-white font-medium">{payment.payment_method || payment.method || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Currency</p>
            <p className="text-sm text-white font-medium">{payment.currency || 'USD'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Reference</p>
            <p className="text-sm text-white font-medium font-mono">{payment.provider_reference || payment.internal_reference || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm text-white font-medium">{formatDate(payment.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Invoice Info */}
      {invoice && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-4">Invoice</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Invoice Number</p>
              <p className="text-white font-medium">{invoice.invoice_number}</p>
            </div>
            <Link
              href={`/portal/invoices/${invoice.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              View Invoice
            </Link>
          </div>
        </div>
      )}

      {/* Proof of Payment */}
      {payment.proof_url && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Proof of Payment</h3>
          <a
            href={payment.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            [View] View Proof
          </a>
        </div>
      )}
    </div>
  )
}