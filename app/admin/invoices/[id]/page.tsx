'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

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
}

interface Invoice {
  id: number
  invoice_number: string
  client_id: string
  project_id: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  amount: number
  currency: string
  status: string
  due_date: string | null
  issue_date: string | null
  notes: string | null
  payment_terms: string
  created_at: string
  client_name?: string
  client_email?: string
  client_company?: string
  project_name?: string
  paid_amount?: number
  items?: InvoiceItem[]
  payments?: Payment[]
}

export default function AdminInvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentReference, setPaymentReference] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchInvoice = useCallback(async () => {
    setLoading(true)
    try {
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', Number(invoiceId))
        .single()

      if (error || !invoiceData) {
        console.error('Invoice not found:', error)
        setLoading(false)
        return
      }

      // Client
      let clientName = 'Unknown'
      let clientEmail = ''
      let clientCompany = ''
      if (invoiceData.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('full_name, email, company')
          .eq('id', invoiceData.client_id)
          .single()
        if (client) {
          clientName = client.full_name || 'Unknown'
          clientEmail = client.email || ''
          clientCompany = client.company || ''
        }
      }

      // Project
      let projectName = 'General'
      if (invoiceData.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', invoiceData.project_id)
          .single()
        projectName = project?.name || 'General'
      }

      // Items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceData.id)
        .order('id', { ascending: true })

      // Payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceData.id)
        .order('created_at', { ascending: false })

      const paidAmount = (paymentsData || [])
        .filter((p: any) => ['success', 'successful'].includes(p.status))
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

      setInvoice({
        ...invoiceData,
        client_name: clientName,
        client_email: clientEmail,
        client_company: clientCompany,
        project_name: projectName,
        paid_amount: paidAmount,
        items: itemsData || [],
        payments: paymentsData || [],
      })
      setLoading(false)
    } catch (err) {
      console.error('Fetch invoice error:', err)
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    if (invoiceId) fetchInvoice()
  }, [invoiceId, fetchInvoice])

  async function handleRecordPayment() {
    if (!invoice || !paymentAmount) return
    setSaving(true)
    try {
      const amount = parseFloat(paymentAmount)
      await supabase.from('payments').insert({
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount,
        currency: invoice.currency,
        method: paymentMethod,
        payment_method: paymentMethod,
        status: 'successful',
        provider_reference: paymentReference || `MANUAL-${Date.now()}`,
        created_at: new Date().toISOString(),
      })

      const newPaid = (invoice.paid_amount || 0) + amount
      const total = invoice.total || invoice.amount || 0
      const newStatus = newPaid >= total ? 'paid' : 'partially_paid'
      await supabase
        .from('invoices')
        .update({
          status: newStatus,
          amount_paid: newPaid,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)

      setShowRecordPayment(false)
      setPaymentAmount('')
      setPaymentReference('')
      fetchInvoice()
    } catch (error) {
      console.error('Record payment error:', error)
      alert('Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  async function handleApprovePayment(payment: Payment) {
    if (!confirm('Approve this payment?')) return
    await supabase.from('payments').update({ status: 'successful', updated_at: new Date().toISOString() }).eq('id', payment.id)
    fetchInvoice()
  }

  async function handleRejectPayment(payment: Payment) {
    if (!confirm('Reject this payment?')) return
    await supabase.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', payment.id)
    fetchInvoice()
  }

  async function handleSendReminder() {
    if (!invoice) return
    if (!confirm(`Send reminder for ${invoice.invoice_number}?`)) return
    try {
      await supabase.from('notifications').insert({
        user_id: invoice.client_id,
        type: 'invoice_reminder',
        title: 'Invoice Reminder',
        message: `Reminder: ${invoice.invoice_number} is ${invoice.status === 'overdue' ? 'overdue' : 'due soon'}.`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })
    } catch (e) {}
    alert('Reminder sent')
  }

  async function handleCancelInvoice() {
    if (!invoice) return
    const reason = prompt('Reason for cancellation:')
    if (reason === null) return
    await supabase
      .from('invoices')
      .update({ status: 'cancelled', notes: reason, cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', invoice.id)
    fetchInvoice()
  }

  async function handleDuplicateInvoice() {
    if (!invoice) return
    if (!confirm(`Duplicate ${invoice.invoice_number}?`)) return
    const { data: newInvoice } = await supabase
      .from('invoices')
      .insert({
        invoice_number: `INV-${Date.now()}`,
        client_id: invoice.client_id,
        project_id: invoice.project_id,
        subtotal: invoice.subtotal || invoice.amount || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        total: invoice.total || invoice.amount || 0,
        amount: invoice.total || invoice.amount || 0,
        currency: invoice.currency || 'USD',
        status: 'draft',
        due_date: null,
        issue_date: new Date().toISOString().split('T')[0],
        payment_terms: invoice.payment_terms || 'Net 14',
        notes: invoice.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newInvoice) {
      if (invoice.items && invoice.items.length > 0) {
        await supabase.from('invoice_items').insert(
          invoice.items.map((item) => ({
            invoice_id: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          }))
        )
      }
      router.push(`/admin/invoices/${newInvoice.id}`)
    }
  }

  function handlePreviewInvoice() {
    if (invoice) window.open(`/portal/invoices/${invoice.id}/print`, '_blank')
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      sent: 'bg-blue-500/20 text-blue-300',
      viewed: 'bg-cyan-500/20 text-cyan-300',
      partially_paid: 'bg-yellow-500/20 text-yellow-300',
      paid: 'bg-green-500/20 text-green-300',
      overdue: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-400',
      refunded: 'bg-orange-500/20 text-orange-300',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 mb-4">Invoice not found</p>
        <Link href="/admin/invoices" className="text-blue-400 hover:underline">Back to Invoices</Link>
      </div>
    )
  }

  const balance = (invoice.total || invoice.amount || 0) - (invoice.paid_amount || 0)

  return (
    <div className="space-y-6">
      <Link href="/admin/invoices" className="text-gray-400 hover:text-white text-sm inline-block">
        &lt;- Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{invoice.invoice_number}</h1>
          <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handlePreviewInvoice} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Preview</button>
          {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
            <button onClick={handleSendReminder} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg">Send Reminder</button>
          )}
          <button onClick={() => setShowRecordPayment(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">Record Payment</button>
          {invoice.status === 'draft' && (
            <button onClick={handleDuplicateInvoice} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">Duplicate</button>
          )}
          <button onClick={handleCancelInvoice} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">Cancel</button>
        </div>
      </div>

      {/* Client & Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Client</h3>
          <p className="text-white font-medium">{invoice.client_name}</p>
          {invoice.client_company && <p className="text-gray-400 text-sm">{invoice.client_company}</p>}
          {invoice.client_email && <p className="text-gray-400 text-sm">{invoice.client_email}</p>}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Project</h3>
          <p className="text-white font-medium">{invoice.project_name}</p>
        </div>
      </div>

      {/* Dates & Terms */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Issue Date</p>
            <p className="text-sm text-white">{formatDate(invoice.issue_date || invoice.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm text-white">{formatDate(invoice.due_date || '')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Terms</p>
            <p className="text-sm text-white">{invoice.payment_terms || 'Net 14'}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Line Items</h3>
        <div className="space-y-2">
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-sm text-white font-medium">{item.description}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}</p>
                </div>
                <p className="text-sm text-white font-medium">{formatCurrency(item.amount, invoice.currency)}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No line items</p>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatCurrency(invoice.subtotal || invoice.amount || 0, invoice.currency)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Discount</span><span className="text-white">-{formatCurrency(invoice.discount || 0, invoice.currency)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Tax</span><span className="text-white">{formatCurrency(invoice.tax || 0, invoice.currency)}</span></div>
          <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2"><span className="text-white">Total</span><span className="text-white">{formatCurrency(invoice.total || invoice.amount || 0, invoice.currency)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-green-400">Paid</span><span className="text-green-400">{formatCurrency(invoice.paid_amount || 0, invoice.currency)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-yellow-400">Balance</span><span className="text-yellow-400">{formatCurrency(balance, invoice.currency)}</span></div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
        <div className="space-y-2">
          {invoice.payments && invoice.payments.length > 0 ? (
            invoice.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                  <p className="text-xs text-gray-400">{payment.payment_method || payment.method} • {formatDate(payment.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    payment.status === 'successful' || payment.status === 'success' ? 'bg-green-500/20 text-green-300' :
                    payment.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>{payment.status}</span>
                  {(payment.status === 'pending' || payment.status === 'under_review' || payment.status === 'needs_review') && (
                    <>
                      <button onClick={() => handleApprovePayment(payment)} className="text-green-400 text-xs">Approve</button>
                      <button onClick={() => handleRejectPayment(payment)} className="text-red-400 text-xs">Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No payments yet</p>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Notes</h3>
          <p className="text-gray-300">{invoice.notes}</p>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Record Payment</h2>
              <button onClick={() => setShowRecordPayment(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Amount *</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">
                  <option value="bank_transfer" className="bg-gray-900">Bank Transfer</option>
                  <option value="wire_transfer" className="bg-gray-900">Wire Transfer</option>
                  <option value="paystack" className="bg-gray-900">Paystack</option>
                  <option value="usdt" className="bg-gray-900">USDT</option>
                  <option value="cash" className="bg-gray-900">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reference</label>
                <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              </div>
              <button onClick={handleRecordPayment} disabled={saving || !paymentAmount} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}