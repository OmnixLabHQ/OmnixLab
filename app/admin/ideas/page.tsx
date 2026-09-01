'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Idea {
  id: string
  client_id: string
  project_id: string
  title: string
  description: string
  category: string
  priority: string
  business_value: string
  status: string
  attachment_url: string | null
  attachment_name: string | null
  client_name: string
  project_name: string
  created_at: string
  updated_at: string
}

const ITEMS_PER_PAGE = 10

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedIdeas, setPaginatedIdeas] = useState<Idea[]>([])
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  
  // Modal states
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [convertType, setConvertType] = useState<'requirement' | 'task' | 'milestone'>('requirement')
  const [convertTitle, setConvertTitle] = useState('')
  const [convertDescription, setConvertDescription] = useState('')
  const [convertPriority, setConvertPriority] = useState('medium')
  const [convertDueDate, setConvertDueDate] = useState('')
  const [milestones, setMilestones] = useState<any[]>([])
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, ideas])

  useEffect(() => {
    updatePagination()
  }, [filteredIdeas, currentPage])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: ideasData } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })

      const ideasWithNames = await Promise.all(
        (ideasData || []).map(async (idea) => {
          let clientName = 'Unknown'
          if (idea.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', idea.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          let projectName = 'General'
          if (idea.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', idea.project_id)
              .single()
            projectName = project?.name || 'General'
          }

          return {
            ...idea,
            client_name: clientName,
            project_name: projectName,
          }
        })
      )

      setIdeas(ideasWithNames)
      setLoading(false)
    } catch (error) {
      console.error('Fetch ideas error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...ideas]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (idea) =>
          idea.title?.toLowerCase().includes(term) ||
          idea.description?.toLowerCase().includes(term) ||
          idea.client_name?.toLowerCase().includes(term) ||
          idea.project_name?.toLowerCase().includes(term) ||
          idea.business_value?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((idea) => idea.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((idea) => idea.priority === priorityFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((idea) => idea.category === categoryFilter)
    }

    setFilteredIdeas(filtered)
    setCurrentPage(1) // Reset to first page when filters change
    setSelectedIds(new Set()) // Clear selection when filters change
  }

  function updatePagination() {
    const total = Math.ceil(filteredIdeas.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedIdeas(filteredIdeas.slice(start, end))
  }

  function handlePageChange(page: number) {
    setCurrentPage(page)
    setSelectedIds(new Set()) // Clear selection when page changes
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedIdeas.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedIdeas.map(idea => idea.id)))
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

  async function handleBulkStatusUpdate() {
    if (!bulkStatus || selectedIds.size === 0) {
      alert('Please select a status and at least one idea')
      return
    }

    setBulkUpdating(true)
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ 
          status: bulkStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedIds))

      if (error) {
        alert('Bulk update failed: ' + error.message)
        return
      }

      // Create activity logs for bulk update
      const activityLogs = Array.from(selectedIds).map(id => ({
        user_id: null,
        action_type: 'idea_status_updated',
        description: `Idea status changed to ${bulkStatus} (bulk update)`,
        entity_type: 'idea',
        entity_id: id,
      }))
      await supabase.from('activity_logs').insert(activityLogs)

      setShowBulkStatusModal(false)
      setBulkStatus('')
      setSelectedIds(new Set())
      fetchData()
    } catch (error) {
      console.error('Bulk status update error:', error)
      alert('Failed to update status')
    } finally {
      setBulkUpdating(false)
    }
  }

  async function handleStatusUpdate() {
    if (!selectedIdea || !newStatus) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedIdea.id)

      if (error) {
        alert('Update failed: ' + error.message)
        return
      }

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: selectedIdea.client_id,
        action_type: 'idea_status_updated',
        description: `Idea "${selectedIdea.title}" status changed to ${newStatus}`,
        entity_type: 'idea',
        entity_id: selectedIdea.id,
      })

      setShowStatusModal(false)
      setNewStatus('')
      fetchData()
    } catch (error) {
      console.error('Status update error:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleConvertIdea() {
    if (!selectedIdea || !convertTitle.trim()) {
      alert('Please enter a title')
      return
    }

    setUpdating(true)
    try {
      if (convertType === 'requirement') {
        await supabase.from('requirements').insert({
          client_id: selectedIdea.client_id,
          project_id: selectedIdea.project_id,
          title: convertTitle,
          description: convertDescription || selectedIdea.description,
          priority: convertPriority,
          status: 'draft',
          source_idea_id: selectedIdea.id,
          created_at: new Date().toISOString(),
        })
      } else if (convertType === 'task') {
        await supabase.from('tasks').insert({
          client_id: selectedIdea.client_id,
          project_id: selectedIdea.project_id,
          title: convertTitle,
          description: convertDescription || selectedIdea.description,
          priority: convertPriority,
          status: 'todo',
          due_date: convertDueDate || null,
          source_idea_id: selectedIdea.id,
          created_at: new Date().toISOString(),
        })
      } else if (convertType === 'milestone') {
        await supabase.from('milestones').insert({
          client_id: selectedIdea.client_id,
          project_id: selectedIdea.project_id,
          name: convertTitle,
          description: convertDescription || selectedIdea.description,
          status: 'upcoming',
          due_date: convertDueDate || null,
          source_idea_id: selectedIdea.id,
          created_at: new Date().toISOString(),
        })
      }

      // Update idea status to show it's been converted
      await supabase
        .from('ideas')
        .update({ 
          status: 'Accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedIdea.id)

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: selectedIdea.client_id,
        action_type: 'idea_converted',
        description: `Idea "${selectedIdea.title}" converted to ${convertType}: ${convertTitle}`,
        entity_type: 'idea',
        entity_id: selectedIdea.id,
      })

      setShowConvertModal(false)
      setConvertTitle('')
      setConvertDescription('')
      setConvertPriority('medium')
      setConvertDueDate('')
      fetchData()
    } catch (error) {
      console.error('Convert idea error:', error)
      alert('Failed to convert idea')
    } finally {
      setUpdating(false)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      submitted: 'bg-blue-500/20 text-blue-300',
      reviewing: 'bg-yellow-500/20 text-yellow-300',
      accepted: 'bg-green-500/20 text-green-300',
      planned: 'bg-purple-500/20 text-purple-300',
      'in development': 'bg-cyan-500/20 text-cyan-300',
      completed: 'bg-emerald-500/20 text-emerald-300',
      declined: 'bg-red-500/20 text-red-300',
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
          <h1 className="text-2xl font-bold text-white">Ideas</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredIdeas.length} total ideas
            {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setShowBulkStatusModal(true)}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Update Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, description, client, or project..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="submitted" className="bg-gray-900">Submitted</option>
          <option value="reviewing" className="bg-gray-900">Reviewing</option>
          <option value="accepted" className="bg-gray-900">Accepted</option>
          <option value="planned" className="bg-gray-900">Planned</option>
          <option value="in development" className="bg-gray-900">In Development</option>
          <option value="completed" className="bg-gray-900">Completed</option>
          <option value="declined" className="bg-gray-900">Declined</option>
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Categories</option>
          <option value="feature" className="bg-gray-900">Feature</option>
          <option value="improvement" className="bg-gray-900">Improvement</option>
          <option value="bug" className="bg-gray-900">Bug Fix</option>
          <option value="design" className="bg-gray-900">Design</option>
          <option value="other" className="bg-gray-900">Other</option>
        </select>
      </div>

      {/* Ideas Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium w-12">
                <input
                  type="checkbox"
                  checked={paginatedIdeas.length > 0 && selectedIds.size === paginatedIdeas.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 bg-white/10 border-white/20 rounded"
                />
              </th>
              <th className="py-3 px-4 font-medium">Idea</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Priority</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Last Updated</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIdeas.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="text-4xl mb-3">💡</div>
                  <p className="text-gray-500">No ideas found</p>
                  <p className="text-gray-600 text-xs mt-1">Client-submitted ideas will appear here</p>
                </td>
              </tr>
            ) : (
              paginatedIdeas.map((idea) => (
                <tr key={idea.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedIds.has(idea.id) ? 'bg-blue-500/10' : ''}`}>
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(idea.id)}
                      onChange={() => toggleSelectOne(idea.id)}
                      className="w-4 h-4 bg-white/10 border-white/20 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelectedIdea(idea); setShowDetailModal(true); }}
                      className="text-white font-medium hover:text-blue-400 text-left"
                    >
                      {idea.title}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{idea.client_name}</td>
                  <td className="py-3 px-4 text-gray-300">{idea.project_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(idea.priority)}`}>
                      {idea.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(idea.status)}`}>
                      {idea.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(idea.created_at)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(idea.updated_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { setSelectedIdea(idea); setShowDetailModal(true); }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View
                      </button>
                      <button
                        onClick={() => { setSelectedIdea(idea); setNewStatus(idea.status); setShowStatusModal(true); }}
                        className="text-green-400 hover:text-green-300 text-xs"
                      >
                        Status
                      </button>
                      <button
                        onClick={() => { 
                          setSelectedIdea(idea); 
                          setConvertTitle(idea.title);
                          setConvertDescription(idea.description);
                          setConvertType('requirement');
                          setShowConvertModal(true); 
                        }}
                        className="text-purple-400 hover:text-purple-300 text-xs"
                      >
                        Convert
                      </button>
                    </div>
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
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedIdea.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedIdea.status)}`}>
                    {selectedIdea.status}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedIdea.priority)}`}>
                    {selectedIdea.priority}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/10 text-gray-300">
                    {selectedIdea.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm text-white">{selectedIdea.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project</p>
                  <p className="text-sm text-white">{selectedIdea.project_name}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">{selectedIdea.description}</p>
              </div>

              {selectedIdea.business_value && (
                <div>
                  <p className="text-xs text-gray-500">Business Value</p>
                  <p className="text-sm text-gray-300 mt-1">{selectedIdea.business_value}</p>
                </div>
              )}

              {selectedIdea.attachment_url && (
                <div>
                  <p className="text-xs text-gray-500">Attachment</p>
                  <a
                    href={selectedIdea.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-1 text-sm text-blue-400 hover:text-blue-300"
                  >
                    📎 {selectedIdea.attachment_name || 'View Attachment'}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-white">{formatDate(selectedIdea.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-white">{formatDate(selectedIdea.updated_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setNewStatus(selectedIdea.status);
                  setShowStatusModal(true);
                }}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setConvertTitle(selectedIdea.title);
                  setConvertDescription(selectedIdea.description);
                  setConvertType('requirement');
                  setShowConvertModal(true);
                }}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Convert Idea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Update Idea Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="submitted" className="bg-gray-900">Submitted</option>
                  <option value="reviewing" className="bg-gray-900">Reviewing</option>
                  <option value="accepted" className="bg-gray-900">Accepted</option>
                  <option value="planned" className="bg-gray-900">Planned</option>
                  <option value="in development" className="bg-gray-900">In Development</option>
                  <option value="completed" className="bg-gray-900">Completed</option>
                  <option value="declined" className="bg-gray-900">Declined</option>
                  <option value="archived" className="bg-gray-900">Archived</option>
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Update Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Bulk Update Status</h2>
              <button onClick={() => setShowBulkStatusModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Update <span className="text-white font-medium">{selectedIds.size}</span> selected ideas
              </p>
              <div>
                <label className="block text-sm text-gray-300 mb-1">New Status</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="" className="bg-gray-900">Select status...</option>
                  <option value="submitted" className="bg-gray-900">Submitted</option>
                  <option value="reviewing" className="bg-gray-900">Reviewing</option>
                  <option value="accepted" className="bg-gray-900">Accepted</option>
                  <option value="planned" className="bg-gray-900">Planned</option>
                  <option value="in development" className="bg-gray-900">In Development</option>
                  <option value="completed" className="bg-gray-900">Completed</option>
                  <option value="declined" className="bg-gray-900">Declined</option>
                  <option value="archived" className="bg-gray-900">Archived</option>
                </select>
              </div>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={bulkUpdating || !bulkStatus}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {bulkUpdating ? 'Updating...' : 'Update Selected Ideas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Convert Idea</h2>
              <button onClick={() => setShowConvertModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Convert To</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setConvertType('requirement')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      convertType === 'requirement'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Requirement
                  </button>
                  <button
                    onClick={() => setConvertType('task')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      convertType === 'task'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Task
                  </button>
                  <button
                    onClick={() => setConvertType('milestone')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      convertType === 'milestone'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Milestone
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={convertDescription}
                  onChange={(e) => setConvertDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Priority</label>
                  <select
                    value={convertPriority}
                    onChange={(e) => setConvertPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="low" className="bg-gray-900">Low</option>
                    <option value="medium" className="bg-gray-900">Medium</option>
                    <option value="high" className="bg-gray-900">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={convertDueDate}
                    onChange={(e) => setConvertDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleConvertIdea}
                disabled={updating || !convertTitle.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {updating ? 'Converting...' : `Convert to ${convertType.charAt(0).toUpperCase() + convertType.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
