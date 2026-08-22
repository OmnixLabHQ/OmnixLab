'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  created_at: string
}

interface ProjectWithProgress extends Project {
  progress: number
  totalTasks: number
  completedTasks: number
  lastActivity?: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Stats
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    awaitingAction: 0,
    outstanding: 0,
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch projects for this client
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (projectsError) {
        console.error('Failed to fetch projects:', projectsError)
        setLoading(false)
        return
      }

      if (!projectsData || projectsData.length === 0) {
        setProjects([])
        setStats({ active: 0, completed: 0, awaitingAction: 0, outstanding: 0 })
        setLoading(false)
        return
      }

      // Fetch all tasks for these projects to compute progress
      const projectIds = projectsData.map((p) => p.id)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds)

      if (tasksError) {
        console.error('Failed to fetch tasks:', tasksError)
        // Continue without task progress
      }

      // Compute progress and stats
      const projectsWithProgress: ProjectWithProgress[] = projectsData.map((project) => {
        const projectTasks = tasksData?.filter((t) => t.project_id === project.id) || []
        const totalTasks = projectTasks.length
        const completedTasks = projectTasks.filter((t) => t.completed_by !== null).length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return {
          ...project,
          progress,
          totalTasks,
          completedTasks,
          lastActivity: project.created_at, // fallback, can be updated later
        }
      })

      // Compute stats
      const activeCount = projectsWithProgress.filter(
        (p) => !['completed', 'cancelled'].includes(p.status)
      ).length
      const completedCount = projectsWithProgress.filter(
        (p) => p.status === 'completed'
      ).length

      // Fetch outstanding invoices for this client to calculate outstanding amount
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('amount')
        .eq('client_id', user.id)
        .in('status', ['sent', 'overdue', 'unpaid'])

      const outstanding =
        invoicesData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      setProjects(projectsWithProgress)
      setStats({
        active: activeCount,
        completed: completedCount,
        awaitingAction: 0, // we'll compute later if needed
        outstanding,
      })
      setLoading(false)
    } catch (error) {
      console.error('Projects fetch error:', error)
      setLoading(false)
    }
  }

  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((p) => !['completed', 'cancelled'].includes(p.status))
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter((p) => p.status === 'completed')
      } else if (statusFilter === 'in_progress') {
        filtered = filtered.filter((p) => p.status === 'in_progress')
      } else if (statusFilter === 'paused') {
        filtered = filtered.filter((p) => p.status === 'paused' || p.status === 'on_hold')
      }
    }

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      )
    }

    return filtered
  }, [projects, searchTerm, statusFilter])

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      in_progress: { label: 'In Development', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', dot: '🟢' },
      on_hold: { label: 'On Hold', color: 'bg-red-100 text-red-800', dot: '🔴' },
      paused: { label: 'Paused', color: 'bg-red-100 text-red-800', dot: '🔴' },
      review: { label: 'Client Review', color: 'bg-purple-100 text-purple-800', dot: '🟣' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', dot: '⚪' },
      lead: { label: 'Lead', color: 'bg-gray-100 text-gray-600', dot: '⚪' },
      proposal: { label: 'Proposal', color: 'bg-indigo-100 text-indigo-800', dot: '🔷' },
      awaiting_deposit: { label: 'Awaiting Deposit', color: 'bg-orange-100 text-orange-800', dot: '🟠' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '⚪' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">
              Manage your active projects, track progress, review milestones, and collaborate with the Omnix Lab team.
            </p>
          </div>
          <Link
            href="/portal/start-project"
            className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            + Start New Project
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600">Active Projects</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.awaitingAction}</p>
                <p className="text-sm text-gray-600">Awaiting Your Action</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.outstanding.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Outstanding</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="in_progress">In Development</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Project List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Start your first project with Omnix Lab.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/portal/start-project"
                className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Start a Project
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const statusInfo = getStatusDisplay(project.status)
              return (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {project.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}
                        >
                          {statusInfo.dot} {statusInfo.label}
                        </span>
                      </div>

                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            Progress
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            {project.progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500">
                        <span>
                          Start: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                        </span>
                        <span>
                          Due: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                        </span>
                        {project.totalTasks > 0 && (
                          <span>
                            Tasks: {project.completedTasks}/{project.totalTasks}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Link
                        href={`/portal/projects/${project.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Open Project →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}