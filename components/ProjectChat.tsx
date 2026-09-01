'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProjectChat({ projectId }: { projectId: number }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setClientId(user.id)
    }
    fetchUser()
    fetchMessages()

    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` },
        () => fetchMessages()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !clientId) return
    await supabase.from('messages').insert({
      project_id: projectId,
      sender_id: clientId,
      sender_type: 'client',
      content: newMsg,
      client_id: clientId,
    })
    setNewMsg('')
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">P</div>
        <div>
          <h3 className="font-bold text-gray-900">Project Chat</h3>
          <p className="text-xs text-gray-500">Discuss this project</p>
        </div>
      </div>

      <div className="h-48 overflow-y-auto space-y-3 bg-gray-50 rounded-xl p-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.sender_type === 'client'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
            }`}>
              {msg.content}
              <span className="block text-xs opacity-70 mt-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none bg-white text-gray-900"
        />
        <button
          onClick={sendMessage}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  )
}
