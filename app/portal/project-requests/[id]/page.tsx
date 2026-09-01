'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ClientProjectRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params?.id as string

  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (requestId) fetchRequest()
  }, [requestId])

  const fetchRequest = async () => {
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
        console.error('Request not found')
        setLoading(false)
        return
      }

      setRequest(data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch error:', err)
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-amber-100 text-amber-800',
      needs_information: 'bg-orange-100 text-orange-800',
      qualified: 'bg-cyan-100 text-cyan-800',
      proposal_sent: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-emerald-100 text-emerald-800',
    }
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Request not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/portal/project-requests" className="text-gray-600 hover:text-gray-900 text-sm mb-6 inline-block">
          ← Back to Requests
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{request.project_name}</h1>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">{request.request_number}</p>
          <p className="text-gray-700 whitespace-pre-line">{request.description}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Type</p><p className="text-gray-900 font-medium">{request.project_type || '—'}</p></div>
            <div><p className="text-gray-500">Budget</p><p className="text-gray-900 font-medium">{request.budget_range || '—'}</p></div>
            <div><p className="text-gray-500">Timeline</p><p className="text-gray-900 font-medium">{request.timeline || '—'}</p></div>
            <div><p className="text-gray-500">Submitted</p><p className="text-gray-900 font-medium">{formatDate(request.created_at)}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
