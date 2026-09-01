'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: number
  conversation_number: string
  subject: string
  category: string
  status: string
  priority: string
  client_id: string
  project_id: number | null
  invoice_id: number | null
  project_request_id: number | null
  assigned_admin_id: string | null
  last_message_at: string | null
  last_message: string | null
  unread_count: number
  client_name?: string
  project_name?: string
}

interface Message {
  id: number
  conversation_id: number
  sender_id: string
  sender_type: 'client' | 'admin'
  message_type: string
  content: string
  visibility: string
  created_at: string
}

export default function AdminMessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filter, priorityFilter, statusFilter, conversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      const channel = supabase
        .channel(`admin-conv-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            const newMsg = payload.new as Message
            setMessages((prev) => [...prev, newMsg])
            scrollToBottom()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation])

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    try {
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          let clientName = 'Unknown'
          let projectName = null
          if (conv.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', conv.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }
          if (conv.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', conv.project_id)
              .single()
            projectName = project?.name || null
          }

          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('content, sender_type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          // Count unread messages from client
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_type', 'client')
            .eq('visibility', 'client')

          return {
            ...conv,
            client_name: clientName,
            project_name: projectName,
            last_message: lastMsgData?.[0]?.content || null,
            unread_count: unreadCount || 0,
          }
        })
      )

      setConversations(conversationsWithDetails)
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch conversations error:', err)
      setLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (conversationId: number) => {
    setLoadingMessages(true)
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(messagesData || [])
      scrollToBottom()
    } catch (err: any) {
      console.error('Fetch messages error:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...conversations]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (conv) =>
          conv.subject?.toLowerCase().includes(term) ||
          conv.client_name?.toLowerCase().includes(term) ||
          conv.last_message?.toLowerCase().includes(term) ||
          conv.project_name?.toLowerCase().includes(term)
      )
    }

    if (filter === 'unread') filtered = filtered.filter((c) => c.unread_count > 0)
    if (filter === 'project') filtered = filtered.filter((c) => c.project_id !== null)
    if (filter === 'support') filtered = filtered.filter((c) => c.category === 'support')
    if (filter === 'billing') filtered = filtered.filter((c) => c.category === 'billing')

    if (priorityFilter !== 'all') filtered = filtered.filter((c) => c.priority === priorityFilter)
    if (statusFilter !== 'all') filtered = filtered.filter((c) => c.status === statusFilter)

    setFilteredConversations(filtered)
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && !attachment)) return
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let attachmentUrl = null
      let attachmentName = null
      let attachmentType = null
      let attachmentSize = null

      if (attachment) {
        const fileName = `${Date.now()}-${attachment.name}`
        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, attachment)

        if (uploadError) {
          alert('Attachment upload failed: ' + uploadError.message)
          setSending(false)
          return
        }

        const { data: urlData } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(fileName)

        attachmentUrl = urlData?.publicUrl
        attachmentName = attachment.name
        attachmentType = attachment.type
        attachmentSize = attachment.size
      }

      const { data: newMsg, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          sender_type: 'admin',
          message_type: attachment ? 'file' : 'text',
          content: newMessage.trim(),
          visibility: isInternalNote ? 'internal' : 'client',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (messageError) throw messageError

      if (attachmentUrl && newMsg) {
        await supabase.from('message_attachments').insert({
          message_id: newMsg.id,
          file_name: attachmentName,
          storage_path: attachmentUrl,
          mime_type: attachmentType,
          file_size: attachmentSize,
          created_by: user.id
        })
      }

      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_id: newMsg.id,
          status: isInternalNote ? selectedConversation.status : 'awaiting_client',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id)

      setMessages((prev) => [...prev, newMsg])
      setNewMessage('')
      setAttachment(null)
      setIsInternalNote(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      scrollToBottom()
      fetchConversations()
    } catch (err: any) {
      console.error('Send message error:', err)
      alert('Failed to send: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (conversationId: number, status: string) => {
    try {
      await supabase.from('conversations').update({ status }).eq('id', conversationId)
      fetchConversations()
    } catch (err) {
      console.error('Status change error:', err)
    }
  }

  const handlePriorityChange = async (conversationId: number, priority: string) => {
    try {
      await supabase.from('conversations').update({ priority }).eq('id', conversationId)
      fetchConversations()
    } catch (err) {
      console.error('Priority change error:', err)
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      open: 'bg-green-500/20 text-green-300',
      awaiting_client: 'bg-amber-500/20 text-amber-300',
      awaiting_admin: 'bg-blue-500/20 text-blue-300',
      resolved: 'bg-emerald-500/20 text-emerald-300',
      archived: 'bg-gray-500/20 text-gray-300'
    }
    return map[status] || 'bg-gray-500/20 text-gray-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-sm text-gray-400 mt-1">Client communication center</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Conversations</p>
          <p className="text-2xl font-bold text-white">{conversations.length}</p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-blue-400">
            {conversations.filter((c) => c.unread_count > 0).length}
          </p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Awaiting Admin</p>
          <p className="text-2xl font-bold text-amber-400">
            {conversations.filter((c) => c.status === 'awaiting_admin').length}
          </p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Resolved</p>
          <p className="text-2xl font-bold text-green-400">
            {conversations.filter((c) => c.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search client, project, message..."
          className="flex-1 px-4 py-2.5 bg-gray-900 border border-white/10 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-white/10 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Priorities</option>
          <option value="normal" className="bg-gray-900">Normal</option>
          <option value="high" className="bg-gray-900">High</option>
          <option value="urgent" className="bg-gray-900">Urgent</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-white/10 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="open" className="bg-gray-900">Open</option>
          <option value="awaiting_client" className="bg-gray-900">Awaiting Client</option>
          <option value="awaiting_admin" className="bg-gray-900">Awaiting Admin</option>
          <option value="resolved" className="bg-gray-900">Resolved</option>
          <option value="archived" className="bg-gray-900">Archived</option>
        </select>
      </div>

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex gap-2 flex-wrap">
              {['all', 'unread', 'project', 'support', 'billing'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg ${
                    filter === f ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No conversations</div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 ${
                    selectedConversation?.id === conv.id ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{conv.client_name}</p>
                      <p className="text-sm text-gray-400 truncate">{conv.subject}</p>
                      <p className="text-xs text-gray-500 truncate mt-1">{conv.last_message}</p>
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      {conv.last_message_at && (
                        <span className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</span>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(conv.status)}`}>
                      {conv.status}
                    </span>
                    <span className="text-xs text-gray-500">{conv.priority}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/10 rounded-xl flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <p className="text-gray-500">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">
                    {selectedConversation.client_name} - {selectedConversation.subject}
                  </h2>
                  {selectedConversation.project_name && (
                    <p className="text-sm text-gray-400">Project: {selectedConversation.project_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedConversation.priority}
                    onChange={(e) => handlePriorityChange(selectedConversation.id, e.target.value)}
                    className="bg-gray-800 border border-white/10 text-white rounded px-2 py-1 text-xs"
                  >
                    <option value="normal" className="bg-gray-900">Normal</option>
                    <option value="high" className="bg-gray-900">High</option>
                    <option value="urgent" className="bg-gray-900">Urgent</option>
                  </select>
                  <select
                    value={selectedConversation.status}
                    onChange={(e) => handleStatusChange(selectedConversation.id, e.target.value)}
                    className="bg-gray-800 border border-white/10 text-white rounded px-2 py-1 text-xs"
                  >
                    <option value="open" className="bg-gray-900">Open</option>
                    <option value="awaiting_client" className="bg-gray-900">Awaiting Client</option>
                    <option value="awaiting_admin" className="bg-gray-900">Awaiting Admin</option>
                    <option value="resolved" className="bg-gray-900">Resolved</option>
                    <option value="archived" className="bg-gray-900">Archived</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {loadingMessages ? (
                  <div className="text-center py-8 text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No messages</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          msg.visibility === 'internal'
                            ? 'bg-yellow-500/10 border border-yellow-500/30'
                            : msg.sender_type === 'admin'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                        }`}
                      >
                        {msg.visibility === 'internal' && (
                          <span className="text-xs text-yellow-400 block mb-1">🔒 Internal Note</span>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-70">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isInternalNote ? 'bg-yellow-600 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    🔒
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-white/10 text-gray-300 rounded-lg text-sm"
                  >
                    📎
                  </button>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={isInternalNote ? 'Internal note...' : 'Write a message...'}
                    rows={1}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-white/10 text-white rounded-lg text-sm resize-none focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && !attachment)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
                {attachment && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">📎 {attachment.name}</span>
                    <button
                      onClick={() => {
                        setAttachment(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="text-xs text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
