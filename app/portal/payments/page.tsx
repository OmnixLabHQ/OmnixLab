'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
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
}

interface Invoice {
  id: string
  invoice_number: string
  project_id: string | null
  total: number
  amount: number
  currency: string
  status: string
}

interface Project {
  id: string
  name: string
}

interface Credit {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [showAmountFilter, setShowAmountFilter] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (!paymentsError) setPayments(paymentsData || [])

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)

      if (invoicesData) setInvoices(invoicesData)

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      const { data: creditsData } = await supabase
        .from('credits')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'active')

      if (creditsData) setCredits(creditsData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const totalPaid = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + (p.amount || 0), 0)
    const pending = payments.filter((p) => ['initiated', 'pending', 'processing'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0)
    const refunded = payments.filter((p) => ['refunded', 'partially_refunded', 'reversed'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0)
    const outstanding = invoices.filter((inv) => ['sent', 'overdue', 'partial', 'viewed'].includes(inv.status)).reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)
    const creditBalance = credits.reduce((sum, c) => sum + (c.amount || 0), 0)
    return { totalPaid, pending, refunded, outstanding, creditBalance }
  }, [payments, invoices, credits])

  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((p) => {
        const invoice = invoices.find((inv) => inv.id === p.invoice_id)
        const project = projects.find((proj) => proj.id === invoice?.project_id)
        return (
          p.internal_reference.toLowerCase().includes(term) ||
          p.provider_reference?.toLowerCase().includes(term) ||
          invoice?.invoice_number?.toLowerCase().includes(term) ||
          project?.name?.toLowerCase().includes(term)
        )
      })
    }

    if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter)
    if (methodFilter !== 'all') filtered = filtered.filter((p) => p.payment_method === methodFilter)

    if (dateFrom) filtered = filtered.filter((p) => new Date(p.created_at) >= new Date(dateFrom))
    if (dateTo) filtered = filtered.filter((p) => new Date(p.created_at) <= new Date(dateTo + 'T23:59:59'))

    if (amountMin) filtered = filtered.filter((p) => p.amount >= parseFloat(amountMin))
    if (amountMax) filtered = filtered.filter((p) => p.amount <= parseFloat(amountMax))

    if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === 'amount_high') filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0))
    else if (sortBy === 'amount_low') filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0))

    return filtered
  }, [payments, invoices, projects, searchTerm, statusFilter, methodFilter, sortBy, dateFrom, dateTo, amountMin, amountMax])

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

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
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)
    } catch {
      return `${currency} ${(amount || 0).toLocaleString()}`
    }
  }

  function getInvoiceNumber(invoiceId: string) {
    return invoices.find((inv) => inv.id === invoiceId)?.invoice_number || '—'
  }

  function getProjectName(invoiceId: string) {
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (!invoice?.project_id) return '—'
    return projects.find((p) => p.id === invoice.project_id)?.name || '—'
  }

  async function handleDownloadStatement() {
    const csvRows = ['Payment ID,Invoice,Project,Method,Amount,Currency,Status,Date']
    filteredPayments.forEach((p) => {
      csvRows.push(`${p.internal_reference},${getInvoiceNumber(p.invoice_id)},${getProjectName(p.invoice_id)},${p.payment_method},${p.amount},${p.currency},${p.status},${new Date(p.created_at).toLocaleDateString()}`)
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `omnix-payments-${dateFrom || 'all'}-${dateTo || new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-2">Manage payments, transactions, receipts and payment methods.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleDownloadStatement} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
              Download Statement
            </button>
            <Link href="/portal/payments/make" className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
              Make a Payment
            </Link>
            <Link href="/portal/payments/methods" className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
              Payment Methods
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pending)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.outstanding)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Refunded</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.refunded)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Credit Balance</p>
            <p className="text-2xl font-bold text-teal-600">{formatCurrency(stats.creditBalance)}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                   placeholder="Search by payment ID, invoice, project..." className="flex-1 px-4 py-3 border border-gray-200 rounded-xl" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-white">
              <option value="all">All Statuses</option>
              <option value="success">Paid</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-white">
              <option value="all">All Methods</option>
              <option value="paystack">Paystack</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="wire_transfer">Wire Transfer</option>
              <option value="usdt">USDT</option>
              <option value="other">Other</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-white">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
            </select>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowDateFilter(!showDateFilter)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              📅 Date Range {showDateFilter ? '▲' : '▼'}
            </button>
            <button onClick={() => setShowAmountFilter(!showAmountFilter)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              💰 Amount Range {showAmountFilter ? '▲' : '▼'}
            </button>
          </div>

          {showDateFilter && (
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white border border-gray-200 rounded-xl">
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                     className="px-4 py-2 border border-gray-200 rounded-lg" />
              <span className="text-gray-500 self-center">to</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                     className="px-4 py-2 border border-gray-200 rounded-lg" />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">Clear</button>
              )}
            </div>
          )}

          {showAmountFilter && (
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white border border-gray-200 rounded-xl">
              <input type="number" value={amountMin} onChange={(e) => { setAmountMin(e.target.value); setCurrentPage(1); }}
                     placeholder="Min amount" className="px-4 py-2 border border-gray-200 rounded-lg" />
              <span className="text-gray-500 self-center">to</span>
              <input type="number" value={amountMax} onChange={(e) => { setAmountMax(e.target.value); setCurrentPage(1); }}
                     placeholder="Max amount" className="px-4 py-2 border border-gray-200 rounded-lg" />
              {(amountMin || amountMax) && (
                <button onClick={() => { setAmountMin(''); setAmountMax(''); }}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">Clear</button>
              )}
            </div>
          )}
        </div>

        {/* Payments Table */}
        {paginatedPayments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[120px_100px_1fr_100px_100px_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
                <span>Payment ID</span>
                <span>Invoice</span>
                <span>Project</span>
                <span>Method</span>
                <span className="text-right">Amount</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-gray-100">
                {paginatedPayments.map((payment) => {
                  const statusInfo = getStatusDisplay(payment.status)
                  return (
                    <Link key={payment.id} href={`/portal/payments/${payment.id}`}
                          className="grid grid-cols-1 md:grid-cols-[120px_100px_1fr_100px_100px_100px] gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
                      <div>
                        <p className="font-medium text-gray-900 text-sm truncate">{payment.internal_reference}</p>
                        <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm text-gray-600">{getInvoiceNumber(payment.invoice_id)}</span>
                      <span className="text-sm text-gray-600 truncate">{getProjectName(payment.invoice_id)}</span>
                      <span className="text-sm text-gray-600 capitalize">{payment.payment_method?.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-semibold text-gray-900 text-right">{formatCurrency(payment.amount, payment.currency)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.dot} {statusInfo.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}