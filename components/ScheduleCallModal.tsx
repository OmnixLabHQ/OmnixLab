 
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const TELEGRAM_BOT = '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'
const TELEGRAM_CHAT = '8550312488'

export default function ScheduleCallModal({ onClose, user }: { onClose: () => void; user: any }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    // Save to Supabase
    const { error } = await supabase.from('call_bookings').insert({
      client_id: user.id,
      date,
      time,
      notes,
    })

    // Notify Telegram
    const msg = `📅 *New Call Booking*\n👤 ${user.email}\n📆 ${date} at ${time}\n📝 ${notes}`
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: msg,
        parse_mode: 'Markdown',
      }),
    })

    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Schedule a Call</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
          <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600" rows={3} />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Booking...' : 'Book Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}