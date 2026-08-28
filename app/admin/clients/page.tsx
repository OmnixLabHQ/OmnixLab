'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Client {
  id: string
  full_name: string
  company: string
  email: string
  phone: string
  approved: boolean
  created_at: string
  projects_count?: number
  outstanding_amount?: number
}

const ITEMS_PER_PAGE = 10

export default function AdminClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedClients, setPaginatedClients] = useState<Client[]>([])

  const [showAddClient, setShowAddClient] = useState(false)
  const [formFullName, setFormFullName] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    withProjects: 0,
  })

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, clients])

  useEffect(() => {
    updatePagination()
  }, [filteredClients, currentPage])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const clientsWithDetails = await Promise.all(
        (clientsData || []).map(async (client) => {
          let projectsCount = 0
          let outstandingAmount = 0

          try {
            const { count } = await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('client_id', client.id)
            projectsCount = count || 0
          } catch {}

          try {
            const { data: invoices } = await supabase
              .from('invoices')
              .select('total, amount, amount_paid, status')
              .eq('client_id', client.id)
            outstandingAmount = (invoices || [])
              .filter((inv: any) => ['sent', 'viewed', 'overdue'].includes(inv.status))
              .reduce((sum: number, inv: any) => sum + ((inv.total || inv.amount || 0) - (inv.amount_paid || 0)), 0)
          } catch {}

          return {
            ...client,
            projects_count: projectsCount,
            outstanding_amount: outstandingAmount,
          }
        })
      )

      setClients(clientsWithDetails)
      calculateStats(clientsWithDetails)
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch clients error:', err)
      setLoading(false)
    }
  }, [])

  function calculateStats(clients: Client[]) {
    const total = clients.length
    const active = clients.filter(c => c.approved).length
    const pending = clients.filter(c => !c.approved).length
    const withProjects = clients.filter(c => (c.projects_count || 0) > 0).length
    setStats({ total, active, pending, withProjects })
  }

  function applyFilters() {
    let filtered = [...clients]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (client) =>
          client.full_name?.toLowerCase().includes(term) ||
          client.company?.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term) ||
          client.phone?.toLowerCase().includes(term)
      )
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(c => c.approved)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(c => !c.approved)
    }

    setFilteredClients(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedClients(filteredClients.slice(start, end))
  }

  function showSuccess(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleAddClient() {
    if (!formFullName.trim() || !formEmail.trim()) {
      alert('Name and email are required')
      return
    }

    setSaving(true)
    try {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          full_name: formFullName,
          company: formCompany,
          email: formEmail,
          phone: formPhone,
          approved: false,
          onboarding_completed: false,
          welcome_email_sent: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      showSuccess('Client added')
      setShowAddClient(false)
      setFormFullName('')
      setFormCompany('')
      setFormEmail('')
      setFormPhone('')
      fetchClients()
    } catch (err: any) {
      alert('Failed to add client: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleApproval(client: Client) {
    const newStatus = !client.approved

    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ approved: newStatus })
        .eq('id', client.id)
        .select()
        .single()

      if (error) {
        alert('Failed: ' + error.message)
        return
      }

      // Update local state immediately
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, approved: newStatus } : c))

      showSuccess(newStatus ? 'Client approved' : 'Client suspended')
      fetchClients()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-gray-400 mt-1">Manage client accounts and relationships</p>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          + Add Client
        </button>
      </div>

      {message && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-400 text-sm">{message}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Clients</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">With Projects</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.withProjects}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, company, email, phone..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="active" className="bg-gray-900">Active</option>
          <option value="pending" className="bg-gray-900">Pending</option>
        </select>
      </div>

      {/* Clients Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Projects</th>
              <th className="py-3 px-4 font-medium">Outstanding</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">No clients found</td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr key={client.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <Link href={`/admin/clients/${client.id}`} className="text-white font-medium hover:text-blue-400">
                      {client.company || client.full_name}
                    </Link>
                    <p className="text-xs text-gray-400">{client.full_name} • {client.email}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{client.projects_count || 0}</td>
                  <td className="py-3 px-4 text-amber-400">{formatCurrency(client.outstanding_amount || 0)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      client.approved ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {client.approved ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(client.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/clients/${client.id}`} className="text-blue-400 hover:text-blue-300 text-xs">View</Link>
                      <button
                        onClick={() => handleToggleApproval(client)}
                        className={client.approved ? 'text-red-400 hover:text-red-300 text-xs' : 'text-green-400 hover:text-green-300 text-xs'}
                      >
                        {client.approved ? 'Suspend' : 'Approve'}
                      </button>
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

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Add Client</h2>
              <button onClick={() => setShowAddClient(false)} className="text-white">X</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name *</label>
                <input type="text" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Company</label>
                <input type="text" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Phone</label>
                <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              </div>
              <button onClick={handleAddClient} disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}