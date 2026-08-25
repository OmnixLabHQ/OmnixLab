'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Lead {
  id: string
  full_name: string
  company: string
  email: string
  phone: string
  service: string
  budget: string
  message: string
  source: string
  status: string
  created_at: string
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)

  // Convert form
  const [convertForm, setConvertForm] = useState({
    full_name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, sourceFilter, leads])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('project_requests')
        .select('*')
        .order('created_at', { ascending: false })
      setLeads(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Fetch leads error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...leads]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.full_name?.toLowerCase().includes(term) ||
          l.company?.toLowerCase().includes(term) ||
          l.email?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((l) => l.status === statusFilter)
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter((l) => (l.source || 'website') === sourceFilter)
    }

    setFilteredLeads(filtered)
  }

  async function handleStatusChange(leadId: string, newStatus: string) {
    await supabase.from('project_requests').update({ status: newStatus }).eq('id', leadId)
    fetchLeads()
  }

  async function handleConvertToClient(lead: Lead) {
    setSelectedLead(lead)
    setConvertForm({
      full_name: lead.full_name || '',
      email: lead.email || '',
      company: lead.company || '',
      phone: lead.phone || '',
      password: '',
    })
    setShowConvertModal(true)
  }

  async function handleSubmitConversion() {
    if (!convertForm.full_name || !convertForm.email || !convertForm.password) {
      alert('Full name, email, and password are required')
      return
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: convertForm.email,
        password: convertForm.password,
        options: {
          data: {
            full_name: convertForm.full_name,
            company: convertForm.company,
          },
        },
      })

      if (authError) {
        alert('Auth error: ' + authError.message)
        return
      }

      if (authData.user && selectedLead) {
        // Create client record
        const { error: insertError } = await supabase.from('clients').insert({
          id: authData.user.id,
          full_name: convertForm.full_name,
          company: convertForm.company,
          email: convertForm.email,
          phone: convertForm.phone,
          approved: true,
        })

        if (insertError) {
          alert('Client insert error: ' + insertError.message)
          return
        }

        // Update lead status to Won
        await supabase.from('project_requests').update({ status: 'won' }).eq('id', selectedLead.id)

        // Create notification
        await supabase.from('notifications').insert({
          client_id: authData.user.id,
          type: 'account',
          title: 'Account Created',
          message: 'Your Omnix Lab account has been created from your project inquiry. Welcome!',
          data: { status: 'approved' },
        })
      }

      setShowConvertModal(false)
      fetchLeads()
    } catch (error) {
      console.error('Convert error:', error)
      alert('Failed to convert lead')
    }
  }

  function getStatusDisplay(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      new: { label: 'New', color: 'bg-blue-500/20 text-blue-300' },
      contacted: { label: 'Contacted', color: 'bg-cyan-500/20 text-cyan-300' },
      qualified: { label: 'Qualified', color: 'bg-purple-500/20 text-purple-300' },
      proposal: { label: 'Proposal', color: 'bg-yellow-500/20 text-yellow-300' },
      won: { label: 'Won', color: 'bg-green-500/20 text-green-300' },
      lost: { label: 'Lost', color: 'bg-red-500/20 text-red-300' },
      archived: { label: 'Archived', color: 'bg-gray-500/20 text-gray-400' },
    }
    return map[status] || { label: status, color: 'bg-gray-500/20 text-gray-300' }
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
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-gray-400 mt-1">
            {leads.filter(l => l.status === 'new').length} new leads waiting
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, company, or email..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="new" className="bg-gray-900">New</option>
          <option value="contacted" className="bg-gray-900">Contacted</option>
          <option value="qualified" className="bg-gray-900">Qualified</option>
          <option value="proposal" className="bg-gray-900">Proposal</option>
          <option value="won" className="bg-gray-900">Won</option>
          <option value="lost" className="bg-gray-900">Lost</option>
          <option value="archived" className="bg-gray-900">Archived</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Sources</option>
          <option value="website" className="bg-gray-900">Website</option>
          <option value="contact" className="bg-gray-900">Contact Form</option>
          <option value="referral" className="bg-gray-900">Referral</option>
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
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Service</th>
              <th className="py-3 px-4 font-medium">Budget</th>
              <th className="py-3 px-4 font-medium">Source</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-500">No leads found</td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const statusInfo = getStatusDisplay(lead.status)
                return (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{lead.full_name}</td>
                    <td className="py-3 px-4 text-gray-300">{lead.company}</td>
                    <td className="py-3 px-4 text-gray-300">{lead.email}</td>
                    <td className="py-3 px-4 text-gray-300">{lead.phone}</td>
                    <td className="py-3 px-4 text-gray-300">{lead.service}</td>
                    <td className="py-3 px-4 text-gray-300">{lead.budget}</td>
                    <td className="py-3 px-4 text-gray-300 capitalize">{lead.source || 'website'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLead(lead)
                            setShowLeadModal(true)
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          View
                        </button>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1 focus:border-blue-500 outline-none"
                        >
                          <option value="new" className="bg-gray-900">New</option>
                          <option value="contacted" className="bg-gray-900">Contacted</option>
                          <option value="qualified" className="bg-gray-900">Qualified</option>
                          <option value="proposal" className="bg-gray-900">Proposal</option>
                          <option value="won" className="bg-gray-900">Won</option>
                          <option value="lost" className="bg-gray-900">Lost</option>
                          <option value="archived" className="bg-gray-900">Archived</option>
                        </select>
                        <button
                          onClick={() => handleConvertToClient(lead)}
                          className="text-green-400 hover:text-green-300 text-xs font-medium"
                        >
                          Convert
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Lead Details</h2>
              <button onClick={() => setShowLeadModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-white font-medium">{selectedLead.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Company</p>
                <p className="text-white">{selectedLead.company || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{selectedLead.email}</p>
              </div>
              {selectedLead.phone && (
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="text-white">{selectedLead.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Service</p>
                <p className="text-white">{selectedLead.service || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Budget</p>
                <p className="text-white">{selectedLead.budget || '—'}</p>
              </div>
              {selectedLead.message && (
                <div>
                  <p className="text-sm text-gray-400">Message</p>
                  <p className="text-gray-300">{selectedLead.message}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white">{new Date(selectedLead.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowLeadModal(false)
                    handleConvertToClient(selectedLead)
                  }}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                >
                  Convert to Client
                </button>
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Client Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Convert Lead to Client</h2>
              <button onClick={() => setShowConvertModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={convertForm.full_name}
                  onChange={(e) => setConvertForm({ ...convertForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  value={convertForm.company}
                  onChange={(e) => setConvertForm({ ...convertForm, company: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={convertForm.email}
                  onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={convertForm.phone}
                  onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password *</label>
                <input
                  type="password"
                  value={convertForm.password}
                  onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handleSubmitConversion}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
              >
                Convert to Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}