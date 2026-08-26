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
  active: boolean
}

export default function PaymentsPage() {
  const router = useRouter()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (invoicesError) throw invoicesError

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

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

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

      // Fetch payment methods
      const { data: methodsData, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true })

      if (methodsError) throw methodsError

      setMethods(methodsData || [])

      calculateStats(invoicesWithProjects, paymentsWithInvoice)
      setLoading(false)

    } catch (err: any) {
      console.error('Fetch payment center error:', err)
      setError(err?.message || 'Failed to load payment data')
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
      const total = inv.amount || inv.total || 0
      const paid = inv.amount_paid || 0
      return sum + Math.max(0, total - paid)
    }, 0)

    const paid = paidInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
    const pending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const overdue = overdueInvoices.reduce((sum, inv) => {
      const total = inv.amount || inv.total || 0
      const paid = inv.amount_paid || 0
      return sum + Math.max(0, total - paid)
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

  function getPaymentStatusColor(status: string) {
    const map: Record<string, string> = {
      initiated: 'bg-blue-500/20 text-blue-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      pending_review: 'bg-yellow-500/20 text-yellow-300',
      processing: 'bg-purple-500/20 text-purple-300',
      success: 'bg-green-500/20 text-green-300',
      successful: 'bg-green-500/20 text-green-300',
      paid: 'bg-green-500/20 text-green-300',
      failed: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-600',
      refunded: 'bg-orange-500/20 text-orange-300',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-600'
  }

  function getMethodIcon(type: string) {
    if (type === 'gateway') return '💳'
    if (type === 'crypto') return '🪙'
    return '🏦'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchPaymentCenter}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-gray-900 font-semibold rounded-xl"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Payments
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Manage your invoices and payments securely.
          </p>
        </div>

        {/* Payment Center Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(225,29,46,0.15) 0%, rgba(18,24,33,0.8) 100%)',
          border: '1px solid #D1D5DB',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 8px 0' }}>
              Outstanding Balance
            </p>
            <p style={{ fontSize: '48px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {formatCurrency(stats.outstanding, 'USD')}
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '8px 0 0 0' }}>
              {stats.outstandingCount} outstanding invoice{stats.outstandingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/portal/payments/make')}
            style={{
              background: '#E11D2E',
              color: '#111827',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F43F5E'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#E11D2E'}
          >
            Make a Payment →
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'Outstanding', value: stats.outstanding, count: `${stats.outstandingCount} invoices`, color: '#F59E0B' },
            { label: 'Paid', value: stats.paid, count: `${stats.paidCount} invoices`, color: '#22C55E' },
            { label: 'Pending', value: stats.pending, count: `${stats.pendingCount} transactions`, color: '#38BDF8' },
            { label: 'Overdue', value: stats.overdue, count: `${stats.overdueCount} invoices`, color: '#EF4444' },
          ].map((card) => (
            <div key={card.label} style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 8px 0' }}>
                {card.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: card.color, margin: '0 0 4px 0' }}>
                {formatCurrency(card.value, 'USD')}
              </p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                {card.count}
              </p>
            </div>
          ))}
        </div>

        {/* Available Payment Methods */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
            Available Payment Methods
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => router.push(`/portal/payments/make?method=${method.name.toLowerCase().replace(/\s+/g, '_')}`)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#E11D2E'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{getMethodIcon(method.type)}</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {method.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
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
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
              Outstanding Invoices
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invoices
                .filter(inv => ['unpaid', 'viewed', 'sent', 'partial', 'pending'].includes(inv.payment_status || inv.status || ''))
                .map((invoice) => {
                  const total = invoice.amount || invoice.total || 0
                  const paid = invoice.amount_paid || 0
                  const remaining = Math.max(0, total - paid)
                  return (
                    <button
                      key={invoice.id}
                      onClick={() => router.push(`/portal/payments/make?invoiceId=${invoice.id}`)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#E11D2E'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                    >
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          {invoice.invoice_number}
                        </p>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
                          {invoice.project_name}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                          {formatCurrency(remaining, invoice.currency)}
                        </p>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          background: 'rgba(245,158,11,0.2)',
                          color: '#F59E0B',
                          marginTop: '4px',
                        }}>
                          {invoice.payment_status || invoice.status}
                        </span>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
            Recent Transactions
          </h2>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {payments.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9CA3AF', margin: 0 }}>No transactions yet</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #D1D5DB' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Invoice</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Method</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #D1D5DB' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280' }}>
                        {formatDate(payment.created_at)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                        {payment.invoice_number}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280' }}>
                        {payment.payment_method || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          background: payment.status === 'success' || payment.status === 'successful' 
                            ? 'rgba(34,197,94,0.2)' 
                            : payment.status === 'failed'
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(245,158,11,0.2)',
                          color: payment.status === 'success' || payment.status === 'successful'
                            ? '#22C55E'
                            : payment.status === 'failed'
                            ? '#EF4444'
                            : '#F59E0B',
                        }}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
