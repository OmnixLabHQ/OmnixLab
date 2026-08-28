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

const ITEMS_PER_PAGE = 10

export default function AdminProjectRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ProjectRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedRequests, setPaginatedRequests] = useState<ProjectRequest[]>([])

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    underReview: 0,
    needsInfo: 0,
    qualified: 0,
    converted: 0,
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, priorityFilter, requests])

  useEffect(() => {
    updatePagination()
  }, [filteredRequests, currentPage])

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
              .select('full_name, email')
              .eq('id', request.client_id)
              .single()
            if (client) {
              clientName = client.full_name || 'Unknown'
              clientEmail = client.email || ''
            }
          }
          return { ...request, client_name: clientName, client_email: clientEmail }
        })
      )

      setRequests(requestsWithClient)
      calculateStats(requestsWithClient)
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch requests error:', err)
      setLoading(false)
    }
  }, [])

  function calculateStats(requests: ProjectRequest[]) {
    const total = requests.length
    const newRequests = requests.filter(r => r.status === 'submitted').length
    const underReview = requests.filter(r => r.status === 'under_review').length
    const needsInfo = requests.filter(r => r.status === 'needs_information').length
    const qualified = requests.filter(r => r.status === 'qualified').length
    const converted = requests.filter(r => r.status === 'converted').length
    setStats({ total, new: newRequests, underReview, needsInfo, qualified, converted })
  }

  function applyFilters() {
    let filtered = [...requests]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (request) =>
          request.project_name?.toLowerCase().includes(term) ||
          request.company?.toLowerCase().includes(term) ||
          request.client_name?.toLowerCase().includes(term) ||
          request.request_number?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(r => r.priority === priorityFilter)
    }

    setFilteredRequests(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedRequests(filteredRequests.slice(start, end))
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

  function getPriorityColor(priority: string) {
    const map: Record<string, string> = {
      high: 'bg-red-500/20 text-red-300',
      urgent: 'bg-red-500/20 text-red-300',
      important: 'bg-yellow-500/20 text-yellow-300',
      normal: 'bg-green-500/20 text-green-300',
    }
    return map[priority?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
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
        <p className="text-sm text-gray-400 mt-1">Review and manage incoming project opportunities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">New</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.new}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Under Review</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.underReview}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Needs Info</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{stats.needsInfo}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Qualified</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.qualified}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Converted</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.converted}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project, client, request number..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="submitted" className="bg-gray-900">New</option>
          <option value="under_review" className="bg-gray-900">Under Review</option>
          <option value="needs_information" className="bg-gray-900">Needs Info</option>
          <option value="qualified" className="bg-gray-900">Qualified</option>
          <option value="proposal_sent" className="bg-gray-900">Proposal Sent</option>
          <option value="approved" className="bg-gray-900">Approved</option>
          <option value="rejected" className="bg-gray-900">Rejected</option>
          <option value="converted" className="bg-gray-900">Converted</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Priorities</option>
          <option value="normal" className="bg-gray-900">Normal</option>
          <option value="important" className="bg-gray-900">Important</option>
          <option value="urgent" className="bg-gray-900">Urgent</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Request</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Budget</th>
              <th className="py-3 px-4 font-medium">Priority</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Submitted</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">No project requests found</td>
              </tr>
            ) : (
              paginatedRequests.map((request) => (
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
                  <td className="py-3 px-4 text-gray-300">{request.project_type || '—'}</td>
                  <td className="py-3 px-4 text-gray-300">{request.budget_range || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(request.priority || 'normal')}`}>
                      {request.priority || 'normal'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(request.created_at)}</td>
                  <td className="py-3 px-4">
                    <Link href={`/admin/project-requests/${request.id}`} className="text-blue-400 hover:text-blue-300 text-xs">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}