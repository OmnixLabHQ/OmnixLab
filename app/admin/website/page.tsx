'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface WebsiteLead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  project_type: string
  budget: string
  message: string
  source: string
  status: string
  created_at: string
  updated_at: string
}

interface WebsiteStats {
  totalVisitors: number
  totalLeads: number
  newLeads: number
  conversionRate: number
  qualifiedLeads: number
  wonLeads: number
}

const LEAD_STATUSES: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-500/20 text-blue-300' },
  contacted: { label: 'Contacted', color: 'bg-yellow-500/20 text-yellow-300' },
  qualified: { label: 'Qualified', color: 'bg-purple-500/20 text-purple-300' },
  proposal: { label: 'Proposal', color: 'bg-cyan-500/20 text-cyan-300' },
  won: { label: 'Won', color: 'bg-green-500/20 text-green-300' },
  lost: { label: 'Lost', color: 'bg-red-500/20 text-red-300' },
  archived: { label: 'Archived', color: 'bg-gray-500/20 text-gray-300' },
}

const PROJECT_TYPES = [
  'Website Development',
  'Mobile App',
  'Web Application',
  'Trading Platform',
  'E-commerce',
  'SaaS Platform',
  'AI/ML Solution',
  'Blockchain',
  'UI/UX Design',
  'Other',
]

const LEAD_SOURCES = [
  'Website Contact Form',
  'Start Project Form',
  'Newsletter',
  'Referral',
  'Social Media',
  'Direct',
  'Other',
]

