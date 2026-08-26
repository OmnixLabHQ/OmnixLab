'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  
  const [invoice, setInvoice] = useState<any>(null)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [instructions, setInstructions] = useState<any>(null)
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    } else {
      setError('No invoice specified')
      setLoading(false)
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', Number(invoiceId))
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

  const handleMethodSelect = async (method: string) => {
    setSelectedMethod(method)
    setInstructions(null)
    setError('')

    if (method === 'paystack') {
      return
    }

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

  const handlePayNow = async () => {
    if (!invoice) return
    setProcessing(true)
    setError('')

    try {
      if (selectedMethod === 'paystack') {
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
      }
    } catch (err) {
      setError('Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => router.push('/portal/invoices')} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Back to Invoices
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">Make Payment</h1>

      {invoice && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400">Invoice</p>
          <p className="text-lg font-bold text-white">{invoice.invoice_number}</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            ${(invoice.amount || invoice.total || 0).toLocaleString()} {invoice.currency || 'USD'}
          </p>
        </div>
      )}

      {/* Payment Methods */}
      <div className="space-y-2 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Select Payment Method</h2>
        {PAYMENT_METHODS.map(method => (
          <button
            key={method.id}
            onClick={() => handleMethodSelect(method.id)}
            disabled={processing}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${
              selectedMethod === method.id
                ? 'bg-blue-500/20 border-blue-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{method.icon}</span>
                <div>
                  <span className="text-white font-medium">{method.label}</span>
                  <p className="text-xs text-gray-400">{method.description}</p>
                </div>
              </div>
              {method.type === 'automated' && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">Instant</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* USDT Instructions with QR Codes */}
      {selectedMethod === 'usdt' && instructions?.wallets && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">USDT Payment Instructions</h3>
          
          <label className="block text-sm text-gray-300 mb-2">Select Network</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {instructions.wallets.map((wallet: any) => (
              <button
                key={wallet.network}
                onClick={() => setSelectedNetwork(wallet.network)}
                className={`px-3 py-2.5 text-sm font-medium rounded-lg ${
                  selectedNetwork === wallet.network
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300'
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
                  <div className="bg-white rounded-xl p-4 inline-block mb-4">
                    <img
                      src={wallet.qr_code_url}
                      alt={`${wallet.network} QR Code`}
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg p-3">
                  <code className="flex-1 text-sm text-white break-all">{wallet.wallet_address}</code>
                  <button
                    onClick={() => copyToClipboard(wallet.wallet_address)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg shrink-0"
                  >
                    {copied === wallet.wallet_address ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Network: {wallet.network}</p>
              </div>
            ))}

          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-red-400">
              IMPORTANT: Send only USDT using the selected network. Sending other tokens or using the wrong network will result in permanent loss of funds.
            </p>
          </div>
        </div>
      )}

      {/* Bank Instructions */}
      {selectedMethod !== 'paystack' && selectedMethod !== 'usdt' && instructions && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Instructions</h3>
          <div className="space-y-3">
            {instructions.bank_name && (
              <div>
                <p className="text-xs text-gray-500">Bank Name</p>
                <p className="text-sm text-white font-medium">{instructions.bank_name}</p>
              </div>
            )}
            {instructions.account_name && (
              <div>
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="text-sm text-white font-medium">{instructions.account_name}</p>
              </div>
            )}
            {instructions.account_number && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="text-sm text-white font-medium">{instructions.account_number}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(instructions.account_number)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg"
                >
                  {copied === instructions.account_number ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
            {instructions.routing_number && (
              <div>
                <p className="text-xs text-gray-500">Routing Number</p>
                <p className="text-sm text-white font-medium">{instructions.routing_number}</p>
              </div>
            )}
            {instructions.instructions && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-400">{instructions.instructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Button */}
      {selectedMethod === 'paystack' && (
        <button
          onClick={handlePayNow}
          disabled={processing}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Continue to Paystack'}
        </button>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

export default function MakePaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}