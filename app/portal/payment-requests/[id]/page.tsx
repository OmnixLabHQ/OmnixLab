'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  existing_system: boolean
  existing_system_details: string
  budget_range: string
  timeline: string
  preferred_start_date: string | null
  target_launch_date: string | null
  priority: string
  status: string
  created_at: string
  submitted_at: string | null
  reviewed_at: string | null
  converted_project_id: number | null
}

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Request submitted' },
  { key: 'under_review', label: 'Under review' },
  { key: 'needs_information', label: 'Information requested' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal_sent', label: 'Proposal sent' },
  { key: 'approved', label: 'Approved' },
  { key: 'converted', label: 'Project created' },
]

export default function ClientProjectRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params?.id as string

  const [request, setRequest] = useState<ProjectRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (requestId) fetchRequest()
  }, [requestId])

  const fetchRequest = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data, error } = await supabase
        .from('project_requests')
        .select('*')
        .eq('id', Number(requestId))
        .eq('client_id', user.id)
        .single()

      if (error || !data) {
        setError('Request not found')
        setLoading(false)
        return
      }

      setRequest(data)
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch request error:', err)
      setError(err?.message || 'Failed to load request')
      setLoading(false)
    }
  }, [requestId, router])

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

  function getTimelineStatus(stepKey: string) {
    const statusOrder = ['submitted', 'under_review', 'needs_information', 'qualified', 'proposal_sent', 'approved', 'converted']
    const currentIndex = statusOrder.indexOf(request?.status || '')
    const stepIndex = statusOrder.indexOf(stepKey)

    if (stepIndex <= currentIndex) return 'completed'
    if (stepIndex === currentIndex + 1) return 'current'
    return 'upcoming'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Request not found'}</p>
          <Link href="/portal/project-requests" className="text-blue-600 hover:underline">Back to Requests</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/project-requests" className="text-gray-600 hover:text-gray-900 text-sm mb-6 inline-block">
          ← Back to Requests
        </Link>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{request.project_name}</h1>
              <p className="text-sm text-gray-500 mt-1">{request.request_number}</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-4">Submitted: {formatDate(request.created_at)}</p>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Request Timeline</h3>
          <div className="space-y-3">
            {TIMELINE_STEPS.map((step, index) => {
              const timelineStatus = getTimelineStatus(step.key)
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    timelineStatus === 'completed' ? 'bg-green-500 text-white' :
                    timelineStatus === 'current' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {timelineStatus === 'completed' ? '✓' : index + 1}
                  </div>
                  <span className={`text-sm ${
                    timelineStatus === 'completed' ? 'text-green-600 font-medium' :
                    timelineStatus === 'current' ? 'text-blue-600 font-medium' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-line">{request.description}</p>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Project Type</p><p className="text-gray-900 font-medium">{request.project_type || '—'}</p></div>
            <div><p className="text-gray-500">Company</p><p className="text-gray-900 font-medium">{request.company || '—'}</p></div>
            <div><p className="text-gray-500">Budget Range</p><p className="text-gray-900 font-medium">{request.budget_range || '—'}</p></div>
            <div><p className="text-gray-500">Timeline</p><p className="text-gray-900 font-medium">{request.timeline || '—'}</p></div>
            <div><p className="text-gray-500">Priority</p><p className="text-gray-900 font-medium">{request.priority || '—'}</p></div>
            <div><p className="text-gray-500">Website</p><p className="text-gray-900 font-medium">{request.website || '—'}</p></div>
            {request.preferred_start_date && (
              <div><p className="text-gray-500">Preferred Start</p><p className="text-gray-900 font-medium">{formatDate(request.preferred_start_date)}</p></div>
            )}
            {request.target_launch_date && (
              <div><p className="text-gray-500">Target Launch</p><p className="text-gray-900 font-medium">{formatDate(request.target_launch_date)}</p></div>
            )}
          </div>
        </div>

        {/* Converted Project Link */}
        {request.status === 'converted' && request.converted_project_id && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-6 text-center">
            <Link href={`/portal/projects/${request.converted_project_id}`} className="text-emerald-700 font-medium hover:underline">
              View Your Project →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
