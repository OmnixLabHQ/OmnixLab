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
  milestone_id: string | null
  invoice_id: string | null
  file_id: string | null
  idea_id: string | null
  support_ticket_id: string | null
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
  is_deleted: boolean
  created_at: string
  attachments: Attachment[]
  reactions: Reaction[]
  read_by: string[]
  sender_name?: string
}

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
}

interface Reaction {
  id: string
  message_id: string
  user_id: string
  reaction: string
}

interface Project {
  id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
}

const REACTIONS = ['👍', '❤️', '✅', '🎉', '👀', '❗']
const EMOJIS = ['😊', '👍', '🎉', '✅', '❤️', '👀', '❗', '🙏', '💪', '🚀']

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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<Array<{ id: string; title: string; body: string }>>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const draftSaveTimer = useRef<NodeJS.Timeout | null>(null)

  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [newPriority, setNewPriority] = useState('normal')
  const [newProjectId, setNewProjectId] = useState('')
  const [newMessage, setNewMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .eq('archived', false)
        .order('last_message_at', { ascending: false })

      if (convosError) { setLoading(false); return }

      const convosWithMeta = await Promise.all((convos || []).map(async (convo) => {
        const { data: msgs } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', convo.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const { data: unreadMsgs } = await supabase
          .from('conversation_messages')
          .select('id')
          .eq('conversation_id', convo.id)
          .eq('sender_type', 'admin')

        const { data: readData } = await supabase
          .from('message_reads')
          .select('message_id')
          .eq('user_id', user.id)
          .in('message_id', unreadMsgs?.map(m => m.id) || [])

        const unreadCount = (unreadMsgs?.length || 0) - (readData?.length || 0)

        return {
          ...convo,
          unread_count: Math.max(0, unreadCount),
          last_message: msgs?.[0]?.body?.slice(0, 60) || '',
          last_sender: msgs?.[0]?.sender_type === 'client' ? 'You' : 'Omnix Lab',
        }
      }))

      setConversations(convosWithMeta)

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, status, start_date, end_date')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      const { data: templatesData } = await supabase
        .from('message_templates')
        .select('*')

      if (templatesData) setTemplates(templatesData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, () => {
        if (activeConversation) selectConversation(activeConversation)
        fetchData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConversation, fetchData])

  // Auto-save draft
  useEffect(() => {
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current)
    if (messageInput.trim() && activeConversation) {
      draftSaveTimer.current = setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await fetch('/api/messaging/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: activeConversation.id, clientId: user.id, body: messageInput }),
          })
        }
      }, 2000)
    }
    return () => { if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current) }
  }, [messageInput, activeConversation])

  async function selectConversation(conversation: Conversation) {
    setActiveConversation(conversation)

    const { data: msgData, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (msgError) return

    const messagesWithMeta = await Promise.all((msgData || []).map(async (msg) => {
      const { data: attData } = await supabase.from('message_attachments').select('*').eq('message_id', msg.id)
      const { data: reactData } = await supabase.from('message_reactions').select('*').eq('message_id', msg.id)
      const { data: readData } = await supabase.from('message_reads').select('*').eq('message_id', msg.id)

      return {
        ...msg,
        attachments: attData || [],
        reactions: reactData || [],
        read_by: (readData || []).map(r => r.user_id),
        sender_name: msg.sender_type === 'client' ? 'You' : 'Omnix Lab',
      }
    }))

    setMessages(messagesWithMeta)

    // Mark admin messages as read
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const adminMsgIds = messagesWithMeta.filter(m => m.sender_type === 'admin').map(m => m.id)
      if (adminMsgIds.length > 0) {
        await fetch('/api/messaging/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageIds: adminMsgIds, userId: user.id }),
        })
      }
    }

    // Load draft
    const { data: { user: u2 } } = await supabase.auth.getUser()
    if (u2) {
      const { data: draft } = await supabase.from('message_drafts').select('*').eq('conversation_id', conversation.id).eq('client_id', u2.id).single()
      if (draft) setMessageInput(draft.body)
    }
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
        const res = await fetch('/api/messaging/upload', { method: 'POST', body: formData })
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
          body: editingMessage ? messageInput : messageInput,
          message_type: 'text',
          reply_to_id: replyTo?.id || null,
        })
        .select()
        .single()

      if (msgError) { setSending(false); return }

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

      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', activeConversation.id)

      // Clear draft
      await supabase.from('message_drafts').delete().eq('conversation_id', activeConversation.id).eq('client_id', user.id)

      setMessageInput('')
      setAttachments([])
      setReplyTo(null)
      setEditingMessage(null)

      await selectConversation(activeConversation)
      await fetchData()
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setSending(false)
    }
  }

  async function handleReaction(message: Message, reaction: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await fetch('/api/messaging/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: message.id, userId: user.id, reaction }),
    })

    await selectConversation(activeConversation!)
  }

  async function handleEditMessage() {
    if (!editingMessage || !messageInput.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await fetch('/api/messaging/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: editingMessage.id, body: messageInput, userId: user.id }),
    })

    setEditingMessage(null)
    setMessageInput('')
    await selectConversation(activeConversation!)
  }

  async function handleDeleteMessage(message: Message) {
    if (!confirm('Delete this message?')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await fetch('/api/messaging/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: message.id, userId: user.id }),
    })

    await selectConversation(activeConversation!)
  }

  async function handleStatusChange(status: string) {
    if (!activeConversation) return
    await fetch('/api/messaging/conversation-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversation.id, status }),
    })
    await fetchData()
    setActiveConversation({ ...activeConversation, status })
  }

  async function handleArchiveConversation() {
    if (!activeConversation) return
    await supabase.from('conversations').update({ archived: true }).eq('id', activeConversation.id)
    setActiveConversation(null)
    setMessages([])
    await fetchData()
  }

  async function handleExport() {
    if (!activeConversation) return
    const res = await fetch('/api/messaging/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversation.id }),
    })
    const result = await res.json()
    if (result.success) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversation-${activeConversation.id}.json`
      a.click()
      URL.revokeObjectURL(url)
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
        await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id)
      }

      setShowNewModal(false)
      setNewSubject('')
      setNewMessage('')
      setNewCategory('general')
      setNewPriority('normal')
      setNewProjectId('')
      await fetchData()
    } catch (error) { console.error('Create error:', error) }
  }

  async function handlePinConversation(conversation: Conversation) {
    const newPinned = !conversation.pinned
    await supabase.from('conversations').update({ pinned: newPinned }).eq('id', conversation.id)
    setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, pinned: newPinned } : c))
  }

  async function handleDragDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setAttachments(files)
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
    return new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime()
  })

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>
  }

  const activeProject = activeConversation?.project_id ? projects.find(p => p.id === activeConversation.project_id) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <div className="flex gap-3">
            {activeConversation && (
              <>
                <button onClick={handleExport} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">Export</button>
                <button onClick={handleArchiveConversation} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm">Archive</button>
              </>
            )}
            <button onClick={() => setShowNewModal(true)} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl">+ New Message</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-4">
          {/* LEFT PANEL */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <div className="flex gap-2 mt-3 flex-wrap">
                {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }, { key: 'pinned', label: 'Pinned' }, { key: 'project', label: 'Projects' }, { key: 'billing', label: 'Billing' }, { key: 'support', label: 'Support' }, { key: 'general', label: 'General' }].map(cat => (
                  <button key={cat.key} onClick={() => setCategoryFilter(cat.key)} className={`px-3 py-1 rounded-full text-xs ${categoryFilter === cat.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{cat.label}</button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {sortedConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No conversations</div>
              ) : sortedConversations.map(convo => (
                <button key={convo.id} onClick={() => selectConversation(convo)} className={`w-full text-left p-4 hover:bg-gray-50 ${activeConversation?.id === convo.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate text-sm">{convo.pinned ? '📌 ' : ''}{convo.priority === 'urgent' ? '🔴 ' : convo.priority === 'important' ? '🟡 ' : ''}{convo.title}</p>
                    {(convo.unread_count || 0) > 0 && <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{convo.unread_count}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{convo.last_sender}: {convo.last_message}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{convo.last_message_at ? new Date(convo.last_message_at).toLocaleTimeString() : ''}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${convo.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{convo.status.replace(/_/g, ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col min-h-[600px]"
               onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
               onDragLeave={() => setDragging(false)}
               onDrop={handleDragDrop}>
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation</div>
            ) : (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{activeConversation.title}</h2>
                    <p className="text-xs text-gray-500">{activeConversation.status.replace(/_/g, ' ')} • {activeConversation.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <select value={activeConversation.status} onChange={(e) => handleStatusChange(e.target.value)} className="px-2 py-1 border rounded-lg text-xs bg-white">
                      <option value="open">Open</option>
                      <option value="waiting_for_client">Waiting for Client</option>
                      <option value="waiting_for_omnix">Waiting for Omnix</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button onClick={() => handlePinConversation(activeConversation)} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">{activeConversation.pinned ? 'Unpin' : 'Pin'}</button>
                    <button onClick={() => setShowDetails(!showDetails)} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">Details</button>
                  </div>
                </div>

                {dragging && <div className="bg-blue-50 border-2 border-dashed border-blue-300 p-4 text-center text-blue-600">Drop files here</div>}

                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
                  {messages.length === 0 ? <div className="text-center text-gray-500 py-8">No messages</div> : messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl p-3 relative group ${msg.sender_type === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString()}{msg.is_edited ? ' (edited)' : ''}</p>
                        {msg.reply_to_id && <div className="text-xs mb-1 opacity-70 border-l-2 pl-2">↪ Reply</div>}
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        {msg.attachments?.map(att => (
                          <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="block text-xs mt-2 underline">📎 {att.file_name}</a>
                        ))}
                        {/* Reactions */}
                        {msg.reactions?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {msg.reactions.map(r => <span key={r.id} className="text-sm">{r.reaction}</span>)}
                          </div>
                        )}
                        {/* Read receipts */}
                        {msg.read_by?.length > 0 && msg.sender_type === 'client' && (
                          <p className="text-xs opacity-70 mt-1">✓✓ Read</p>
                        )}
                        {/* Actions on hover */}
                        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                          {msg.sender_type === 'client' && (
                            <>
                              <button onClick={() => { setEditingMessage(msg); setMessageInput(msg.body); }} className="p-1 bg-white rounded shadow text-xs">✏️</button>
                              <button onClick={() => handleDeleteMessage(msg)} className="p-1 bg-white rounded shadow text-xs">🗑️</button>
                            </>
                          )}
                          <button onClick={() => setReplyTo(msg)} className="p-1 bg-white rounded shadow text-xs">↩️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {replyTo && (
                  <div className="px-4 py-2 bg-gray-50 border-t flex justify-between">
                    <span className="text-sm text-gray-600">Replying to: {replyTo.body.slice(0, 50)}...</span>
                    <button onClick={() => setReplyTo(null)}>✕</button>
                  </div>
                )}
                {editingMessage && (
                  <div className="px-4 py-2 bg-amber-50 border-t flex justify-between">
                    <span className="text-sm text-amber-700">Editing message...</span>
                    <button onClick={() => { setEditingMessage(null); setMessageInput(''); }}>✕</button>
                  </div>
                )}

                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <input ref={fileInputRef} type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-100 rounded-lg">📎</button>
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 bg-gray-100 rounded-lg">😊</button>
                    <button onClick={() => setShowTemplates(!showTemplates)} className="p-2 bg-gray-100 rounded-lg">📋</button>
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editingMessage ? handleEditMessage() : handleSendMessage() } }}
                      placeholder="Write a message..."
                      rows={1}
                      className="flex-1 px-4 py-3 border rounded-xl resize-none"
                    />
                    <button
                      onClick={editingMessage ? handleEditMessage : handleSendMessage}
                      disabled={sending || !messageInput.trim()}
                      className="px-5 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                    >
                      {sending ? '...' : editingMessage ? 'Update' : 'Send'}
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {EMOJIS.map(emoji => <button key={emoji} onClick={() => setMessageInput(prev => prev + emoji)} className="text-xl">{emoji}</button>)}
                    </div>
                  )}
                  {showTemplates && templates.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {templates.map(t => <button key={t.id} onClick={() => setMessageInput(t.body)} className="block w-full text-left text-sm p-2 bg-gray-50 rounded hover:bg-gray-100">{t.title}</button>)}
                    </div>
                  )}
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">📎 {file.name}<button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="ml-1">✕</button></span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANEL */}
          {showDetails && activeConversation && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 max-h-[600px] overflow-y-auto">
              <h3 className="font-semibold">Details</h3>
              {activeProject && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Project</p>
                  <p className="font-medium">{activeProject.name}</p>
                  <p className="text-xs text-gray-600">Status: {activeProject.status}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Category</p><p className="font-medium">{activeConversation.category}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Priority</p><p className="font-medium">{activeConversation.priority}</p></div>
              </div>
              {/* Shared files */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Shared Files</p>
                {messages.filter(m => m.attachments?.length > 0).length === 0 ? <p className="text-sm text-gray-400">None</p> :
                  messages.filter(m => m.attachments?.length > 0).map(m => m.attachments?.map(att => (
                    <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 truncate">📄 {att.file_name}</a>
                  )))}
              </div>
              {/* Activity */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Activity</p>
                {messages.slice(-5).reverse().map(msg => (
                  <div key={msg.id} className="flex gap-2"><span>•</span><div><p className="text-xs">{msg.sender_name} sent a message</p><p className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</p></div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold mb-4">New Conversation</h3>
            <div className="space-y-4">
              <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject *" className="w-full px-4 py-3 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-white"><option value="general">General</option><option value="project">Project</option><option value="billing">Billing</option><option value="support">Support</option></select>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-white"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select>
              </div>
              <select value={newProjectId} onChange={(e) => setNewProjectId(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-white"><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={3} placeholder="Message (optional)" className="w-full px-4 py-3 border rounded-xl resize-none" />
              <div className="flex gap-3">
                <button onClick={handleCreateConversation} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold">Send</button>
                <button onClick={() => setShowNewModal(false)} className="px-6 py-3 bg-gray-100 rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}