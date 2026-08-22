'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  project_id: string | null
  total: number
  amount: number
  currency: string
  status: string
  description: string
  due_date: string | null
}

interface Project {
  id: string
  name: string
}

interface PaymentInstruction {
  id: string
  method: string
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  routing_number: string | null
  swift_bic: string | null
  iban: string | null
  wallet_address: string | null
  network: string | null
  memo_tag: string | null
  instructions: string | null
}

export default function MakePaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedInvoiceId = searchParams?.get('invoice') || ''

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preSelectedInvoiceId)
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full')
  const [customAmount, setCustomAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('paystack')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Manual payment state
  const [showProofUpload, setShowProofUpload] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofAmount, setProofAmount] = useState('')
  const [proofDate, setProofDate] = useState('')
  const [senderName, setSenderName] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [proofNotes, setProofNotes] = useState('')

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

      // Fetch unpaid invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .in('status', ['sent', 'viewed', 'overdue', 'partial'])
        .order('created_at', { ascending: false })

      if (!invoicesError) {
        setInvoices(invoicesData || [])
      }

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      // Fetch payment instructions
      const { data: instructionsData } = await supabase
        .from('payment_instructions')
        .select('*')
        .eq('is_active', true)

      if (instructionsData) setInstructions(instructionsData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  const selectedInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === selectedInvoiceId) || null
  }, [invoices, selectedInvoiceId])

  const paymentAmount = useMemo(() => {
    if (!selectedInvoice) return 0
    const fullAmount = selectedInvoice.total || selectedInvoice.amount
    if (paymentType === 'partial' && customAmount) {
      return Math.min(parseFloat(customAmount) || 0, fullAmount)
    }
    return fullAmount
  }, [selectedInvoice, paymentType, customAmount])

  const selectedInstruction = useMemo(() => {
    return instructions.find((i) => i.method === selectedMethod) || null
  }, [instructions, selectedMethod])

  async function handlePaystackPayment() {
    if (!selectedInvoice) {
      setError('Please select an invoice')
      return
    }

    if (paymentAmount <= 0) {
      setError('Payment amount must be greater than 0')
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

      const response = await fetch('/api/billing/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          clientId: user.id,
          amount: paymentAmount,
          currency: selectedInvoice.currency,
        }),
      })

      const result = await response.json()

      if (!result.success || !result.authorization_url) {
        setError(result.error || 'Failed to initialize payment')
        setProcessing(false)
        return
      }

      window.location.href = result.authorization_url
    } catch (error) {
      console.error('Payment error:', error)
      setError('An error occurred')
      setProcessing(false)
    }
  }

  async function handleManualPaymentRequest() {
    if (!selectedInvoice) {
      setError('Please select an invoice')
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

      const response = await fetch('/api/billing/request-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          clientId: user.id,
          amount: paymentAmount,
          currency: selectedInvoice.currency,
          method: selectedMethod,
          message: message,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to submit request')
        setProcessing(false)
        return
      }

      // Show proof upload for manual methods
      setShowProofUpload(true)
      setProofAmount(paymentAmount.toString())
      setProcessing(false)
    } catch (error) {
      console.error('Manual payment error:', error)
      setError('An error occurred')
      setProcessing(false)
    }
  }

  async function handleProofUpload() {
    if (!proofFile || !selectedInvoice) {
      setError('Please select a proof file')
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

      const formData = new FormData()
      formData.append('file', proofFile)
      formData.append('invoiceId', selectedInvoice.id)
      formData.append('clientId', user.id)
      formData.append('amount', proofAmount)
      formData.append('paymentDate', proofDate)
      formData.append('senderName', senderName)
      formData.append('transactionReference', transactionRef)
      formData.append('notes', proofNotes)

      const response = await fetch('/api/billing/upload-proof', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to upload proof')
        setProcessing(false)
        return
      }

      setMessage('Payment proof submitted successfully. Omnix Lab will verify your payment shortly.')
      setShowProofUpload(false)
      setProofFile(null)
      setProofAmount('')
      setProofDate('')
      setSenderName('')
      setTransactionRef('')
      setProofNotes('')

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/portal/payments')
      }, 2000)
    } catch (error) {
      console.error('Proof upload error:', error)
      setError('An error occurred')
      setProcessing(false)
    }
  }

  function getProjectName(projectId: string | null) {
    if (!projectId) return '—'
    return projects.find((p) => p.id === projectId)?.name || '—'
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('Copied to clipboard')
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/payments" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Payments
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Make a Payment</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 mb-4">
            {message}
          </div>
        )}

        {/* Step 1: Select Invoice */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">1. Select Invoice</h2>
          {invoices.length === 0 ? (
            <p className="text-gray-500">No unpaid invoices available.</p>
          ) : (
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
            >
              <option value="">Select an invoice...</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number || 'Invoice'} — {formatCurrency(invoice.total || invoice.amount, invoice.currency)} ({getProjectName(invoice.project_id)})
                </option>
              ))}
            </select>
          )}

          {selectedInvoice && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedInvoice.invoice_number}</p>
              <p className="text-sm text-gray-600">{selectedInvoice.description}</p>
              <p className="text-sm text-gray-600">
                Project: {getProjectName(selectedInvoice.project_id)}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {formatCurrency(selectedInvoice.total || selectedInvoice.amount, selectedInvoice.currency)}
              </p>
              {selectedInvoice.due_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Due {new Date(selectedInvoice.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Payment Amount */}
        {selectedInvoice && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">2. Payment Amount</h2>
            <div className="space-y-3">
              <button
                onClick={() => setPaymentType('full')}
                className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                  paymentType === 'full' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900">Pay Full Amount</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(selectedInvoice.total || selectedInvoice.amount, selectedInvoice.currency)}
                </p>
              </button>
              <button
                onClick={() => setPaymentType('partial')}
                className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                  paymentType === 'partial' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900">Pay Custom Amount</p>
                <p className="text-sm text-gray-600">Make a partial payment</p>
              </button>
              {paymentType === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Max: ${selectedInvoice.total || selectedInvoice.amount}`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Payment Method */}
        {selectedInvoice && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">3. Select Payment Method</h2>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedMethod('paystack')}
                className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                  selectedMethod === 'paystack' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900">💳 Pay Online (Paystack)</p>
                <p className="text-sm text-gray-600">Card, bank transfer, or mobile money</p>
              </button>
              <button
                onClick={() => setSelectedMethod('bank_transfer')}
                className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                  selectedMethod === 'bank_transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900">🏦 Bank Transfer</p>
                <p className="text-sm text-gray-600">Request bank details and pay manually</p>
              </button>
              <button
                onClick={() => setSelectedMethod('wire_transfer')}
                className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                  selectedMethod === 'wire_transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900">🌍 Wire Transfer</p>
                <p className="text-sm text-gray-600">International wire payment</p>
              </button>
              <button
                onClick={() => setSelectedMethod('usdt')}
                className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                  selectedMethod === 'usdt' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900">🪙 USDT (Crypto)</p>
                <p className="text-sm text-gray-600">Pay with Tether USD</p>
              </button>
            </div>

            {/* Payment Instructions for Manual Methods */}
            {selectedMethod !== 'paystack' && selectedInstruction && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900">Payment Instructions</p>
                {selectedInstruction.bank_name && (
                  <p className="text-sm text-gray-700">Bank: {selectedInstruction.bank_name}</p>
                )}
                {selectedInstruction.account_name && (
                  <p className="text-sm text-gray-700">Account Name: {selectedInstruction.account_name}</p>
                )}
                {selectedInstruction.account_number && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">Account Number: {selectedInstruction.account_number}</p>
                    <button onClick={() => copyToClipboard(selectedInstruction.account_number!)} className="text-xs text-blue-600">Copy</button>
                  </div>
                )}
                {selectedInstruction.swift_bic && (
                  <p className="text-sm text-gray-700">SWIFT/BIC: {selectedInstruction.swift_bic}</p>
                )}
                {selectedInstruction.routing_number && (
                  <p className="text-sm text-gray-700">Routing: {selectedInstruction.routing_number}</p>
                )}
                {selectedInstruction.wallet_address && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">Wallet: {selectedInstruction.wallet_address}</p>
                    <button onClick={() => copyToClipboard(selectedInstruction.wallet_address!)} className="text-xs text-blue-600">Copy</button>
                  </div>
                )}
                {selectedInstruction.network && (
                  <p className="text-sm text-gray-700">Network: {selectedInstruction.network}</p>
                )}
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Use reference: {selectedInvoice.invoice_number || selectedInvoice.id}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {selectedInvoice && (
          <button
            onClick={selectedMethod === 'paystack' ? handlePaystackPayment : handleManualPaymentRequest}
            disabled={processing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {processing
              ? 'Processing...'
              : selectedMethod === 'paystack'
              ? `Pay ${formatCurrency(paymentAmount, selectedInvoice.currency)}`
              : 'Continue'}
          </button>
        )}

        {/* Proof Upload Modal */}
        {showProofUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Upload Payment Proof</h3>
                <button onClick={() => setShowProofUpload(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <span className="text-gray-400 text-xl">✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proof File *</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                  <input
                    type="number"
                    value={proofAmount}
                    onChange={(e) => setProofAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={proofDate}
                    onChange={(e) => setProofDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                  />
                </div>
                <button
                  onClick={handleProofUpload}
                  disabled={processing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {processing ? 'Uploading...' : 'Submit Proof'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}