'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ActivityItem {
  id: string
  user_id: string
  action_type: string
  description: string
  entity_type: string
  entity_id: string
  client_name: string
  project_name: string
  created_at: string
}

const ITEMS_PER_PAGE = 20
const ACTIVITY_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  login: { label: 'Login', icon: '[>]', color: 'bg-blue-500/20 text-blue-300' },
  logout: { label: 'Logout', icon: '[<]', color: 'bg-gray-500/20 text-gray-300' },
  client_created: { label: 'Client Created', icon: '[+]', color: 'bg-green-500/20 text-green-300' },
  client_updated: { label: 'Client Updated', icon: '[~]', color: 'bg-blue-500/20 text-blue-300' },
  project_created: { label: 'Project Created', icon: '[+]', color: 'bg-purple-500/20 text-purple-300' },
  project_updated: { label: 'Project Updated', icon: '[~]', color: 'bg-purple-500/20 text-purple-300' },
  milestone_completed: { label: 'Milestone Completed', icon: '[✓]', color: 'bg-emerald-500/20 text-emerald-300' },
  milestone_approved: { label: 'Milestone Approved', icon: '[✓]', color: 'bg-green-500/20 text-green-300' },
  file_uploaded: { label: 'File Uploaded', icon: '[^]', color: 'bg-cyan-500/20 text-cyan-300' },
  file_deleted: { label: 'File Deleted', icon: '[x]', color: 'bg-red-500/20 text-red-300' },
  message_created: { label: 'Message Sent', icon: '[>]', color: 'bg-blue-500/20 text-blue-300' },
  message_read: { label: 'Message Read', icon: '[✓]', color: 'bg-gray-500/20 text-gray-300' },
  idea_submitted: { label: 'Idea Submitted', icon: '[!]', color: 'bg-orange-500/20 text-orange-300' },
  idea_updated: { label: 'Idea Updated', icon: '[~]', color: 'bg-orange-500/20 text-orange-300' },
  invoice_created: { label: 'Invoice Created', icon: '[+]', color: 'bg-yellow-500/20 text-yellow-300' },
  invoice_sent: { label: 'Invoice Sent', icon: '[>]', color: 'bg-yellow-500/20 text-yellow-300' },
  invoice_paid: { label: 'Invoice Paid', icon: '[✓]', color: 'bg-green-500/20 text-green-300' },
  payment_verified: { label: 'Payment Verified', icon: '[✓]', color: 'bg-green-500/20 text-green-300' },
  payment_failed: { label: 'Payment Failed', icon: '[x]', color: 'bg-red-500/20 text-red-300' },
  offer_created: { label: 'Offer Created', icon: '[+]', color: 'bg-purple-500/20 text-purple-300' },
  offer_accepted: { label: 'Offer Accepted', icon: '[✓]', color: 'bg-green-500/20 text-green-300' },
  support_ticket_created: { label: 'Support Ticket', icon: '[?]', color: 'bg-orange-500/20 text-orange-300' },
  support_ticket_resolved: { label: 'Ticket Resolved', icon: '[✓]', color: 'bg-emerald-500/20 text-emerald-300' },
  requirement_submitted: { label: 'Requirement Submitted', icon: '[+]', color: 'bg-cyan-500/20 text-cyan-300' },
  requirement_approved: { label: 'Requirement Approved', icon: '[✓]', color: 'bg-green-500/20 text-green-300' },
  notification_sent: { label: 'Notification Sent', icon: '[>]', color: 'bg-blue-500/20 text-blue-300' },
  team_member_created: { label: 'Team Member Added', icon: '[+]', color: 'bg-purple-500/20 text-purple-300' },
  permission_changed: { label: 'Permission Changed', icon: '[~]', color: 'bg-red-500/20 text-red-300' },
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedActivities, setPaginatedActivities] = useState<ActivityItem[]>([])
  
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    uniqueTypes: 0,
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, typeFilter, entityFilter, activities])

  useEffect(() => {
    updatePagination()
  }, [filteredActivities, currentPage])

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const { data: activitiesData } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      const activitiesWithDetails = await Promise.all(
        (activitiesData || []).map(async (activity) => {
          let clientName = 'System'
          if (activity.user_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', activity.user_id)
              .single()
            clientName = client?.full_name || client?.company || 'System'
          }

          let projectName = '-'
          if (activity.entity_type === 'project' && activity.entity_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', activity.entity_id)
              .single()
            projectName = project?.name || '-'
          }

          return {
            ...activity,
            client_name: clientName,
            project_name: projectName,
          }
        })
      )

      setActivities(activitiesWithDetails)
      calculateStats(activitiesWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch activities error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats(activities: ActivityItem[]) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    
    const total = activities.length
    const today = activities.filter(a => new Date(a.created_at) >= todayStart).length
    const thisWeek = activities.filter(a => new Date(a.created_at) >= weekStart).length
    const uniqueTypes = new Set(activities.map(a => a.action_type)).size

    setStats({ total, today, thisWeek, uniqueTypes })
  }

  function applyFilters() {
    let filtered = [...activities]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (activity) =>
          activity.description?.toLowerCase().includes(term) ||
          activity.client_name?.toLowerCase().includes(term) ||
          activity.project_name?.toLowerCase().includes(term)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.action_type === typeFilter)
    }

    if (entityFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.entity_type === entityFilter)
    }

    setFilteredActivities(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedActivities(filteredActivities.slice(start, end))
  }

  function getActivityInfo(actionType: string) {
    return ACTIVITY_TYPES[actionType] || { 
      label: actionType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Activity', 
      icon: '[*]', 
      color: 'bg-gray-500/20 text-gray-300' 
    }
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

  function formatRelativeTime(date: string) {
    if (!date) return '-'
    const now = new Date()
    const activityDate = new Date(date)
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(date)
  }

  // Group activities by date
  const groupedActivities = paginatedActivities.reduce((groups: Record<string, ActivityItem[]>, activity) => {
    const dateKey = formatDate(activity.created_at)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(activity)
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
          <h1 className="text-2xl font-bold text-white">Activity</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time business activity timeline
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Events</p>
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
          <p className="text-sm text-gray-400">Event Types</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.uniqueTypes}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search activity..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Event Types</option>
          {Object.entries(ACTIVITY_TYPES).map(([value, info]) => (
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
          <option value="message" className="bg-gray-900">Message</option>
          <option value="idea" className="bg-gray-900">Idea</option>
          <option value="offer" className="bg-gray-900">Offer</option>
          <option value="support_ticket" className="bg-gray-900">Support Ticket</option>
          <option value="requirement" className="bg-gray-900">Requirement</option>
          <option value="milestone" className="bg-gray-900">Milestone</option>
        </select>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">[*]</div>
            <p className="text-gray-500">No activity recorded</p>
            <p className="text-gray-600 text-xs mt-1">Business events will appear here in real-time</p>
          </div>
        ) : (
          Object.entries(groupedActivities).map(([dateKey, dateActivities]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-400">{dateKey}</h3>
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-gray-500">{dateActivities.length} events</span>
              </div>
              <div className="space-y-2">
                {dateActivities.map((activity) => {
                  const info = getActivityInfo(activity.action_type)
                  return (
                    <button
                      key={activity.id}
                      onClick={() => { setSelectedActivity(activity); setShowDetailModal(true); }}
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
                            <span className="text-xs text-gray-500">{formatTime(activity.created_at)}</span>
                          </div>
                          <p className="text-sm text-white mt-1">{activity.description || '-'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{activity.client_name}</span>
                            {activity.project_name !== '-' && (
                              <>
                                <span className="text-xs text-gray-600">|</span>
                                <span className="text-xs text-gray-400">{activity.project_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{formatRelativeTime(activity.created_at)}</span>
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
      {showDetailModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Activity Details</h2>
                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getActivityInfo(selectedActivity.action_type).color}`}>
                  {getActivityInfo(selectedActivity.action_type).label}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-300 mt-1">{selectedActivity.description || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm text-white">{selectedActivity.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Entity Type</p>
                  <p className="text-sm text-white">{selectedActivity.entity_type || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Timestamp</p>
                <p className="text-sm text-white">
                  {formatDate(selectedActivity.created_at)} at {formatTime(selectedActivity.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
