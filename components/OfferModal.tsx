'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function OfferModal({ projectId, clientId, onClose }: { projectId: number; clientId: string; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOffer = async () => {
    if (!amount) return
    setLoading(true)
    await supabase.from('offers').insert({
      project_id: projectId,
      client_id: clientId,
      amount: parseFloat(amount),
      description,
      status: 'pending'
    })
    // Also create an invoice
    await supabase.from('invoices').insert({
      client_id: clientId,
      project_id: projectId,
      amount: parseFloat(amount),
      description,
      status: 'unpaid'
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Send Payment Offer</h2>
        <input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
        <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
          <button onClick={sendOffer} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Offer'}
          </button>
        </div>
      </div>
    </div>
  )
}
