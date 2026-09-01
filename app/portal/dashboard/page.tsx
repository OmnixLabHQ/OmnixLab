'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface DashboardData {
  profile: {
    name: string
    company: string
    email: string
  }
  attention: {
    type: string
    title: string
    link: string
    severity: string
  }[]
  financial: {
    outstanding: number
    paid: number
    pending: number
    overdue: number
    outstandingCount: number
    paidCount: number
    pendingCount: number
    overdueCount: number
  }
  projects: {
    id: number
    name: string
    status: string
    progress: number
    due_date: string
  }[]
  recentActivity: {
    id: string
    description: string
    action_type: string
    created_at: string
  }[]
  messages: {
    id: string
    content: string
    sender_name: string
    created_at: string
  }[]
  recentFiles: {
    id: string
    file_name: string
    file_type: string
    created_at: string
  }[]
  recentIdeas: {
    id: string
    title: string
    status: string
    created_at: string
  }[]
  notifications: any[]
  nextAction: {
    title: string
    link: string | null
  }
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
    
    fetchDashboard()
  }, [])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        router.push('/portal/login')
        return
      }

      const response = await fetch('/api/portal/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (result.success && result.dashboard) {
        setDashboard(result.dashboard)
      } else {
        setError(result.error || 'Failed to load dashboard')
      }
      setLoading(false)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Failed to load dashboard')
      setLoading(false)
    }
  }, [router])

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatRelativeTime(date: string) {
    if (!date) return '—'
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

  function getSeverityColor(severity: string) {
    const map: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-amber-100 text-amber-800 border-amber-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    return map[severity] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  function getProjectStatusColor(status: string) {
    const map: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      development: 'bg-green-100 text-green-800',
      in_progress: 'bg-green-100 text-green-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-emerald-100 text-emerald-800',
      paused: 'bg-gray-100 text-gray-600',
    }
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No dashboard data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {greeting}, {dashboard.profile.name?.split(' ')[0] || 'there'}.
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back to your Omnix Lab workspace. Here's what's happening with your projects.
          </p>
        </div>

        {/* Attention Center */}
        {dashboard.attention.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Attention Required</h2>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {dashboard.attention.length} item{dashboard.attention.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {dashboard.attention.map((item, index) => (
                <Link
                  key={index}
                  href={item.link}
                  className={`block p-3 rounded-lg border ${getSeverityColor(item.severity)}`}
                >
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/portal/invoices" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(dashboard.financial.outstanding)}</p>
            <p className="text-xs text-gray-500 mt-1">{dashboard.financial.outstandingCount} invoices</p>
          </Link>
          <Link href="/portal/payments" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(dashboard.financial.pending)}</p>
            <p className="text-xs text-gray-500 mt-1">{dashboard.financial.pendingCount} transactions</p>
          </Link>
          <Link href="/portal/payments" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(dashboard.financial.paid)}</p>
            <p className="text-xs text-gray-500 mt-1">{dashboard.financial.paidCount} invoices</p>
          </Link>
          <Link href="/portal/invoices" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(dashboard.financial.overdue)}</p>
            <p className="text-xs text-gray-500 mt-1">{dashboard.financial.overdueCount} invoices</p>
          </Link>
        </div>

        {/* Next Action */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Next Action</h2>
          {dashboard.nextAction.link ? (
            <div className="flex items-center justify-between">
              <p className="text-gray-700">{dashboard.nextAction.title}</p>
              <Link
                href={dashboard.nextAction.link}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
              >
                Go
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-gray-700">{dashboard.nextAction.title}</p>
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h2>
          {dashboard.projects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-500 mb-4">No active projects yet</p>
              <Link
                href="/portal/start-project"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
              >
                Start a Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/portal/projects/${project.id}`}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getProjectStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min(project.progress || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  {project.due_date && (
                    <p className="text-xs text-gray-500">
                      Due: {formatDate(project.due_date)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {dashboard.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {dashboard.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <Link href="/portal/messages" className="text-sm text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            {dashboard.messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No unread messages</p>
            ) : (
              <div className="space-y-3">
                {dashboard.messages.map((message) => (
                  <Link
                    key={message.id}
                    href="/portal/messages"
                    className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{message.sender_name}</p>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(message.created_at)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Files & Ideas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Files */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Files</h2>
              <Link href="/portal/files" className="text-sm text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            {dashboard.recentFiles.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No files yet</p>
            ) : (
              <div className="space-y-2">
                {dashboard.recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                      <p className="text-xs text-gray-500">{file.file_type} • {formatRelativeTime(file.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ideas */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ideas</h2>
              <Link href="/portal/ideas" className="text-sm text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            {dashboard.recentIdeas.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No ideas submitted yet</p>
            ) : (
              <div className="space-y-2">
                {dashboard.recentIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    href="/portal/ideas"
                    className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{idea.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{idea.status}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link href="/portal/start-project" className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg text-center">
              Start New Project
            </Link>
            <Link href="/portal/files" className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg text-center">
              Upload File
            </Link>
            <Link href="/portal/messages" className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg text-center">
              Send Message
            </Link>
            <Link href="/portal/ideas" className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg text-center">
              Submit Idea
            </Link>
            <Link href="/portal/invoices" className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg text-center">
              View Invoices
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
