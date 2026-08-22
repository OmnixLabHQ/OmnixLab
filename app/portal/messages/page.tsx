'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: string
  client_id: string
  title: string
  subject: string | null
  category: string
  priority: string
  status: string
  project_id: string | null
  pinned: boolean
  archived: boolean
  last_message_at: string | null
  created_at: string
  updated_at: string
  unread_count: number
  last_message?: string
  last_sender?: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: string
  body: string
  message_type: string
  reply_to_id: string | null
  is_edited: boolean
  created_at: string
  attachments: Attachment[]
  sender_name?: string
}

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
}

interface Project {
  id: string
  name: string
  status: string
}

interface Participant {
  id: string
  name: string
  role: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [messageInput, setMessageInput] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // New conversation form
  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [newPriority, setNewPriority] = useState('normal')
  const [newProjectId, setNewProjectId] = useState('')
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .eq('archived', false)
        .order('last_message_at', { ascending: false })

      if (convosError) {
        console.error('Fetch conversations error:', convosError)
        setLoading(false)
        return
      }

      const convosWithMeta = await Promise.all(
        (convos || []).map(async (convo) => {
          const { data: msgs } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...convo,
            unread_count: 0,
            last_message: msgs?.[0]?.body?.slice(0, 60) || '',
            last_sender: msgs?.[0]?.sender_type === 'client' ? 'You' : 'Omnix Lab',
          }
        })
      )

      setConversations(convosWithMeta)

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  async function selectConversation(conversation: Conversation) {
    setActiveConversation(conversation)

    const { data: msgData, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (msgError) return

    const messagesWithAttachments = await Promise.all(
      (msgData || []).map(async (msg) => {
        const { data: attData } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('message_id', msg.id)

        return {
          ...msg,
          attachments: attData || [],
          sender_name: msg.sender_type === 'client' ? 'You' : 'Omnix Lab',
        }
      })
    )

    setMessages(messagesWithAttachments)
  }

  async function handleSendMessage() {
    if (!activeConversation || !messageInput.trim()) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const uploadedAttachments: Array<{ file_name: string; file_url: string; file_size: number | null; file_type: string | null }> = []

      for (const file of attachments) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('uploadedBy', user.id)

        const res = await fetch('/api/messaging/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadResult = await res.json()
        if (uploadResult.success) {
          uploadedAttachments.push({
            file_name: uploadResult.fileName,
            file_url: uploadResult.fileUrl,
            file_size: uploadResult.fileSize || null,
            file_type: uploadResult.fileType || null,
          })
        }
      }

      const { data: newMsg, error: msgError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          sender_type: 'client',
          body: messageInput,
          message_type: 'text',
          reply_to_id: replyTo?.id || null,
        })
        .select()
        .single()

      if (msgError) {
        console.error('Send error:', msgError)
        return
      }

      for (const att of uploadedAttachments) {
        await supabase.from('message_attachments').insert({
          message_id: newMsg.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_size: att.file_size,
          file_type: att.file_type,
          uploaded_by: user.id,
        })
      }

      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeConversation.id)

      setMessageInput('')
      setAttachments([])
      setReplyTo(null)

      await selectConversation(activeConversation)
      await fetchData()
    } catch (error) {
      console.error('Send exception:', error)
    } finally {
      setSending(false)
    }
  }

  async function handleCreateConversation() {
    if (!newSubject.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: conversation, error: convoError } = await supabase
        .from('conversations')
        .insert({
          client_id: user.id,
          title: newSubject,
          subject: newSubject,
          category: newCategory,
          priority: newPriority,
          project_id: newProjectId || null,
          status: 'open',
        })
        .select()
        .single()

      if (convoError) return

      if (newMessage.trim()) {
        await supabase.from('conversation_messages').insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'client',
          body: newMessage,
          message_type: 'text',
        })
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversation.id)
      }

      setShowNewModal(false)
      setNewSubject('')
      setNewMessage('')
      setNewCategory('general')
      setNewPriority('normal')
      setNewProjectId('')
      await fetchData()
    } catch (error) {
      console.error('Create error:', error)
    }
  }

  async function handlePinConversation(conversation: Conversation) {
    const newPinned = !conversation.pinned
    await supabase.from('conversations').update({ pinned: newPinned }).eq('id', conversation.id)
    setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, pinned: newPinned } : c))
    if (activeConversation?.id === conversation.id) {
      setActiveConversation({ ...activeConversation, pinned: newPinned })
    }
  }

  const filteredConversations = conversations.filter(convo => {
    if (categoryFilter === 'unread') return (convo.unread_count || 0) > 0
    if (categoryFilter === 'pinned') return convo.pinned
    if (categoryFilter !== 'all' && convo.category !== categoryFilter) return false
    if (searchTerm && !convo.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    const aTime = new Date(a.last_message_at || a.created_at).getTime()
    const bTime = new Date(b.last_message_at || b.created_at).getTime()
    return bTime - aTime
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
          >
            + New Message
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-4">
          {/* LEFT PANEL — Conversation List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread' },
                  { key: 'pinned', label: 'Pinned' },
                  { key: 'project', label: 'Projects' },
                  { key: 'billing', label: 'Billing' },
                  { key: 'support', label: 'Support' },
                  { key: 'general', label: 'General' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      categoryFilter === cat.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {sortedConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No conversations</div>
              ) : (
                sortedConversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => selectConversation(convo)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      activeConversation?.id === convo.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {convo.pinned ? '📌 ' : ''}
                        {convo.priority === 'urgent' ? '🔴 ' : convo.priority === 'important' ? '🟡 ' : ''}
                        {convo.title}
                      </p>
                      {(convo.unread_count || 0) > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {convo.last_sender}: {convo.last_message || 'No messages yet'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {convo.last_message_at ? new Date(convo.last_message_at).toLocaleTimeString() : ''}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        convo.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        convo.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {convo.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CENTER PANEL — Active Conversation */}
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col min-h-[600px]">
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
                Select a conversation to view messages
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{activeConversation.title}</h2>
                    <p className="text-xs text-gray-500">
                      {activeConversation.status.replace(/_/g, ' ')} • {activeConversation.category}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePinConversation(activeConversation)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      {activeConversation.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-xl p-3 ${
                          msg.sender_type === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                          {msg.reply_to_id && (
                            <div className="text-xs mb-1 opacity-70 border-l-2 pl-2">
                              ↪ Replying to previous message
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          {msg.attachments && msg.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs mt-2 underline"
                            >
                              📎 {att.file_name}
                            </a>
                          ))}
                          {msg.is_edited && <span className="text-xs opacity-70"> (edited)</span>}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply indicator */}
                {replyTo && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between">
                    <span className="text-sm text-gray-600">Replying to: {replyTo.body.slice(0, 50)}...</span>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400">✕</button>
                  </div>
                )}

                {/* Composer */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-end gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                      className="hidden"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg" title="Attach files">📎</button>
                    <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg" title="Mention">@</button>
                    <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg" title="Emoji">😊</button>
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Write a message..."
                      rows={1}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !messageInput.trim()}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                          📎 {file.name}
                          <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="ml-1 text-gray-400">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANEL — Conversation Details */}
          {showDetails && activeConversation && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 max-h-[600px] overflow-y-auto">
              <h3 className="font-semibold text-gray-900">Conversation Details</h3>

              {/* Project context */}
              {activeConversation.project_id && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Project</p>
                  {projects.find(p => p.id === activeConversation.project_id) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {projects.find(p => p.id === activeConversation.project_id)?.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Status: {projects.find(p => p.id === activeConversation.project_id)?.status}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">{activeConversation.category}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Priority</p>
                  <p className="font-medium text-gray-900">{activeConversation.priority}</p>
                </div>
              </div>

              {/* Shared Files */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Shared Files</p>
                {messages.filter(m => m.attachments.length > 0).length === 0 ? (
                  <p className="text-sm text-gray-400">No files shared yet</p>
                ) : (
                  <div className="space-y-1">
                    {messages.filter(m => m.attachments.length > 0).map(m =>
                      m.attachments.map(att => (
                        <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer"
                           className="block text-sm text-blue-600 hover:underline truncate">
                          📄 {att.file_name}
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Activity */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Activity</p>
                <div className="space-y-2">
                  {messages.slice(-5).reverse().map(msg => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <span className="text-xs">•</span>
                      <div>
                        <p className="text-xs text-gray-700">{msg.sender_name} sent a message</p>
                        <p className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">New Conversation</h3>
              <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
                    <option value="general">General</option>
                    <option value="project">Project</option>
                    <option value="billing">Billing</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project (optional)</label>
                <select value={newProjectId} onChange={(e) => setNewProjectId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreateConversation}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                  Send
                </button>
                <button onClick={() => setShowNewModal(false)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}