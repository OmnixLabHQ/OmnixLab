'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: string
  client_id: string
  project_id: string
  subject: string
  status: string
  priority: string
  assigned_to: string
  assigned_to_name: string
  client_name: string
  project_name: string
  last_message: string
  last_message_at: string
  unread_count: number
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'admin'
  sender_name: string
  content: string
  attachment_url: string | null
  attachment_name: string | null
  is_read: boolean
  is_internal_note: boolean
  created_at: string
  reactions: any[]
}

const ITEMS_PER_PAGE = 20

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assignmentFilter, setAssignmentFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedConversations, setPaginatedConversations] = useState<Conversation[]>([])
  
  // Selected conversation
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  // Message composition
  const [newMessage, setNewMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  
  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [assignToId, setAssignToId] = useState('')
  const [newPriority, setNewPriority] = useState('')
  
  // Team members
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  
  // Real-time subscription
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Typing indicator
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchData()
    
    // Real-time subscription for conversations
    const conversationsChannel = supabase
      .channel('admin-conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Real-time subscription for messages
    const messagesChannel = supabase
      .channel('admin-messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, newMessage])
            scrollToBottom()
          }
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedConversation])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, priorityFilter, assignmentFilter, conversations])

  useEffect(() => {
    updatePagination()
  }, [filteredConversations, currentPage])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch team members
      const { data: teamData } = await supabase
        .from('admin_users')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })
      setTeamMembers(teamData || [])

      // Fetch conversations
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })

      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          let clientName = 'Unknown'
          if (conv.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', conv.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          let projectName = 'General'
          if (conv.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', conv.project_id)
              .single()
            projectName = project?.name || 'General'
          }

          let assignedToName = 'Unassigned'
          if (conv.assigned_to) {
            const { data: admin } = await supabase
              .from('admin_users')
              .select('full_name')
              .eq('id', conv.assigned_to)
              .single()
            assignedToName = admin?.full_name || 'Unassigned'
          }

          return {
            ...conv,
            client_name: clientName,
            project_name: projectName,
            assigned_to_name: assignedToName,
          }
        })
      )

      setConversations(conversationsWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch messages error:', error)
      setLoading(false)
    }
  }, [])

  const fetchMessages = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setLoadingMessages(true)
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      setLoadingMessages(false)
      scrollToBottom()

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversation.id)
        .eq('sender_type', 'client')
        .eq('is_read', false)

      // Update conversation unread count
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversation.id)

      fetchData()
    } catch (error) {
      console.error('Fetch messages error:', error)
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
          conv.client_name?.toLowerCase().includes(term) ||
          conv.project_name?.toLowerCase().includes(term) ||
          conv.last_message?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((conv) => conv.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((conv) => conv.priority === priorityFilter)
    }

    if (assignmentFilter !== 'all') {
      if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter((conv) => !conv.assigned_to)
      } else {
        filtered = filtered.filter((conv) => conv.assigned_to === assignmentFilter)
      }
    }

    setFilteredConversations(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredConversations.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedConversations(filteredConversations.slice(start, end))
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  async function handleSendMessage() {
    if (!selectedConversation || (!newMessage.trim() && !attachment)) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let attachmentUrl = null
      let attachmentName = null

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
      }

      const { data: newMessage } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user?.id,
          sender_type: 'admin',
          sender_name: 'Admin',
          content: newMessage.trim(),
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          is_read: false,
          is_internal_note: isInternalNote,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: isInternalNote ? '[Internal Note]' : newMessage.trim(),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: selectedConversation.status === 'archived' ? 'open' : selectedConversation.status,
        })
        .eq('id', selectedConversation.id)

      // Add to local messages
      setMessages(prev => [...prev, newMessage])
      setNewMessage('')
      setAttachment(null)
      setIsInternalNote(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      scrollToBottom()
      fetchData()
    } catch (error) {
      console.error('Send message error:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function handleAssignConversation() {
    if (!selectedConversation || !assignToId) return

    await supabase
      .from('conversations')
      .update({ 
        assigned_to: assignToId,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedConversation.id)

    setShowAssignModal(false)
    setAssignToId('')
    fetchData()
  }

  async function handlePriorityChange() {
    if (!selectedConversation || !newPriority) return

    await supabase
      .from('conversations')
      .update({ 
        priority: newPriority,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedConversation.id)

    setShowPriorityModal(false)
    setNewPriority('')
    fetchData()
  }

  async function handleStatusChange(status: string) {
    if (!selectedConversation) return

    await supabase
      .from('conversations')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedConversation.id)

    fetchData()
  }

  async function handleTyping() {
    if (!selectedConversation) return

    // Send typing indicator via real-time
    const channel = supabase.channel(`typing-${selectedConversation.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: 'Admin', conversation_id: selectedConversation.id },
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    // Set timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      open: 'bg-green-500/20 text-green-300',
      waiting: 'bg-yellow-500/20 text-yellow-300',
      resolved: 'bg-blue-500/20 text-blue-300',
      archived: 'bg-gray-500/20 text-gray-300',
    }
    return map[status.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function getPriorityColor(priority: string) {
    const map: Record<string, string> = {
      high: 'bg-red-500/20 text-red-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      low: 'bg-green-500/20 text-green-300',
    }
    return map[priority.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatTime(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredConversations.length} conversations
            {filteredConversations.filter(c => c.unread_count > 0).length > 0 && 
              ` • ${filteredConversations.filter(c => c.unread_count > 0).length} unread`}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by subject, client, project, or message..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="open" className="bg-gray-900">Open</option>
          <option value="waiting" className="bg-gray-900">Waiting</option>
          <option value="resolved" className="bg-gray-900">Resolved</option>
          <option value="archived" className="bg-gray-900">Archived</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Priorities</option>
          <option value="high" className="bg-gray-900">High</option>
          <option value="medium" className="bg-gray-900">Medium</option>
          <option value="low" className="bg-gray-900">Low</option>
        </select>
        <select
          value={assignmentFilter}
          onChange={(e) => setAssignmentFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Assignments</option>
          <option value="unassigned" className="bg-gray-900">Unassigned</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id} className="bg-gray-900">
              {member.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Inbox</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {paginatedConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500">No conversations found</p>
              </div>
            ) : (
              paginatedConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => fetchMessages(conv)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{conv.client_name}</p>
                        {conv.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{conv.subject}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(conv.status)}`}>
                        {conv.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(conv.priority)}`}>
                      {conv.priority}
                    </span>
                    <span className="text-xs text-gray-500">{conv.assigned_to_name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg disabled:opacity-50 hover:bg-white/20"
              >
                Previous
              </button>
              <span className="text-xs text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg disabled:opacity-50 hover:bg-white/20"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500">Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{selectedConversation.subject}</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {selectedConversation.client_name} • {selectedConversation.project_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => setShowPriorityModal(true)}
                      className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20"
                    >
                      Priority
                    </button>
                    {selectedConversation.status === 'resolved' ? (
                      <button
                        onClick={() => handleStatusChange('open')}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                      >
                        Reopen
                      </button>
                    ) : selectedConversation.status !== 'archived' ? (
                      <button
                        onClick={() => handleStatusChange('resolved')}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                      >
                        Resolve
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(selectedConversation.priority)}`}>
                    {selectedConversation.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    Assigned: {selectedConversation.assigned_to_name}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.is_internal_note
                            ? 'bg-yellow-500/10 border border-yellow-500/30'
                            : message.sender_type === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {message.is_internal_note && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs text-yellow-400">🔒 Internal Note</span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                        {message.attachment_url && (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block mt-2 text-xs ${message.sender_type === 'admin' ? 'text-blue-200' : 'text-blue-400'} hover:underline`}
                          >
                            📎 {message.attachment_name}
                          </a>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${message.sender_type === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>
                            {message.sender_name} • {formatTime(message.created_at)}
                          </span>
                          {message.sender_type === 'admin' && message.is_read && (
                            <span className="text-xs text-blue-200">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Client is typing...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={isInternalNote ? 'Type internal note...' : 'Type your message...'}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20"
                      title="Attach file"
                    >
                      📎
                    </button>
                    <button
                      onClick={() => setIsInternalNote(!isInternalNote)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        isInternalNote
                          ? 'bg-yellow-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      title="Toggle internal note"
                    >
                      🔒
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && !attachment)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
                      className="text-xs text-red-400 hover:text-red-300"
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

      {/* Assign Modal */}
      {showAssignModal && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Assign Conversation</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Assign To</label>
                <select
                  value={assignToId}
                  onChange={(e) => setAssignToId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="" className="bg-gray-900">Select team member...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id} className="bg-gray-900">
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssignConversation}
                disabled={!assignToId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Modal */}
      {showPriorityModal && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Set Priority</h2>
              <button onClick={() => setShowPriorityModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="" className="bg-gray-900">Select priority...</option>
                  <option value="high" className="bg-gray-900">High</option>
                  <option value="medium" className="bg-gray-900">Medium</option>
                  <option value="low" className="bg-gray-900">Low</option>
                </select>
              </div>
              <button
                onClick={handlePriorityChange}
                disabled={!newPriority}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Update Priority
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}