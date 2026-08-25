'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Requirement {
  id: string
  project_id: string
  client_id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
  created_at: string
  project_name: string
  client_name: string
}

export default function AdminRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [projects, setProjects] = useState<any[]>([])

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Internal notes state
  const [internalNotes, setInternalNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')

  // Forms
  const [newRequirement, setNewRequirement] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 'normal',
    due_date: '',
  })

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'normal',
    due_date: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, priorityFilter, requirements])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
      setProjects(projectsData || [])

      const { data: requirementsData } = await supabase
        .from('requirements')
        .select('*')
        .order('created_at', { ascending: false })

      const reqsWithNames = await Promise.all(
        (requirementsData || []).map(async (req) => {
          const { data: project } = await supabase
            .from('projects')
            .select('name, client_id')
            .eq('id', req.project_id)
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
            ...req,
            project_name: project?.name || 'Unknown Project',
            client_name: clientName,
          }
        })
      )

      setRequirements(reqsWithNames)
      setLoading(false)
    } catch (error) {
      console.error('Fetch requirements error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...requirements]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term) ||
          r.client_name?.toLowerCase().includes(term) ||
          r.project_name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((r) => r.priority === priorityFilter)
    }

    setFilteredRequirements(filtered)
  }

  async function handleCreateRequirement() {
    if (!newRequirement.title || !newRequirement.project_id) {
      alert('Title and project are required')
      return
    }

    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', newRequirement.project_id)
      .single()

    const { data: newReq } = await supabase
      .from('requirements')
      .insert({
        project_id: newRequirement.project_id,
        client_id: project?.client_id,
        title: newRequirement.title,
        description: newRequirement.description,
        priority: newRequirement.priority,
        due_date: newRequirement.due_date || null,
        status: 'draft',
      })
      .select()
      .single()

    // Upload file if attached
    if (uploadFile && newReq) {
      const fileName = `requirement-${Date.now()}-${uploadFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(fileName, uploadFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('client-files').getPublicUrl(fileName)
        if (urlData?.publicUrl) {
          await supabase.from('files').insert({
            client_id: project?.client_id,
            project_id: newRequirement.project_id,
            file_name: uploadFile.name,
            file_url: urlData.publicUrl,
            status: 'uploaded',
          })
        }
      }
    }

    await supabase.from('activity_logs').insert({
      client_id: project?.client_id,
      project_id: newRequirement.project_id,
      type: 'requirement',
      title: 'Requirement Created',
      description: newRequirement.title,
    })

    setShowCreateModal(false)
    setUploadFile(null)
    setNewRequirement({ project_id: '', title: '', description: '', priority: 'normal', due_date: '' })
    fetchData()
  }

  async function handleEditRequirement() {
    if (!selectedRequirement || !editForm.title) return

    await supabase
      .from('requirements')
      .update({
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        due_date: editForm.due_date || null,
      })
      .eq('id', selectedRequirement.id)

    setShowEditModal(false)
    fetchData()
  }

  async function handleStatusChange(requirementId: string, newStatus: string) {
    await supabase.from('requirements').update({ status: newStatus }).eq('id', requirementId)

    const req = requirements.find(r => r.id === requirementId)
    if (req && newStatus === 'approved') {
      await supabase.from('notifications').insert({
        client_id: req.client_id,
        type: 'project',
        title: 'Requirement Approved',
        message: `Your requirement "${req.title}" has been approved.`,
      })
    }

    if (req && newStatus === 'needs_clarification') {
      await supabase.from('notifications').insert({
        client_id: req.client_id,
        type: 'project',
        title: 'Clarification Needed',
        message: `We need clarification on your requirement "${req.title}".`,
      })
    }

    fetchData()
  }

  async function fetchInternalNotes(requirementId: string) {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('project_id', selectedRequirement?.project_id)
      .eq('type', 'internal_note')
      .order('created_at', { ascending: false })
    setInternalNotes(data || [])
  }

  async function handleAddInternalNote() {
    if (!newNote.trim() || !selectedRequirement) return

    await supabase.from('activity_logs').insert({
      client_id: selectedRequirement.client_id,
      project_id: selectedRequirement.project_id,
      type: 'internal_note',
      title: 'Internal Note',
      description: newNote,
    })

    setNewNote('')
    fetchInternalNotes(selectedRequirement.id)
  }

  function openDetailModal(req: Requirement) {
    setSelectedRequirement(req)
    setShowDetailModal(true)
    fetchInternalNotes(req.id)
  }

  function openEditModal(req: Requirement) {
    setSelectedRequirement(req)
    setEditForm({
      title: req.title,
      description: req.description || '',
      priority: req.priority,
      due_date: req.due_date || '',
    })
    setShowEditModal(true)
  }

  function getStatusDisplay(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-300' },
      submitted: { label: 'Submitted', color: 'bg-blue-500/20 text-blue-300' },
      under_review: { label: 'Under Review', color: 'bg-yellow-500/20 text-yellow-300' },
      needs_clarification: { label: 'Needs Clarification', color: 'bg-orange-500/20 text-orange-300' },
      approved: { label: 'Approved', color: 'bg-green-500/20 text-green-300' },
      rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-300' },
      completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-300' },
    }
    return map[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-500/20 text-gray-300' }
  }

  function getPriorityDisplay(priority: string) {
    const map: Record<string, string> = {
      low: 'bg-gray-500/20 text-gray-300',
      normal: 'bg-blue-500/20 text-blue-300',
      high: 'bg-yellow-500/20 text-yellow-300',
      critical: 'bg-red-500/20 text-red-300',
    }
    return map[priority] || 'bg-gray-500/20 text-gray-300'
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
        <h1 className="text-2xl font-bold text-white">Requirements</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Requirement
        </button>
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
          <option value="draft" className="bg-gray-900">Draft</option>
          <option value="submitted" className="bg-gray-900">Submitted</option>
          <option value="under_review" className="bg-gray-900">Under Review</option>
          <option value="needs_clarification" className="bg-gray-900">Needs Clarification</option>
          <option value="approved" className="bg-gray-900">Approved</option>
          <option value="rejected" className="bg-gray-900">Rejected</option>
          <option value="completed" className="bg-gray-900">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Priorities</option>
          <option value="low" className="bg-gray-900">Low</option>
          <option value="normal" className="bg-gray-900">Normal</option>
          <option value="high" className="bg-gray-900">High</option>
          <option value="critical" className="bg-gray-900">Critical</option>
        </select>
      </div>

      {/* Requirements Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Priority</th>
              <th className="py-3 px-4 font-medium">Due</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequirements.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">No requirements found</td>
              </tr>
            ) : (
              filteredRequirements.map((req) => {
                const statusInfo = getStatusDisplay(req.status)
                return (
                  <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{req.title}</td>
                    <td className="py-3 px-4 text-gray-300">{req.client_name}</td>
                    <td className="py-3 px-4 text-gray-300">
                      <Link href={`/admin/projects/${req.project_id}`} className="hover:text-blue-400">
                        {req.project_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityDisplay(req.priority)}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      {req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailModal(req)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(req)}
                          className="text-green-400 hover:text-green-300 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                          className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1 focus:border-blue-500 outline-none"
                        >
                          <option value="draft" className="bg-gray-900">Draft</option>
                          <option value="submitted" className="bg-gray-900">Submitted</option>
                          <option value="under_review" className="bg-gray-900">Under Review</option>
                          <option value="needs_clarification" className="bg-gray-900">Needs Clarification</option>
                          <option value="approved" className="bg-gray-900">Approved</option>
                          <option value="rejected" className="bg-gray-900">Rejected</option>
                          <option value="completed" className="bg-gray-900">Completed</option>
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

      {/* Detail Modal with Internal Notes */}
      {showDetailModal && selectedRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Requirement Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Title</p>
                <p className="text-white font-medium">{selectedRequirement.title}</p>
              </div>
              {selectedRequirement.description && (
                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-gray-300">{selectedRequirement.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-white">{selectedRequirement.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Project</p>
                <p className="text-white">{selectedRequirement.project_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Priority</p>
                <p className="text-white capitalize">{selectedRequirement.priority}</p>
              </div>

              {/* Internal Notes */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="font-bold text-white mb-3">Internal Notes</h3>
                <div className="space-y-2 mb-3">
                  {internalNotes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No internal notes</p>
                  ) : (
                    internalNotes.map((note) => (
                      <div key={note.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-300 text-sm">{note.description}</p>
                        <p className="text-gray-500 text-xs mt-1">{new Date(note.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add internal note..."
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                  <button
                    onClick={handleAddInternalNote}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Create Requirement</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Project *</label>
                <select
                  value={newRequirement.project_id}
                  onChange={(e) => setNewRequirement({ ...newRequirement, project_id: e.target.value })}
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
                  value={newRequirement.title}
                  onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={newRequirement.description}
                  onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Priority</label>
                  <select
                    value={newRequirement.priority}
                    onChange={(e) => setNewRequirement({ ...newRequirement, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="low" className="bg-gray-900">Low</option>
                    <option value="normal" className="bg-gray-900">Normal</option>
                    <option value="high" className="bg-gray-900">High</option>
                    <option value="critical" className="bg-gray-900">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newRequirement.due_date}
                    onChange={(e) => setNewRequirement({ ...newRequirement, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Attach File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700"
                />
              </div>
              <button
                onClick={handleCreateRequirement}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Requirement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Edit Requirement</h2>
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
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="low" className="bg-gray-900">Low</option>
                    <option value="normal" className="bg-gray-900">Normal</option>
                    <option value="high" className="bg-gray-900">High</option>
                    <option value="critical" className="bg-gray-900">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleEditRequirement}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Update Requirement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}