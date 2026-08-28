'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  last_message_at: string | null
  last_message: string | null
  unread_count: number
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
  sender_name?: string
  attachments?: {
    id: number
    file_name: string
    storage_path: string
    mime_type: string
    file_size: number
  }[]
}

export default function ClientMessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessageText, setNewMessageText] = useState('')
  const [error, setError] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filter, conversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)

      // Subscribe to realtime messages
      const channel = supabase
        .channel(`client-conversation-${selectedConversation.id}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` },
          (payload) => {
            const newMsg = payload.new as Message
            if (newMsg.visibility === 'client') {
              setMessages(prev => [...prev, newMsg])
              scrollToBottom()
            }
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
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .order('last_message_at', { ascending: false })

      if (conversationsError) throw conversationsError

      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          let projectName = null
          if (conv.project_id) {
            try {
              const { data: project } = await supabase
                .from('projects')
                .select('name')
                .eq('id', conv.project_id)
                .single()
              projectName = project?.name || null
            } catch {}
          }

          // Get last message
          let lastMessage = null
          try {
            const { data: lastMsgData } = await supabase
              .from('messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .eq('visibility', 'client')
              .order('created_at', { ascending: false })
              .limit(1)
            lastMessage = lastMsgData?.[0]?.content || null
          } catch {}

          // Count unread admin messages
          let unreadCount = 0
          try {
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('sender_type', 'admin')
              .eq('visibility', 'client')
            unreadCount = count || 0
          } catch {}

          return {
            ...conv,
            project_name: projectName,
            last_message: lastMessage,
            unread_count: unreadCount,
          }
        })
      )

      setConversations(conversationsWithDetails)
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch conversations error:', err)
      setError(err?.message || 'Failed to load conversations')
      setLoading(false)
    }
  }, [router])

  const fetchMessages = async (conversationId: number) => {
    setLoadingMessages(true)
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_attachments (*)
        `)
        .eq('conversation_id', conversationId)
        .eq('visibility', 'client')
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(messagesData || [])
      scrollToBottom()
      setLoadingMessages(false)
    } catch (err) {
      console.error('Fetch messages error:', err)
      setLoadingMessages(false)
    }
  }

  function applyFilters() {
    let filtered = [...conversations]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (conv) =>
          conv.subject?.toLowerCase().includes(term) ||
          conv.last_message?.toLowerCase().includes(term) ||
          conv.project_name?.toLowerCase().includes(term)
      )
    }

    if (filter === 'unread') {
      filtered = filtered.filter(conv => conv.unread_count > 0)
    } else if (filter === 'projects') {
      filtered = filtered.filter(conv => conv.project_id !== null)
    } else if (filter === 'support') {
      filtered = filtered.filter(conv => conv.category === 'support')
    }

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

      // Upload attachment if present
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

      // Insert message
      const { data: newMsg, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          sender_type: 'client',
          message_type: 'text',
          content: newMessage.trim(),
          visibility: 'client',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Insert attachment metadata
      if (attachmentUrl && newMsg) {
        await supabase.from('message_attachments').insert({
          message_id: newMsg.id,
          file_name: attachmentName,
          storage_path: attachmentUrl,
          mime_type: attachmentType,
          file_size: attachmentSize,
          created_by: user.id,
        })
      }

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_id: newMsg.id,
          status: 'awaiting_admin',
        })
        .eq('id', selectedConversation.id)

      // Add local message
      setMessages(prev => [...prev, { ...newMsg, attachments: [] }])
      setNewMessage('')
      setAttachment(null)
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

  const handleCreateConversation = async () => {
    if (!newSubject.trim() || !newMessageText.trim()) {
      alert('Please enter a subject and message')
      return
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const conversationNumber = `CONV-${Date.now()}`

      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          conversation_number: conversationNumber,
          subject: newSubject,
          category: 'general',
          status: 'awaiting_admin',
          priority: 'normal',
          client_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (conversationError) throw conversationError

      await supabase.from('messages').insert({
        conversation_id: newConversation.id,
        sender_id: user.id,
        sender_type: 'client',
        message_type: 'text',
        content: newMessageText.trim(),
        visibility: 'client',
        created_at: new Date().toISOString(),
      })

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', newConversation.id)

      setShowNewConversation(false)
      setNewSubject('')
      setNewMessageText('')
      fetchConversations()
    } catch (err: any) {
      console.error('Create conversation error:', err)
      alert('Failed to create: ' + err.message)
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

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-sm text-gray-300 mt-1">Your conversations with the Omnix Lab team</p>
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            + New Message
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm"
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'support', label: 'Support' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      filter === f.id ? 'bg-blue-100 text-blue-700' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[500px]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-gray-400 text-sm">No conversations found</p>
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="text-blue-600 text-sm hover:underline mt-2"
                  >
                    Start a conversation
                  </button>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {conv.subject || 'General Conversation'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                        {conv.project_name && (
                          <p className="text-xs text-gray-400 mt-1">Project: {conv.project_name}</p>
                        )}
                      </div>
                      {conv.last_message_at && (
                        <span className="text-xs text-gray-400 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation View */}
          <div className="lg:col-span-2 bg-gray-900 border border-white/10 rounded-xl flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-gray-400">Select a conversation to view messages</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                  <h2 className="font-semibold text-white">
                    {selectedConversation.subject || 'Conversation'}
                  </h2>
                  {selectedConversation.project_name && (
                    <p className="text-sm text-gray-400">Project: {selectedConversation.project_name}</p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                    selectedConversation.status === 'awaiting_admin' ? 'bg-amber-100 text-amber-800' :
                    selectedConversation.status === 'awaiting_client' ? 'bg-blue-100 text-blue-800' :
                    selectedConversation.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-white/10 text-gray-800'
                  }`}>
                    {selectedConversation.status}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-400 text-sm mt-2">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            msg.sender_type === 'client'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map(att => (
                                <a
                                  key={att.id}
                                  href={att.storage_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`block text-xs ${
                                    msg.sender_type === 'client' ? 'text-blue-200' : 'text-blue-600'
                                  } hover:underline`}
                                >
                                  📎 {att.file_name}
                                </a>
                              ))}
                            </div>
                          )}
                          <span className={`text-xs mt-1 block ${
                            msg.sender_type === 'client' ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Omnix Lab is typing...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-gray-200"
                      title="Attach file"
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
                      placeholder="Write a message..."
                      rows={1}
                      className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-sm resize-none focus:border-blue-500 outline-none"
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
                        className="text-xs text-red-500 hover:text-red-600"
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

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">New Conversation</h2>
              <button onClick={() => setShowNewConversation(false)} className="text-gray-400 hover:text-gray-300">X</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Subject *</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="e.g., Question about my project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Message *</label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Type your message..."
                />
              </div>
              <button
                onClick={handleCreateConversation}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
