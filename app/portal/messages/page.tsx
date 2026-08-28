'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Conversation {
  id: number
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
  content: string
  visibility: string
  created_at: string
  attachments?: any[]
  sender_name?: string
}

export default function ClientMessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessageText, setNewMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachment, setAttachment] = useState<File | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      // Subscribe to realtime messages
      const channel = supabase
        .channel(`conversation-${selectedConversation.id}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` },
          (payload) => {
            const newMsg = payload.new as Message
            setMessages(prev => [...prev, newMsg])
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          let projectName = null
          if (conv.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', conv.project_id)
              .single()
            projectName = project?.name || null
          }

          // Get last message and unread count
          const { data: msgs, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const unread = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_type', 'admin')
            .eq('visibility', 'client')
            .not('read_at', 'is', null)

          return {
            ...conv,
            project_name: projectName,
            last_message: msgs?.[0]?.content || null,
            unread_count: unread.count || 0,
          }
        })
      )

      setConversations(conversationsWithDetails)
      setLoading(false)
    } catch (err) {
      console.error('Fetch conversations error:', err)
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

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    // Mark as read - optional
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
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(fileName)
          attachmentUrl = urlData?.publicUrl
          attachmentName = attachment.name
          attachmentType = attachment.type
          attachmentSize = attachment.size
        }
      }

      const { data: sentMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          sender_type: 'client',
          content: newMessage.trim(),
          visibility: 'client',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      if (attachmentUrl && sentMessage) {
        await supabase.from('message_attachments').insert({
          message_id: sentMessage.id,
          file_name: attachmentName,
          storage_path: attachmentUrl,
          mime_type: attachmentType,
          file_size: attachmentSize,
          created_by: user.id,
        })
      }

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString(), last_message_id: sentMessage.id })
        .eq('id', selectedConversation.id)

      setNewMessage('')
      setAttachment(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      scrollToBottom()
    } catch (err) {
      console.error('Send message error:', err)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleCreateConversation = async () => {
    if (!newSubject.trim() || !newMessageText.trim()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          subject: newSubject,
          category: 'general',
          client_id: user.id,
          status: 'open',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Insert first message
      await supabase.from('messages').insert({
        conversation_id: newConversation.id,
        sender_id: user.id,
        sender_type: 'client',
        content: newMessageText,
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
    } catch (err) {
      console.error('Create conversation error:', err)
      alert('Failed to create conversation')
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

  const filteredConversations = conversations.filter(conv => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      if (!conv.subject?.toLowerCase().includes(term) &&
          !conv.last_message?.toLowerCase().includes(term) &&
          !conv.project_name?.toLowerCase().includes(term)) return false
    }
    if (filter === 'unread') return conv.unread_count > 0
    if (filter === 'projects') return conv.project_id !== null
    if (filter === 'support') return conv.category === 'support'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <button
            onClick={() => setShowNewConversation(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            + New Message
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <div className="flex gap-2 mt-3">
                {['all', 'unread', 'projects', 'support'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      filter === f ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No conversations found</div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {conv.subject || 'Conversation'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{conv.last_message || ''}</p>
                        {conv.project_name && (
                          <p className="text-xs text-gray-400 mt-1">Project: {conv.project_name}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        {conv.last_message_at && (
                          <span className="text-xs text-gray-400">{formatTime(conv.last_message_at)}</span>
                        )}
                        {conv.unread_count > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-gray-500">Select a conversation to view messages</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.subject || 'Conversation'}
                  </h2>
                  {selectedConversation.project_name && (
                    <p className="text-sm text-gray-500">Project: {selectedConversation.project_name}</p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                  {loadingMessages ? (
                    <div className="text-center py-8 text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No messages yet</div>
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
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((att: any) => (
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
                          <span className={`text-xs ${
                            msg.sender_type === 'client' ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm"
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
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm resize-none"
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
                      <span className="text-xs text-gray-500">📎 {attachment.name}</span>
                      <button
                        onClick={() => {
                          setAttachment(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="text-xs text-red-500"
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
              <h2 className="text-lg font-bold text-gray-900">New Conversation</h2>
              <button onClick={() => setShowNewConversation(false)} className="text-gray-400">X</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
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