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
  company: string
  budget_range: string
  timeline: string
  status: string
  priority: string
  created_at: string
  client_name?: string
  client_email?: string
}

export default function AdminProjectRequestsPage() {
  const [requests, setRequests] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data: requestsData, error } = await supabase
        .from('project_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const requestsWithClient = await Promise.all(
        (requestsData || []).map(async (request) => {
          let clientName = 'Unknown'
          let clientEmail = ''
          if (request.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, email, company')
              .eq('id', request.client_id)
              .single()
            clientName = client?.full_name || 'Unknown'
            clientEmail = client?.email || ''
          }
          return { ...request, client_name: clientName, client_email: clientEmail }
        })
      )

      setRequests(requestsWithClient)
      setLoading(false)
    } catch (err) {
      console.error('Fetch requests error:', err)
      setLoading(false)
    }
  }, [])

  const filteredRequests = requests.filter(request => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      if (!request.project_name?.toLowerCase().includes(term) &&
          !request.company?.toLowerCase().includes(term) &&
          !request.client_name?.toLowerCase().includes(term) &&
          !request.request_number?.toLowerCase().includes(term)) return false
    }
    if (statusFilter !== 'all' && request.status !== statusFilter) return false
    return true
  })

  async function handleStatusChange(requestId: number, newStatus: string) {
    try {
      const { error } = await supabase
        .from('project_requests')
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq('id', requestId)
      if (error) throw error
      fetchRequests()
    } catch (err: any) {
      alert('Failed: ' + err.message)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      submitted: 'bg-blue-500/20 text-blue-300',
      under_review: 'bg-amber-500/20 text-amber-300',
      needs_information: 'bg-orange-500/20 text-orange-300',
      qualified: 'bg-cyan-500/20 text-cyan-300',
      proposal_sent: 'bg-purple-500/20 text-purple-300',
      approved: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300',
      converted: 'bg-emerald-500/20 text-emerald-300',
      cancelled: 'bg-gray-500/20 text-gray-400',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Project Requests</h1>
        <p className="text-sm text-gray-400 mt-1">{requests.length} total requests</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project, company, client..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="submitted" className="bg-gray-900">Submitted</option>
          <option value="under_review" className="bg-gray-900">Under Review</option>
          <option value="needs_information" className="bg-gray-900">Needs Information</option>
          <option value="qualified" className="bg-gray-900">Qualified</option>
          <option value="proposal_sent" className="bg-gray-900">Proposal Sent</option>
          <option value="approved" className="bg-gray-900">Approved</option>
          <option value="rejected" className="bg-gray-900">Rejected</option>
          <option value="converted" className="bg-gray-900">Converted</option>
        </select>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Request</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Budget</th>
              <th className="py-3 px-4 font-medium">Timeline</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Submitted</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">No project requests found</td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <Link href={`/admin/project-requests/${request.id}`} className="text-white font-medium hover:text-blue-400">
                      {request.project_name}
                    </Link>
                    <p className="text-xs text-gray-400">{request.request_number}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-300">{request.client_name}</p>
                    <p className="text-xs text-gray-500">{request.company}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{request.budget_range || '—'}</td>
                  <td className="py-3 px-4 text-gray-300">{request.timeline || '—'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      className="bg-white/10 border border-white/20 text-white rounded px-2 py-1 text-xs"
                    >
                      <option value="submitted" className="bg-gray-900">Submitted</option>
                      <option value="under_review" className="bg-gray-900">Under Review</option>
                      <option value="needs_information" className="bg-gray-900">Needs Information</option>
                      <option value="qualified" className="bg-gray-900">Qualified</option>
                      <option value="proposal_sent" className="bg-gray-900">Proposal Sent</option>
                      <option value="approved" className="bg-gray-900">Approved</option>
                      <option value="rejected" className="bg-gray-900">Rejected</option>
                      <option value="converted" className="bg-gray-900">Converted</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(request.created_at)}</td>
                  <td className="py-3 px-4">
                    <Link href={`/admin/project-requests/${request.id}`} className="text-blue-400 hover:text-blue-300 text-xs">View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}