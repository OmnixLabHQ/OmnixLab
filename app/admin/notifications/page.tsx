'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  channel: string
  delivery_status: string
  client_name: string
  created_at: string
  delivered_at: string | null
  read_at: string | null
}

const ITEMS_PER_PAGE = 15

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedNotifications, setPaginatedNotifications] = useState<Notification[]>([])
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Modal states
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formType, setFormType] = useState('general')
  const [formChannel, setFormChannel] = useState('in_app')
  const [formClientId, setFormClientId] = useState('')
  const [formSendToAll, setFormSendToAll] = useState(false)
  
  // Data
  const [clients, setClients] = useState<any[]>([])
  
  // UI states
  const [sending, setSending] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    delivered: 0,
    failed: 0,
    emailChannel: 0,
    inAppChannel: 0,
    telegramChannel: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, typeFilter, statusFilter, channelFilter, notifications])

  useEffect(() => {
    updatePagination()
  }, [filteredNotifications, currentPage])

  useEffect(() => {
    calculateStats()
  }, [notifications])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name, company')
        .order('created_at', { ascending: false })
      setClients(clientsData || [])

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      const notificationsWithDetails = await Promise.all(
        (notificationsData || []).map(async (notification) => {
          let clientName = 'System'
          if (notification.user_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', notification.user_id)
              .single()
            clientName = client?.full_name || client?.company || 'System'
          }

          return {
            ...notification,
            client_name: clientName,
          }
        })
      )

      setNotifications(notificationsWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch notifications error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats() {
    const total = notifications.length
    const unread = notifications.filter(n => !n.read).length
    const delivered = notifications.filter(n => n.delivery_status === 'delivered').length
    const failed = notifications.filter(n => n.delivery_status === 'failed').length
    const emailChannel = notifications.filter(n => n.channel === 'email').length
    const inAppChannel = notifications.filter(n => n.channel === 'in_app').length
    const telegramChannel = notifications.filter(n => n.channel === 'telegram').length

    setStats({ total, unread, delivered, failed, emailChannel, inAppChannel, telegramChannel })
  }

  function applyFilters() {
    let filtered = [...notifications]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification.title?.toLowerCase().includes(term) ||
          notification.message?.toLowerCase().includes(term) ||
          notification.client_name?.toLowerCase().includes(term)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((notification) => notification.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'read') {
        filtered = filtered.filter((notification) => notification.read)
      } else if (statusFilter === 'unread') {
        filtered = filtered.filter((notification) => !notification.read)
      } else {
        filtered = filtered.filter((notification) => notification.delivery_status === statusFilter)
      }
    }

    if (channelFilter !== 'all') {
      filtered = filtered.filter((notification) => notification.channel === channelFilter)
    }

    setFilteredNotifications(filtered)
    setCurrentPage(1)
    setSelectedIds(new Set())
  }

  function updatePagination() {
    const total = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedNotifications(filteredNotifications.slice(start, end))
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedNotifications.map(n => n.id)))
    }
  }

  function toggleSelectOne(id: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  async function handleMarkAsRead() {
    if (selectedIds.size === 0) return

    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .in('id', Array.from(selectedIds))

    if (error) {
      alert('Failed to mark as read: ' + error.message)
      return
    }

    setSelectedIds(new Set())
    fetchData()
  }

  async function handleDeleteNotifications() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} notifications?`)) return

    await supabase
      .from('notifications')
      .delete()
      .in('id', Array.from(selectedIds))

    setSelectedIds(new Set())
    fetchData()
  }

  async function handleSendNotification() {
    if (!formTitle.trim() || !formMessage.trim()) {
      alert('Please fill in title and message')
      return
    }
    if (!formSendToAll && !formClientId) {
      alert('Please select a client or choose "Send to all"')
      return
    }

    setSending(true)
    try {
      if (formSendToAll) {
        // Send to all clients
        for (const client of clients) {
          await supabase.from('notifications').insert({
            user_id: client.id,
            type: formType,
            title: formTitle,
            message: formMessage,
            read: false,
            channel: formChannel,
            delivery_status: formChannel === 'in_app' ? 'delivered' : 'pending',
            created_at: new Date().toISOString(),
          })
        }
      } else {
        // Send to specific client
        await supabase.from('notifications').insert({
          user_id: formClientId,
          type: formType,
          title: formTitle,
          message: formMessage,
          read: false,
          channel: formChannel,
          delivery_status: formChannel === 'in_app' ? 'delivered' : 'pending',
          created_at: new Date().toISOString(),
        })
      }

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: formClientId || null,
        action_type: 'notification_sent',
        description: `Notification "${formTitle}" sent via ${formChannel}`,
        entity_type: 'notification',
        entity_id: null,
      })

      setShowCreateModal(false)
      setFormTitle('')
      setFormMessage('')
      setFormType('general')
      setFormChannel('in_app')
      setFormClientId('')
      setFormSendToAll(false)
      fetchData()
    } catch (error) {
      console.error('Send notification error:', error)
      alert('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  function getTypeColor(type: string) {
    const map: Record<string, string> = {
      new_message: 'bg-blue-500/20 text-blue-300',
      new_project: 'bg-purple-500/20 text-purple-300',
      requirement_submitted: 'bg-cyan-500/20 text-cyan-300',
      requirement_approved: 'bg-green-500/20 text-green-300',
      invoice_created: 'bg-yellow-500/20 text-yellow-300',
      payment_received: 'bg-green-500/20 text-green-300',
      payment_failed: 'bg-red-500/20 text-red-300',
      payment_overdue: 'bg-orange-500/20 text-orange-300',
      file_uploaded: 'bg-blue-500/20 text-blue-300',
      idea_submitted: 'bg-purple-500/20 text-purple-300',
      milestone_completed: 'bg-emerald-500/20 text-emerald-300',
      offer_accepted: 'bg-green-500/20 text-green-300',
      support_ticket_created: 'bg-yellow-500/20 text-yellow-300',
      general: 'bg-gray-500/20 text-gray-300',
    }
    return map[type.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function getDeliveryStatusColor(status: string) {
    const map: Record<string, string> = {
      delivered: 'bg-green-500/20 text-green-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      failed: 'bg-red-500/20 text-red-300',
      sent: 'bg-blue-500/20 text-blue-300',
    }
    return map[status.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function getTypeLabel(type: string) {
    const map: Record<string, string> = {
      new_message: 'New Message',
      new_project: 'New Project',
      requirement_submitted: 'Requirement Submitted',
      requirement_approved: 'Requirement Approved',
      invoice_created: 'Invoice Created',
      payment_received: 'Payment Received',
      payment_failed: 'Payment Failed',
      payment_overdue: 'Payment Overdue',
      file_uploaded: 'File Uploaded',
      idea_submitted: 'Idea Submitted',
      milestone_completed: 'Milestone Completed',
      offer_accepted: 'Offer Accepted',
      support_ticket_created: 'Support Ticket',
      general: 'General',
    }
    return map[type] || type
  }

  function getChannelLabel(channel: string) {
    const map: Record<string, string> = {
      in_app: 'In-App',
      email: 'Email',
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
    }
    return map[channel] || channel
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
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredNotifications.length} total notifications
            {stats.unread > 0 && ` • ${stats.unread} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleMarkAsRead}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Mark as Read
              </button>
              <button
                onClick={handleDeleteNotifications}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete Selected
              </button>
            </>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Send Notification
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.unread}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Delivered</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.failed}</p>
        </div>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">In-App</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{stats.inAppChannel}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Email</p>
          <p className="text-xl font-bold text-purple-400 mt-1">{stats.emailChannel}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Telegram</p>
          <p className="text-xl font-bold text-cyan-400 mt-1">{stats.telegramChannel}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, message, or client..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Types</option>
          <option value="new_message" className="bg-gray-900">New Message</option>
          <option value="new_project" className="bg-gray-900">New Project</option>
          <option value="requirement_submitted" className="bg-gray-900">Requirement Submitted</option>
          <option value="requirement_approved" className="bg-gray-900">Requirement Approved</option>
          <option value="invoice_created" className="bg-gray-900">Invoice Created</option>
          <option value="payment_received" className="bg-gray-900">Payment Received</option>
          <option value="payment_failed" className="bg-gray-900">Payment Failed</option>
          <option value="payment_overdue" className="bg-gray-900">Payment Overdue</option>
          <option value="file_uploaded" className="bg-gray-900">File Uploaded</option>
          <option value="idea_submitted" className="bg-gray-900">Idea Submitted</option>
          <option value="milestone_completed" className="bg-gray-900">Milestone Completed</option>
          <option value="offer_accepted" className="bg-gray-900">Offer Accepted</option>
          <option value="support_ticket_created" className="bg-gray-900">Support Ticket</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="read" className="bg-gray-900">Read</option>
          <option value="unread" className="bg-gray-900">Unread</option>
          <option value="delivered" className="bg-gray-900">Delivered</option>
          <option value="pending" className="bg-gray-900">Pending</option>
          <option value="failed" className="bg-gray-900">Failed</option>
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Channels</option>
          <option value="in_app" className="bg-gray-900">In-App</option>
          <option value="email" className="bg-gray-900">Email</option>
          <option value="telegram" className="bg-gray-900">Telegram</option>
          <option value="whatsapp" className="bg-gray-900">WhatsApp</option>
        </select>
      </div>

      {/* Notifications Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium w-12">
                <input
                  type="checkbox"
                  checked={paginatedNotifications.length > 0 && selectedIds.size === paginatedNotifications.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
              </th>
              <th className="py-3 px-4 font-medium">Notification</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Channel</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedNotifications.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-gray-500">No notifications found</p>
                  <p className="text-gray-600 text-xs mt-1">Notifications will appear here</p>
                </td>
              </tr>
            ) : (
              paginatedNotifications.map((notification) => (
                <tr 
                  key={notification.id} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedIds.has(notification.id) ? 'bg-blue-500/10' : ''
                  } ${!notification.read ? 'bg-white/5' : ''}`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => toggleSelectOne(notification.id)}
                      className="w-4 h-4 bg-white/10 border-white/20 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelectedNotification(notification); setShowDetailModal(true); }}
                      className="text-left"
                    >
                      <p className={`text-white font-medium hover:text-blue-400 ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[200px]">
                        {notification.message}
                      </p>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{notification.client_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{getChannelLabel(notification.channel)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(notification.delivery_status)}`}>
                        {notification.delivery_status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(notification.created_at)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelectedNotification(notification); setShowDetailModal(true); }}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedNotification.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedNotification.type)}`}>
                    {getTypeLabel(selectedNotification.type)}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(selectedNotification.delivery_status)}`}>
                    {selectedNotification.delivery_status}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Message</p>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">{selectedNotification.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm text-white">{selectedNotification.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Channel</p>
                  <p className="text-sm text-white">{getChannelLabel(selectedNotification.channel)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-white">{formatDate(selectedNotification.created_at)}</p>
                </div>
                {selectedNotification.read_at && (
                  <div>
                    <p className="text-xs text-gray-500">Read At</p>
                    <p className="text-sm text-white">{formatDate(selectedNotification.read_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Send Notification</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Message *</label>
                <textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Notification message"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="general" className="bg-gray-900">General</option>
                    <option value="new_message" className="bg-gray-900">New Message</option>
                    <option value="new_project" className="bg-gray-900">New Project</option>
                    <option value="invoice_created" className="bg-gray-900">Invoice Created</option>
                    <option value="payment_received" className="bg-gray-900">Payment Received</option>
                    <option value="milestone_completed" className="bg-gray-900">Milestone Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Channel</label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="in_app" className="bg-gray-900">In-App</option>
                    <option value="email" className="bg-gray-900">Email</option>
                    <option value="telegram" className="bg-gray-900">Telegram</option>
                    <option value="whatsapp" className="bg-gray-900">WhatsApp</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formSendToAll}
                  onChange={(e) => setFormSendToAll(e.target.checked)}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
                <label className="text-sm text-gray-300">Send to all clients</label>
              </div>
              {!formSendToAll && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Client</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">Select client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-gray-900">
                        {client.full_name} ({client.company})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={handleSendNotification}
                disabled={sending || !formTitle.trim() || !formMessage.trim() || (!formSendToAll && !formClientId)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}