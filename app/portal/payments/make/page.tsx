'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const PAYMENT_METHODS = [
  { id: 'paystack', label: 'Pay Online (Paystack)', icon: '[CARD]', description: 'Secure card or bank payment', type: 'automated' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '[BANK]', description: 'Direct bank transfer', type: 'manual' },
  { id: 'wire_transfer', label: 'Wire Transfer', icon: '[WIRE]', description: 'International wire transfer', type: 'manual' },
  { id: 'fedwire', label: 'FedWire', icon: '[FED]', description: 'US domestic wire', type: 'manual' },
  { id: 'local_wire', label: 'Local Wire Transfer', icon: '[LOCAL]', description: 'Local wire transfer', type: 'manual' },
  { id: 'remitly', label: 'Remitly', icon: '[REM]', description: 'Send via Remitly', type: 'manual' },
  { id: 'worldremit', label: 'WorldRemit', icon: '[WORLD]', description: 'Send via WorldRemit', type: 'manual' },
  { id: 'western_union', label: 'Western Union', icon: '[WU]', description: 'Send via Western Union', type: 'manual' },
  { id: 'moneygram', label: 'MoneyGram', icon: '[MG]', description: 'Send via MoneyGram', type: 'manual' },
  { id: 'usdt', label: 'USDT (Crypto)', icon: '[USDT]', description: 'Pay with USDT', type: 'manual' },
]

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const invoiceId = searchParams.get('invoiceId') || ''
  const presetMethod = searchParams.get('method') || ''

  const [invoice, setInvoice] = useState<any>(null)
  const [selectedMethod, setSelectedMethod] = useState(presetMethod || 'paystack')
  const [instructions, setInstructions] = useState<any>(null)
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')
  const [senderName, setSenderName] = useState('')

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    } else {
      setError('No invoice specified')
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    if (presetMethod && presetMethod !== 'paystack') {
      fetchInstructions(presetMethod)
    }
  }, [presetMethod])

  const fetchInvoice = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', Number(invoiceId))
        .eq('client_id', user.id)
        .single()

      if (error || !data) {
        setError('Invoice not found')
        setLoading(false)
        return
      }

      setInvoice(data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch invoice error:', err)
      setError('Failed to load invoice')
      setLoading(false)
    }
  }

  const fetchInstructions = async (method: string) => {
    try {
      const response = await fetch(`/api/billing/payment-instructions?method=${method}`)
      const data = await response.json()
      if (data.success && data.instructions) {
        setInstructions(data.instructions)
        if (method === 'usdt' && data.instructions.wallets?.length > 0) {
          setSelectedNetwork(data.instructions.wallets[0].network)
        }
      }
    } catch (err) {
      console.error('Fetch instructions error:', err)
    }
  }

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method)
    setInstructions(null)
    setError('')

    if (method !== 'paystack') {
      fetchInstructions(method)
    }
  }

  const handlePaystackPayment = async () => {
    if (!invoice) return
    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/billing/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })
      const result = await response.json()

      if (result.success && result.authorization_url) {
        window.location.href = result.authorization_url
      } else {
        setError(result.error || 'Failed to initialize payment')
      }
    } catch (err) {
      console.error('Paystack error:', err)
      setError('Failed to initialize payment')
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmitProof = async () => {
    if (!invoice || !proofFile) {
      alert('Please upload proof of payment')
      return
    }

    setUploading(true)
    try {
      const fileName = `${Date.now()}-${proofFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile)

      if (uploadError) {
        alert('Failed to upload proof: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      // Create payment record
      await supabase.from('payments').insert({
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount: invoice.total || invoice.amount || 0,
        currency: invoice.currency || 'USD',
        method: selectedMethod,
        payment_method: selectedMethod,
        status: 'pending',
        provider_reference: paymentReference || `MANUAL-${Date.now()}`,
        proof_url: urlData?.publicUrl || null,
        created_at: new Date().toISOString(),
      })

      alert('Payment proof submitted successfully! We will verify your payment shortly.')
      router.push('/portal/payments')
    } catch (err) {
      console.error('Upload proof error:', err)
      alert('Failed to submit payment proof')
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/portal/invoices" className="text-blue-600 hover:underline">Back to Invoices</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/portal/invoices" className="text-gray-600 hover:text-gray-900 text-sm mb-6 inline-block">
          &larr; Back to Invoices
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Make Payment</h1>

        {/* Invoice Summary */}
        {invoice && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoice</p>
                <p className="text-lg font-bold text-gray-900">{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Amount Due</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoice.total || invoice.amount || 0, invoice.currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-2 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</h2>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              disabled={processing || uploading}
              className={`w-full p-4 rounded-xl border-2 transition-colors text-left bg-white ${
                selectedMethod === method.id
                  ? 'border-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{method.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{method.label}</p>
                    <p className="text-xs text-gray-600">{method.description}</p>
                  </div>
                </div>
                {method.type === 'automated' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Instant</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Paystack Button */}
        {selectedMethod === 'paystack' && (
          <button
            onClick={handlePaystackPayment}
            disabled={processing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-gray-900 text-lg font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Continue to Paystack'}
          </button>
        )}

        {/* USDT Instructions */}
        {selectedMethod === 'usdt' && instructions?.wallets && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">USDT Payment Instructions</h3>

            <label className="block text-sm text-gray-700 mb-2">Select Network</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {instructions.wallets.map((wallet: any) => (
                <button
                  key={wallet.network}
                  onClick={() => setSelectedNetwork(wallet.network)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg ${
                    selectedNetwork === wallet.network
                      ? 'bg-blue-600 text-gray-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {wallet.network.split(' ')[0]}
                </button>
              ))}
            </div>

            {instructions.wallets
              .filter((w: any) => w.network === selectedNetwork)
              .map((wallet: any) => (
                <div key={wallet.network} className="text-center">
                  {wallet.qr_code_url && (
                    <div className="bg-gray-100 rounded-xl p-4 inline-block mb-4">
                      <img
                        src={wallet.qr_code_url}
                        alt={`${wallet.network} QR Code`}
                        width={200}
                        height={200}
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <code className="flex-1 text-sm text-gray-900 break-all">{wallet.wallet_address}</code>
                    <button
                      onClick={() => copyToClipboard(wallet.wallet_address)}
                      className="px-3 py-1.5 bg-blue-600 text-gray-900 text-xs rounded-lg shrink-0"
                    >
                      {copied === wallet.wallet_address ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Network: {wallet.network}</p>
                </div>
              ))}

            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium">
                IMPORTANT: Send only USDT using the selected network. Sending other tokens or using the wrong network will result in permanent loss of funds.
              </p>
            </div>
          </div>
        )}

        {/* Bank Instructions */}
        {selectedMethod !== 'paystack' && selectedMethod !== 'usdt' && instructions && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Instructions</h3>
            <div className="space-y-3">
              {instructions.bank_name && (
                <div>
                  <p className="text-xs text-gray-500">Bank Name</p>
                  <p className="text-sm text-gray-900 font-medium">{instructions.bank_name}</p>
                </div>
              )}
              {instructions.account_name && (
                <div>
                  <p className="text-xs text-gray-500">Account Name</p>
                  <p className="text-sm text-gray-900 font-medium">{instructions.account_name}</p>
                </div>
              )}
              {instructions.account_number && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Account Number</p>
                    <p className="text-sm text-gray-900 font-medium">{instructions.account_number}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(instructions.account_number)}
                    className="px-3 py-1.5 bg-blue-600 text-gray-900 text-xs rounded-lg"
                  >
                    {copied === instructions.account_number ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
              {instructions.routing_number && (
                <div>
                  <p className="text-xs text-gray-500">Routing Number</p>
                  <p className="text-sm text-gray-900 font-medium">{instructions.routing_number}</p>
                </div>
              )}
              {instructions.bank_address && (
                <div>
                  <p className="text-xs text-gray-500">Bank Address</p>
                  <p className="text-sm text-gray-900">{instructions.bank_address}</p>
                </div>
              )}
              {instructions.instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">{instructions.instructions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proof Upload for Manual Methods */}
        {selectedMethod !== 'paystack' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Payment Proof</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Payment Reference/Transaction ID</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 outline-none"
                  placeholder="Enter transaction reference"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 outline-none"
                  placeholder="Your name as sender"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Proof of Payment</label>
                <input
                  type="file"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-gray-900"
                  accept="image/*,.pdf,.jpg,.png,.jpeg"
                />
                {proofFile && <p className="text-xs text-gray-500 mt-1">Selected: {proofFile.name}</p>}
              </div>
              <button
                onClick={handleSubmitProof}
                disabled={uploading || !proofFile}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-gray-900 font-semibold rounded-xl disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MakePaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
