'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
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
  notes: string
  billing_address: string
  viewed_at: string | null
  cancelled_at: string | null
  updated_at: string
}

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  full_name: string
  company: string
  email: string
  phone: string
}

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
  status: string
  payment_method: string
  provider_reference: string
  internal_reference: string
  paid_at: string
  created_at: string
}

interface Receipt {
  id: string
  receipt_number: string
  amount: number
  currency: string
  receipt_url: string
  created_at: string
}

interface PaymentInstructions {
  method: string
  bank_name?: string
  account_name?: string
  account_number?: string
  routing_number?: string
  account_type?: string
  bank_address?: string
  swift_bic?: string
  iban?: string
  wallet_address?: string
  network?: string
  memo_tag?: string
  instructions?: string
  wallets?: {
    network: string
    wallet_address: string
    memo_tag: string
    qr_code_url: string
  }[]
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paystack')
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstructions | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [copied, setCopied] = useState('')

  const PAYMENT_METHODS = [
    { id: 'paystack', label: 'Pay Online', icon: '[CARD]', description: 'Secure card or bank payment via Paystack', type: 'automated' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: '[BANK]', description: 'Direct bank transfer', type: 'manual' },
    { id: 'wire_transfer', label: 'Wire Transfer', icon: '[WIRE]', description: 'International wire transfer', type: 'manual' },
    { id: 'fedwire', label: 'FedWire', icon: '[FED]', description: 'US domestic wire transfer', type: 'manual' },
    { id: 'local_wire', label: 'Local Wire Transfer', icon: '[LOCAL]', description: 'Local wire transfer', type: 'manual' },
    { id: 'remitly', label: 'Remitly', icon: '[REM]', description: 'Send via Remitly', type: 'manual' },
    { id: 'worldremit', label: 'WorldRemit', icon: '[WORLD]', description: 'Send via WorldRemit', type: 'manual' },
    { id: 'western_union', label: 'Western Union', icon: '[WU]', description: 'Send via Western Union', type: 'manual' },
    { id: 'moneygram', label: 'MoneyGram', icon: '[MG]', description: 'Send via MoneyGram', type: 'manual' },
    { id: 'usdt', label: 'USDT (Crypto)', icon: '[USDT]', description: 'Pay with USDT', type: 'manual' },
  ]

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData()
    }
  }, [invoiceId])

  async function fetchInvoiceData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('client_id', user.id)
        .single()

      if (invoiceError || !invoiceData) {
        console.error('Failed to fetch invoice:', invoiceError)
        router.push('/portal/invoices')
        return
      }

      setInvoice(invoiceData)

      if (!invoiceData.viewed_at && invoiceData.status === 'sent') {
        await supabase
          .from('invoices')
          .update({
            viewed_at: new Date().toISOString(),
            status: 'viewed',
          })
          .eq('id', invoiceId)
      }

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', invoiceData.client_id)
        .single()

      if (clientData) {
        setClient(clientData)
      }

      if (invoiceData.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', invoiceData.project_id)
          .single()

        if (projectData) {
          setProject(projectData)
        }
      }

      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('id', { ascending: true })

      if (itemsData) {
        setItems(itemsData)
      }

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })

      if (paymentsData) {
        setPayments(paymentsData)
      }

      const { data: receiptsData } = await supabase
        .from('receipts')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })

      if (receiptsData) {
        setReceipts(receiptsData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Invoice fetch error:', error)
      setLoading(false)
    }
  }

  async function handlePaymentMethodSelect(method: string) {
    setSelectedPaymentMethod(method)
    setPaymentInstructions(null)
    setCopied('')

    if (method === 'paystack') {
      return
    }

    // Fetch payment instructions for manual methods
    try {
      const response = await fetch(`/api/billing/payment-instructions?method=${method}`)
      const data = await response.json()

      if (data.success && data.instructions) {
        setPaymentInstructions(data.instructions)
        if (method === 'usdt' && data.instructions.wallets?.length > 0) {
          setSelectedNetwork(data.instructions.wallets[0].network)
        }
      }
    } catch (error) {
      console.error('Fetch instructions error:', error)
    }
  }

  async function handlePayNow() {
    if (!invoice) return

    setProcessingPayment(true)

    try {
      if (selectedPaymentMethod === 'paystack') {
        const response = await fetch('/api/billing/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
          }),
        })

        const result = await response.json()

        if (!result.success || !result.authorization_url) {
          alert(result.error || 'Failed to initialize payment')
          setProcessingPayment(false)
          return
        }

        window.location.href = result.authorization_url
      } else {
        // For manual methods, redirect to payment page with instructions
        router.push(`/portal/payments/make?invoiceId=${invoice.id}&method=${selectedPaymentMethod}`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('An error occurred')
      setProcessingPayment(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', dot: '[ ]' },
      sent: { label: 'Pending', color: 'bg-amber-100 text-amber-800', dot: '[!]' },
      viewed: { label: 'Viewed', color: 'bg-blue-100 text-blue-800', dot: '[>]' },
      partial: { label: 'Partially Paid', color: 'bg-purple-100 text-purple-800', dot: '[~]' },
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800', dot: '[OK]' },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800', dot: '[X]' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', dot: '[-]' },
      refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800', dot: '[R]' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '[ ]' }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">[ ]</div>
          <p className="text-gray-600 mb-4">Invoice not found</p>
          <Link href="/portal/invoices" className="text-blue-600 hover:underline">
            Back to Invoices
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusDisplay(invoice.status)
  const totalPaid = payments
    .filter((p) => p.status === 'success' || p.status === 'successful')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const remainingBalance = (invoice.total || invoice.amount) - totalPaid

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/portal/invoices"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          &larr; Back to Invoices
        </Link>

        {/* Invoice Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {invoice.description || 'Invoice'}
              </p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.dot} {statusInfo.label}
            </span>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-1">
              {invoice.status === 'paid' ? 'Amount Paid' : remainingBalance > 0 && totalPaid > 0 ? 'Remaining Balance' : 'Total Amount'}
            </p>
            <p className="text-4xl font-bold text-gray-900">
              {formatCurrency(
                invoice.status === 'paid' ? invoice.total || invoice.amount : remainingBalance,
                invoice.currency
              )}
            </p>
            {invoice.due_date && invoice.status !== 'paid' && (
              <p className="text-sm text-gray-500 mt-2">
                Due {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            )}
            {invoice.paid_at && (
              <p className="text-sm text-green-600 mt-2">
                Paid on {new Date(invoice.paid_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {['sent', 'viewed', 'overdue', 'partial'].includes(invoice.status) && remainingBalance > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Pay Now
              </button>
            )}

            <Link
              href={`/portal/invoices/${invoice.id}/print`}
              target="_blank"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              Download Invoice PDF
            </Link>

            {invoice.status === 'paid' && (
              <Link
                href={`/portal/invoices/${invoice.id}/receipt-print`}
                target="_blank"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-xl transition-colors"
              >
                View Receipt
              </Link>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Invoice Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">From</p>
              <p className="font-medium text-gray-900">Omnix Lab</p>
              <p className="text-sm text-gray-600">Global Software Development</p>
              <p className="text-sm text-gray-600">helloafrica@omnixlab-production.up.railway.app</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Bill To</p>
              <p className="font-medium text-gray-900">{client?.full_name || 'Client'}</p>
              {client?.company && <p className="text-sm text-gray-600">{client.company}</p>}
              {client?.email && <p className="text-sm text-gray-600">{client.email}</p>}
              {client?.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Issue Date</p>
              <p className="text-sm text-gray-900">
                {invoice.issue_date
                  ? new Date(invoice.issue_date).toLocaleDateString()
                  : new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Due Date</p>
              <p className="text-sm text-gray-900">
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>

            {project && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Project</p>
                <Link
                  href={`/portal/projects/${project.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {project.name}
                </Link>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Payment Terms</p>
              <p className="text-sm text-gray-900">{invoice.payment_terms || 'Net 14'}</p>
            </div>

            {invoice.currency && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Currency</p>
                <p className="text-sm text-gray-900">{invoice.currency}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Line Items</h3>

          {items.length > 0 ? (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity} x {formatCurrency(item.unit_price, invoice.currency)}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.amount, invoice.currency)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotal || invoice.amount, invoice.currency)}
                  </span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(invoice.discount, invoice.currency)}
                    </span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.tax, invoice.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No line items for this invoice</p>
            </div>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>

            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.payment_method || 'Payment'} - {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                    {payment.provider_reference && (
                      <p className="text-xs text-gray-400 font-mono">
                        Ref: {payment.provider_reference}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      payment.status === 'success' || payment.status === 'successful'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipts */}
        {receipts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Receipts</h3>

            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{receipt.receipt_number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(receipt.created_at).toLocaleDateString()} - {formatCurrency(receipt.amount, receipt.currency)}
                    </p>
                  </div>
                  <Link
                    href={`/portal/invoices/${invoice.id}/receipt-print`}
                    target="_blank"
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Download PDF
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Modal - UPDATED WITH ALL 10 METHODS */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Pay Invoice</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
                disabled={processingPayment}
              >
                <span className="text-gray-400 text-xl">X</span>
              </button>
            </div>

            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(remainingBalance, invoice.currency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Invoice: {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Payment Method</p>

              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  disabled={processingPayment}
                  className={`w-full p-3 rounded-xl border-2 transition-colors text-left ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{method.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Show USDT Wallet Instructions in Modal */}
            {selectedPaymentMethod === 'usdt' && paymentInstructions?.wallets && (
              <div className="mb-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Select Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentInstructions.wallets.map((wallet) => (
                    <button
                      key={wallet.network}
                      onClick={() => setSelectedNetwork(wallet.network)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        selectedNetwork === wallet.network
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {wallet.network.split(' ')[0]}
                    </button>
                  ))}
                </div>
                {paymentInstructions.wallets
                  .filter(w => w.network === selectedNetwork)
                  .map(wallet => (
                    <div key={wallet.network} className="text-center">
                      {wallet.qr_code_url && (
                        <div className="bg-white border border-gray-200 rounded-xl p-3 inline-block mb-2">
                          <img
                            src={wallet.qr_code_url}
                            alt={`${wallet.network} QR Code`}
                            width={150}
                            height={150}
                            className="rounded"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                        <code className="flex-1 text-xs text-gray-900 break-all">{wallet.wallet_address}</code>
                        <button
                          onClick={() => copyToClipboard(wallet.wallet_address)}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded shrink-0"
                        >
                          {copied === wallet.wallet_address ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Network: {wallet.network}</p>
                    </div>
                  ))}
              </div>
            )}

            <button
              onClick={handlePayNow}
              disabled={processingPayment}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingPayment
                ? 'Processing...'
                : selectedPaymentMethod === 'paystack'
                ? 'Continue to Paystack'
                : 'View Full Payment Instructions'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
