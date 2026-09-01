'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface AuditLog {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_role: string
  action_type: string
  description: string
  entity_type: string
  entity_id: string
  client_name: string
  ip_address: string
  session_id: string
  user_agent: string
  result: string
  error_message: string | null
  metadata: any
  created_at: string
}

const ITEMS_PER_PAGE = 25

const AUDIT_TYPES: Record<string, { label: string; color: string; icon: string; severity: string }> = {
  login: { label: 'Login', color: 'bg-blue-500/20 text-blue-300', icon: '[>]', severity: 'info' },
  login_failed: { label: 'Login Failed', color: 'bg-orange-500/20 text-orange-300', icon: '[!]', severity: 'warning' },
  logout: { label: 'Logout', color: 'bg-gray-500/20 text-gray-300', icon: '[<]', severity: 'info' },
  password_changed: { label: 'Password Changed', color: 'bg-purple-500/20 text-purple-300', icon: '[~]', severity: 'warning' },
  mfa_enabled: { label: '2FA Enabled', color: 'bg-green-500/20 text-green-300', icon: '[+]', severity: 'info' },
  mfa_disabled: { label: '2FA Disabled', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'warning' },
  client_created: { label: 'Client Created', color: 'bg-green-500/20 text-green-300', icon: '[+]', severity: 'info' },
  client_modified: { label: 'Client Modified', color: 'bg-yellow-500/20 text-yellow-300', icon: '[~]', severity: 'info' },
  client_deleted: { label: 'Client Deleted', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  client_suspended: { label: 'Client Suspended', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  client_reactivated: { label: 'Client Reactivated', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  invoice_created: { label: 'Invoice Created', color: 'bg-blue-500/20 text-blue-300', icon: '[+]', severity: 'info' },
  invoice_updated: { label: 'Invoice Updated', color: 'bg-yellow-500/20 text-yellow-300', icon: '[~]', severity: 'info' },
  invoice_sent: { label: 'Invoice Sent', color: 'bg-cyan-500/20 text-cyan-300', icon: '[>]', severity: 'info' },
  invoice_paid: { label: 'Invoice Paid', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  invoice_cancelled: { label: 'Invoice Cancelled', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'warning' },
  invoice_voided: { label: 'Invoice Voided', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  payment_verified: { label: 'Payment Verified', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  payment_failed: { label: 'Payment Failed', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'warning' },
  payment_refunded: { label: 'Refund Issued', color: 'bg-orange-500/20 text-orange-300', icon: '[~]', severity: 'warning' },
  payment_reversed: { label: 'Payment Reversed', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  file_uploaded: { label: 'File Uploaded', color: 'bg-cyan-500/20 text-cyan-300', icon: '[^]', severity: 'info' },
  file_downloaded: { label: 'File Downloaded', color: 'bg-blue-500/20 text-blue-300', icon: '[v]', severity: 'info' },
  file_deleted: { label: 'File Deleted', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  file_restored: { label: 'File Restored', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  permission_changed: { label: 'Permission Changed', color: 'bg-purple-500/20 text-purple-300', icon: '[~]', severity: 'critical' },
  settings_changed: { label: 'Settings Changed', color: 'bg-yellow-500/20 text-yellow-300', icon: '[~]', severity: 'warning' },
  impersonation_started: { label: 'Impersonation Started', color: 'bg-orange-500/20 text-orange-300', icon: '[>]', severity: 'critical' },
  impersonation_ended: { label: 'Impersonation Ended', color: 'bg-gray-500/20 text-gray-300', icon: '[<]', severity: 'info' },
  project_created: { label: 'Project Created', color: 'bg-purple-500/20 text-purple-300', icon: '[+]', severity: 'info' },
  project_updated: { label: 'Project Updated', color: 'bg-yellow-500/20 text-yellow-300', icon: '[~]', severity: 'info' },
  project_deleted: { label: 'Project Deleted', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  milestone_approved: { label: 'Milestone Approved', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  requirement_approved: { label: 'Requirement Approved', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  team_member_created: { label: 'Team Member Added', color: 'bg-green-500/20 text-green-300', icon: '[+]', severity: 'info' },
  team_member_updated: { label: 'Team Member Updated', color: 'bg-yellow-500/20 text-yellow-300', icon: '[~]', severity: 'info' },
  team_member_deleted: { label: 'Team Member Deleted', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  member_suspended: { label: 'Member Suspended', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  member_reactivated: { label: 'Member Reactivated', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  report_exported: { label: 'Report Exported', color: 'bg-cyan-500/20 text-cyan-300', icon: '[^]', severity: 'info' },
  notification_sent: { label: 'Notification Sent', color: 'bg-blue-500/20 text-blue-300', icon: '[>]', severity: 'info' },
  offer_created: { label: 'Offer Created', color: 'bg-purple-500/20 text-purple-300', icon: '[+]', severity: 'info' },
  offer_sent: { label: 'Offer Sent', color: 'bg-cyan-500/20 text-cyan-300', icon: '[>]', severity: 'info' },
  offer_accepted: { label: 'Offer Accepted', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  idea_status_updated: { label: 'Idea Status Updated', color: 'bg-yellow-500/20 text-yellow-300', icon: '[~]', severity: 'info' },
  idea_converted: { label: 'Idea Converted', color: 'bg-purple-500/20 text-purple-300', icon: '[~]', severity: 'info' },
  support_ticket_created: { label: 'Support Ticket Created', color: 'bg-orange-500/20 text-orange-300', icon: '[+]', severity: 'info' },
  support_ticket_resolved: { label: 'Ticket Resolved', color: 'bg-green-500/20 text-green-300', icon: '[✓]', severity: 'info' },
  message_sent: { label: 'Message Sent', color: 'bg-blue-500/20 text-blue-300', icon: '[>]', severity: 'info' },
  webhook_received: { label: 'Webhook Received', color: 'bg-cyan-500/20 text-cyan-300', icon: '[^]', severity: 'info' },
  webhook_failed: { label: 'Webhook Failed', color: 'bg-red-500/20 text-red-300', icon: '[x]', severity: 'critical' },
  api_error: { label: 'API Error', color: 'bg-red-500/20 text-red-300', icon: '[!]', severity: 'critical' },
  system_error: { label: 'System Error', color: 'bg-red-500/20 text-red-300', icon: '[!]', severity: 'critical' },
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedLogs, setPaginatedLogs] = useState<AuditLog[]>([])
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Export state
  const [exporting, setExporting] = useState(false)
  
  // Real-time subscription
  const subscriptionRef = useRef<any>(null)
  
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    uniqueUsers: 0,
    failedActions: 0,
    criticalEvents: 0,
    warningEvents: 0,
  })

  // Unique users for filter
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([])

  useEffect(() => {
    fetchLogs()
    
    // Real-time subscription for new audit logs
    subscriptionRef.current = supabase
      .channel('audit-logs-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          // Refresh logs when new audit record is added
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, typeFilter, entityFilter, resultFilter, severityFilter, dateFilter, userFilter, logs])

  useEffect(() => {
    updatePagination()
  }, [filteredLogs, currentPage])

  const fetchLogs = useCallback(async () => {
    try {
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      const logsWithDetails = await Promise.all(
        (logsData || []).map(async (log) => {
          let userName = 'System'
          let userEmail = '-'
          let userRole = 'system'
          
          if (log.user_id) {
            // Try admin_users first
            const { data: adminUser } = await supabase
              .from('admin_users')
              .select('full_name, email, role')
              .eq('id', log.user_id)
              .single()
            
            if (adminUser) {
              userName = adminUser.full_name || 'Unknown'
              userEmail = adminUser.email || '-'
              userRole = adminUser.role || 'admin'
            } else {
              // Try clients
              const { data: client } = await supabase
                .from('clients')
                .select('full_name, email')
                .eq('id', log.user_id)
                .single()
              
              if (client) {
                userName = client.full_name || 'Unknown'
                userEmail = client.email || '-'
                userRole = 'client'
              }
            }
          }

          let clientName = '-'
          if (log.entity_type === 'client' && log.entity_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', log.entity_id)
              .single()
            clientName = client?.full_name || client?.company || '-'
          }

          return {
            ...log,
            user_name: userName,
            user_email: userEmail,
            user_role: userRole,
            client_name: clientName,
          }
        })
      )

      setLogs(logsWithDetails)
      calculateStats(logsWithDetails)
      
      // Extract unique users
      const users = [...new Set(logsWithDetails.map(l => l.user_name).filter(Boolean))]
      setUniqueUsers(users)
      
      setLoading(false)
    } catch (error) {
      console.error('Fetch audit logs error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats(logs: AuditLog[]) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    
    const total = logs.length
    const today = logs.filter(l => new Date(l.created_at) >= todayStart).length
    const thisWeek = logs.filter(l => new Date(l.created_at) >= weekStart).length
    const uniqueUserCount = new Set(logs.map(l => l.user_id).filter(Boolean)).size
    const failedActions = logs.filter(l => l.result === 'failed').length
    const criticalEvents = logs.filter(l => {
      const info = AUDIT_TYPES[l.action_type]
      return info && info.severity === 'critical'
    }).length
    const warningEvents = logs.filter(l => {
      const info = AUDIT_TYPES[l.action_type]
      return info && info.severity === 'warning'
    }).length

    setStats({ total, today, thisWeek, uniqueUsers: uniqueUserCount, failedActions, criticalEvents, warningEvents })
  }

  function applyFilters() {
    let filtered = [...logs]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.description?.toLowerCase().includes(term) ||
          log.user_name?.toLowerCase().includes(term) ||
          log.user_email?.toLowerCase().includes(term) ||
          log.client_name?.toLowerCase().includes(term) ||
          log.ip_address?.toLowerCase().includes(term) ||
          log.entity_id?.toLowerCase().includes(term) ||
          log.session_id?.toLowerCase().includes(term)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((log) => log.action_type === typeFilter)
    }

    if (entityFilter !== 'all') {
      filtered = filtered.filter((log) => log.entity_type === entityFilter)
    }

    if (resultFilter !== 'all') {
      filtered = filtered.filter((log) => log.result === resultFilter)
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((log) => {
        const info = AUDIT_TYPES[log.action_type]
        return info && info.severity === severityFilter
      })
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter((log) => log.user_name === userFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date(now)
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'yesterday':
          filterDate.setDate(now.getDate() - 1)
          filterDate.setHours(0, 0, 0, 0)
          break
        case '7d':
          filterDate.setDate(now.getDate() - 7)
          break
        case '30d':
          filterDate.setDate(now.getDate() - 30)
          break
        case '90d':
          filterDate.setDate(now.getDate() - 90)
          break
        case '365d':
          filterDate.setDate(now.getDate() - 365)
          break
      }
      
      filtered = filtered.filter(l => new Date(l.created_at) >= filterDate)
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedLogs(filteredLogs.slice(start, end))
  }

  function getAuditInfo(actionType: string) {
    return AUDIT_TYPES[actionType] || {
      label: (actionType || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      color: 'bg-gray-500/20 text-gray-300',
      icon: '[*]',
      severity: 'info',
    }
  }

  function getResultColor(result: string) {
    const map: Record<string, string> = {
      success: 'bg-green-500/20 text-green-300',
      successful: 'bg-green-500/20 text-green-300',
      failed: 'bg-red-500/20 text-red-300',
      error: 'bg-red-500/20 text-red-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      warning: 'bg-orange-500/20 text-orange-300',
    }
    return map[(result || '').toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function getSeverityColor(severity: string) {
    const map: Record<string, string> = {
      info: 'bg-blue-500/20 text-blue-300',
      warning: 'bg-orange-500/20 text-orange-300',
      critical: 'bg-red-500/20 text-red-300',
    }
    return map[severity] || 'bg-gray-500/20 text-gray-300'
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
      second: '2-digit',
    })
  }

  function formatRelativeTime(date: string) {
    if (!date) return '-'
    const now = new Date()
    const logDate = new Date(date)
    const diffMs = now.getTime() - logDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(date)
  }

  async function handleExport(format: 'csv' | 'json') {
    if (filteredLogs.length === 0) {
      alert('No logs to export')
      return
    }

    setExporting(true)
    try {
      if (format === 'csv') {
        const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Description', 'Entity Type', 'Entity ID', 'Client', 'IP Address', 'Session ID', 'Result']
        const csvContent = [
          headers.join(','),
          ...filteredLogs.map(log => [
            log.created_at,
            log.user_name,
            log.user_email,
            log.user_role,
            getAuditInfo(log.action_type).label,
            log.description,
            log.entity_type,
            log.entity_id,
            log.client_name,
            log.ip_address,
            log.session_id,
            log.result,
          ].map(value => `"${(value || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `audit-logs-${Date.now()}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `audit-logs-${Date.now()}.json`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      // Log the export action
      await supabase.from('audit_logs').insert({
        user_id: null,
        action_type: 'report_exported',
        description: `Audit logs exported as ${format.toUpperCase()}`,
        entity_type: 'audit_log',
        entity_id: null,
        result: 'success',
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  // Group logs by date
  const groupedLogs = paginatedLogs.reduce((groups: Record<string, AuditLog[]>, log) => {
    const dateKey = formatDate(log.created_at)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(log)
    return groups
  }, {})

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
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-sm text-gray-400 mt-1">
            Append-only security and compliance audit trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Today</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.today}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">This Week</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.thisWeek}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Users</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.uniqueUsers}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.failedActions}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Critical</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.criticalEvents}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Warnings</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{stats.warningEvents}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by description, user, email, client, IP, entity ID..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Actions</option>
          {Object.entries(AUDIT_TYPES).map(([value, info]) => (
            <option key={value} value={value} className="bg-gray-900">{info.label}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Entities</option>
          <option value="client" className="bg-gray-900">Client</option>
          <option value="project" className="bg-gray-900">Project</option>
          <option value="invoice" className="bg-gray-900">Invoice</option>
          <option value="payment" className="bg-gray-900">Payment</option>
          <option value="file" className="bg-gray-900">File</option>
          <option value="idea" className="bg-gray-900">Idea</option>
          <option value="offer" className="bg-gray-900">Offer</option>
          <option value="support_ticket" className="bg-gray-900">Support Ticket</option>
          <option value="admin_user" className="bg-gray-900">Team Member</option>
          <option value="report" className="bg-gray-900">Report</option>
          <option value="audit_log" className="bg-gray-900">Audit Log</option>
        </select>
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Results</option>
          <option value="success" className="bg-gray-900">Success</option>
          <option value="failed" className="bg-gray-900">Failed</option>
          <option value="pending" className="bg-gray-900">Pending</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Severity</option>
          <option value="info" className="bg-gray-900">Info</option>
          <option value="warning" className="bg-gray-900">Warning</option>
          <option value="critical" className="bg-gray-900">Critical</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Time</option>
          <option value="today" className="bg-gray-900">Today</option>
          <option value="yesterday" className="bg-gray-900">Yesterday</option>
          <option value="7d" className="bg-gray-900">Last 7 Days</option>
          <option value="30d" className="bg-gray-900">Last 30 Days</option>
          <option value="90d" className="bg-gray-900">Last 90 Days</option>
          <option value="365d" className="bg-gray-900">Last 12 Months</option>
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Users</option>
          {uniqueUsers.map(user => (
            <option key={user} value={user} className="bg-gray-900">{user}</option>
          ))}
        </select>
      </div>

      {/* Audit Log Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedLogs).length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">[ ]</div>
            <p className="text-gray-500">No audit logs found</p>
            <p className="text-gray-600 text-xs mt-1">Security events will appear here in real-time</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([dateKey, dateLogs]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-400">{dateKey}</h3>
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-gray-500">{dateLogs.length} records</span>
              </div>
              <div className="space-y-2">
                {dateLogs.map((log) => {
                  const info = getAuditInfo(log.action_type)
                  return (
                    <button
                      key={log.id}
                      onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}
                      className="w-full text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${info.color}`}>
                          <span className="text-xs font-bold">{info.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${info.color}`}>
                              {info.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getResultColor(log.result)}`}>
                              {log.result || 'unknown'}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(info.severity)}`}>
                              {info.severity}
                            </span>
                            <span className="text-xs text-gray-500">{formatTime(log.created_at)}</span>
                          </div>
                          <p className="text-sm text-white mt-1">{log.description || '-'}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400">By: {log.user_name}</span>
                            {log.client_name !== '-' && (
                              <>
                                <span className="text-xs text-gray-600">|</span>
                                <span className="text-xs text-gray-400">Client: {log.client_name}</span>
                              </>
                            )}
                            {log.ip_address && (
                              <>
                                <span className="text-xs text-gray-600">|</span>
                                <span className="text-xs text-gray-400">IP: {log.ip_address}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{formatRelativeTime(log.created_at)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
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
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Audit Record</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getAuditInfo(selectedLog.action_type).color}`}>
                    {getAuditInfo(selectedLog.action_type).label}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getResultColor(selectedLog.result)}`}>
                    {selectedLog.result || 'unknown'}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getSeverityColor(getAuditInfo(selectedLog.action_type).severity)}`}>
                    {getAuditInfo(selectedLog.action_type).severity}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-white">{selectedLog.description || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">User (WHO)</p>
                  <p className="text-sm text-white">{selectedLog.user_name}</p>
                  <p className="text-xs text-gray-400">{selectedLog.user_email}</p>
                  <p className="text-xs text-gray-500 mt-1">Role: {selectedLog.user_role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Action (WHAT)</p>
                  <p className="text-sm text-white">{getAuditInfo(selectedLog.action_type).label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Entity Type</p>
                  <p className="text-sm text-white">{selectedLog.entity_type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Entity ID</p>
                  <p className="text-sm text-white truncate">{selectedLog.entity_id || '-'}</p>
                </div>
                {selectedLog.client_name !== '-' && (
                  <div>
                    <p className="text-xs text-gray-500">Client</p>
                    <p className="text-sm text-white">{selectedLog.client_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Result</p>
                  <p className="text-sm text-white">{selectedLog.result || '-'}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-400 mb-1">Error Message</p>
                  <p className="text-sm text-red-300">{selectedLog.error_message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-500">IP Address (WHERE)</p>
                  <p className="text-sm text-white">{selectedLog.ip_address || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Session ID</p>
                  <p className="text-sm text-white truncate">{selectedLog.session_id || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">User Agent</p>
                  <p className="text-sm text-white truncate">{selectedLog.user_agent || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date (WHEN)</p>
                  <p className="text-sm text-white">{formatDate(selectedLog.created_at)}</p>
                  <p className="text-xs text-gray-400">{formatTime(selectedLog.created_at)}</p>
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2">Additional Metadata</p>
                  <pre className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
