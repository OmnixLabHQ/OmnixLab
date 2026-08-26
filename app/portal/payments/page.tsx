'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Invoice {
  id: number
  invoice_number: string
  amount: number
  total: number
  currency: string
  status: string
  payment_status: string
  amount_paid: number
  due_date: string
  created_at: string
  project_name: string
}

interface Payment {
  id: number
  invoice_id: number
  amount: number
  currency: string
  status: string
  payment_method: string
  payment_channel: string
  provider_reference: string
  internal_reference: string
  created_at: string
  paid_at: string
  invoice_number: string
}

interface PaymentMethod {
  id: number
  name: string
  type: string
  instructions: string
  logo: string
  active: boolean
}

export default function PaymentsPage() {
  const router = useRouter()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  
  // Financial stats per blueprint Section 3
  const [stats, setStats] = useState({
    outstanding: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    outstandingCount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  })

  useEffect(() => {
    fetchPaymentCenter()
  }, [])

  const fetchPaymentCenter = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      // Fetch invoices for this client
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (invoicesError) {
        console.error('Fetch invoices error:', invoicesError)
        setLoading(false)
        return
      }

      // Get project names
      const invoicesWithProjects = await Promise.all(
        (invoicesData || []).map(async (invoice) => {
          let projectName = 'General'
          if (invoice.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', invoice.project_id)
              .single()
            projectName = project?.name || 'General'
          }
          return { ...invoice, project_name: projectName }
        })
      )

      setInvoices(invoicesWithProjects)

      // Fetch payments for this client
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (paymentsError) {
        console.error('Fetch payments error:', paymentsError)
      }

      // Get invoice numbers for payments
      const paymentsWithInvoice = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          let invoiceNumber = 'N/A'
          if (payment.invoice_id) {
            const { data: invoice } = await supabase
              .from('invoices')
              .select('invoice_number')
              .eq('id', payment.invoice_id)
              .single()
            invoiceNumber = invoice?.invoice_number || 'N/A'
          }
          return { ...payment, invoice_number: invoiceNumber }
        })
      )

      setPayments(paymentsWithInvoice)

      // Fetch active payment methods
      const { data: methodsData, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true })

      if (methodsError) {
        console.error('Fetch methods error:', methodsError)
      }

      setMethods(methodsData || [])

      // Calculate stats
      calculateStats(invoicesWithProjects, paymentsWithInvoice)
      setLoading(false)

    } catch (error) {
      console.error('Fetch payment center error:', error)
      setLoading(false)
    }
  }, [router])

  function calculateStats(invoices: Invoice[], payments: Payment[]) {
    const outstandingInvoices = invoices.filter(inv => 
      ['unpaid', 'viewed', 'sent', 'partial', 'pending'].includes(inv.payment_status || inv.status || '')
    )
    const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid' || inv.status === 'paid')
    const pendingPayments = payments.filter(p => 
      ['pending', 'initiated', 'processing', 'pending_review', 'under_review'].includes(p.status || '')
    )
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')

    const outstanding = outstandingInvoices.reduce((sum, inv) => {
      const invoiceTotal = inv.amount || inv.total || 0
      const amountPaid = inv.amount_paid || 0
      return sum + Math.max(0, invoiceTotal - amountPaid)
    }, 0)

    const paid = paidInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
    const pending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const overdue = overdueInvoices.reduce((sum, inv) => {
      const invoiceTotal = inv.amount || inv.total || 0
      const amountPaid = inv.amount_paid || 0
      return sum + Math.max(0, invoiceTotal - amountPaid)
    }, 0)

    setStats({
      outstanding,
      paid,
      pending,
      overdue,
      outstandingCount: outstandingInvoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingPayments.length,
      overdueCount: overdueInvoices.length,
    })
  }

  function getPaymentStatusColor(status: string) {
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

  function getInvoiceStatusColor(status: string) {
    const map: Record<string, string> = {
      unpaid: 'bg-yellow-500/20 text-yellow-300',
      viewed: 'bg-blue-500/20 text-blue-300',
      sent: 'bg-blue-500/20 text-blue-300',
      partial: 'bg-purple-500/20 text-purple-300',
      paid: 'bg-green-500/20 text-green-300',
      overdue: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-300',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
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
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header per blueprint Section 2 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your invoices and payments securely.
        </p>
      </div>

      {/* Payment Center Main Card per blueprint Section 34 */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-gray-400">Outstanding Balance</p>
            <p className="text-4xl font-bold text-white mt-2">
              {formatCurrency(stats.outstanding, 'USD')}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {stats.outstandingCount} outstanding invoice{stats.outstandingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/portal/payments/make')}
            className="px-8 py-4 bg-[#E11D2E] hover:bg-[#F43F5E] text-white font-semibold rounded-xl transition-colors"
          >
            Make a Payment →
          </button>
        </div>
      </div>

      {/* Financial Cards per blueprint Section 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => router.push('/portal/invoices?filter=outstanding')}
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
        >
          <p className="text-sm text-gray-400">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(stats.outstanding, 'USD')}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.outstandingCount} invoices</p>
        </button>

        <button
          onClick={() => router.push('/portal/invoices?filter=paid')}
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
        >
          <p className="text-sm text-gray-400">Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.paid, 'USD')}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.paidCount} invoices</p>
        </button>

        <button
          onClick={() => router.push('/portal/payments?filter=pending')}
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
        >
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(stats.pending, 'USD')}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.pendingCount} transaction{stats.pendingCount !== 1 ? 's' : ''}</p>
        </button>

        <button
          onClick={() => router.push('/portal/invoices?filter=overdue')}
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
        >
          <p className="text-sm text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(stats.overdue, 'USD')}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.overdueCount} invoices</p>
        </button>
      </div>

      {/* Available Payment Methods per blueprint Section 27 & 35 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Available Payment Methods</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => router.push(`/portal/payments/make?method=${method.name.toLowerCase().replace(/\s+/g, '_')}`)}
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-sm">
                  {method.type === 'gateway' ? '[CARD]' : method.type === 'crypto' ? '[USDT]' : '[BANK]'}
                </span>
                <div>
                  <p className="text-white font-medium">{method.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {method.type === 'gateway' ? 'Instant processing' : 'Manual verification'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Outstanding Invoices */}
      {invoices.filter(inv => ['unpaid', 'viewed', 'sent', 'partial', 'pending'].includes(inv.payment_status || inv.status || '')).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Outstanding Invoices</h2>
          <div className="space-y-2">
            {invoices
              .filter(inv => ['unpaid', 'viewed', 'sent', 'partial', 'pending'].includes(inv.payment_status || inv.status || ''))
              .map((invoice) => {
                const invoiceTotal = invoice.amount || invoice.total || 0
                const amountPaid = invoice.amount_paid || 0
                const remaining = Math.max(0, invoiceTotal - amountPaid)
                return (
                  <button
                    key={invoice.id}
                    onClick={() => router.push(`/portal/payments/make?invoiceId=${invoice.id}`)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-gray-400">{invoice.project_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatCurrency(remaining, invoice.currency)}</p>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getInvoiceStatusColor(invoice.payment_status || invoice.status)}`}>
                        {invoice.payment_status || invoice.status}
                      </span>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* Recent Transactions per blueprint Section 20 */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Invoice</th>
                <th className="py-3 px-4 font-medium">Method</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                payments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(payment.created_at)}</td>
                    <td className="py-3 px-4 text-white font-medium">{payment.invoice_number}</td>
                    <td className="py-3 px-4 text-gray-300">{payment.payment_method || '-'}</td>
                    <td className="py-3 px-4 text-white">{formatCurrency(payment.amount, payment.currency)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}