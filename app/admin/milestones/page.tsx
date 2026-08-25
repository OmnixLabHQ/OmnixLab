'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Milestone {
  id: string
  project_id: string
  client_id: string | null
  title: string
  description: string
  status: string
  start_date: string
  deadline: string
  completion_percentage: number
  budget: number
  sort_order: number
  approved_by: string
  approved_at: string
  created_at: string
  project_name: string
  client_name: string
}

export default function AdminMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [projects, setProjects] = useState<any[]>([])

  const [newMilestone, setNewMilestone] = useState({
    project_id: '',
    title: '',
    description: '',
    start_date: '',
    deadline: '',
    budget: '',
    sort_order: 0,
  })

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start_date: '',
    deadline: '',
    budget: '',
    completion_percentage: 0,
    sort_order: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, milestones])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
      setProjects(projectsData || [])

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      const milestonesWithNames = await Promise.all(
        (milestonesData || []).map(async (milestone) => {
          const { data: project } = await supabase
            .from('projects')
            .select('name, client_id')
            .eq('id', milestone.project_id)
            .single()

          let clientName = 'Unknown'
          if (project?.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', project.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          return {
            ...milestone,
            project_name: project?.name || 'Unknown Project',
            client_name: clientName,
            client_id: project?.client_id || null,
          }
        })
      )

      setMilestones(milestonesWithNames)
      setLoading(false)
    } catch (error) {
      console.error('Fetch milestones error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...milestones]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.client_name?.toLowerCase().includes(term) ||
          m.project_name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter)
    }

    setFilteredMilestones(filtered)
  }

  async function handleCreateMilestone() {
    if (!newMilestone.title || !newMilestone.project_id) {
      alert('Title and project are required')
      return
    }

    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', newMilestone.project_id)
      .single()

    await supabase.from('milestones').insert({
      project_id: newMilestone.project_id,
      title: newMilestone.title,
      description: newMilestone.description,
      start_date: newMilestone.start_date || null,
      deadline: newMilestone.deadline || null,
      budget: newMilestone.budget ? parseFloat(newMilestone.budget) : null,
      sort_order: newMilestone.sort_order || 0,
      status: 'upcoming',
      completion_percentage: 0,
    })

    await supabase.from('activity_logs').insert({
      client_id: project?.client_id,
      project_id: newMilestone.project_id,
      type: 'milestone',
      title: 'Milestone Created',
      description: newMilestone.title,
    })

    setShowCreateModal(false)
    setNewMilestone({ project_id: '', title: '', description: '', start_date: '', deadline: '', budget: '', sort_order: 0 })
    fetchData()
  }

  async function handleEditMilestone() {
    if (!selectedMilestone || !editForm.title) return

    await supabase
      .from('milestones')
      .update({
        title: editForm.title,
        description: editForm.description,
        start_date: editForm.start_date || null,
        deadline: editForm.deadline || null,
        budget: editForm.budget ? parseFloat(editForm.budget) : null,
        completion_percentage: editForm.completion_percentage,
        sort_order: editForm.sort_order,
      })
      .eq('id', selectedMilestone.id)

    setShowEditModal(false)
    fetchData()
  }

    async function handleStatusChange(milestoneId: string, newStatus: string) {
    const milestone = milestones.find(m => m.id === milestoneId)

    // If approving, record who approved and when
    if (newStatus === 'approved') {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('milestones')
        .update({
          status: newStatus,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)
    } else if (newStatus === 'completed') {
      await supabase
        .from('milestones')
        .update({
          status: newStatus,
          completion_percentage: 100,
          approved_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)

      if (milestone) {
        await supabase.from('notifications').insert({
          client_id: milestone.client_id,
          type: 'milestone',
          title: 'Milestone Completed',
          message: `Milestone "${milestone.title}" has been completed.`,
        })

        await supabase.from('activity_logs').insert({
          client_id: milestone.client_id,
          project_id: milestone.project_id,
          type: 'milestone',
          title: 'Milestone Completed',
          description: milestone.title,
        })
      }
    } else {
      await supabase.from('milestones').update({ status: newStatus }).eq('id', milestoneId)
    }

    fetchData()
  }

  async function handleMoveUp(milestoneId: string) {
    const index = milestones.findIndex(m => m.id === milestoneId)
    if (index <= 0) return

    const current = milestones[index]
    const previous = milestones[index - 1]

    await supabase.from('milestones').update({ sort_order: previous.sort_order }).eq('id', current.id)
    await supabase.from('milestones').update({ sort_order: current.sort_order }).eq('id', previous.id)

    fetchData()
  }

  async function handleMoveDown(milestoneId: string) {
    const index = milestones.findIndex(m => m.id === milestoneId)
    if (index >= milestones.length - 1) return

    const current = milestones[index]
    const next = milestones[index + 1]

    await supabase.from('milestones').update({ sort_order: next.sort_order }).eq('id', current.id)
    await supabase.from('milestones').update({ sort_order: current.sort_order }).eq('id', next.id)

    fetchData()
  }

  function getStatusDisplay(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      upcoming: { label: 'Upcoming', color: 'bg-gray-500/20 text-gray-300' },
      active: { label: 'Active', color: 'bg-blue-500/20 text-blue-300' },
      awaiting_client: { label: 'Awaiting Client', color: 'bg-yellow-500/20 text-yellow-300' },
      review: { label: 'Review', color: 'bg-purple-500/20 text-purple-300' },
      approved: { label: 'Approved', color: 'bg-cyan-500/20 text-cyan-300' },
      completed: { label: 'Completed', color: 'bg-green-500/20 text-green-300' },
      blocked: { label: 'Blocked', color: 'bg-red-500/20 text-red-300' },
    }
    return map[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-500/20 text-gray-300' }
  }

  function openDetailModal(milestone: Milestone) {
    setSelectedMilestone(milestone)
    setShowDetailModal(true)
  }

  function openEditModal(milestone: Milestone) {
    setSelectedMilestone(milestone)
    setEditForm({
      title: milestone.title,
      description: milestone.description || '',
      start_date: milestone.start_date || '',
      deadline: milestone.deadline || '',
      budget: milestone.budget?.toString() || '',
      completion_percentage: milestone.completion_percentage || 0,
      sort_order: milestone.sort_order || 0,
    })
    setShowEditModal(true)
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
        <h1 className="text-2xl font-bold text-white">Milestones</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Milestone
        </button>
      </div>

      {/* Search & Filter */}
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
          <option value="upcoming" className="bg-gray-900">Upcoming</option>
          <option value="active" className="bg-gray-900">Active</option>
          <option value="awaiting_client" className="bg-gray-900">Awaiting Client</option>
          <option value="review" className="bg-gray-900">Review</option>
          <option value="approved" className="bg-gray-900">Approved</option>
          <option value="completed" className="bg-gray-900">Completed</option>
          <option value="blocked" className="bg-gray-900">Blocked</option>
        </select>
      </div>

      {/* Milestones Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Order</th>
              <th className="py-3 px-4 font-medium">Milestone</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Start</th>
              <th className="py-3 px-4 font-medium">Deadline</th>
              <th className="py-3 px-4 font-medium">Budget</th>
              <th className="py-3 px-4 font-medium">Progress</th>
              <th className="py-3 px-4 font-medium">Approved</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMilestones.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-500">No milestones found</td>
              </tr>
            ) : (
              filteredMilestones.map((milestone, index) => {
                const statusInfo = getStatusDisplay(milestone.status)
                return (
                  <tr key={milestone.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleMoveUp(milestone.id)} className="text-gray-500 hover:text-white text-xs">↑</button>
                        <span className="text-gray-400 text-xs">{milestone.sort_order || index + 1}</span>
                        <button onClick={() => handleMoveDown(milestone.id)} className="text-gray-500 hover:text-white text-xs">↓</button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{milestone.title}</td>
                    <td className="py-3 px-4 text-gray-300">{milestone.client_name}</td>
                    <td className="py-3 px-4 text-gray-300">
                      <Link href={`/admin/projects/${milestone.project_id}`} className="hover:text-blue-400">
                        {milestone.project_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      {milestone.start_date ? new Date(milestone.start_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      {milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {milestone.budget ? `$${milestone.budget.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${milestone.completion_percentage || 0}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400">{milestone.completion_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      {milestone.approved_at ? new Date(milestone.approved_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetailModal(milestone)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">View</button>
                        <button onClick={() => openEditModal(milestone)} className="text-green-400 hover:text-green-300 text-xs font-medium">Edit</button>
                        <select
                          value={milestone.status}
                          onChange={(e) => handleStatusChange(milestone.id, e.target.value)}
                          className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1 focus:border-blue-500 outline-none"
                        >
                          <option value="upcoming" className="bg-gray-900">Upcoming</option>
                          <option value="active" className="bg-gray-900">Active</option>
                          <option value="awaiting_client" className="bg-gray-900">Awaiting Client</option>
                          <option value="review" className="bg-gray-900">Review</option>
                          <option value="approved" className="bg-gray-900">Approved</option>
                          <option value="completed" className="bg-gray-900">Completed</option>
                          <option value="blocked" className="bg-gray-900">Blocked</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Milestone Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Title</p>
                <p className="text-white font-medium">{selectedMilestone.title}</p>
              </div>
              {selectedMilestone.description && (
                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-gray-300">{selectedMilestone.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-white">{selectedMilestone.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Project</p>
                <p className="text-white">{selectedMilestone.project_name}</p>
              </div>
              {selectedMilestone.start_date && (
                <div>
                  <p className="text-sm text-gray-400">Start Date</p>
                  <p className="text-white">{new Date(selectedMilestone.start_date).toLocaleDateString()}</p>
                </div>
              )}
              {selectedMilestone.deadline && (
                <div>
                  <p className="text-sm text-gray-400">Deadline</p>
                  <p className="text-white">{new Date(selectedMilestone.deadline).toLocaleDateString()}</p>
                </div>
              )}
              {selectedMilestone.budget && (
                <div>
                  <p className="text-sm text-gray-400">Budget</p>
                  <p className="text-white">${selectedMilestone.budget.toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Completion</p>
                <p className="text-white">{selectedMilestone.completion_percentage || 0}%</p>
              </div>
              {selectedMilestone.approved_at && (
                <div>
                  <p className="text-sm text-gray-400">Approved</p>
                  <p className="text-white">{new Date(selectedMilestone.approved_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Create Milestone</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Project *</label>
                <select
                  value={newMilestone.project_id}
                  onChange={(e) => setNewMilestone({ ...newMilestone, project_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                >
                  <option value="" className="bg-gray-900">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-900">{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newMilestone.start_date}
                    onChange={(e) => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={newMilestone.deadline}
                    onChange={(e) => setNewMilestone({ ...newMilestone, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={newMilestone.budget}
                    onChange={(e) => setNewMilestone({ ...newMilestone, budget: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={newMilestone.sort_order}
                    onChange={(e) => setNewMilestone({ ...newMilestone, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateMilestone}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Edit Milestone</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editForm.sort_order}
                    onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Completion: {editForm.completion_percentage}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editForm.completion_percentage}
                  onChange={(e) => setEditForm({ ...editForm, completion_percentage: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleEditMilestone}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Update Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}