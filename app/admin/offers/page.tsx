'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Offer {
  id: string
  client_id: string
  project_id: string
  title: string
  description: string
  scope: string
  deliverables: string[]
  timeline: string
  pricing: number
  currency: string
  payment_schedule: any[]
  terms: string
  expiration_date: string
  status: string
  client_name: string
  project_name: string
  created_at: string
  updated_at: string
  sent_at: string | null
  accepted_at: string | null
  revision_requested_at: string | null
}

const ITEMS_PER_PAGE = 10

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedOffers, setPaginatedOffers] = useState<Offer[]>([])
  
  // Modal states
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formClientId, setFormClientId] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formScope, setFormScope] = useState('')
  const [formDeliverables, setFormDeliverables] = useState('')
  const [formTimeline, setFormTimeline] = useState('')
  const [formPricing, setFormPricing] = useState('')
  const [formCurrency, setFormCurrency] = useState('USD')
  const [formPaymentSchedule, setFormPaymentSchedule] = useState('')
  const [formTerms, setFormTerms] = useState('')
  const [formExpirationDate, setFormExpirationDate] = useState('')
  
  // Data
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  // UI states
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, offers])

  useEffect(() => {
    updatePagination()
  }, [filteredOffers, currentPage])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name, company, email')
        .order('created_at', { ascending: false })
      setClients(clientsData || [])

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
      setProjects(projectsData || [])

      // Fetch offers
      const { data: offersData } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })

      const offersWithDetails = await Promise.all(
        (offersData || []).map(async (offer) => {
          let clientName = 'Unknown'
          if (offer.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', offer.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          let projectName = 'General'
          if (offer.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', offer.project_id)
              .single()
            projectName = project?.name || 'General'
          }

          return {
            ...offer,
            client_name: clientName,
            project_name: projectName,
          }
        })
      )

      setOffers(offersWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch offers error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...offers]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (offer) =>
          offer.title?.toLowerCase().includes(term) ||
          offer.client_name?.toLowerCase().includes(term) ||
          offer.project_name?.toLowerCase().includes(term) ||
          offer.description?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((offer) => offer.status === statusFilter)
    }

    setFilteredOffers(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedOffers(filteredOffers.slice(start, end))
  }

  function resetForm() {
    setFormTitle('')
    setFormClientId('')
    setFormProjectId('')
    setFormDescription('')
    setFormScope('')
    setFormDeliverables('')
    setFormTimeline('')
    setFormPricing('')
    setFormCurrency('USD')
    setFormPaymentSchedule('')
    setFormTerms('')
    setFormExpirationDate('')
  }

  async function handleCreateOffer() {
    if (!formTitle.trim() || !formClientId || !formPricing) {
      alert('Please fill in required fields: Title, Client, and Pricing')
      return
    }

    setSaving(true)
    try {
      const deliverablesArray = formDeliverables
        ? formDeliverables.split('\n').filter(d => d.trim())
        : []
      
      const paymentScheduleArray = formPaymentSchedule
        ? formPaymentSchedule.split('\n').filter(p => p.trim())
        : []

      const { data: newOffer } = await supabase
        .from('offers')
        .insert({
          client_id: formClientId,
          project_id: formProjectId || null,
          title: formTitle,
          description: formDescription,
          scope: formScope,
          deliverables: deliverablesArray,
          timeline: formTimeline,
          pricing: parseFloat(formPricing),
          currency: formCurrency,
          payment_schedule: paymentScheduleArray,
          terms: formTerms,
          expiration_date: formExpirationDate || null,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newOffer) {
        // Create activity log
        await supabase.from('activity_logs').insert({
          user_id: formClientId,
          action_type: 'offer_created',
          description: `Offer "${formTitle}" created`,
          entity_type: 'offer',
          entity_id: newOffer.id,
        })
      }

      setShowCreateModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Create offer error:', error)
      alert('Failed to create offer')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditOffer() {
    if (!selectedOffer || !formTitle.trim() || !formPricing) {
      alert('Please fill in required fields')
      return
    }

    setSaving(true)
    try {
      const deliverablesArray = formDeliverables
        ? formDeliverables.split('\n').filter(d => d.trim())
        : selectedOffer.deliverables || []
      
      const paymentScheduleArray = formPaymentSchedule
        ? formPaymentSchedule.split('\n').filter(p => p.trim())
        : selectedOffer.payment_schedule || []

      await supabase
        .from('offers')
        .update({
          client_id: formClientId,
          project_id: formProjectId || null,
          title: formTitle,
          description: formDescription,
          scope: formScope,
          deliverables: deliverablesArray,
          timeline: formTimeline,
          pricing: parseFloat(formPricing),
          currency: formCurrency,
          payment_schedule: paymentScheduleArray,
          terms: formTerms,
          expiration_date: formExpirationDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOffer.id)

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: formClientId,
        action_type: 'offer_updated',
        description: `Offer "${formTitle}" updated`,
        entity_type: 'offer',
        entity_id: selectedOffer.id,
      })

      setShowEditModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Edit offer error:', error)
      alert('Failed to edit offer')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendOffer(offer: Offer) {
    if (!confirm(`Send offer "${offer.title}" to ${offer.client_name}?`)) return

    setSending(true)
    try {
      await supabase
        .from('offers')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      // Create notification
      await supabase.from('notifications').insert({
        user_id: offer.client_id,
        type: 'offer_sent',
        title: 'New Offer Available',
        message: `You have received an offer: ${offer.title}`,
        read: false,
        created_at: new Date().toISOString(),
      })

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: offer.client_id,
        action_type: 'offer_sent',
        description: `Offer "${offer.title}" sent to client`,
        entity_type: 'offer',
        entity_id: offer.id,
      })

      fetchData()
    } catch (error) {
      console.error('Send offer error:', error)
      alert('Failed to send offer')
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteOffer(offer: Offer) {
    if (!confirm(`Delete offer "${offer.title}"? This action cannot be undone.`)) return

    await supabase.from('offers').delete().eq('id', offer.id)
    fetchData()
  }

  async function handleAcceptOffer(offer: Offer) {
    if (!confirm(`Accept offer "${offer.title}" and create project workflow?`)) return

    setSaving(true)
    try {
      // Update offer status
      await supabase
        .from('offers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      // Create project if not exists
      if (!offer.project_id) {
        const { data: newProject } = await supabase
          .from('projects')
          .insert({
            client_id: offer.client_id,
            name: offer.title,
            description: offer.description,
            status: 'planning',
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        // Update offer with new project
        await supabase
          .from('offers')
          .update({ project_id: newProject.id })
          .eq('id', offer.id)

        // Create initial invoice if pricing > 0
        if (offer.pricing > 0) {
          await supabase.from('invoices').insert({
            client_id: offer.client_id,
            project_id: newProject.id,
            offer_id: offer.id,
            invoice_number: `INV-${Date.now()}`,
            total_amount: offer.pricing,
            currency: offer.currency,
            status: 'draft',
            due_date: offer.expiration_date || null,
            created_at: new Date().toISOString(),
          })
        }

        // Create activity log
        await supabase.from('activity_logs').insert({
          user_id: offer.client_id,
          action_type: 'offer_accepted',
          description: `Offer "${offer.title}" accepted, project created`,
          entity_type: 'offer',
          entity_id: offer.id,
        })
      }

      fetchData()
    } catch (error) {
      console.error('Accept offer error:', error)
      alert('Failed to accept offer')
    } finally {
      setSaving(false)
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      sent: 'bg-blue-500/20 text-blue-300',
      viewed: 'bg-cyan-500/20 text-cyan-300',
      accepted: 'bg-green-500/20 text-green-300',
      revision_requested: 'bg-yellow-500/20 text-yellow-300',
      declined: 'bg-red-500/20 text-red-300',
      expired: 'bg-orange-500/20 text-orange-300',
      cancelled: 'bg-red-500/20 text-red-300',
    }
    return map[status.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
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
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredOffers.length} total offers
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Offer
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, client, project, or description..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="draft" className="bg-gray-900">Draft</option>
          <option value="sent" className="bg-gray-900">Sent</option>
          <option value="viewed" className="bg-gray-900">Viewed</option>
          <option value="accepted" className="bg-gray-900">Accepted</option>
          <option value="revision_requested" className="bg-gray-900">Revision Requested</option>
          <option value="declined" className="bg-gray-900">Declined</option>
          <option value="expired" className="bg-gray-900">Expired</option>
          <option value="cancelled" className="bg-gray-900">Cancelled</option>
        </select>
      </div>

      {/* Offers Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Offer</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Expires</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOffers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-gray-500">No offers found</p>
                  <p className="text-gray-600 text-xs mt-1">Create your first offer to get started</p>
                </td>
              </tr>
            ) : (
              paginatedOffers.map((offer) => (
                <tr key={offer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelectedOffer(offer); setShowDetailModal(true); }}
                      className="text-white font-medium hover:text-blue-400 text-left"
                    >
                      {offer.title}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{offer.client_name}</td>
                  <td className="py-3 px-4 text-gray-300">{offer.project_name}</td>
                  <td className="py-3 px-4 text-white font-medium">
                    {formatCurrency(offer.pricing, offer.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(offer.expiration_date)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(offer.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { setSelectedOffer(offer); setShowDetailModal(true); }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View
                      </button>
                      {offer.status === 'draft' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedOffer(offer);
                              setFormTitle(offer.title);
                              setFormClientId(offer.client_id || '');
                              setFormProjectId(offer.project_id || '');
                              setFormDescription(offer.description || '');
                              setFormScope(offer.scope || '');
                              setFormDeliverables((offer.deliverables || []).join('\n'));
                              setFormTimeline(offer.timeline || '');
                              setFormPricing(String(offer.pricing || ''));
                              setFormCurrency(offer.currency || 'USD');
                              setFormPaymentSchedule((offer.payment_schedule || []).join('\n'));
                              setFormTerms(offer.terms || '');
                              setFormExpirationDate(offer.expiration_date || '');
                              setShowEditModal(true);
                            }}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSendOffer(offer)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {offer.status === 'sent' && (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(offer)}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            Accept & Create Project
                          </button>
                          <button
                            onClick={() => handleSendOffer(offer)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs"
                          >
                            Resend
                          </button>
                        </>
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

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create Offer</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="e.g., Website Development Proposal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Client *</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">Select client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-gray-900">
                        {client.full_name} ({client.company})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Project (Optional)</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-gray-900">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Brief description of the offer..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Scope</label>
                <textarea
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Detailed scope of work..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Deliverables (one per line)</label>
                <textarea
                  value={formDeliverables}
                  onChange={(e) => setFormDeliverables(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Deliverable 1&#10;Deliverable 2&#10;Deliverable 3"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Timeline</label>
                <input
                  type="text"
                  value={formTimeline}
                  onChange={(e) => setFormTimeline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="e.g., 6-8 weeks"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Pricing *</label>
                  <input
                    type="number"
                    value={formPricing}
                    onChange={(e) => setFormPricing(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="USD" className="bg-gray-900">USD</option>
                    <option value="EUR" className="bg-gray-900">EUR</option>
                    <option value="GBP" className="bg-gray-900">GBP</option>
                    <option value="NGN" className="bg-gray-900">NGN</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Payment Schedule (one per line)</label>
                <textarea
                  value={formPaymentSchedule}
                  onChange={(e) => setFormPaymentSchedule(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="50% upfront&#10;25% mid-project&#10;25% on completion"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Terms & Conditions</label>
                <textarea
                  value={formTerms}
                  onChange={(e) => setFormTerms(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Terms and conditions..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={formExpirationDate}
                  onChange={(e) => setFormExpirationDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleCreateOffer}
                disabled={saving || !formTitle.trim() || !formClientId || !formPricing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offer Modal */}
      {showEditModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Offer</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Client *</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">Select client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-gray-900">
                        {client.full_name} ({client.company})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Project (Optional)</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-gray-900">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Scope</label>
                <textarea
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Deliverables (one per line)</label>
                <textarea
                  value={formDeliverables}
                  onChange={(e) => setFormDeliverables(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Timeline</label>
                <input
                  type="text"
                  value={formTimeline}
                  onChange={(e) => setFormTimeline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Pricing *</label>
                  <input
                    type="number"
                    value={formPricing}
                    onChange={(e) => setFormPricing(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="USD" className="bg-gray-900">USD</option>
                    <option value="EUR" className="bg-gray-900">EUR</option>
                    <option value="GBP" className="bg-gray-900">GBP</option>
                    <option value="NGN" className="bg-gray-900">NGN</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Payment Schedule (one per line)</label>
                <textarea
                  value={formPaymentSchedule}
                  onChange={(e) => setFormPaymentSchedule(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Terms & Conditions</label>
                <textarea
                  value={formTerms}
                  onChange={(e) => setFormTerms(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={formExpirationDate}
                  onChange={(e) => setFormExpirationDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleEditOffer}
                disabled={saving || !formTitle.trim() || !formClientId || !formPricing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedOffer.title}</h2>
                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOffer.status)}`}>
                  {selectedOffer.status}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm text-white">{selectedOffer.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project</p>
                  <p className="text-sm text-white">{selectedOffer.project_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedOffer.pricing, selectedOffer.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expires</p>
                  <p className="text-sm text-white">{formatDate(selectedOffer.expiration_date)}</p>
                </div>
              </div>

              {selectedOffer.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-300">{selectedOffer.description}</p>
                </div>
              )}

              {selectedOffer.scope && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Scope</p>
                  <p className="text-sm text-gray-300">{selectedOffer.scope}</p>
                </div>
              )}

              {selectedOffer.deliverables && selectedOffer.deliverables.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Deliverables</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedOffer.deliverables.map((item, index) => (
                      <li key={index} className="text-sm text-gray-300">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedOffer.timeline && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Timeline</p>
                  <p className="text-sm text-gray-300">{selectedOffer.timeline}</p>
                </div>
              )}

              {selectedOffer.payment_schedule && selectedOffer.payment_schedule.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Schedule</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedOffer.payment_schedule.map((item, index) => (
                      <li key={index} className="text-sm text-gray-300">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedOffer.terms && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Terms & Conditions</p>
                  <p className="text-sm text-gray-300">{selectedOffer.terms}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-white">{formatDate(selectedOffer.created_at)}</p>
                </div>
                {selectedOffer.sent_at && (
                  <div>
                    <p className="text-xs text-gray-500">Sent</p>
                    <p className="text-sm text-white">{formatDate(selectedOffer.sent_at)}</p>
                  </div>
                )}
                {selectedOffer.accepted_at && (
                  <div>
                    <p className="text-xs text-gray-500">Accepted</p>
                    <p className="text-sm text-white">{formatDate(selectedOffer.accepted_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}