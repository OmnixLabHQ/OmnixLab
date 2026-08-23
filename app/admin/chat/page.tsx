'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminChatPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [newMsg, setNewMsg] = useState('')
  const [clientTyping, setClientTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchClients()
    fetchMessages()

    const messageChannel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchMessages()
      )
      .subscribe()

    const typingChannel = supabase
      .channel('admin-typing')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'typing_status' },
        (payload) => {
          const record = payload.new as any
          if (record && record.sender_type === 'client' && record.client_id === selectedClientId) {
            setClientTyping(record.is_typing)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(typingChannel)
    }
  }, [selectedClientId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedClientId])

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name, company').order('full_name', { ascending: true })
    setClients(data || [])
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, clients(full_name, company, email)')
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendTyping = async (typing: boolean) => {
    if (!selectedClientId) return
    await supabase
      .from('typing_status')
      .delete()
      .eq('client_id', selectedClientId)
      .is('project_id', null)
      .eq('sender_type', 'admin')

    await supabase.from('typing_status').insert({
      client_id: selectedClientId,
      project_id: null,
      sender_type: 'admin',
      is_typing: typing,
      updated_at: new Date().toISOString(),
    })
  }

  const handleTyping = () => {
    sendTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000)
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedClientId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('messages').insert({
      project_id: null,
      sender_id: user.id,
      sender_type: 'admin',
      content: newMsg,
      client_id: selectedClientId,
    })
    setNewMsg('')
    sendTyping(false)
  }

  const filteredMessages = selectedClientId
    ? messages.filter(msg => msg.client_id === selectedClientId)
    : messages

  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Chat Inbox</h1>

      <div className="flex gap-6">
        {/* Client List */}
        <div className="w-64 bg-white rounded-2xl shadow-sm border p-4 h-fit">
          <h2 className="font-bold mb-3">Clients</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                  selectedClientId === client.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{client.full_name}</div>
                <div className="text-xs text-gray-500">{client.company}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">
            {selectedClient
              ? `Chat with ${selectedClient.full_name} (${selectedClient.company})`
              : 'Select a client to start chatting'}
          </h2>

          <div className="h-96 overflow-y-auto space-y-3">
            {filteredMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                  msg.sender_type === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs">
                      {msg.sender_type === 'admin' ? 'You' : msg.clients?.full_name || 'Client'}
                    </span>
                    <span className="text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            {clientTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-full">
                  {selectedClient?.full_name || 'Client'} is typing…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newMsg}
              onChange={e => { setNewMsg(e.target.value); handleTyping() }}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={selectedClientId ? 'Type a message...' : 'Select a client first'}
              disabled={!selectedClientId}
              className="flex-1 px-4 py-2 border rounded-xl disabled:bg-gray-100"
            />
            <button
              onClick={sendMessage}
              disabled={!selectedClientId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}