'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface SupportTicket {
  id: string
  ticket_number: string
  client_id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  assigned_to: string
  assigned_to_name: string
  client_name: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  unread_count: number
}

interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: 'client' | 'admin'
  sender_name: string
  content: string
  attachment_url: string | null
  attachment_name: string | null
  is_internal_note: boolean
  is_read: boolean
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assignmentFilter, setAssignmentFilter] = useState('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedTickets, setPaginatedTickets] = useState<SupportTicket[]>([])
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  const [newMessage, setNewMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [assignToId, setAssignToId] = useState('')
  const [newPriority, setNewPriority] = useState('')
  
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingClient: 0,
    resolved: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, assignmentFilter, tickets])

  useEffect(() => {
    updatePagination()
  }, [filteredTickets, currentPage])

  useEffect(() => {
    calculateStats()
  }, [tickets])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: teamData } = await supabase
        .from('admin_users')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })
      setTeamMembers(teamData || [])

      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      const ticketsWithDetails = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          let clientName = 'Unknown'
          if (ticket.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', ticket.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          let assignedToName = 'Unassigned'
          if (ticket.assigned_to) {
            const { data: admin } = await supabase
              .from('admin_users')
              .select('full_name')
              .eq('id', ticket.assigned_to)
              .single()
            assignedToName = admin?.full_name || 'Unassigned'
          }

          return {
            ...ticket,
            client_name: clientName,
            assigned_to_name: assignedToName,
          }
        })
      )

      setTickets(ticketsWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch tickets error:', error)
      setLoading(false)
    }
  }, [])

  const fetchMessages = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setLoadingMessages(true)
    try {
      const { data } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      setLoadingMessages(false)
      scrollToBottom()

      await supabase
        .from('ticket_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticket.id)
        .eq('sender_type', 'client')
        .eq('is_read', false)

      await supabase
        .from('support_tickets')
        .update({ unread_count: 0 })
        .eq('id', ticket.id)

      fetchData()
    } catch (error) {
      console.error('Fetch ticket messages error:', error)
      setLoadingMessages(false)
    }
  }

  function calculateStats() {
    const total = tickets.length
    const open = tickets.filter(t => t.status === 'open').length
    const inProgress = tickets.filter(t => t.status === 'in_progress').length
    const waitingClient = tickets.filter(t => t.status === 'waiting_for_client').length
    const resolved = tickets.filter(t => t.status === 'resolved').length

    setStats({ total, open, inProgress, waitingClient, resolved })
  }

  function applyFilters() {
    let filtered = [...tickets]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (ticket) =>
          ticket.ticket_number?.toLowerCase().includes(term) ||
          ticket.subject?.toLowerCase().includes(term) ||
          ticket.description?.toLowerCase().includes(term) ||
          ticket.client_name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.category === categoryFilter)
    }

    if (assignmentFilter !== 'all') {
      if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter((ticket) => !ticket.assigned_to)
      } else {
        filtered = filtered.filter((ticket) => ticket.assigned_to === assignmentFilter)
      }
    }

    setFilteredTickets(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedTickets(filteredTickets.slice(start, end))
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  async function handleSendMessage() {
    if (!selectedTicket || (!newMessage.trim() && !attachment)) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let attachmentUrl = null
      let attachmentName = null

      if (attachment) {
        const fileName = `${Date.now()}-${attachment.name}`
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, attachment)

        if (uploadError) {
          alert('Attachment upload failed: ' + uploadError.message)
          setSending(false)
          return
        }

        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(fileName)

        attachmentUrl = urlData?.publicUrl
        attachmentName = attachment.name
      }

      const { data: insertedMessage } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
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

      const newStatus = isInternalNote 
        ? selectedTicket.status 
        : selectedTicket.status === 'open' 
          ? 'in_progress' 
          : selectedTicket.status

      await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTicket.id)

      const newTicketMessage: TicketMessage = {
        id: insertedMessage?.id ?? crypto.randomUUID(),
        ticket_id: selectedTicket.id,
        sender_id: user?.id ?? '',
        sender_type: 'admin',
        sender_name: 'Admin',
        content: newMessage.trim(),
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        is_read: false,
        is_internal_note: isInternalNote,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, newTicketMessage])
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

  async function handleAssignTicket() {
    if (!selectedTicket || !assignToId) return

    await supabase
      .from('support_tickets')
      .update({ 
        assigned_to: assignToId,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedTicket.id)

    setShowAssignModal(false)
    setAssignToId('')
    fetchData()
  }

  async function handlePriorityChange() {
    if (!selectedTicket || !newPriority) return

    await supabase
      .from('support_tickets')
      .update({ 
        priority: newPriority,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedTicket.id)

    setShowPriorityModal(false)
    setNewPriority('')
    fetchData()
  }

  async function handleStatusChange(status: string) {
    if (!selectedTicket) return

    await supabase
      .from('support_tickets')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', selectedTicket.id)

    if (status === 'resolved') {
      await supabase.from('notifications').insert({
        user_id: selectedTicket.client_id,
        type: 'ticket_resolved',
        title: 'Ticket Resolved',
        message: `Your support ticket ${selectedTicket.ticket_number} has been resolved`,
        read: false,
        created_at: new Date().toISOString(),
      })
    }

    fetchData()
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      open: 'bg-green-500/20 text-green-300',
      in_progress: 'bg-blue-500/20 text-blue-300',
      waiting_for_client: 'bg-yellow-500/20 text-yellow-300',
      waiting_internal: 'bg-purple-500/20 text-purple-300',
      resolved: 'bg-emerald-500/20 text-emerald-300',
      closed: 'bg-gray-500/20 text-gray-300',
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
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatTime(date: string) {
    if (!date) return '-'
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredTickets.length} total tickets
            {stats.open > 0 && ` - ${stats.open} open`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Open</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.open}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Waiting Client</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.waitingClient}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.resolved}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by ticket number, subject, client..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="open" className="bg-gray-900">Open</option>
          <option value="in_progress" className="bg-gray-900">In Progress</option>
          <option value="waiting_for_client" className="bg-gray-900">Waiting for Client</option>
          <option value="waiting_internal" className="bg-gray-900">Waiting Internal</option>
          <option value="resolved" className="bg-gray-900">Resolved</option>
          <option value="closed" className="bg-gray-900">Closed</option>
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Categories</option>
          <option value="technical" className="bg-gray-900">Technical</option>
          <option value="billing" className="bg-gray-900">Billing</option>
          <option value="general" className="bg-gray-900">General</option>
          <option value="feature_request" className="bg-gray-900">Feature Request</option>
          <option value="bug" className="bg-gray-900">Bug Report</option>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Tickets</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {paginatedTickets.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">[ ]</div>
                <p className="text-gray-500">No tickets found</p>
              </div>
            ) : (
              paginatedTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => fetchMessages(ticket)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">{ticket.ticket_number}</p>
                        {ticket.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            {ticket.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white truncate mt-1">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{ticket.client_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {ticket.assigned_to_name} - {formatDate(ticket.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
          
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

        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-4xl mb-3">[ ]</div>
                <p className="text-gray-500">Select a ticket to view details</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{selectedTicket.ticket_number}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-2">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-400 mt-1">{selectedTicket.client_name}</p>
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
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-gray-500">
                    Assigned: {selectedTicket.assigned_to_name}
                  </span>
                  <span className="text-xs text-gray-500">|</span>
                  <span className="text-xs text-gray-500">
                    Category: {selectedTicket.category}
                  </span>
                  <span className="text-xs text-gray-500">|</span>
                  <span className="text-xs text-gray-500">
                    Created: {formatDate(selectedTicket.created_at)}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <button
                      onClick={() => handleStatusChange('resolved')}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700"
                    >
                      Resolve
                    </button>
                  )}
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={() => handleStatusChange('closed')}
                      className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700"
                    >
                      Close
                    </button>
                  )}
                  {selectedTicket.status === 'closed' && (
                    <button
                      onClick={() => handleStatusChange('open')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

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
                            <span className="text-xs text-yellow-400">[INTERNAL]</span>
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
                            [Attachment] {message.attachment_name}
                          </a>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${message.sender_type === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>
                            {message.sender_name} - {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={isInternalNote ? 'Type internal note...' : 'Type your response...'}
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
                      Attach
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
                      Note
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
                    <span className="text-xs text-gray-400">{attachment.name}</span>
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

      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Assign Ticket</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
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
                onClick={handleAssignTicket}
                disabled={!assignToId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showPriorityModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Set Priority</h2>
              <button onClick={() => setShowPriorityModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
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