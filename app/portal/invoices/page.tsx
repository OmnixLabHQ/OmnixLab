'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_id: string | null
  amount: number
  subtotal: number
  tax: number
  discount: number
  total: number
  description: string
  status: string
  payment_gateway: string | null
  due_date: string | null
  issue_date: string | null
  paid_at: string | null
  paystack_reference: string | null
  created_at: string
  receipt_url: string | null
  milestone_id: string | null
  currency: string
  payment_terms: string
}

interface Project {
  id: string
  name: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchInvoices()
    fetchProjects()
  }, [])

  async function fetchInvoices() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch invoices:', error)
        setLoading(false)
        return
      }

      setInvoices(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Invoices fetch error:', error)
      setLoading(false)
    }
  }

  async function fetchProjects() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProjects(data || [])
      }
    } catch (error) {
      console.error('Projects fetch error:', error)
    }
  }

  // Calculate summary stats
  const stats = useMemo(() => {
    const outstanding = invoices
      .filter((inv) => ['sent', 'overdue', 'partial'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)

    const overdue = invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)

    const pending = invoices
      .filter((inv) => inv.status === 'sent')
      .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)

    const paid = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)

    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + (inv.total || inv.amount || 0),
      0
    )

    return { outstanding, overdue, pending, paid, totalInvoiced }
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (inv) =>
          (inv.invoice_number && inv.invoice_number.toLowerCase().includes(term)) ||
          (inv.description && inv.description.toLowerCase().includes(term))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.status === statusFilter)
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.project_id === projectFilter)
    }

    // Sort
    if (sortBy === 'newest') {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else if (sortBy === 'oldest') {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    } else if (sortBy === 'amount_high') {
      filtered = [...filtered].sort(
        (a, b) => (b.total || b.amount) - (a.total || a.amount)
      )
    } else if (sortBy === 'amount_low') {
      filtered = [...filtered].sort(
        (a, b) => (a.total || a.amount) - (b.total || b.amount)
      )
    } else if (sortBy === 'due_date') {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime()
      )
    }

    return filtered
  }, [invoices, searchTerm, statusFilter, projectFilter, sortBy])

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', dot: '⚪' },
      sent: { label: 'Pending', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      viewed: { label: 'Viewed', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      partial: { label: 'Partially Paid', color: 'bg-purple-100 text-purple-800', dot: '🟣' },
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800', dot: '🟢' },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800', dot: '🔴' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', dot: '⚫' },
      refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800', dot: '🟠' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '⚪' }
  }

  function formatCurrency(amount: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0)
  }

  function getProjectName(projectId: string | null) {
    if (!projectId) return '—'
    const project = projects.find((p) => p.id === projectId)
    return project?.name || '—'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">
            View, manage and securely pay invoices for your Omnix Lab projects.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.outstanding)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.overdue)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats.pending)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.paid)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Total Invoiced</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalInvoiced)}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice number or description..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Pending</option>
            <option value="viewed">Viewed</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="due_date">Due Date</option>
            <option value="amount_high">Amount: High to Low</option>
            <option value="amount_low">Amount: Low to High</option>
          </select>
        </div>

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'You have no invoices yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-[120px_1fr_150px_100px_120px_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              <span>Invoice #</span>
              <span>Project</span>
              <span>Due Date</span>
              <span className="text-right">Amount</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => {
                const statusInfo = getStatusDisplay(invoice.status)
                return (
                  <div
                    key={invoice.id}
                    className="grid grid-cols-1 md:grid-cols-[120px_1fr_150px_100px_120px_100px] gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                  >
                    {/* Invoice Number */}
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {invoice.issue_date
                          ? new Date(invoice.issue_date).toLocaleDateString()
                          : new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Project */}
                    <span className="text-sm text-gray-600 truncate">
                      {getProjectName(invoice.project_id)}
                    </span>

                    {/* Due Date */}
                    <span className="text-sm text-gray-600">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : '—'}
                    </span>

                    {/* Amount */}
                    <span className="text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
                    </span>

                    {/* Status */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                      {statusInfo.dot} {statusInfo.label}
                    </span>

                    {/* Action */}
                    <div className="text-right">
                      <Link
                        href={`/portal/invoices/${invoice.id}`}
                        className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}