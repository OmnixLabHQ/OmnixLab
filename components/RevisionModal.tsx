'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RevisionModal({
  milestoneId,
  onClose,
}: {
  milestoneId: number
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await supabase
      .from('milestones')
      .update({ status: 'revision-requested', description: note })
      .eq('id', milestoneId)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Request Revision</h2>
        <textarea
          rows={4}
          placeholder="Describe what you'd like changed..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-indigo-500 outline-none"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}