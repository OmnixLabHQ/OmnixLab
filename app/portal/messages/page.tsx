'use client'

import { useState, useEffect, useRef } from 'react'
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
  is_system_message: boolean
  action_type: string | null
  action_data: Record<string, any>
  status: string
  created_at: string
  attachments: Attachment[]
  reactions: Reaction[]
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
  reaction: string
  user_id: string
}

interface Project {
  id: string
  name: string
}

interface Template {
  id: string
  title: string
  body: string
  category: string
}

const EMOJIS = ['👍', '❤️', '✅', '🎉', '👀', '❗']

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editBody, setEditBody] = useState('')
  const [showRightPanel, setShowRightPanel] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [newPriority, setNewPriority] = useState('normal')
  const [newProjectId, setNewProjectId] = useState('')

  useEffect(() => {
    fetchData()
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    if (!activeConversation) return

    const channel = supabase
      .channel(`conversation-${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => [
            ...prev,
            { ...newMsg, attachments: [], reactions: [] },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversation?.id])

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .order('last_message_at', { ascending: false })

      if (convosError) {
        setLoading(false)
        return
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      const convosWithUnread: Conversation[] = (convos || []).map((convo) => ({
        ...convo,
        unread_count: 0,
      }))

      setConversations(convosWithUnread)
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/messaging/templates')
      const result = await res.json()
      if (result.success) setTemplates(result.templates)
    } catch (error) {
      // Silent
    }
  }

  async function selectConversation(conversation: Conversation) {
    setActiveConversation(conversation)

    try {
      const { data: msgData, error: msgError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (msgError) return

      const messagesWithAttachments: Message[] = []

      for (const msg of msgData || []) {
        const { data: attData } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('message_id', msg.id)

        const { data: reactData } = await supabase
          .from('message_reactions')
          .select('*')
          .eq('message_id', msg.id)

        messagesWithAttachments.push({
          ...msg,
          attachments: attData || [],
          reactions: reactData || [],
        })
      }

      setMessages(messagesWithAttachments)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unread_count: 0 } : c
        )
      )
    } catch (error) {
      // Silent
    }
  }

  async function handlePinConversation(conversation: Conversation) {
    const newPinned = !conversation.pinned

    await supabase
      .from('conversations')
      .update({ pinned: newPinned })
      .eq('id', conversation.id)

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, pinned: newPinned } : c
      )
    )

    if (activeConversation?.id === conversation.id) {
      setActiveConversation({ ...activeConversation, pinned: newPinned })
    }
  }

  async function handleCreateConversation() {
    if (!newSubject.trim()) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

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

      if (convoError) {
        alert('Failed to create conversation')
        return
      }

      if (newMessage.trim() && conversation) {
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
      alert('An error occurred')
    }
  }

  async function handleSendMessage() {
    if (!activeConversation || !messageInput.trim()) return

    setSending(true)
    setUploadProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const uploadedAttachments: Array<{
        file_name: string
        file_url: string
        file_size: number | null
        file_type: string | null
      }> = []

      if (attachments.length > 0) {
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

          setUploadProgress((prev) =>
            Math.min(100, prev + 100 / attachments.length)
          )
        }
      }

      const response = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          senderId: user.id,
          body: messageInput,
          messageType: 'text',
          replyToId: replyTo?.id || null,
          attachments: uploadedAttachments,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessageInput('')
        setAttachments([])
        setReplyTo(null)
        setUploadProgress(0)
        await selectConversation(activeConversation)
      } else {
        alert(result.error || 'Failed to send message')
      }
    } catch (error) {
      alert('An error occurred while sending')
    } finally {
      setSending(false)
    }
  }

  async function handleReact(message: Message, reaction: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await fetch('/api/messaging/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          userId: user.id,
          reaction,
        }),
      })

      if (activeConversation) await selectConversation(activeConversation)
    } catch (error) {
      // Silent
    }
  }

  function handleReply(message: Message) {
    setReplyTo(message)
  }

  function handleEdit(message: Message) {
    setEditingMessage(message)
    setEditBody(message.body)
  }

  async function handleSaveEdit() {
    if (!editingMessage || !editBody.trim()) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const res = await fetch('/api/messaging/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: editingMessage.id,
          userId: user.id,
          body: editBody,
        }),
      })

      const result = await res.json()

      if (result.success) {
        setEditingMessage(null)
        setEditBody('')
        if (activeConversation) await selectConversation(activeConversation)
      } else {
        alert(result.error || 'Failed to edit')
      }
    } catch (error) {
      alert('Error editing message')
    }
  }

  async function handleDelete(message: Message) {
    if (!confirm('Delete this message?')) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await fetch('/api/messaging/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: message.id, userId: user.id }),
      })

      if (activeConversation) await selectConversation(activeConversation)
    } catch (error) {
      alert('Error deleting message')
    }
  }

  async function handleConversationUpdate(updates: Record<string, any>) {
    if (!activeConversation) return

    await fetch('/api/messaging/conversation-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: activeConversation.id,
        ...updates,
      }),
    })

    const updatedConversation = { ...activeConversation, ...updates }
    setActiveConversation(updatedConversation)

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, ...updates }
          : c
      )
    )
  }

  async function handleExport() {
    if (!activeConversation) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const res = await fetch('/api/messaging/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          clientId: user.id,
          format: 'csv',
        }),
      })

      const result = await res.json()

      if (result.success && result.csvContent) {
        const blob = new Blob([result.csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `conversation-${activeConversation.id}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      alert('Export failed')
    }
  }

  function insertEmoji(emoji: string) {
    setMessageInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  function insertTemplate(template: Template) {
    setMessageInput(template.body)
    setShowTemplates(false)
  }

  function getProjectName(projectId: string | null) {
    if (!projectId) return null
    return projects.find((p) => p.id === projectId)?.name || null
  }

  const sortedConversations = [...conversations]
    .filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
      if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return !c.archived
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return (
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
      )
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  const sharedFiles = messages.flatMap((m) => m.attachments || [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Panel */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {['all', 'project', 'billing', 'support', 'general'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
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
                    className={`w-full text-left p-4 hover:bg-gray-50 ${
                      activeConversation?.id === convo.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {convo.pinned ? '📌 ' : ''}
                        {convo.title}
                      </p>
                      {(convo.unread_count ?? 0) > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {convo.last_message_at
                          ? new Date(convo.last_message_at).toLocaleString()
                          : 'No messages yet'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          convo.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : convo.priority === 'important'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {convo.priority}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Center Panel */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col">
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
                Select a conversation
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-semibold text-gray-900">{activeConversation.title}</h2>
                    <p className="text-sm text-gray-500">
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
                      onClick={() => setShowRightPanel(!showRightPanel)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      Details
                    </button>
                    <button
                      onClick={handleExport}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      Export
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{ maxHeight: '500px' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files || [])
                    setAttachments((prev) => [...prev, ...files])
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages
                      .filter((m) => !m.is_deleted)
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_type === 'client' ? 'justify-end' : 'justify-start'
                          } group`}
                        >
                          <div
                            className={`max-w-[70%] rounded-xl p-3 relative ${
                              msg.sender_type === 'client'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {msg.reply_to_id && (
                              <div className="text-xs mb-1 opacity-70">
                                ↪ Replying to previous message
                              </div>
                            )}
                            {msg.is_system_message && (
                              <div className="text-xs mb-1 font-semibold">🔔 SYSTEM</div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                            {msg.attachments &&
                              msg.attachments.map((att) => (
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
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {msg.reactions.map((r) => (
                                  <span
                                    key={r.id}
                                    className="text-xs bg-white/20 px-1.5 py-0.5 rounded"
                                  >
                                    {r.reaction}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="text-xs mt-1 opacity-70 flex items-center gap-2">
                              <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                              {msg.is_edited && <span>(edited)</span>}
                              {msg.status === 'sent' && msg.sender_type === 'client' && <span>✓</span>}
                            </div>
                            {/* Hover Actions */}
                            <div className="absolute -top-2 right-0 hidden group-hover:flex gap-1 z-10">
                              {EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(msg, emoji)}
                                  className="text-xs bg-white border border-gray-200 rounded px-1 py-0.5 shadow-sm"
                                >
                                  {emoji}
                                </button>
                              ))}
                              <button
                                onClick={() => handleReply(msg)}
                                className="text-xs bg-white border border-gray-200 rounded px-1 py-0.5 shadow-sm"
                              >
                                ↩️
                              </button>
                              {msg.sender_type === 'client' && (
                                <>
                                  <button
                                    onClick={() => handleEdit(msg)}
                                    className="text-xs bg-white border border-gray-200 rounded px-1 py-0.5 shadow-sm"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDelete(msg)}
                                    className="text-xs bg-white border border-gray-200 rounded px-1 py-0.5 shadow-sm"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply indicator */}
                {replyTo && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between">
                    <span className="text-sm text-gray-600">
                      Replying to: {replyTo.body.slice(0, 50)}...
                    </span>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400">
                      ✕
                    </button>
                  </div>
                )}

                {/* Editing indicator */}
                {editingMessage && (
                  <div className="px-4 py-2 bg-amber-50 border-t border-gray-200 flex gap-2">
                    <input
                      type="text"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMessage(null)}
                      className="px-3 py-2 bg-gray-100 text-sm rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Composer */}
                <div className="p-4 border-t border-gray-200">
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mb-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploading... {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                  <div className="flex items-end gap-2 relative">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      title="Attach files"
                    >
                      📎
                    </button>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      title="Emoji"
                    >
                      😊
                    </button>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      title="Templates"
                    >
                      📝
                    </button>
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

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex gap-2 z-50">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => insertEmoji(emoji)}
                            className="text-2xl hover:bg-gray-100 p-1 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Templates */}
                    {showTemplates && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64 z-50">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Templates</p>
                        {templates.length === 0 ? (
                          <p className="text-xs text-gray-500">No templates</p>
                        ) : (
                          templates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => insertTemplate(t)}
                              className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                            >
                              {t.title}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                        >
                          📎 {file.name}
                          <button
                            onClick={() =>
                              setAttachments((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="ml-1 text-gray-400"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Conversation Details */}
          {showRightPanel && activeConversation && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                  <select
                    value={activeConversation.status}
                    onChange={(e) => handleConversationUpdate({ status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="waiting_for_omnix">Waiting for Omnix</option>
                    <option value="waiting_for_client">Waiting for Client</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Priority</p>
                  <select
                    value={activeConversation.priority}
                    onChange={(e) => handleConversationUpdate({ priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <button
                  onClick={() => handleConversationUpdate({ archived: !activeConversation.archived })}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  {activeConversation.archived ? 'Unarchive' : 'Archive'} Conversation
                </button>
                {activeConversation.project_id && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Project</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getProjectName(activeConversation.project_id)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Shared Files ({sharedFiles.length})
                  </p>
                  {sharedFiles.length === 0 ? (
                    <p className="text-sm text-gray-400">No files shared</p>
                  ) : (
                    <div className="space-y-1">
                      {sharedFiles.map((att) => (
                        <a
                          key={att.id}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-600 hover:underline truncate"
                        >
                          📎 {att.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(activeConversation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Last Activity</p>
                  <p className="text-sm text-gray-600">
                    {activeConversation.last_message_at
                      ? new Date(activeConversation.last_message_at).toLocaleString()
                      : 'N/A'}
                  </p>
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
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="general">General</option>
                  <option value="project">Project</option>
                  <option value="billing">Billing</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project (optional)
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateConversation}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
                >
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