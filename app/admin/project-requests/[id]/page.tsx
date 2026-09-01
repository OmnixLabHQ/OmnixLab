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
  client_name?: string
  client_email?: string
}

export default function AdminProjectRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params?.id as string

  const [request, setRequest] = useState<ProjectRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showRequestInfo, setShowRequestInfo] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showQualifyModal, setShowQualifyModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)

  const [infoMessage, setInfoMessage] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const fetchRequest = useCallback(async () => {
    setLoading(true)
    try {
      const { data: requestData, error } = await supabase
        .from('project_requests')
        .select('*')
        .eq('id', Number(requestId))
        .single()

      if (error || !requestData) {
        console.error('Request not found')
        setLoading(false)
        return
      }

      let clientName = 'Unknown'
      let clientEmail = ''
      if (requestData.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('full_name, email')
          .eq('id', requestData.client_id)
          .single()
        if (client) {
          clientName = client.full_name || 'Unknown'
          clientEmail = client.email || ''
        }
      }

      setRequest({ ...requestData, client_name: clientName, client_email: clientEmail })
      setLoading(false)
    } catch (err) {
      console.error('Fetch error:', err)
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    if (requestId) fetchRequest()
  }, [requestId, fetchRequest])

  const handleQualify = async () => {
    if (!request) return
    setSaving(true)
    try {
      await supabase
        .from('project_requests')
        .update({ status: 'qualified', reviewed_at: new Date().toISOString() })
        .eq('id', request.id)

      await supabase.from('notifications').insert({
        client_id: request.client_id,
        type: 'request_qualified',
        title: 'Project Request Qualified',
        message: `Your project request "${request.project_name}" has been qualified.`,
        read: false,
        created_at: new Date().toISOString(),
      })

      setShowQualifyModal(false)
      fetchRequest()
    } catch (err: any) {
      alert('Failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRequestInformation = async () => {
    if (!request || !infoMessage.trim()) return alert('Enter message')
    setSaving(true)
    try {
      await supabase
        .from('project_requests')
        .update({ status: 'needs_information', updated_at: new Date().toISOString() })
        .eq('id', request.id)

      await supabase.from('notifications').insert({
        client_id: request.client_id,
        type: 'request_information',
        title: 'Additional Information Required',
        message: infoMessage,
        read: false,
        created_at: new Date().toISOString(),
      })

      setShowRequestInfo(false)
      setInfoMessage('')
      fetchRequest()
    } catch (err: any) {
      alert('Failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!request || !rejectReason.trim()) return alert('Enter reason')
    setSaving(true)
    try {
      await supabase
        .from('project_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', request.id)

      await supabase.from('notifications').insert({
        client_id: request.client_id,
        type: 'request_rejected',
        title: 'Project Request Rejected',
        message: rejectReason,
        read: false,
        created_at: new Date().toISOString(),
      })

      setShowRejectModal(false)
      setRejectReason('')
      fetchRequest()
    } catch (err: any) {
      alert('Failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleConvertToProject = async () => {
    if (!request) return
    setSaving(true)
    try {
      const projectCode = `OMX-PROJ-${Date.now()}`
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: request.client_id,
          name: request.project_name,
          description: request.description,
          status: 'planning',
          progress: 0,
          priority: request.priority || 'normal',
          expected_completion_date: request.target_launch_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_request_id: request.id,
        })
        .select()
        .single()

      if (projectError) throw projectError

      await supabase
        .from('project_requests')
        .update({
          status: 'converted',
          converted_project_id: project.id,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      await supabase.from('notifications').insert({
        client_id: request.client_id,
        type: 'project_created',
        title: 'Project Created',
        message: `Your project "${request.project_name}" is now available in your workspace.`,
        read: false,
        created_at: new Date().toISOString(),
      })

      setShowConvertModal(false)
      fetchRequest()
    } catch (err: any) {
      alert('Failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      submitted: 'bg-blue-500/20 text-blue-300',
      under_review: 'bg-amber-500/20 text-amber-300',
      needs_information: 'bg-orange-500/20 text-orange-300',
      qualified: 'bg-cyan-500/20 text-cyan-300',
      proposal_sent: 'bg-purple-500/20 text-purple-300',
      approved: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300',
      converted: 'bg-emerald-500/20 text-emerald-300',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
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

  if (!request) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 mb-4">Request not found</p>
        <Link href="/admin/project-requests" className="text-blue-400 hover:underline">Back to Requests</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/project-requests" className="text-gray-400 hover:text-white text-sm inline-block">← Back to Requests</Link>

      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{request.project_name}</h1>
            <p className="text-sm text-gray-400 mt-1">{request.request_number} • {request.client_name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>{request.status}</span>
            <button onClick={() => setShowRequestInfo(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg">Request Info</button>
            <button onClick={() => setShowQualifyModal(true)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg">Qualify</button>
            <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">Reject</button>
            <button onClick={() => setShowConvertModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">Convert to Project</button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Information</h3>
          <div className="space-y-3 text-sm">
            <div><p className="text-gray-500">Type</p><p className="text-white">{request.project_type || '—'}</p></div>
            <div><p className="text-gray-500">Objective</p><p className="text-white">{request.objective || '—'}</p></div>
            <div><p className="text-gray-500">Description</p><p className="text-gray-300 whitespace-pre-line">{request.description}</p></div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Business & Budget</h3>
          <div className="space-y-3 text-sm">
            <div><p className="text-gray-500">Company</p><p className="text-white">{request.company || '—'}</p></div>
            <div><p className="text-gray-500">Website</p><p className="text-white">{request.website || '—'}</p></div>
            <div><p className="text-gray-500">Industry</p><p className="text-white">{request.industry || '—'}</p></div>
            <div><p className="text-gray-500">Budget</p><p className="text-white">{request.budget_range || '—'}</p></div>
            <div><p className="text-gray-500">Timeline</p><p className="text-white">{request.timeline || '—'}</p></div>
            <div><p className="text-gray-500">Priority</p><p className="text-white">{request.priority || '—'}</p></div>
            <div><p className="text-gray-500">Submitted</p><p className="text-white">{formatDate(request.created_at)}</p></div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRequestInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Request Information</h2><button onClick={() => setShowRequestInfo(false)} className="text-white">X</button></div>
            <textarea value={infoMessage} onChange={(e) => setInfoMessage(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm mb-3" placeholder="What do you need from the client?" />
            <button onClick={handleRequestInformation} disabled={saving} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Sending...' : 'Send Request'}</button>
          </div>
        </div>
      )}

      {showQualifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Qualify Request</h2><button onClick={() => setShowQualifyModal(false)} className="text-white">X</button></div>
            <p className="text-gray-400 text-sm mb-4">Confirm that this request has passed initial review.</p>
            <button onClick={handleQualify} disabled={saving} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Qualifying...' : 'Confirm Qualification'}</button>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Reject Request</h2><button onClick={() => setShowRejectModal(false)} className="text-white">X</button></div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm mb-3" placeholder="Reason for rejection..." />
            <button onClick={handleReject} disabled={saving} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Rejecting...' : 'Reject Request'}</button>
          </div>
        </div>
      )}

      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Convert to Project</h2><button onClick={() => setShowConvertModal(false)} className="text-white">X</button></div>
            <p className="text-gray-400 text-sm mb-4">This will create an official project from this request.</p>
            <button onClick={handleConvertToProject} disabled={saving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Creating...' : 'Create Project'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
