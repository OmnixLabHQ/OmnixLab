'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Payment {
  id: string
  invoice_id: string
  amount: number
  currency: string
  method: string
  payment_method: string
  status: string
  provider_reference: string
  created_at: string
  invoice_number: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    successful: 0,
    totalAmount: 0,
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch payments error:', error)
        setLoading(false)
        return
      }

      // Get invoice numbers
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
      calculateStats(paymentsWithInvoice)
      setLoading(false)
    } catch (err) {
      console.error('Fetch payments error:', err)
      setLoading(false)
    }
  }, [router])

  function calculateStats(payments: Payment[]) {
    const total = payments.length
    const pending = payments.filter(p => ['pending', 'initiated', 'processing'].includes(p.status)).length
    const successful = payments.filter(p => ['success', 'successful'].includes(p.status)).length
    const totalAmount = payments
      .filter(p => ['success', 'successful'].includes(p.status))
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    setStats({ total, pending, successful, totalAmount })
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-2">Payments</h1>
      <p className="text-sm text-gray-400 mb-6">Your payment history</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Payments</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalAmount, 'USD')}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Invoice</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Method</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="text-4xl mb-3">[ ]</div>
                  <p className="text-gray-500">No payments found</p>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white font-medium">{payment.invoice_number}</td>
                  <td className="py-3 px-4 text-white">{formatCurrency(payment.amount, payment.currency)}</td>
                  <td className="py-3 px-4 text-gray-300">{payment.payment_method || payment.method || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(payment.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}