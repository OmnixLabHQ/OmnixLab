'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface ProjectRequest {
  id: number
  client_id: string
  request_number: string
  project_name: string
  project_type: string
  description: string
  objective: string
  company: string
  website: string
  industry: string
  country: string
  timezone: string
  budget_range: string
  timeline: string
  preferred_start_date: string | null
  target_launch_date: string | null
  priority: string
  status: string
  created_at: string
  submitted_at: string | null
  reviewed_at: string | null
}

export default function ClientProjectRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    qualified: 0,
    converted: 0,
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('project_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError

      setRequests(requestsData || [])
      calculateStats(requestsData || [])
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch requests error:', err)
      setError(err?.message || 'Failed to load requests')
      setLoading(false)
    }
  }, [router])

  function calculateStats(requests: ProjectRequest[]) {
    const total = requests.length
    const underReview = requests.filter(r => ['submitted', 'under_review', 'needs_information'].includes(r.status)).length
    const qualified = requests.filter(r => ['qualified', 'proposal_sent', 'approved'].includes(r.status)).length
    const converted = requests.filter(r => r.status === 'converted').length
    setStats({ total, underReview, qualified, converted })
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-amber-100 text-amber-800',
      needs_information: 'bg-orange-100 text-orange-800',
      qualified: 'bg-cyan-100 text-cyan-800',
      proposal_sent: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-gray-100 text-gray-600',
    }
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') {
      return ['submitted', 'under_review', 'needs_information', 'qualified', 'proposal_sent', 'approved'].includes(request.status)
    }
    if (statusFilter === 'converted') {
      return request.status === 'converted'
    }
    if (statusFilter === 'rejected') {
      return request.status === 'rejected'
    }
    return request.status === statusFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
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
          <button onClick={fetchRequests} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/portal/dashboard" className="text-gray-600 hover:text-gray-900 text-sm mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Requests</h1>
            <p className="text-sm text-gray-600 mt-1">Track the status of your project submissions</p>
          </div>
          <Link href="/portal/start-project" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center">
            + New Request
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">In Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.underReview}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Qualified</p>
            <p className="text-2xl font-bold text-cyan-600 mt-1">{stats.qualified}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Converted</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.converted}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'qualified', label: 'Qualified' },
            { id: 'converted', label: 'Converted' },
            { id: 'rejected', label: 'Rejected' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                statusFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">[ ]</div>
            <p className="text-gray-600 mb-4">No project requests found</p>
            <Link href="/portal/start-project" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl">
              Start a Project
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Link
                key={request.id}
                href={`/portal/project-requests/${request.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{request.project_name}</h3>
                    <p className="text-xs text-gray-500">{request.request_number}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{request.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  {request.project_type && <span>Type: {request.project_type}</span>}
                  {request.budget_range && <span>Budget: {request.budget_range}</span>}
                  {request.timeline && <span>Timeline: {request.timeline}</span>}
                  <span>Submitted: {formatDate(request.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}