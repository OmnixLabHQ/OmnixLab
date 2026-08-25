'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const updateApproval = async (id: string, approved: boolean) => {
    await supabase.from('clients').update({ approved }).eq('id', id)
    fetchClients()
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-300">Loading clients...</div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Clients</h1>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Company</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-medium text-white">{client.full_name}</td>
                <td className="py-3 px-4 text-gray-300">{client.company}</td>
                <td className="py-3 px-4 text-gray-300">{client.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.approved
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {client.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {client.approved ? (
                    <button
                      onClick={() => updateApproval(client.id, false)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium"
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      onClick={() => updateApproval(client.id, true)}
                      className="text-green-400 hover:text-green-300 text-xs font-medium"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}