'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function MilestoneCard({
  milestone,
  invoice,
  projectId,
  userId,
  onPay,
  onAccept,
  onDecline,
  onRequestRevision,
}: {
  milestone: any
  invoice: any
  projectId: number
  userId: string
  onPay: (invoice: any) => void
  onAccept: (milestone: any) => void
  onDecline: (milestone: any) => void
  onRequestRevision: (milestone: any) => void
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (milestone.status === 'revision-requested' || milestone.status === 'declined') {
      setShowChat(true)
      fetchMessages()

      const channel = supabase
        .channel(`milestone-chat-${milestone.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `milestone_id=eq.${milestone.id}` },
          () => fetchMessages()
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    } else {
      setShowChat(false)
    }
  }, [milestone.status, milestone.id])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('milestone_id', milestone.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendMessage = async () => {
    if (!newMsg.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('messages').insert({
      project_id: projectId,
      milestone_id: milestone.id,
      sender_id: user.id,
      sender_type: 'client',
      content: newMsg,
      client_id: userId,
    })
    setNewMsg('')
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const isPaid = invoice?.status === 'paid'
  const isDelivered = milestone.status === 'delivered'
  const isAccepted = milestone.status === 'accepted'
  const isRevision = milestone.status === 'revision-requested'
  const isDeclined = milestone.status === 'declined'

  return (
    <div className={`border rounded-xl p-4 ${
      isAccepted ? 'bg-green-50 border-green-200' :
      isRevision ? 'bg-yellow-50 border-yellow-200' :
      isDeclined ? 'bg-red-50 border-red-200' :
      'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
          {milestone.description && <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {isPaid ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Unpaid</span>
            )}
            {isAccepted && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Accepted</span>}
            {isDelivered && !isAccepted && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Delivered</span>}
            {isRevision && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Revision Requested</span>}
            {isDeclined && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Declined</span>}
          </div>
        </div>
        <div className="text-right">
          {invoice ? (
            <>
              <p className="font-semibold">${invoice.amount?.toLocaleString()}</p>
              {!isPaid && (
                <button
                  onClick={() => onPay(invoice)}
                  className="mt-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                >
                  Pay Now
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No invoice</p>
          )}
        </div>
      </div>

      {/* Action buttons when delivered and paid */}
      {isDelivered && isPaid && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onAccept(milestone)}
            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={() => onRequestRevision(milestone)}
            className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700"
          >
            Request Revision
          </button>
          <button
            onClick={() => onDecline(milestone)}
            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
          >
            Decline
          </button>
        </div>
      )}

      {/* Chat box when revision/declined */}
      {showChat && (
        <div className="mt-4 bg-white rounded-lg p-3 border border-gray-100">
          <h5 className="text-sm font-medium mb-2">💬 Discussion</h5>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-1.5 rounded-lg text-sm ${
                  msg.sender_type === 'client' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your reason..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
            <button onClick={sendMessage} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg">Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
