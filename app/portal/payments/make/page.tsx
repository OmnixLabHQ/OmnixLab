'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  project_name: string
}

interface PaymentMethod {
  id: number
  name: string
  type: string
  instructions: string
  active: boolean
}

interface USDTWallet {
  network: string
  wallet_address: string
  memo_tag: string
  qr_code_url: string
}

const QR_CODE_BASE_URL = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co/storage/v1/object/public/payment-qr-codes'

const USDT_WALLETS: USDTWallet[] = [
  {
    network: 'ERC20 (Ethereum)',
    wallet_address: '0x05cc5992a2ac3380a8c4eac0563323191b3e7b04',
    memo_tag: '',
    qr_code_url: `${QR_CODE_BASE_URL}/usdt-erc20.jpg`,
  },
  {
    network: 'TRC20 (TRON)',
    wallet_address: 'TDsAEYnpqtzh6Mj19ASY5nV2THKF3xYnDn',
    memo_tag: '',
    qr_code_url: `${QR_CODE_BASE_URL}/usdt-trc20.jpg`,
  },
  {
    network: 'BEP20 (BSC)',
    wallet_address: '0x05cc5992a2ac3380a8c4eac0563323191b3e7b04',
    memo_tag: '',
    qr_code_url: `${QR_CODE_BASE_URL}/usdt-bep20.jpg`,
  },
]

function MakePaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialInvoiceId = searchParams.get('invoiceId') || ''
  const initialMethod = searchParams.get('method') || ''
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  
  // Manual payment form fields per blueprint Section 17
  const [paymentDate, setPaymentDate] = useState('')
  const [senderName, setSenderName] = useState('')
  const [transactionReference, setTransactionReference] = useState('')
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (initialInvoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === Number(initialInvoiceId))
      if (invoice) {
        setSelectedInvoice(invoice)
      }
    }
  }, [initialInvoiceId, invoices])

  useEffect(() => {
    if (initialMethod && methods.length > 0) {
      const method = methods.find(m => 
        m.name.toLowerCase().replace(/\s+/g, '_') === initialMethod.toLowerCase()
      )
      if (method) {
        setSelectedMethod(method.name)
      }
    }
  }, [initialMethod, methods])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      // Fetch unpaid invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (invoicesError) {
        console.error('Fetch invoices error:', invoicesError)
      }

      const unpaidInvoices = (invoicesData || []).filter(inv => 
        ['unpaid', 'viewed', 'sent', 'partial', 'pending'].includes(inv.payment_status || inv.status || '')
      )

      const invoicesWithProjects = await Promise.all(
        unpaidInvoices.map(async (invoice) => {
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
      setLoading(false)

    } catch (error) {
      console.error('Fetch data error:', error)
      setLoading(false)
    }
  }, [router])

  const handlePaystackPayment = async () => {
    if (!selectedInvoice) return
    
    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/billing/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: selectedInvoice.id }),
      })

      const result = await response.json()

      if (result.success && result.authorization_url) {
        window.location.href = result.authorization_url
      } else {
        setError(result.error || 'Failed to initialize payment')
        setProcessing(false)
      }
    } catch (err) {
      console.error('Paystack error:', err)
      setError('Failed to initialize payment')
      setProcessing(false)
    }
  }

  const handleSubmitManualPayment = async () => {
    if (!selectedInvoice) return
    if (!proofFile) {
      setError('Please upload proof of payment')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Upload proof file to Supabase Storage
      const fileName = `${Date.now()}-${proofFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile)

      if (uploadError) {
        setError('Failed to upload proof: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      // Submit manual payment
      const invoiceTotal = selectedInvoice.amount || selectedInvoice.total || 0
      const amountPaid = selectedInvoice.amount_paid || 0
      const amountToPay = Math.max(0, invoiceTotal - amountPaid)

      const response = await fetch('/api/billing/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          method: selectedMethod,
          amount: amountToPay,
          paymentDate: paymentDate || new Date().toISOString().split('T')[0],
          senderName: senderName,
          transactionReference: transactionReference,
          notes: notes,
          proofUrl: urlData?.publicUrl,
          proofFileName: proofFile.name,
          proofFileSize: proofFile.size,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert('Payment submitted successfully! We will verify your payment shortly.')
        router.push('/portal/payments')
      } else {
        setError(result.error || 'Failed to submit payment')
      }
    } catch (err) {
      console.error('Submit payment error:', err)
      setError('Failed to submit payment')
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const selectedInvoiceTotal = selectedInvoice ? (selectedInvoice.amount || selectedInvoice.total || 0) : 0
  const selectedInvoicePaid = selectedInvoice ? (selectedInvoice.amount_paid || 0) : 0
  const remainingBalance = Math.max(0, selectedInvoiceTotal - selectedInvoicePaid)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button
        onClick={() => router.back()}
        className="text-gray-400 hover:text-white text-sm mb-6"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">Make a Payment</h1>

      {/* Step 1: Select Invoice per blueprint Section 5 */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">STEP 1: Choose what you'd like to pay</h2>
        <div className="space-y-2">
          {invoices.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <p className="text-gray-500">No outstanding invoices</p>
            </div>
          ) : (
            invoices.map((invoice) => {
              const invTotal = invoice.amount || invoice.total || 0
              const invPaid = invoice.amount_paid || 0
              const invRemaining = Math.max(0, invTotal - invPaid)
              return (
                <button
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedInvoice?.id === invoice.id
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-gray-400">{invoice.project_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatCurrency(invRemaining, invoice.currency)}</p>
                      <p className="text-xs text-gray-500">Outstanding</p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Amount display per blueprint Section 6 */}
      {selectedInvoice && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Invoice balance</p>
              <p className="text-xl font-bold text-white">{formatCurrency(remainingBalance, selectedInvoice.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Amount to pay</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(remainingBalance, selectedInvoice.currency)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Payment Method per blueprint Section 7 */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">STEP 2: Choose payment method</h2>
        <div className="space-y-2">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.name)}
              disabled={!selectedInvoice}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedMethod === method.name
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-sm">
                    {method.type === 'gateway' ? '[CARD]' : method.type === 'crypto' ? '[USDT]' : '[BANK]'}
                  </span>
                  <div>
                    <p className="text-white font-medium">{method.name}</p>
                    <p className="text-xs text-gray-400">
                      {method.type === 'gateway' ? 'Instant processing' : 'Manual verification'}
                    </p>
                  </div>
                </div>
                {method.type === 'gateway' && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">Instant</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* USDT Instructions per blueprint Section 9, 35 */}
      {selectedMethod === 'USDT' && selectedInvoice && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">USDT Payment Instructions</h3>
          
          <label className="block text-sm text-gray-300 mb-2">Select Network</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {USDT_WALLETS.map((wallet) => (
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

          {USDT_WALLETS
            .filter(w => w.network === selectedNetwork)
            .map(wallet => (
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

      {/* Bank/Wire Instructions per blueprint Section 9, 16 */}
      {selectedMethod && selectedMethod !== 'USDT' && selectedMethod !== 'Paystack' && selectedInvoice && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Instructions</h3>
          {(() => {
            const method = methods.find(m => m.name === selectedMethod)
            return method?.instructions ? (
              <pre className="text-sm text-gray-300 whitespace-pre-line font-sans">{method.instructions}</pre>
            ) : (
              <p className="text-gray-500">Instructions not available</p>
            )
          })()}
        </div>
      )}

      {/* Manual Payment Form per blueprint Section 17 */}
      {selectedMethod && selectedMethod !== 'Paystack' && selectedMethod !== 'USDT' && selectedInvoice && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Submit Payment Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Transaction/Reference Number</label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                placeholder="e.g., TRX-123456"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                placeholder="Additional notes..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Proof of Payment *</label>
              <input
                type="file"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
              />
              {proofFile && (
                <p className="text-xs text-gray-400 mt-2">Selected: {proofFile.name}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedInvoice && selectedMethod && (
        <div className="space-y-3">
          {selectedMethod === 'Paystack' && (
            <button
              onClick={handlePaystackPayment}
              disabled={processing}
              className="w-full py-4 bg-[#E11D2E] hover:bg-[#F43F5E] text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {processing ? 'Processing...' : `Pay ${formatCurrency(remainingBalance, selectedInvoice.currency)} via Paystack`}
            </button>
          )}

          {selectedMethod !== 'Paystack' && (
            <button
              onClick={handleSubmitManualPayment}
              disabled={uploading || !proofFile}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {uploading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          )}
        </div>
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
      <MakePaymentContent />
    </Suspense>
  )
}