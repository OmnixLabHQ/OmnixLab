'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface PaymentRequest {
  id: string
  invoice_id: string
  payment_method: string
  amount: number
  currency: string
  message: string
  status: string
  reference: string
  admin_instructions: string
  created_at: string
  updated_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  description: string
}

interface PaymentProof {
  id: string
  payment_request_id: string
  file_name: string
  file_url: string
  amount: number
  payment_date: string
  sender_name: string
  transaction_reference: string
  notes: string
  status: string
  created_at: string
}

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [invoices, setInvoices] = useState<Record<string, Invoice>>({})
  const [proofs, setProofs] = useState<Record<string, PaymentProof[]>>({})
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload form state
  const [uploadAmount, setUploadAmount] = useState('')
  const [uploadDate, setUploadDate] = useState('')
  const [senderName, setSenderName] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [uploadNotes, setUploadNotes] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Failed to fetch requests:', requestsError)
        setLoading(false)
        return
      }

      setRequests(requestsData || [])

      // Fetch related invoices
      const invoiceIds = requestsData?.map((r) => r.invoice_id).filter(Boolean) || []
      if (invoiceIds.length > 0) {
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('id, invoice_number, description')
          .in('id', invoiceIds)

        if (invoiceData) {
          const invoiceMap: Record<string, Invoice> = {}
          invoiceData.forEach((inv) => {
            invoiceMap[inv.id] = inv
          })
          setInvoices(invoiceMap)
        }
      }

      // Fetch proofs for these requests
      const requestIds = requestsData?.map((r) => r.id).filter(Boolean) || []
      if (requestIds.length > 0) {
        const { data: proofData } = await supabase
          .from('payment_proofs')
          .select('*')
          .in('payment_request_id', requestIds)
          .order('created_at', { ascending: false })

        if (proofData) {
          const proofMap: Record<string, PaymentProof[]> = {}
          proofData.forEach((proof) => {
            if (!proofMap[proof.payment_request_id]) {
              proofMap[proof.payment_request_id] = []
            }
            proofMap[proof.payment_request_id].push(proof)
          })
          setProofs(proofMap)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Requests fetch error:', error)
      setLoading(false)
    }
  }

  function openUploadModal(request: PaymentRequest) {
    setSelectedRequest(request)
    setUploadAmount(String(request.amount || ''))
    setUploadDate(new Date().toISOString().split('T')[0])
    setSenderName('')
    setTransactionRef('')
    setUploadNotes('')
    setShowUploadModal(true)
  }

  async function handleUploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedRequest) return

    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('You must be logged in')
        setUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('paymentRequestId', selectedRequest.id)
      formData.append('invoiceId', selectedRequest.invoice_id)
      formData.append('clientId', user.id)
      formData.append('amount', uploadAmount)
      formData.append('paymentDate', uploadDate)
      formData.append('senderName', senderName)
      formData.append('transactionReference', transactionRef)
      formData.append('notes', uploadNotes)

      const response = await fetch('/api/billing/upload-proof', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error || 'Failed to upload proof')
        setUploading(false)
        return
      }

      setShowUploadModal(false)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      alert('Payment proof submitted successfully!')
      await fetchRequests()
    } catch (error) {
      console.error('Upload exception:', error)
      alert('An error occurred')
      setUploading(false)
    }
  }

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      awaiting_instructions: { label: 'Awaiting Instructions', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      instructions_sent: { label: 'Instructions Sent', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      proof_submitted: { label: 'Proof Submitted', color: 'bg-purple-100 text-purple-800', dot: '🟣' },
      verified: { label: 'Verified', color: 'bg-green-100 text-green-800', dot: '🟢' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', dot: '🔴' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', dot: '⚫' },
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

  function formatMethod(method: string) {
    const methodMap: Record<string, string> = {
      bank_transfer: '🏦 Bank Transfer',
      wire_transfer: '🌍 Wire Transfer',
      fedwire: '🏛️ Fedwire',
      remitly: '💸 Remitly',
      worldremit: '💸 WorldRemit',
      western_union: '💸 Western Union',
      moneygram: '💸 MoneyGram',
      usdt: '🪙 USDT',
      local_wire: '🏦 Local Wire Transfer',
    }
    return methodMap[method] || method.replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Requests</h1>
          <p className="text-gray-600 mt-2">
            Track your manual payment requests and upload payment proof.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No payment requests
            </h3>
            <p className="text-gray-600">
              When you request manual payment instructions, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const statusInfo = getStatusDisplay(request.status)
              const invoice = invoices[request.invoice_id]
              const requestProofs = proofs[request.id] || []

              return (
                <div key={request.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {formatMethod(request.payment_method)}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                          {statusInfo.dot} {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Reference: {request.reference}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(request.amount, request.currency)}
                      </p>
                      {invoice && (
                        <Link
                          href={`/portal/invoices/${request.invoice_id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {invoice.invoice_number || `INV-${request.invoice_id.slice(0, 8)}`}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Admin Instructions */}
                  {request.admin_instructions && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Payment Instructions:</p>
                      <p className="text-sm text-blue-700 whitespace-pre-line">{request.admin_instructions}</p>
                    </div>
                  )}

                  {/* Client Message */}
                  {request.message && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">💬 {request.message}</p>
                    </div>
                  )}

                  {/* Uploaded Proofs */}
                  {requestProofs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Uploaded Proofs:</p>
                      {requestProofs.map((proof) => (
                        <div key={proof.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{proof.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(proof.created_at).toLocaleDateString()}
                              {proof.transaction_reference && ` • Ref: ${proof.transaction_reference}`}
                            </p>
                          </div>
                          <a
                            href={proof.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {request.status === 'instructions_sent' && requestProofs.length === 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => openUploadModal(request)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Upload Payment Proof
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Upload Payment Proof</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
                disabled={uploading}
              >
                <span className="text-gray-400 text-xl">✕</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Name on payment"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Bank/transfer reference"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleUploadProof}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:bg-green-50 file:text-green-700 file:font-medium hover:file:bg-green-100 disabled:opacity-50"
                />
              </div>

              {uploading && (
                <p className="text-sm text-blue-600">Uploading...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}