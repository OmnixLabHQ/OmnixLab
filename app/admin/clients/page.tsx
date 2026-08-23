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

  if (loading) return <div className="text-center py-20">Loading clients...</div>

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Clients</h1>
      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{client.full_name}</td>
                <td className="py-3 px-4">{client.company}</td>
                <td className="py-3 px-4">{client.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {client.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {client.approved ? (
                    <button onClick={() => updateApproval(client.id, false)} className="text-red-600 hover:underline text-xs">Reject</button>
                  ) : (
                    <button onClick={() => updateApproval(client.id, true)} className="text-green-600 hover:underline text-xs">Approve</button>
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