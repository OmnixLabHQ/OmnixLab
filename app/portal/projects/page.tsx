'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Project {
  id: number
  client_id: string
  name: string
  status: string
  progress: number
  expected_completion_date: string | null
  created_at: string
  description?: string
  completed_milestones?: number
  total_milestones?: number
}

interface Milestone {
  id: number
  project_id: number
  name: string
  status: string
  due_date: string | null
  created_at: string
}

interface Task {
  id: number
  project_id: number
  title: string
  status: string
  due_date: string | null
  created_at: string
}

interface Requirement {
  id: number
  project_id: number
  title: string
  status: string
  created_at: string
}

interface ProjectFile {
  id: number
  project_id: number
  file_name: string
  file_type: string
  created_at: string
}

interface Deliverable {
  id: number
  project_id: number
  title: string
  status: string
  created_at: string
}

interface Idea {
  id: number
  project_id: number
  title: string
  status: string
  created_at: string
}

interface Invoice {
  id: number
  project_id: number
  invoice_number: string
  total: number
  amount: number
  status: string
  due_date: string | null
  created_at: string
}

interface Payment {
  id: number
  invoice_id: number
  amount: number
  status: string
  created_at: string
}

interface Activity {
  id: string
  description: string
  created_at: string
}

export default function ClientProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, awaitingClient: 0 })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (projectsError) {
        setError('Failed to load projects')
        setLoading(false)
        return
      }

      const projectsWithProgress = await Promise.all(
        (projectsData || []).map(async (project) => {
          let completedMilestones = 0
          let totalMilestones = 0
          try {
            const { data: milestonesData } = await supabase.from('milestones').select('status').eq('project_id', project.id)
            totalMilestones = milestonesData?.length || 0
            completedMilestones = (milestonesData || []).filter(m => m.status === 'completed').length
          } catch {}
          return { ...project, completed_milestones: completedMilestones, total_milestones: totalMilestones, progress: project.progress || (totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0) }
        })
      )

      setProjects(projectsWithProgress)
      calculateStats(projectsWithProgress)
      setLoading(false)
    } catch (err) {
      console.error('Fetch projects error:', err)
      setError('Failed to load projects')
      setLoading(false)
    }
  }, [router])

  function calculateStats(projects: Project[]) {
    const total = projects.length
    const active = projects.filter(p => ['active', 'in_progress', 'development'].includes(p.status)).length
    const completed = projects.filter(p => p.status === 'completed').length
    const awaitingClient = projects.filter(p => ['awaiting_client', 'client_approval'].includes(p.status)).length
    setStats({ total, active, completed, awaitingClient })
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      in_progress: 'bg-green-100 text-green-800',
      development: 'bg-green-100 text-green-800',
      review: 'bg-purple-100 text-purple-800',
      client_approval: 'bg-amber-100 text-amber-800',
      awaiting_client: 'bg-amber-100 text-amber-800',
      completed: 'bg-emerald-100 text-emerald-800',
      paused: 'bg-gray-100 text-gray-600',
      on_hold: 'bg-amber-100 text-amber-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredProjects = projects.filter(project => {
    if (searchTerm.trim() && !project.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (statusFilter === 'active') return ['active', 'in_progress', 'development'].includes(project.status)
    if (statusFilter === 'awaiting_client') return ['awaiting_client', 'client_approval'].includes(project.status)
    if (statusFilter !== 'all') return project.status === statusFilter
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>)}</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchProjects} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-600 mt-1">Your Omnix Lab projects</p>
          </div>
          <Link href="/portal/start-project" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center">
            + Start New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-600">Total Projects</p><p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p></div>
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p></div>
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-600">Completed</p><p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p></div>
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-600">Awaiting You</p><p className="text-2xl font-bold text-amber-600 mt-1">{stats.awaitingClient}</p></div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search projects..." className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-lg text-sm placeholder-gray-400 focus:border-blue-500 outline-none" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-lg text-sm focus:border-blue-500 outline-none">
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="awaiting_client">Awaiting You</option>
            <option value="completed">Completed</option>
            <option value="planning">Planning</option>
            <option value="review">In Review</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">[ ]</div>
            <p className="text-gray-600 mb-4">No projects found</p>
            <Link href="/portal/start-project" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl">Start a Project</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/portal/projects/${project.id}`} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{project.progress || 0}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.min(project.progress || 0, 100)}%` }} /></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{project.completed_milestones || 0} / {project.total_milestones || 0} milestones</span>
                  {project.expected_completion_date && <span>Due: {formatDate(project.expected_completion_date)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}