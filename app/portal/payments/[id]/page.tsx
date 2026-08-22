'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payment {
  id: string
  invoice_id: string
  client_id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  provider_reference: string | null
  internal_reference: string
  paid_at: string | null
  created_at: string
  updated_at: string
  retry_count: number
  last_retry_at: string | null
  dispute_status: string
  dispute_reason: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  project_id: string | null
  total: number
  amount: number
  currency: string
  status: string
  description: string
}

interface Project {
  id: string
  name: string
}

interface Receipt {
  id: string
  receipt_number: string
  amount: number
  currency: string
  receipt_url: string | null
  created_at: string
}

interface Refund {
  id: string
  amount: number
  reason: string | null
  status: string
  created_at: string
}

interface PaymentTransaction {
  id: string
  provider: string
  provider_reference: string | null
  status: string
  amount: number
  currency: string
  created_at: string
}

interface PaymentProof {
  id: string
  file_name: string
  file_url: string
  amount: number | null
  payment_date: string | null
  sender_name: string | null
  transaction_reference: string | null
  status: string
  created_at: string
}

interface PaymentEvent {
  id: string
  event_type: string
  description: string | null
  metadata: Record<string, any>
  created_at: string
}

interface Dispute {
  id: string
  reason: string
  description: string | null
  status: string
  resolution: string | null
  created_at: string
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params?.id as string

  const [payment, setPayment] = useState<Payment | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [events, setEvents] = useState<PaymentEvent[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Modal states
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')

  useEffect(() => {
    if (paymentId) {
      fetchPaymentData()
    }
  }, [paymentId])

  // Auto-refresh for pending payments
  useEffect(() => {
    if (payment && ['pending', 'processing', 'initiated'].includes(payment.status)) {
      const interval = setInterval(() => {
        fetchPaymentData()
      }, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [payment?.status])

  async function fetchPaymentData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('client_id', user.id)
        .single()

      if (paymentError || !paymentData) {
        router.push('/portal/payments')
        return
      }

      setPayment(paymentData)

      // Fetch invoice
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', paymentData.invoice_id)
        .single()

      if (invoiceData) {
        setInvoice(invoiceData)
        if (invoiceData.project_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', invoiceData.project_id)
            .single()
          if (projectData) setProject(projectData)
        }
      }

      // Fetch receipt
      const { data: receiptData } = await supabase
        .from('receipts')
        .select('*')
        .eq('payment_id', paymentId)
        .single()

      if (receiptData) setReceipt(receiptData)

      // Fetch refunds
      const { data: refundsData } = await supabase
        .from('refunds')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false })

      if (refundsData) setRefunds(refundsData)

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false })

      if (transactionsData) setTransactions(transactionsData)

      // Fetch payment proofs
      const { data: proofsData } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('invoice_id', paymentData.invoice_id)
        .order('created_at', { ascending: false })

      if (proofsData) setProofs(proofsData)

