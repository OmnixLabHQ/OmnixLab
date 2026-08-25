'use client'

import { useState, useEffect, useCallback } from 'react'
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
  activeProjects: number
  totalRevenue: number
  outstanding: number
  lastActivity: string
  status: string
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [newClient, setNewClient] = useState({
    full_name: '',
    company: '',
    email: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, clients])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async (client) => {
          // Active projects count
          const { count: activeProjects } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .neq('status', 'completed')
            .neq('status', 'cancelled')

          // Paid invoices
          const { data: paidInvoices } = await supabase
            .from('invoices')
            .select('amount')
            .eq('client_id', client.id)
            .eq('status', 'paid')
          const totalRevenue = paidInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

          // Outstanding invoices
          const { data: outstandingInvoices } = await supabase
            .from('invoices')
            .select('amount')
            .eq('client_id', client.id)
            .in('status', ['sent', 'overdue', 'unpaid'])
          const outstanding = outstandingInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

          // Last activity
          const { data: lastActivity } = await supabase
            .from('activity_logs')
            .select('created_at')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Determine status
          let status = 'active'
          if (!client.approved) status = 'lead'
          else if (activeProjects === 0 && totalRevenue === 0) status = 'prospect'
          else if (activeProjects === 0) status = 'completed'

          return {
            ...client,
            activeProjects: activeProjects || 0,
            totalRevenue,
            outstanding,
            lastActivity: lastActivity?.created_at || client.created_at,
            status,
          }
        })
      )

      setClients(clientsWithStats)
      setLoading(false)
    } catch (error) {
      console.error('Fetch clients error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...clients]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(term) ||
          c.company?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    setFilteredClients(filtered)
  }

  async function handleCreateClient() {
    if (!newClient.full_name || !newClient.email || !newClient.password) {
      alert('Full name, email, and password are required')
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newClient.email,
        password: newClient.password,
        options: {
          data: {
            full_name: newClient.full_name,
            company: newClient.company,
          },
        },
      })

      if (authError) {
        alert('Auth error: ' + authError.message)
        return
      }

      if (authData.user) {
        const { error: insertError } = await supabase.from('clients').insert({
          id: authData.user.id,
          full_name: newClient.full_name,
          company: newClient.company,
          email: newClient.email,
          phone: newClient.phone,
          approved: true,
        })

        if (insertError) {
          alert('Client insert error: ' + insertError.message)
          return
        }

        await supabase.from('notifications').insert({
          client_id: authData.user.id,
          type: 'account',
          title: 'Account Created',
          message: 'Your Omnix Lab account has been created. Welcome!',
          data: { status: 'approved' },
        })
      }

      setShowCreateModal(false)
      setNewClient({ full_name: '', company: '', email: '', phone: '', password: '' })
      fetchClients()
    } catch (error) {
      console.error('Create client error:', error)
      alert('Failed to create client')
    }
  }

  async function handleToggleApproval(client: Client) {
    await supabase
      .from('clients')
      .update({ approved: !client.approved })
      .eq('id', client.id)

    if (!client.approved) {
      await supabase.from('notifications').insert({
        client_id: client.id,
        type: 'account',
        title: 'Account Approved',
        message: 'Your Omnix Lab account has been approved. Welcome!',
        data: { status: 'approved' },
      })
    }

    fetchClients()
  }

  function getStatusDisplay(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      lead: { label: 'Lead', color: 'bg-gray-500/20 text-gray-300' },
      prospect: { label: 'Prospect', color: 'bg-blue-500/20 text-blue-300' },
      active: { label: 'Active', color: 'bg-green-500/20 text-green-300' },
      paused: { label: 'Paused', color: 'bg-yellow-500/20 text-yellow-300' },
      completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-300' },
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
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Client
        </button>
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
          <option value="lead" className="bg-gray-900">Lead</option>
          <option value="prospect" className="bg-gray-900">Prospect</option>
          <option value="active" className="bg-gray-900">Active</option>
          <option value="paused" className="bg-gray-900">Paused</option>
          <option value="completed" className="bg-gray-900">Completed</option>
          <option value="archived" className="bg-gray-900">Archived</option>
        </select>
      </div>

      {/* Clients Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Company</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Projects</th>
              <th className="py-3 px-4 font-medium">Revenue</th>
              <th className="py-3 px-4 font-medium">Outstanding</th>
              <th className="py-3 px-4 font-medium">Last Activity</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">No clients found</td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const statusInfo = getStatusDisplay(client.status)
                return (
                  <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/admin/clients/${client.id}`} className="text-white hover:text-blue-400 font-medium">
                        {client.full_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{client.company}</td>
                    <td className="py-3 px-4 text-gray-300">{client.email}</td>
                    <td className="py-3 px-4 text-white font-medium">{client.activeProjects}</td>
                    <td className="py-3 px-4 text-green-400">${client.totalRevenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-amber-400">${client.outstanding.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(client.lastActivity).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleApproval(client)}
                          className={`text-xs font-medium ${
                            client.approved ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                          }`}
                        >
                          {client.approved ? 'Suspend' : 'Approve'}
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

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Create Client</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newClient.full_name}
                  onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password *</label>
                <input
                  type="password"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handleCreateClient}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}