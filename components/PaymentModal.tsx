'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaymentModal({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  useState(() => {
    const fetchMethods = async () => {
      const { data } = await supabase.from('payment_methods').select('*').eq('active', true).order('id')
      setPaymentMethods(data || [])
    }
    fetchMethods()
  })

  const handlePay = async () => {
    if (!selectedMethod) return
    setLoading(true)

    if (selectedMethod.type === 'automated') {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: (await supabase.auth.getUser()).data.user?.email,
          amount: invoice.amount,
          invoiceId: invoice.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = data.authorization_url
      } else {
        alert('Payment failed: ' + data.error)
      }
    } else {
      if (!receiptFile) return
      setUploading(true)
      const fileName = `receipt-${Date.now()}-${receiptFile.name}`
      const { error: uploadError } = await supabase.storage.from('project-files').upload(fileName, receiptFile)
      if (uploadError) {
        alert('Upload failed: ' + uploadError.message)
        setUploading(false)
        setLoading(false)
        return
      }
      const receiptUrl = supabase.storage.from('project-files').getPublicUrl(fileName).data.publicUrl
      await supabase.from('payment_receipts').insert({
        client_id: (await supabase.auth.getUser()).data.user?.id,
        project_id: invoice.project_id,
        amount: invoice.amount,
        payment_method: selectedMethod.name,
        receipt_url: receiptUrl,
        status: 'pending',
      })
      await supabase.from('invoices').update({ payment_gateway: selectedMethod.name, status: 'pending' }).eq('id', invoice.id)
      setUploading(false)
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Pay Invoice #{invoice.id}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">✕</button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <p className="text-sm"><strong>Amount:</strong> ${invoice.amount?.toLocaleString()}</p>
          <p className="text-sm mt-1"><strong>Description:</strong> {invoice.description}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Select Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={`p-3 rounded-xl border text-center ${
                  selectedMethod?.id === method.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-sm font-medium">{method.name}</div>
                <div className="text-xs text-gray-500">{method.type === 'automated' ? 'Instant' : 'Manual'}</div>
              </button>
            ))}
          </div>
        </div>
        {selectedMethod && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
            {selectedMethod.type === 'manual' ? (
              <>
                <p className="text-sm">Upload your receipt after payment.</p>
                <input type="file" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="text-sm" />
              </>
            ) : (
              <p className="text-sm">You will be redirected to Paystack.</p>
            )}
            <button
              onClick={handlePay}
              disabled={loading || (selectedMethod.type === 'manual' && !receiptFile)}
              className="w-full py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : selectedMethod.type === 'automated' ? `Pay with ${selectedMethod.name}` : 'Submit Receipt'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 