      // Fetch payment events
      const { data: eventsData } = await supabase
        .from('payment_events')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: true })

      if (eventsData) setEvents(eventsData)

      // Fetch disputes
      const { data: disputesData } = await supabase
        .from('payment_disputes')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false })

      if (disputesData) setDisputes(disputesData)

      setLoading(false)
    } catch (error) {
      console.error('Payment fetch error:', error)
      setLoading(false)
    }
  }

  async function handleRetryPayment() {
    if (!payment) return
    setProcessing(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setProcessing(false)
        return
      }

      const response = await fetch('/api/billing/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          clientId: user.id,
        }),
      })

      const result = await response.json()

      if (!result.success || !result.authorization_url) {
        setError(result.error || 'Failed to retry payment')
        setProcessing(false)
        return
      }

      window.location.href = result.authorization_url
    } catch (error) {
      setError('An error occurred')
      setProcessing(false)
    }
  }

  async function handleRefundRequest() {
    if (!payment || !refundAmount || !refundReason) {
      setError('Please fill in all refund fields')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setProcessing(false)
        return
      }

      const response = await fetch('/api/billing/request-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          clientId: user.id,
          amount: parseFloat(refundAmount),
          reason: refundReason,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to request refund')
        setProcessing(false)
        return
      }

      setMessage('Refund requested successfully')
      setShowRefundModal(false)
      setRefundAmount('')
      setRefundReason('')
      await fetchPaymentData()
    } catch (error) {
      setError('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  async function handleOpenDispute() {
    if (!payment || !disputeReason) {
      setError('Please provide a reason')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setProcessing(false)
        return
      }

      const response = await fetch('/api/billing/open-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          clientId: user.id,
          reason: disputeReason,
          description: disputeDescription,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to open dispute')
        setProcessing(false)
        return
      }

      setMessage('Dispute opened successfully')
      setShowDisputeModal(false)
      setDisputeReason('')
      setDisputeDescription('')
      await fetchPaymentData()
    } catch (error) {
      setError('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      initiated: { label: 'Initiated', color: 'bg-gray-100 text-gray-800', dot: '⚪' },
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      success: { label: 'Paid', color: 'bg-green-100 text-green-800', dot: '🟢' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-800', dot: '🔴' },
      abandoned: { label: 'Abandoned', color: 'bg-gray-100 text-gray-600', dot: '⚫' },
      expired: { label: 'Expired', color: 'bg-gray-100 text-gray-600', dot: '⚫' },
      reversed: { label: 'Reversed', color: 'bg-red-100 text-red-800', dot: '🔴' },
      refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800', dot: '🟣' },
      partially_refunded: { label: 'Partially Refunded', color: 'bg-purple-100 text-purple-800', dot: '🟣' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '⚪' }
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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!payment) {
    return null
  }

  const statusInfo = getStatusDisplay(payment.status)
  const isRetryable = ['failed', 'abandoned', 'expired'].includes(payment.status)
  const isRefundable = ['success', 'partially_refunded'].includes(payment.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/payments" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Payments
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 mb-4">{error}</div>
        )}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 mb-4">{message}</div>
        )}

        {/* Payment Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{payment.internal_reference}</h1>
              <p className="text-sm text-gray-600 mt-1">Created {formatDate(payment.created_at)}</p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.dot} {statusInfo.label}
            </span>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
            <p className="text-4xl font-bold text-gray-900">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
            {payment.paid_at && (
              <p className="text-sm text-gray-500 mt-2">Paid {formatDate(payment.paid_at)}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {isRetryable && (
              <button
                onClick={handleRetryPayment}
                disabled={processing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Try Again'}
              </button>
            )}
            {isRefundable && (
              <button
                onClick={() => setShowRefundModal(true)}
                className="px-6 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-xl transition-colors"
              >
                Request Refund
              </button>
            )}
            <button
              onClick={() => setShowDisputeModal(true)}
              className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-xl transition-colors"
            >
              Open Dispute
            </button>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Invoice</p>
              {invoice ? (
                <Link href={`/portal/invoices/${invoice.id}`} className="text-sm text-blue-600 hover:underline">
                  {invoice.invoice_number || 'View Invoice'}
                </Link>
              ) : <p className="text-sm text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Project</p>
              {project ? (
                <Link href={`/portal/projects/${project.id}`} className="text-sm text-blue-600 hover:underline">
                  {project.name}
                </Link>
              ) : <p className="text-sm text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Method</p>
              <p className="text-sm text-gray-900 capitalize">{payment.payment_method?.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Gateway Reference</p>
              <p className="text-sm text-gray-900">{payment.provider_reference || '—'}</p>
            </div>
            {payment.retry_count > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Retry Count</p>
                <p className="text-sm text-gray-900">{payment.retry_count} attempt(s)</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Timeline with Events */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Timeline</h3>
          <div className="space-y-4">
            {/* Basic timeline */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Payment Created</p>
                <p className="text-xs text-gray-500">{formatDate(payment.created_at)}</p>
              </div>
            </div>

            {/* Event timeline */}
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">•</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  {event.description && (
                    <p className="text-xs text-gray-600">{event.description}</p>
                  )}
                  <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                </div>
              </div>
            ))}

            {payment.status === 'success' && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Payment Confirmed</p>
                  <p className="text-xs text-gray-500">{payment.paid_at ? formatDate(payment.paid_at) : ''}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Receipt */}
        {receipt && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Receipt</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{receipt.receipt_number}</p>
                <p className="text-sm text-gray-600">{formatCurrency(receipt.amount, receipt.currency)}</p>
              </div>
              {receipt.receipt_url ? (
                <a href={receipt.receipt_url} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                  Download
                </a>
              ) : (
                <button onClick={() => window.print()}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
                  Print
                </button>
              )}
            </div>
          </div>
        )}

        {/* Payment Proofs */}
        {proofs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Proofs</h3>
            <div className="space-y-3">
              {proofs.map((proof) => (
                <div key={proof.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{proof.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {proof.amount ? formatCurrency(proof.amount) : ''}
                      {proof.payment_date ? ` • ${proof.payment_date}` : ''}
                      {proof.sender_name ? ` • ${proof.sender_name}` : ''}
                    </p>
                    {proof.transaction_reference && (
                      <p className="text-xs text-gray-400">Ref: {proof.transaction_reference}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      proof.status === 'approved' ? 'bg-green-100 text-green-800' :
                      proof.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {proof.status}
                    </span>
                    <a href={proof.file_url} target="_blank" rel="noopener noreferrer"
                       className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg">
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refunds */}
        {refunds.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Refunds</h3>
            <div className="space-y-3">
              {refunds.map((refund) => (
                <div key={refund.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(refund.amount, payment.currency)}</p>
                    {refund.reason && <p className="text-sm text-gray-600">{refund.reason}</p>}
                    <p className="text-xs text-gray-500">{formatDate(refund.created_at)}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 capitalize">
                    {refund.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disputes */}
        {disputes.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Disputes</h3>
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-900">{dispute.reason}</p>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 capitalize">
                      {dispute.status}
                    </span>
                  </div>
                  {dispute.description && <p className="text-sm text-gray-600 mt-1">{dispute.description}</p>}
                  {dispute.resolution && <p className="text-sm text-green-700 mt-1">Resolution: {dispute.resolution}</p>}
                  <p className="text-xs text-gray-500 mt-1">{formatDate(dispute.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gateway Transactions */}
        {transactions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Gateway Transactions</h3>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{tx.provider}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(tx.amount, tx.currency)}</p>
                    {tx.provider_reference && (
                      <p className="text-xs text-gray-500">Ref: {tx.provider_reference}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-800 capitalize">
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                       max={payment.amount} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                          rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleRefundRequest} disabled={processing}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl disabled:opacity-50">
                  {processing ? 'Submitting...' : 'Submit Request'}
                </button>
                <button onClick={() => setShowRefundModal(false)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Open Dispute</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
                  <option value="">Select reason...</option>
                  <option value="unauthorized_transaction">Unauthorized transaction</option>
                  <option value="duplicate_payment">Duplicate payment</option>
                  <option value="wrong_amount">Wrong amount charged</option>
                  <option value="service_not_received">Service not received</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={disputeDescription} onChange={(e) => setDisputeDescription(e.target.value)}
                          rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleOpenDispute} disabled={processing}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl disabled:opacity-50">
                  {processing ? 'Opening...' : 'Open Dispute'}
                </button>
                <button onClick={() => setShowDisputeModal(false)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}