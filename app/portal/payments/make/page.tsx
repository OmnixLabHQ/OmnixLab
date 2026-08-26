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

const QR_CODE_BASE_URL = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co/storage/v1/object/public/payment-qr-codes'

const USDT_WALLETS = [
  { network: 'ERC20 (Ethereum)', wallet_address: '0x05cc5992a2ac3380a8c4eac0563323191b3e7b04', memo_tag: '', qr_code_url: `${QR_CODE_BASE_URL}/usdt-erc20.jpg` },
  { network: 'TRC20 (TRON)', wallet_address: 'TDsAEYnpqtzh6Mj19ASY5nV2THKF3xYnDn', memo_tag: '', qr_code_url: `${QR_CODE_BASE_URL}/usdt-trc20.jpg` },
  { network: 'BEP20 (BSC)', wallet_address: '0x05cc5992a2ac3380a8c4eac0563323191b3e7b04', memo_tag: '', qr_code_url: `${QR_CODE_BASE_URL}/usdt-bep20.jpg` },
]

const C = {
  bg: '#070A0F',
  surface: '#0D1117',
  border: '#1E293B',
  text: '#F8FAFC',
  text2: '#94A3B8',
  accent: '#E11D2E',
  accentHover: '#F43F5E',
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
  blue: '#38BDF8',
}

function MakePaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialInvoiceId = searchParams.get('invoiceId') || ''
  const initialMethod = searchParams.get('method') || ''

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState(USDT_WALLETS[0].network)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const [paymentDate, setPaymentDate] = useState('')
  const [senderName, setSenderName] = useState('')
  const [transactionReference, setTransactionReference] = useState('')
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (initialInvoiceId && invoices.length > 0) {
      const inv = invoices.find(i => i.id === Number(initialInvoiceId))
      if (inv) setSelectedInvoice(inv)
    }
  }, [initialInvoiceId, invoices])

  useEffect(() => {
    if (initialMethod && methods.length > 0) {
      const m = methods.find(m => m.name.toLowerCase().replace(/\s+/g, '_') === initialMethod.toLowerCase())
      if (m) setSelectedMethod(m.name)
    }
  }, [initialMethod, methods])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/portal/login'); return }

      const { data: invoicesData } = await supabase
        .from('invoices').select('*').eq('client_id', user.id).order('created_at', { ascending: false })

      const unpaid = (invoicesData || []).filter(inv =>
        ['unpaid', 'viewed', 'sent', 'partial', 'pending'].includes(inv.payment_status || inv.status || '')
      )

      const withProjects = await Promise.all(unpaid.map(async (inv) => {
        let projectName = 'General'
        if (inv.project_id) {
          const { data: p } = await supabase.from('projects').select('name').eq('id', inv.project_id).single()
          projectName = p?.name || 'General'
        }
        return { ...inv, project_name: projectName }
      }))

      setInvoices(withProjects)

      const { data: methodsData } = await supabase
        .from('payment_methods').select('*').eq('active', true).order('id', { ascending: true })

      setMethods(methodsData || [])
      setLoading(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to load')
      setLoading(false)
    }
  }, [router])

  const handlePaystack = async () => {
    if (!selectedInvoice) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/billing/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: selectedInvoice.id }),
      })
      const data = await res.json()
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        setError(data.error || 'Failed to initialize')
        setProcessing(false)
      }
    } catch (e) {
      setError('Failed to initialize payment')
      setProcessing(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!selectedInvoice) return
    if (!proofFile) { setError('Please upload proof of payment'); return }
    setUploading(true)
    setError('')
    try {
      const fileName = `${Date.now()}-${proofFile.name}`
      const { error: upErr } = await supabase.storage.from('payment-proofs').upload(fileName, proofFile)
      if (upErr) { setError('Upload failed: ' + upErr.message); setUploading(false); return }

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName)
      const total = selectedInvoice.amount || selectedInvoice.total || 0
      const paid = selectedInvoice.amount_paid || 0
      const amountToPay = Math.max(0, total - paid)

      const res = await fetch('/api/billing/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          method: selectedMethod,
          amount: amountToPay,
          paymentDate: paymentDate || new Date().toISOString().split('T')[0],
          senderName,
          transactionReference,
          notes,
          proofUrl: urlData?.publicUrl,
          proofFileName: proofFile.name,
          proofFileSize: proofFile.size,
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Payment submitted! We will verify shortly.')
        router.push('/portal/payments')
      } else {
        setError(data.error || 'Failed to submit')
      }
    } catch (e) {
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

  const fmt = (n: number, c: string = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n || 0)

  if (loading) {
    return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  }

  const invoiceTotal = selectedInvoice ? (selectedInvoice.amount || selectedInvoice.total || 0) : 0
  const invoicePaid = selectedInvoice ? (selectedInvoice.amount_paid || 0) : 0
  const remaining = Math.max(0, invoiceTotal - invoicePaid)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.text2, fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}>
          &larr; Back
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.text, margin: '0 0 24px 0' }}>Make a Payment</h1>

        {/* Step 1: Invoice */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: C.text2, margin: '0 0 12px 0' }}>STEP 1: Choose invoice</p>
          {invoices.length === 0 ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <p style={{ color: C.text2, margin: 0 }}>No outstanding invoices</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {invoices.map((inv) => {
                const t = inv.amount || inv.total || 0
                const p = inv.amount_paid || 0
                const r = Math.max(0, t - p)
                return (
                  <button key={inv.id} onClick={() => setSelectedInvoice(inv)}
                    style={{
                      background: selectedInvoice?.id === inv.id ? 'rgba(56,189,248,0.15)' : C.surface,
                      border: selectedInvoice?.id === inv.id ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
                      borderRadius: '12px', padding: '16px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: C.text, margin: 0 }}>{inv.invoice_number}</p>
                      <p style={{ fontSize: '13px', color: C.text2, margin: '4px 0 0 0' }}>{inv.project_name}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: C.text, margin: 0 }}>{fmt(r, inv.currency)}</p>
                      <p style={{ fontSize: '12px', color: C.text2, margin: '4px 0 0 0' }}>Outstanding</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Amount Display */}
        {selectedInvoice && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '13px', color: C.text2, margin: 0 }}>Invoice balance</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: C.text, margin: '4px 0 0 0' }}>{fmt(remaining, selectedInvoice.currency)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '13px', color: C.text2, margin: 0 }}>Amount to pay</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: C.green, margin: '4px 0 0 0' }}>{fmt(remaining, selectedInvoice.currency)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Method */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: C.text2, margin: '0 0 12px 0' }}>STEP 2: Choose payment method</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {methods.map((m) => (
              <button key={m.id} onClick={() => setSelectedMethod(m.name)} disabled={!selectedInvoice}
                style={{
                  background: selectedMethod === m.name ? 'rgba(56,189,248,0.15)' : C.surface,
                  border: selectedMethod === m.name ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
                  borderRadius: '12px', padding: '16px', cursor: selectedInvoice ? 'pointer' : 'not-allowed', textAlign: 'left',
                  opacity: selectedInvoice ? 1 : 0.5,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{m.type === 'gateway' ? '💳' : m.type === 'crypto' ? '🪙' : '🏦'}</span>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: C.text, margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: '12px', color: C.text2, margin: '4px 0 0 0' }}>
                      {m.type === 'gateway' ? 'Instant processing' : 'Manual verification'}
                    </p>
                  </div>
                </div>
                {m.type === 'gateway' && (
                  <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', background: 'rgba(34,197,94,0.2)', color: C.green }}>
                    Instant
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* USDT Instructions */}
        {selectedMethod === 'USDT' && selectedInvoice && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: C.text, margin: '0 0 16px 0' }}>USDT Payment Instructions</h3>
            <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 8px 0' }}>Select Network</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {USDT_WALLETS.map((w) => (
                <button key={w.network} onClick={() => setSelectedNetwork(w.network)}
                  style={{
                    background: selectedNetwork === w.network ? C.blue : C.surface,
                    border: `1px solid ${selectedNetwork === w.network ? C.blue : C.border}`,
                    borderRadius: '8px', padding: '10px', cursor: 'pointer',
                    color: selectedNetwork === w.network ? '#000' : C.text2,
                    fontSize: '13px', fontWeight: '600',
                  }}>
                  {w.network.split(' ')[0]}
                </button>
              ))}
            </div>
            {USDT_WALLETS.filter(w => w.network === selectedNetwork).map(w => (
              <div key={w.network} style={{ textAlign: 'center' }}>
                {w.qr_code_url && (
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', display: 'inline-block', marginBottom: '16px' }}>
                    <img src={w.qr_code_url} alt={`${w.network} QR`} width={200} height={200} style={{ borderRadius: '8px' }} />
                  </div>
                )}
                <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 8px 0' }}>Or copy wallet address</p>
                <div style={{ display: 'flex', gap: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
                  <code style={{ flex: 1, fontSize: '13px', color: C.text, wordBreak: 'break-all' }}>{w.wallet_address}</code>
                  <button onClick={() => copyToClipboard(w.wallet_address)}
                    style={{ background: C.blue, border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#000', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                    {copied === w.wallet_address ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: C.text2, margin: '8px 0 0 0' }}>Network: {w.network}</p>
              </div>
            ))}
            <div style={{ marginTop: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '12px', color: C.red, margin: 0 }}>
                IMPORTANT: Send only USDT using the selected network. Sending other tokens or using the wrong network will result in permanent loss of funds.
              </p>
            </div>
          </div>
        )}

        {/* Bank Instructions */}
        {selectedMethod && selectedMethod !== 'USDT' && selectedMethod !== 'Paystack' && selectedInvoice && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: C.text, margin: '0 0 16px 0' }}>Payment Instructions</h3>
            {(() => {
              const m = methods.find(x => x.name === selectedMethod)
              return m?.instructions ? (
                <pre style={{ fontSize: '14px', color: C.text2, whiteSpace: 'pre-line', fontFamily: 'inherit', margin: 0 }}>{m.instructions}</pre>
              ) : <p style={{ color: C.text2, margin: 0 }}>Instructions not available</p>
            })()}
          </div>
        )}

        {/* Manual Form */}
        {selectedMethod && selectedMethod !== 'Paystack' && selectedMethod !== 'USDT' && selectedInvoice && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: C.text, margin: '0 0 16px 0' }}>Submit Payment Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 4px 0' }}>Payment Date</p>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                    style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', color: C.text, fontSize: '14px' }} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 4px 0' }}>Sender Name</p>
                  <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your full name"
                    style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', color: C.text, fontSize: '14px' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 4px 0' }}>Transaction/Reference Number</p>
                <input type="text" value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} placeholder="e.g., TRX-123456"
                  style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', color: C.text, fontSize: '14px' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 4px 0' }}>Notes (optional)</p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', color: C.text, fontSize: '14px' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 4px 0' }}>Proof of Payment *</p>
                <input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} accept=".pdf,.png,.jpg,.jpeg,.webp"
                  style={{ width: '100%', color: C.text2, fontSize: '13px' }} />
                {proofFile && <p style={{ fontSize: '12px', color: C.text2, margin: '4px 0 0 0' }}>Selected: {proofFile.name}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedInvoice && selectedMethod && (
          <div>
            {selectedMethod === 'Paystack' && (
              <button onClick={handlePaystack} disabled={processing}
                style={{ width: '100%', padding: '16px', background: C.accent, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', opacity: processing ? 0.5 : 1 }}>
                {processing ? 'Processing...' : `Pay ${fmt(remaining, selectedInvoice.currency)} via Paystack`}
              </button>
            )}
            {selectedMethod !== 'Paystack' && (
              <button onClick={handleManualSubmit} disabled={uploading || !proofFile}
                style={{ width: '100%', padding: '16px', background: C.green, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', opacity: uploading || !proofFile ? 0.5 : 1 }}>
                {uploading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
            <p style={{ fontSize: '14px', color: C.red, margin: 0 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MakePaymentPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#070A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>}>
      <MakePaymentContent />
    </Suspense>
  )
}