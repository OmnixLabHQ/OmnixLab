'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Project {
  id: number
  client_id: string
  name: string
  description?: string | null
  status: string
  progress: number
  priority: string
  expected_completion_date: string | null
  created_at: string
  client_name?: string
  client_company?: string
  completed_milestones?: number
  total_milestones?: number
  outstanding_amount?: number
  budget?: number
}

const PROJECT_STATUSES = [
  'draft',
  'awaiting_client',
  'planning',
  'in_progress',
  'in_review',
  'client_approval',
  'revision',
  'on_hold',
  'blocked',
  'completed',
  'cancelled',
  'archived',
]

const ITEMS_PER_PAGE = 10

export default function AdminProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedProjects, setPaginatedProjects] = useState<Project[]>([])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [formName, setFormName] = useState('')
  const [formClientId, setFormClientId] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStatus, setFormStatus] = useState('planning')
  const [formPriority, setFormPriority] = useState('medium')
  const [formStartDate, setFormStartDate] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formBudget, setFormBudget] = useState('')
  const [formProgress, setFormProgress] = useState('0')

  const [clients, setClients] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    atRisk: 0,
    awaitingClient: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, priorityFilter, projects])

  useEffect(() => {
    updatePagination()
  }, [filteredProjects, currentPage])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name, company, email')
        .order('created_at', { ascending: false })
      setClients(clientsData || [])

      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch projects error:', error)
        setLoading(false)
        return
      }

      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          let clientName = 'Unknown'
          let clientCompany = ''
          if (project.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', project.client_id)
              .single()
            clientName = client?.full_name || 'Unknown'
            clientCompany = client?.company || ''
          }

          let completedMilestones = 0
          let totalMilestones = 0
          try {
            const { data: milestonesData } = await supabase
              .from('milestones')
              .select('status')
              .eq('project_id', project.id)
            totalMilestones = milestonesData?.length || 0
            completedMilestones = (milestonesData || []).filter(m => m.status === 'completed').length
          } catch {}

          let outstandingAmount = 0
          try {
            const { data: invoicesData } = await supabase
              .from('invoices')
              .select('total, amount, amount_paid, status')
              .eq('project_id', project.id)
            outstandingAmount = (invoicesData || [])
              .filter((inv: any) => ['sent', 'viewed', 'overdue'].includes(inv.status))
              .reduce((sum: number, inv: any) => sum + ((inv.total || inv.amount || 0) - (inv.amount_paid || 0)), 0)
          } catch {}

          const calculatedProgress = project.progress || (totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0)

          return {
            ...project,
            client_name: clientName,
            client_company: clientCompany,
            completed_milestones: completedMilestones,
            total_milestones: totalMilestones,
            progress: calculatedProgress,
            outstanding_amount: outstandingAmount,
          }
        })
      )

      setProjects(projectsWithDetails)
      calculateStats(projectsWithDetails)
      setLoading(false)
    } catch (err) {
      console.error('Fetch projects error:', err)
      setLoading(false)
    }
  }, [])

  function calculateStats(projects: Project[]) {
    const total = projects.length
    const active = projects.filter(p => ['in_progress', 'development', 'active'].includes(p.status)).length
    const completed = projects.filter(p => p.status === 'completed').length
    const atRisk = projects.filter(p => ['blocked', 'on_hold'].includes(p.status)).length
    const awaitingClient = projects.filter(p => ['awaiting_client', 'client_approval'].includes(p.status)).length

    setStats({ total, active, completed, atRisk, awaitingClient })
  }

  function applyFilters() {
    let filtered = [...projects]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.name?.toLowerCase().includes(term) ||
          project.client_name?.toLowerCase().includes(term) ||
          project.client_company?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(p => ['in_progress', 'development', 'active'].includes(p.status))
      } else if (statusFilter === 'at_risk') {
        filtered = filtered.filter(p => ['blocked', 'on_hold'].includes(p.status))
      } else {
        filtered = filtered.filter(p => p.status === statusFilter)
      }
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === priorityFilter)
    }

    setFilteredProjects(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedProjects(filteredProjects.slice(start, end))
  }

  async function handleCreateProject() {
    if (!formName.trim() || !formClientId) {
      alert('Please enter project name and select a client')
      return
    }

    setSaving(true)
    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: formName,
          client_id: formClientId,
          description: formDescription || null,
          status: formStatus,
          priority: formPriority,
          progress: parseInt(formProgress) || 0,
          expected_completion_date: formDeadline || null,
          start_date: formStartDate || null,
          budget: formBudget ? parseFloat(formBudget) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        alert('Failed to create project: ' + error.message)
        setSaving(false)
        return
      }

      try {
        await supabase.from('audit_logs').insert({
          user_id: formClientId,
          action_type: 'project_created',
          description: `Project "${formName}" created`,
          entity_type: 'project',
          entity_id: String(newProject.id),
          result: 'success',
          created_at: new Date().toISOString(),
        })
      } catch (e) {}

      setShowCreateModal(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Create project error:', err)
      alert('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditProject() {
    if (!selectedProject || !formName.trim()) return

    setSaving(true)
    try {
      await supabase
        .from('projects')
        .update({
          name: formName,
          client_id: formClientId,
          description: formDescription || null,
          status: formStatus,
          priority: formPriority,
          expected_completion_date: formDeadline || null,
          budget: formBudget ? parseFloat(formBudget) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProject.id)

      await supabase.from('audit_logs').insert({
        user_id: formClientId,
        action_type: 'project_updated',
        description: `Project "${formName}" updated`,
        entity_type: 'project',
        entity_id: String(selectedProject.id),
        result: 'success',
        created_at: new Date().toISOString(),
      })

      setShowEditModal(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Edit project error:', err)
      alert('Failed to edit project')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!selectedProject || !formStatus) return

    setSaving(true)
    try {
      await supabase
        .from('projects')
        .update({ status: formStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedProject.id)

      await supabase.from('audit_logs').insert({
        user_id: selectedProject.client_id,
        action_type: 'project_status_changed',
        description: `Project status changed to ${formStatus}`,
        entity_type: 'project',
        entity_id: String(selectedProject.id),
        result: 'success',
        created_at: new Date().toISOString(),
      })

      setShowStatusModal(false)
      fetchData()
    } catch (err) {
      console.error('Status change error:', err)
      alert('Failed to change status')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (!selectedProject) return

    setSaving(true)
    try {
      await supabase
        .from('projects')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', selectedProject.id)

      setShowDeleteModal(false)
      fetchData()
    } catch (err) {
      console.error('Delete project error:', err)
      alert('Failed to archive project')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setFormName('')
    setFormClientId('')
    setFormDescription('')
    setFormStatus('planning')
    setFormPriority('medium')
    setFormStartDate('')
    setFormDeadline('')
    setFormBudget('')
    setFormProgress('0')
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      awaiting_client: 'bg-amber-500/20 text-amber-300',
      planning: 'bg-blue-500/20 text-blue-300',
      in_progress: 'bg-green-500/20 text-green-300',
      active: 'bg-green-500/20 text-green-300',
      development: 'bg-green-500/20 text-green-300',
      in_review: 'bg-purple-500/20 text-purple-300',
      client_approval: 'bg-cyan-500/20 text-cyan-300',
      revision: 'bg-orange-500/20 text-orange-300',
      on_hold: 'bg-yellow-500/20 text-yellow-300',
      blocked: 'bg-red-500/20 text-red-300',
      completed: 'bg-emerald-500/20 text-emerald-300',
      cancelled: 'bg-gray-500/20 text-gray-400',
      archived: 'bg-gray-500/20 text-gray-400',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function getPriorityColor(priority: string) {
    const map: Record<string, string> = {
      high: 'bg-red-500/20 text-red-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      low: 'bg-green-500/20 text-green-300',
    }
    return map[priority?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">{filteredProjects.length} total projects</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">At Risk</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.atRisk}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Awaiting Client</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.awaitingClient}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project, client, or company..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="active" className="bg-gray-900">Active</option>
          <option value="awaiting_client" className="bg-gray-900">Awaiting Client</option>
          <option value="planning" className="bg-gray-900">Planning</option>
          <option value="in_review" className="bg-gray-900">In Review</option>
          <option value="client_approval" className="bg-gray-900">Client Approval</option>
          <option value="completed" className="bg-gray-900">Completed</option>
          <option value="at_risk" className="bg-gray-900">At Risk</option>
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
      </div>

      {/* Projects Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Priority</th>
              <th className="py-3 px-4 font-medium">Progress</th>
              <th className="py-3 px-4 font-medium">Milestones</th>
              <th className="py-3 px-4 font-medium">Outstanding</th>
              <th className="py-3 px-4 font-medium">Deadline</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">No projects found</td>
              </tr>
            ) : (
              paginatedProjects.map((project) => (
                <tr key={project.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <Link href={`/admin/projects/${project.id}`} className="text-white font-medium hover:text-blue-400">
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{project.client_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(project.priority || 'medium')}`}>{project.priority || 'medium'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(project.progress || 0, 100)}%` }} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-xs">{project.completed_milestones || 0} / {project.total_milestones || 0}</td>
                  <td className="py-3 px-4 text-amber-400">{formatCurrency(project.outstanding_amount || 0)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(project.expected_completion_date || '')}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/projects/${project.id}`} className="text-blue-400 hover:text-blue-300 text-xs">View</Link>
                      <button
                        onClick={() => {
                          setSelectedProject(project)
                          setFormName(project.name)
                          setFormClientId(project.client_id || '')
                          setFormDescription(project.description || '')
                          setFormStatus(project.status)
                          setFormPriority(project.priority || 'medium')
                          setFormDeadline(project.expected_completion_date || '')
                          setFormBudget(project.budget?.toString() || '')
                          setShowEditModal(true)
                        }}
                        className="text-green-400 hover:text-green-300 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setSelectedProject(project); setFormStatus(project.status); setShowStatusModal(true); }}
                        className="text-purple-400 hover:text-purple-300 text-xs"
                      >
                        Status
                      </button>
                      <button
                        onClick={() => { setSelectedProject(project); setShowDeleteModal(true); }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Archive
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
          <div className="text-sm text-gray-400">Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20">Next</button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Create Project</h2><button onClick={() => setShowCreateModal(false)} className="text-white">X</button></div>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-300 mb-1">Project Name *</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Client *</label><select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="" className="bg-gray-900">Select client...</option>{clients.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.full_name} ({c.company})</option>)}</select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">{PROJECT_STATUSES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}</select></div>
                <div><label className="block text-sm text-gray-300 mb-1">Priority</label><select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="low" className="bg-gray-900">Low</option><option value="medium" className="bg-gray-900">Medium</option><option value="high" className="bg-gray-900">High</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Start Date</label><input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Deadline</label><input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Budget</label><input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Initial Progress</label><input type="number" value={formProgress} onChange={(e) => setFormProgress(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              </div>
              <button onClick={handleCreateProject} disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Creating...' : 'Create Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Edit Project</h2><button onClick={() => setShowEditModal(false)} className="text-white">X</button></div>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-300 mb-1">Project Name *</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Client *</label><select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">{clients.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.full_name} ({c.company})</option>)}</select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">{PROJECT_STATUSES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}</select></div>
                <div><label className="block text-sm text-gray-300 mb-1">Priority</label><select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="low" className="bg-gray-900">Low</option><option value="medium" className="bg-gray-900">Medium</option><option value="high" className="bg-gray-900">High</option></select></div>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Deadline</label><input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Budget</label><input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleEditProject} disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Change Status</h2><button onClick={() => setShowStatusModal(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">{PROJECT_STATUSES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}</select>
              <button onClick={handleStatusChange} disabled={saving} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Updating...' : 'Update Status'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Archive Project</h2><button onClick={() => setShowDeleteModal(false)} className="text-white">X</button></div>
            <p className="text-gray-400 text-sm mb-4">Archive "{selectedProject.name}"? This will hide it from the client.</p>
            <button onClick={handleDeleteProject} disabled={saving} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Archiving...' : 'Archive Project'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
