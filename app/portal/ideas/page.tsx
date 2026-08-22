'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Idea {
  id: string
  client_id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  project_id: string | null
  problem_statement: string | null
  proposed_solution: string | null
  business_impact: string | null
  business_impact_score: number | null
  created_at: string
  updated_at: string
  comment_count?: number
  attachment_count?: number
}

interface Project {
  id: string
  name: string
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: ideasData, error: ideasError } = await supabase
        .from('ideas')
        .select('*')
        .eq('client_id', user.id)
        .eq('deleted', false)
        .order('updated_at', { ascending: false })

      if (ideasError) {
        console.error('Ideas fetch error:', ideasError)
        setLoading(false)
        return
      }

      // Fetch comment counts
      const ideasWithCounts = await Promise.all(
        (ideasData || []).map(async (idea) => {
          const { count: commentCount } = await supabase
            .from('idea_comments')
            .select('*', { count: 'exact', head: true })
            .eq('idea_id', idea.id)

          const { count: attachmentCount } = await supabase
            .from('idea_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('idea_id', idea.id)

          return {
            ...idea,
            comment_count: commentCount || 0,
            attachment_count: attachmentCount || 0,
          }
        })
      )

      setIdeas(ideasWithCounts)

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = ideas.length
    const underReview = ideas.filter((i) => i.status === 'under_review').length
    const inProgress = ideas.filter((i) => ['planned', 'in_development'].includes(i.status)).length
    const completed = ideas.filter((i) => i.status === 'completed').length
    return { total, underReview, inProgress, completed }
  }, [ideas])

  const filteredIdeas = useMemo(() => {
    let filtered = ideas

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(term) ||
          (i.description && i.description.toLowerCase().includes(term))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((i) => i.category === categoryFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((i) => i.priority === priorityFilter)
    }

    return filtered
  }, [ideas, searchTerm, statusFilter, categoryFilter, priorityFilter])

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', dot: '⚪' },
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      needs_information: { label: 'Needs Information', color: 'bg-orange-100 text-orange-800', dot: '🟠' },
      validated: { label: 'Validated', color: 'bg-green-100 text-green-800', dot: '🟢' },
      prioritized: { label: 'Prioritized', color: 'bg-purple-100 text-purple-800', dot: '🟣' },
      planned: { label: 'Planned', color: 'bg-indigo-100 text-indigo-800', dot: '🔷' },
      in_development: { label: 'In Development', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', dot: '✅' },
      declined: { label: 'Declined', color: 'bg-red-100 text-red-800', dot: '🔴' },
      archived: { label: 'Archived', color: 'bg-gray-100 text-gray-600', dot: '⚫' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '⚪' }
  }

  function getPriorityDisplay(priority: string) {
    const priorityMap: Record<string, { label: string; color: string }> = {
      low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
      medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'High', color: 'bg-amber-100 text-amber-800' },
      critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
    }
    return priorityMap[priority] || { label: priority, color: 'bg-gray-100 text-gray-600' }
  }

  function getProjectName(projectId: string | null) {
    if (!projectId) return '—'
    return projects.find((p) => p.id === projectId)?.name || '—'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Ideas</h1>
            <p className="text-gray-600 mt-2">
              Submit product ideas, feature requests, and improvements.
            </p>
          </div>
          <Link
            href="/portal/ideas/new"
            className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            + Submit an Idea
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Total Ideas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Under Review</p>
            <p className="text-2xl font-bold text-amber-600">{stats.underReview}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ideas..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="needs_information">Needs Information</option>
            <option value="validated">Validated</option>
            <option value="planned">Planned</option>
            <option value="in_development">In Development</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white"
          >
            <option value="all">All Categories</option>
            <option value="new_feature">New Feature</option>
            <option value="improvement">Improvement</option>
            <option value="bug">Bug / Problem</option>
            <option value="automation">Automation</option>
            <option value="integration">Integration</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="ui_ux">UI/UX</option>
            <option value="business_process">Business Process</option>
            <option value="new_product">New Product</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Ideas List */}
        {filteredIdeas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No ideas found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Submit your first idea to get started.'}
            </p>
            {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
              <Link
                href="/portal/ideas/new"
                className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Submit an Idea
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIdeas.map((idea) => {
              const statusInfo = getStatusDisplay(idea.status)
              const priorityInfo = getPriorityDisplay(idea.priority)
              return (
                <Link
                  key={idea.id}
                  href={`/portal/ideas/${idea.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{idea.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                          {statusInfo.dot} {statusInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </div>

                      {idea.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{idea.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500">
                        <span>Category: {idea.category.replace(/_/g, ' ')}</span>
                        <span>Project: {getProjectName(idea.project_id)}</span>
                        <span>💬 {idea.comment_count || 0} comments</span>
                        <span>📎 {idea.attachment_count || 0} attachments</span>
                        <span>
                          Updated {new Date(idea.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span className="text-gray-400">View →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}