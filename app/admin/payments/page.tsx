'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Payment {
  id: string
  invoice_id: string
  client_id: string
  amount: number
  currency: string
  method: string
  status: string
  reference: string
  transaction_id: string | null
  gateway_response: any | null
  proof_url: string | null
  client_name: string
  invoice_number: string
  created_at: string
  updated_at: string
  verified_at: string | null
  verified_by: string | null
}

const ITEMS_PER_PAGE = 10

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedPayments, setPaginatedPayments] = useState<Payment[]>([])
  
  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  
  // Form states
  const [rejectReason, setRejectReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  
  // UI states
  const [processing, setProcessing] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    successful: 0,
    failed: 0,
    needsReview: 0,
    totalAmount: 0,
  })

  // Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'manual' | 'webhooks'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, methodFilter, payments, activeTab])

  useEffect(() => {
    updatePagination()
  }, [filteredPayments, currentPage])

  useEffect(() => {
    calculateStats()
  }, [payments])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      const paymentsWithDetails = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          let clientName = 'Unknown'
          if (payment.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', payment.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          let invoiceNumber = 'N/A'
          if (payment.invoice_id) {
            const { data: invoice } = await supabase
              .from('invoices')
              .select('invoice_number')
              .eq('id', payment.invoice_id)
              .single()
            invoiceNumber = invoice?.invoice_number || 'N/A'
          }

          return {
            ...payment,
            client_name: clientName,
            invoice_number: invoiceNumber,
          }
        })
      )

      setPayments(paymentsWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch payments error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats() {
    const total = payments.length
    const pending = payments.filter(p => p.status === 'pending').length
    const successful = payments.filter(p => p.status === 'successful').length
    const failed = payments.filter(p => p.status === 'failed').length
    const needsReview = payments.filter(p => p.status === 'needs_review').length
    const totalAmount = payments
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + p.amount, 0)

    setStats({ total, pending, successful, failed, needsReview, totalAmount })
  }

  function applyFilters() {
    let filtered = [...payments]

    // Apply tab filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(p => ['pending', 'needs_review', 'under_review'].includes(p.status))
    } else if (activeTab === 'manual') {
      filtered = filtered.filter(p => 
        ['bank_transfer', 'wire_transfer', 'fedwire', 'remitly', 'worldremit', 'western_union', 'moneygram', 'usdt', 'local_wire'].includes(p.method)
      )
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (payment) =>
          payment.reference?.toLowerCase().includes(term) ||
          payment.client_name?.toLowerCase().includes(term) ||
          payment.invoice_number?.toLowerCase().includes(term) ||
          payment.transaction_id?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.method === methodFilter)
    }

    setFilteredPayments(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedPayments(filteredPayments.slice(start, end))
  }

  async function handleVerifyPayment() {
    if (!selectedPayment) return

    setProcessing(true)
    try {
      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'successful',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id)

      // Update invoice status
      if (selectedPayment.invoice_id) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('id', selectedPayment.invoice_id)
          .single()

        if (invoice) {
          const { data: existingPayments } = await supabase
            .from('payments')
            .select('amount, status')
            .eq('invoice_id', selectedPayment.invoice_id)
            .eq('status', 'successful')

          const totalPaid = (existingPayments || []).reduce((sum, p) => sum + p.amount, 0)
          const newStatus = totalPaid >= invoice.total_amount ? 'paid' : 'partially_paid'

          await supabase
            .from('invoices')
            .update({
              status: newStatus,
              paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', selectedPayment.invoice_id)
        }
      }

      // Create notification
      await supabase.from('notifications').insert({
        user_id: selectedPayment.client_id,
        type: 'payment_verified',
        title: 'Payment Verified',
        message: `Your payment of ${formatCurrency(selectedPayment.amount, selectedPayment.currency)} has been verified`,
        read: false,
        created_at: new Date().toISOString(),
      })

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: selectedPayment.client_id,
        action_type: 'payment_verified',
        description: `Payment ${selectedPayment.reference} verified`,
        entity_type: 'payment',
        entity_id: selectedPayment.id,
      })

      setShowVerifyModal(false)
      fetchData()
    } catch (error) {
      console.error('Verify payment error:', error)
      alert('Failed to verify payment')
    } finally {
      setProcessing(false)
    }
  }

  async function handleRejectPayment() {
    if (!selectedPayment) return

    setProcessing(true)
    try {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id)

      // Create notification
      await supabase.from('notifications').insert({
        user_id: selectedPayment.client_id,
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: `Your payment ${selectedPayment.reference} was rejected. Reason: ${rejectReason || 'N/A'}`,
        read: false,
        created_at: new Date().toISOString(),
      })

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: selectedPayment.client_id,
        action_type: 'payment_rejected',
        description: `Payment ${selectedPayment.reference} rejected - ${rejectReason || 'N/A'}`,
        entity_type: 'payment',
        entity_id: selectedPayment.id,
      })

      setShowRejectModal(false)
      setRejectReason('')
      fetchData()
    } catch (error) {
      console.error('Reject payment error:', error)
      alert('Failed to reject payment')
    } finally {
      setProcessing(false)
    }
  }

  async function handleRefundPayment() {
    if (!selectedPayment || !refundAmount) {
      alert('Please enter refund amount')
      return
    }

    setProcessing(true)
    try {
      const amount = parseFloat(refundAmount)

      // Create refund record
      await supabase.from('payments').insert({
        invoice_id: selectedPayment.invoice_id,
        client_id: selectedPayment.client_id,
        amount: -amount,
        currency: selectedPayment.currency,
        method: 'refund',
        status: 'refunded',
        reference: `REFUND-${Date.now()}`,
        created_at: new Date().toISOString(),
      })

      // Update original payment status
      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id)

      // Update invoice if needed
      if (selectedPayment.invoice_id) {
        await supabase
          .from('invoices')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedPayment.invoice_id)
      }

      // Create notification
      await supabase.from('notifications').insert({
        user_id: selectedPayment.client_id,
        type: 'refund_issued',
        title: 'Refund Issued',
        message: `Refund of ${formatCurrency(amount, selectedPayment.currency)} issued`,
        read: false,
        created_at: new Date().toISOString(),
      })

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: selectedPayment.client_id,
        action_type: 'refund_issued',
        description: `Refund of ${amount} issued for payment ${selectedPayment.reference} - ${refundReason || 'N/A'}`,
        entity_type: 'payment',
        entity_id: selectedPayment.id,
      })

      setShowRefundModal(false)
      setRefundAmount('')
      setRefundReason('')
      fetchData()
    } catch (error) {
      console.error('Refund payment error:', error)
      alert('Failed to issue refund')
    } finally {
      setProcessing(false)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      initiated: 'bg-blue-500/20 text-blue-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      processing: 'bg-cyan-500/20 text-cyan-300',
      successful: 'bg-green-500/20 text-green-300',
      failed: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-300',
      refunded: 'bg-orange-500/20 text-orange-300',
      partially_refunded: 'bg-orange-500/20 text-orange-300',
      under_review: 'bg-purple-500/20 text-purple-300',
      needs_review: 'bg-purple-500/20 text-purple-300',
      reversed: 'bg-red-500/20 text-red-300',
      disputed: 'bg-red-500/20 text-red-300',
    }
    return map[status.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function getMethodLabel(method: string) {
    const map: Record<string, string> = {
      paystack: 'Paystack',
      flutterwave: 'Flutterwave',
      bank_transfer: 'Bank Transfer',
      wire_transfer: 'Wire Transfer',
      fedwire: 'Fedwire',
      remitly: 'Remitly',
      worldremit: 'WorldRemit',
      western_union: 'Western Union',
      moneygram: 'MoneyGram',
      usdt: 'USDT',
      local_wire: 'Local Wire Transfer',
      cash: 'Cash',
      refund: 'Refund',
    }
    return map[method] || method
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredPayments.length} total payments
            {stats.needsReview > 0 && ` • ${stats.needsReview} need review`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Payments</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Needs Review</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.needsReview}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Successful</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.successful}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Received</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalAmount, 'USD')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Payments
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Manual Payments
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by reference, client, invoice, or transaction ID..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="initiated" className="bg-gray-900">Initiated</option>
          <option value="pending" className="bg-gray-900">Pending</option>
          <option value="processing" className="bg-gray-900">Processing</option>
          <option value="successful" className="bg-gray-900">Successful</option>
          <option value="failed" className="bg-gray-900">Failed</option>
          <option value="cancelled" className="bg-gray-900">Cancelled</option>
          <option value="refunded" className="bg-gray-900">Refunded</option>
          <option value="needs_review" className="bg-gray-900">Needs Review</option>
          <option value="under_review" className="bg-gray-900">Under Review</option>
          <option value="disputed" className="bg-gray-900">Disputed</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Methods</option>
          <option value="paystack" className="bg-gray-900">Paystack</option>
          <option value="flutterwave" className="bg-gray-900">Flutterwave</option>
          <option value="bank_transfer" className="bg-gray-900">Bank Transfer</option>
          <option value="wire_transfer" className="bg-gray-900">Wire Transfer</option>
          <option value="fedwire" className="bg-gray-900">Fedwire</option>
          <option value="remitly" className="bg-gray-900">Remitly</option>
          <option value="worldremit" className="bg-gray-900">WorldRemit</option>
          <option value="western_union" className="bg-gray-900">Western Union</option>
          <option value="moneygram" className="bg-gray-900">MoneyGram</option>
          <option value="usdt" className="bg-gray-900">USDT</option>
          <option value="local_wire" className="bg-gray-900">Local Wire</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Reference</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Invoice</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Method</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="text-4xl mb-3">💳</div>
                  <p className="text-gray-500">No payments found</p>
                  <p className="text-gray-600 text-xs mt-1">Payments will appear here</p>
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }}
                      className="text-white font-medium hover:text-blue-400 text-left"
                    >
                      {payment.reference || 'N/A'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{payment.client_name}</td>
                  <td className="py-3 px-4 text-gray-300">{payment.invoice_number}</td>
                  <td className="py-3 px-4 text-white font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td className="py-3 px-4 text-gray-300">{getMethodLabel(payment.method)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(payment.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View
                      </button>
                      {['pending', 'needs_review', 'under_review'].includes(payment.status) && (
                        <>
                          <button
                            onClick={() => { setSelectedPayment(payment); setShowVerifyModal(true); }}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => { setSelectedPayment(payment); setShowRejectModal(true); }}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {payment.status === 'successful' && (
                        <button
                          onClick={() => { setSelectedPayment(payment); setShowRefundModal(true); }}
                          className="text-orange-400 hover:text-orange-300 text-xs"
                        >
                          Refund
                        </button>
                      )}
                      {payment.proof_url && (
                        <a
                          href={payment.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-xs"
                        >
                          Proof
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPayment.reference || 'Payment Details'}</h2>
                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm text-white">{selectedPayment.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Invoice</p>
                  <p className="text-sm text-white">{selectedPayment.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Method</p>
                  <p className="text-sm text-white">{getMethodLabel(selectedPayment.method)}</p>
                </div>
                {selectedPayment.transaction_id && (
                  <div>
                    <p className="text-xs text-gray-500">Transaction ID</p>
                    <p className="text-sm text-white">{selectedPayment.transaction_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm text-white">{formatDate(selectedPayment.created_at)}</p>
                </div>
                {selectedPayment.verified_at && (
                  <div>
                    <p className="text-xs text-gray-500">Verified At</p>
                    <p className="text-sm text-white">{formatDate(selectedPayment.verified_at)}</p>
                  </div>
                )}
              </div>

              {selectedPayment.proof_url && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Proof</p>
                  <a
                    href={selectedPayment.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    📎 View Proof
                  </a>
                </div>
              )}

              {selectedPayment.gateway_response && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gateway Response</p>
                  <pre className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedPayment.gateway_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {['pending', 'needs_review', 'under_review'].includes(selectedPayment.status) && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowVerifyModal(true);
                    }}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedPayment.status === 'successful' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowRefundModal(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"
                >
                  Issue Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Verify Payment</h2>
              <button onClick={() => setShowVerifyModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Verify payment of <span className="text-white font-medium">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</span> from {selectedPayment.client_name}?
              </p>
              {selectedPayment.proof_url && (
                <a
                  href={selectedPayment.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-400 hover:text-blue-300"
                >
                  📎 View Payment Proof
                </a>
              )}
              <button
                onClick={handleVerifyPayment}
                disabled={processing}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {processing ? 'Verifying...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Reject Payment</h2>
              <button onClick={() => setShowRejectModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Reason for rejection..."
                />
              </div>
              <button
                onClick={handleRejectPayment}
                disabled={processing}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Issue Refund</h2>
              <button onClick={() => setShowRefundModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Refund Amount *</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder={`Max: ${formatCurrency(selectedPayment.amount, selectedPayment.currency)}`}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reason</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Reason for refund..."
                />
              </div>
              <button
                onClick={handleRefundPayment}
                disabled={processing || !refundAmount}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Issue Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