export default function AdminWebsitePage() {
  const [leads, setLeads] = useState<WebsiteLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<WebsiteLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedLeads, setPaginatedLeads] = useState<WebsiteLead[]>([])
  
  const [selectedLead, setSelectedLead] = useState<WebsiteLead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  
  // Convert to client form
  const [convertCompany, setConvertCompany] = useState('')
  const [convertPosition, setConvertPosition] = useState('')
  
  const [stats, setStats] = useState<WebsiteStats>({
    totalVisitors: 0,
    totalLeads: 0,
    newLeads: 0,
    conversionRate: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
  })
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, sourceFilter, typeFilter, leads])

  useEffect(() => {
    updatePagination()
  }, [filteredLeads, currentPage])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsData, visitorsData] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('visitors').select('id'),
      ])

      const allLeads = leadsData.data || []
      const totalVisitors = visitorsData.data?.length || 0

      setLeads(allLeads)
      calculateStats(allLeads, totalVisitors)
      setLoading(false)
    } catch (error) {
      console.error('Fetch website data error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats(leads: WebsiteLead[], totalVisitors: number) {
    const totalLeads = leads.length
    const newLeads = leads.filter(l => l.status === 'new').length
    const qualifiedLeads = leads.filter(l => ['qualified', 'proposal'].includes(l.status)).length
    const wonLeads = leads.filter(l => l.status === 'won').length
    const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0

    setStats({
      totalVisitors,
      totalLeads,
      newLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      qualifiedLeads,
      wonLeads,
    })
  }

  function applyFilters() {
    let filtered = [...leads]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(term) ||
          lead.company?.toLowerCase().includes(term) ||
          lead.email?.toLowerCase().includes(term) ||
          lead.message?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.source === sourceFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.project_type === typeFilter)
    }

    setFilteredLeads(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredLeads.length / 10)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * 10
    const end = start + 10
    setPaginatedLeads(filteredLeads.slice(start, end))
  }

  async function handleStatusChange() {
    if (!selectedLead || !newStatus) return

    setSaving(true)
    try {
      await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id)

      await supabase.from('activity_logs').insert({
        user_id: null,
        action_type: 'lead_updated',
        description: `Lead "${selectedLead.name}" status changed to ${newStatus}`,
        entity_type: 'lead',
        entity_id: selectedLead.id,
      })

      setShowStatusModal(false)
      setNewStatus('')
      fetchData()
    } catch (error) {
      console.error('Update lead status error:', error)
      alert('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  async function handleConvertToClient() {
    if (!selectedLead || !convertCompany.trim()) {
      alert('Please enter company name')
      return
    }

    setSaving(true)
    try {
      // Create client from lead
      const { data: newClient } = await supabase
        .from('clients')
        .insert({
          full_name: selectedLead.name,
          company: convertCompany || selectedLead.company,
          email: selectedLead.email,
          phone: selectedLead.phone,
          status: 'prospect',
          source: selectedLead.source,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newClient) {
        // Update lead status
        await supabase
          .from('leads')
          .update({ 
            status: 'won',
            client_id: newClient.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedLead.id)

        // Create notification
        await supabase.from('notifications').insert({
          user_id: newClient.id,
          type: 'client_created',
          title: 'Welcome to Omnix Lab',
          message: 'Your client account has been created',
          read: false,
          channel: 'in_app',
          delivery_status: 'delivered',
          created_at: new Date().toISOString(),
        })

        // Create activity log
        await supabase.from('activity_logs').insert({
          user_id: newClient.id,
          action_type: 'client_created',
          description: `Lead "${selectedLead.name}" converted to client`,
          entity_type: 'client',
          entity_id: newClient.id,
        })
      }

      setShowConvertModal(false)
      setConvertCompany('')
      setConvertPosition('')
      fetchData()
    } catch (error) {
      console.error('Convert lead error:', error)
      alert('Failed to convert lead to client')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(date: string) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Website</h1>
          <p className="text-sm text-gray-400 mt-1">
            Website leads and visitor analytics
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Visitors</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalVisitors}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Leads</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.totalLeads}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">New Leads</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.newLeads}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Qualified</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.qualifiedLeads}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Won</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.wonLeads}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Conversion Rate</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Lead Pipeline</h3>
        <div className="flex items-center gap-2 overflow-x-auto">
          {Object.entries(LEAD_STATUSES).map(([status, info], index) => {
            const count = leads.filter(l => l.status === status).length
            return (
              <div key={status} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center min-w-[100px]">
                  <span className={`block px-2 py-0.5 text-xs font-medium rounded-full ${info.color} mb-2`}>
                    {info.label}
                  </span>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </div>
                {index < Object.entries(LEAD_STATUSES).length - 1 && (
                  <span className="text-gray-500 text-lg">-&gt;</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, company, email, or message..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          {Object.entries(LEAD_STATUSES).map(([value, info]) => (
            <option key={value} value={value} className="bg-gray-900">{info.label}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Sources</option>
          {LEAD_SOURCES.map(source => (
            <option key={source} value={source} className="bg-gray-900">{source}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Project Types</option>
          {PROJECT_TYPES.map(type => (
            <option key={type} value={type} className="bg-gray-900">{type}</option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Company</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Project Type</th>
              <th className="py-3 px-4 font-medium">Budget</th>
              <th className="py-3 px-4 font-medium">Source</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="text-4xl mb-3">[ ]</div>
                  <p className="text-gray-500">No leads found</p>
                  <p className="text-gray-600 text-xs mt-1">Website leads will appear here</p>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                      className="text-white font-medium hover:text-blue-400"
                    >
                      {lead.name || '-'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{lead.company || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{lead.email || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{lead.project_type || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{lead.budget || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{lead.source || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${LEAD_STATUSES[lead.status]?.color || 'bg-gray-500/20 text-gray-300'}`}>
                      {LEAD_STATUSES[lead.status]?.label || lead.status || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(lead.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View
                      </button>
                      <button
                        onClick={() => { setSelectedLead(lead); setNewStatus(lead.status); setShowStatusModal(true); }}
                        className="text-green-400 hover:text-green-300 text-xs"
                      >
                        Status
                      </button>
                      {lead.status !== 'won' && (
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setConvertCompany(lead.company || '');
                            setShowConvertModal(true);
                          }}
                          className="text-purple-400 hover:text-purple-300 text-xs"
                        >
                          Convert
                        </button>
                      )}
                    </div>
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
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedLead.name}</h2>
                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${LEAD_STATUSES[selectedLead.status]?.color || 'bg-gray-500/20 text-gray-300'}`}>
                  {LEAD_STATUSES[selectedLead.status]?.label || selectedLead.status}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-sm text-white">{selectedLead.company || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-white">{selectedLead.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-white">{selectedLead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project Type</p>
                  <p className="text-sm text-white">{selectedLead.project_type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm text-white">{selectedLead.budget || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="text-sm text-white">{selectedLead.source || '-'}</p>
                </div>
              </div>

              {selectedLead.message && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Message</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedLead.message}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-white">{formatDate(selectedLead.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setNewStatus(selectedLead.status);
                  setShowStatusModal(true);
                }}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
              >
                Update Status
              </button>
              {selectedLead.status !== 'won' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setConvertCompany(selectedLead.company || '');
                    setShowConvertModal(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
                >
                  Convert to Client
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Update Lead Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  {Object.entries(LEAD_STATUSES).map(([value, info]) => (
                    <option key={value} value={value} className="bg-gray-900">{info.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusChange}
                disabled={saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Convert to Client</h2>
              <button onClick={() => setShowConvertModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={convertCompany}
                  onChange={(e) => setConvertCompany(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Position (Optional)</label>
                <input
                  type="text"
                  value={convertPosition}
                  onChange={(e) => setConvertPosition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="e.g., CEO, CTO"
                />
              </div>
              <button
                onClick={handleConvertToClient}
                disabled={saving || !convertCompany.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Converting...' : 'Convert to Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}