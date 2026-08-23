'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminInvoicesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchClients()
    fetchInvoices()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name, company').order('created_at', { ascending: false })
    setClients(data || [])
  }

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*, clients(full_name, company)').order('created_at', { ascending: false })
    setInvoices(data || [])
  }

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId)
    if (clientId) {
      const { data } = await supabase.from('projects').select('id, name').eq('client_id', clientId)
      setProjects(data || [])
    } else {
      setProjects([])
    }
  }

  const createInvoice = async () => {
    if (!selectedClient || !amount || !description) return
    setLoading(true)
    await supabase.from('invoices').insert({
      client_id: selectedClient,
      project_id: selectedProject || null,
      amount: parseFloat(amount),
      description,
      status: 'unpaid'
    })
    setAmount('')
    setDescription('')
    setSelectedProject('')
    fetchInvoices()
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Invoices & Offers</h1>

      {/* Create Invoice */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <h2 className="text-lg font-bold">Create New Invoice / Offer</h2>
        <select
          value={selectedClient}
          onChange={e => handleClientChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl bg-white"
        >
          <option value="">Select Client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.full_name} — {client.company}</option>
          ))}
        </select>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          disabled={!selectedClient}
          className="w-full px-4 py-2 border rounded-xl bg-white disabled:bg-gray-100"
        >
          <option value="">Select Project (optional)</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount ($)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl"
        />
        <button
          onClick={createInvoice}
          disabled={!selectedClient || !amount || !description || loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4">All Invoices</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3">Invoice #</th>
              <th className="py-2 px-3">Client</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">INV-{inv.id}</td>
                <td className="py-2 px-3">{inv.clients?.full_name}</td>
                <td className="py-2 px-3">${inv.amount?.toLocaleString()}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{inv.status}</span>
                </td>
                <td className="py-2 px-3">{new Date(inv.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}