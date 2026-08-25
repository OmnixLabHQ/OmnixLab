'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  client_id: string
  description: string
  status: string
  start_date: string
  end_date: string
  created_at: string
  client_name: string
  progress: number
  health: 'green' | 'yellow' | 'red'
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [newProject, setNewProject] = useState({
    client_id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, healthFilter, projects])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch clients for dropdown
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name, company')
        .order('created_at', { ascending: false })
      setClients(clientsData || [])

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch milestones for progress
      const projectIds = projectsData?.map(p => p.id) || []
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('project_id, status, deadline')
        .in('project_id', projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000'])

      // Fetch client names
      const clientMap = new Map<string, string>()
      clientsData?.forEach(c => {
        clientMap.set(c.id, c.full_name || c.company || 'Unknown')
      })

      const projectsWithStats = (projectsData || []).map(project => {
        const projectMilestones = (milestonesData || []).filter(m => m.project_id === project.id)
        const totalMilestones = projectMilestones.length
        const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length
        const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

        // Health calculation
        let health: 'green' | 'yellow' | 'red' = 'green'
        const overdueMilestones = projectMilestones.filter(m => {
          return m.deadline && new Date(m.deadline) < new Date() && m.status !== 'completed'
        })
        const blockedMilestones = projectMilestones.filter(m => m.status === 'blocked')

        if (blockedMilestones.length > 0) {
          health = 'red'
        } else if (overdueMilestones.length > 0) {
          health = 'yellow'
        }

        return {
          ...project,
          client_name: clientMap.get(project.client_id) || 'Unknown',
          progress,
          health,
        }
      })

      setProjects(projectsWithStats)
      setLoading(false)
    } catch (error) {
      console.error('Fetch projects error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...projects]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.client_name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    if (healthFilter !== 'all') {
      filtered = filtered.filter((p) => p.health === healthFilter)
    }

    setFilteredProjects(filtered)
  }

  async function handleCreateProject() {
    if (!newProject.name || !newProject.client_id) {
      alert('Project name and client are required')
      return
    }

    await supabase.from('projects').insert({
      client_id: newProject.client_id,
      name: newProject.name,
      description: newProject.description,
      status: 'planning',
      start_date: newProject.start_date || null,
      end_date: newProject.end_date || null,
    })

    // Create activity log
    await supabase.from('activity_logs').insert({
      client_id: newProject.client_id,
      type: 'project',
      title: 'Project Created',
      description: newProject.name,
    })

    // Notify client
    await supabase.from('notifications').insert({
      client_id: newProject.client_id,
      type: 'project',
      title: 'New Project Created',
      message: `Your project "${newProject.name}" has been created.`,
    })

    setShowCreateModal(false)
    setNewProject({ client_id: '', name: '', description: '', start_date: '', end_date: '', budget: '' })
    fetchData()
  }

  function getStatusDisplay(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      inquiry: { label: 'Inquiry', color: 'bg-gray-500/20 text-gray-300' },
      planning: { label: 'Planning', color: 'bg-cyan-500/20 text-cyan-300' },
      awaiting_requirements: { label: 'Awaiting Requirements', color: 'bg-orange-500/20 text-orange-300' },
      active: { label: 'Active', color: 'bg-blue-500/20 text-blue-300' },
      review: { label: 'Review', color: 'bg-purple-500/20 text-purple-300' },
      client_approval: { label: 'Client Approval', color: 'bg-yellow-500/20 text-yellow-300' },
      completed: { label: 'Completed', color: 'bg-green-500/20 text-green-300' },
      maintenance: { label: 'Maintenance', color: 'bg-teal-500/20 text-teal-300' },
      paused: { label: 'Paused', color: 'bg-red-500/20 text-red-300' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
    }
    return map[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-500/20 text-gray-300' }
  }

  function getHealthColor(health: string) {
    const colors: Record<string, string> = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    }
    return colors[health] || 'bg-gray-500'
  }

  function getHealthLabel(health: string) {
    const labels: Record<string, string> = {
      green: 'On Track',
      yellow: 'Needs Attention',
      red: 'Critical',
    }
    return labels[health] || 'Unknown'
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
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Project
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project name, client, or description..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="inquiry" className="bg-gray-900">Inquiry</option>
          <option value="planning" className="bg-gray-900">Planning</option>
          <option value="awaiting_requirements" className="bg-gray-900">Awaiting Requirements</option>
          <option value="active" className="bg-gray-900">Active</option>
          <option value="review" className="bg-gray-900">Review</option>
          <option value="client_approval" className="bg-gray-900">Client Approval</option>
          <option value="completed" className="bg-gray-900">Completed</option>
          <option value="maintenance" className="bg-gray-900">Maintenance</option>
          <option value="paused" className="bg-gray-900">Paused</option>
          <option value="cancelled" className="bg-gray-900">Cancelled</option>
        </select>
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Health</option>
          <option value="green" className="bg-gray-900">On Track</option>
          <option value="yellow" className="bg-gray-900">Needs Attention</option>
          <option value="red" className="bg-gray-900">Critical</option>
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
              <th className="py-3 px-4 font-medium">Progress</th>
              <th className="py-3 px-4 font-medium">Health</th>
              <th className="py-3 px-4 font-medium">Start Date</th>
              <th className="py-3 px-4 font-medium">End Date</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">No projects found</td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const statusInfo = getStatusDisplay(project.status)
                return (
                  <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/admin/projects/${project.id}`} className="text-white hover:text-blue-400 font-medium">
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{project.client_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getHealthColor(project.health)}`}></span>
                        <span className="text-xs text-gray-300">{getHealthLabel(project.health)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Create Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Client *</label>
                <select
                  value={newProject.client_id}
                  onChange={(e) => setNewProject({ ...newProject, client_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                >
                  <option value="" className="bg-gray-900">Select client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-gray-900">
                      {client.full_name} ({client.company})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateProject}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}