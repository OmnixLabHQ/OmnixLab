'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaymentReceiptUpload({ userId, projects }: { userId: string; projects: any[] }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Bank Transfer')
  const [projectId, setProjectId] = useState('')
  const [clientMessage, setClientMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!selectedFile || !amount || !userId) return
    setUploading(true)

    const fileName = `receipt-${Date.now()}-${selectedFile.name}`
    const { error: uploadError } = await supabase.storage.from('project-files').upload(fileName, selectedFile)
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const receiptUrl = supabase.storage.from('project-files').getPublicUrl(fileName).data.publicUrl

    const { error } = await supabase.from('payment_receipts').insert({
      client_id: userId,
      project_id: projectId || null,
      amount: parseFloat(amount),
      payment_method: method,
      receipt_url: receiptUrl,
      status: 'pending',
      client_message: clientMessage || null,
    })

    if (error) {
      alert('Failed to save receipt: ' + error.message)
    } else {
      // Notify Telegram
      await fetch('/api/telegram-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🧾 New payment receipt from ${userId}\nAmount: $${amount}\nMethod: ${method}\nMessage: ${clientMessage || 'None'}` }),
      })
      alert('Receipt submitted! It will be reviewed shortly.')
      setAmount('')
      setMethod('Bank Transfer')
      setProjectId('')
      setClientMessage('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setUploading(false)
  }

  return (
    <div className="space-y-3 text-gray-900 dark:text-gray-100">
      <label className="block text-sm font-medium">Amount</label>
      <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
      <label className="block text-sm font-medium">Payment Method</label>
      <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <option>Bank Transfer</option>
        <option>Credit Card</option>
        <option>Crypto</option>
        <option>Other</option>
      </select>
      <label className="block text-sm font-medium">Project (optional)</label>
      <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <option value="">None</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <label className="block text-sm font-medium">Message (optional)</label>
      <input type="text" placeholder="Add a note with your payment" value={clientMessage} onChange={e => setClientMessage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
      <label className="block text-sm font-medium">Receipt File</label>
      <input type="file" ref={fileInputRef} onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300" />
      <button onClick={handleUpload} disabled={uploading || !selectedFile || !amount} className="w-full py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
        {uploading ? 'Uploading...' : 'Submit Receipt'}
      </button>
    </div>
  )
}
