'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminProjectsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchClients()
    fetchProjects()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name, company').order('created_at', { ascending: false })
    setClients(data || [])
  }

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*, clients(full_name, company)').order('created_at', { ascending: false })
    setProjects(data || [])
  }

  const createProject = async () => {
    if (!name || !selectedClient) return
    setLoading(true)
    await supabase.from('projects').insert({
      client_id: selectedClient,
      name,
      description,
      status: 'planning'
    })
    setName('')
    setDescription('')
    setSelectedClient('')
    fetchProjects()
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Projects</h1>

      {/* Create Project */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <h2 className="text-lg font-bold">Create New Project</h2>
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl bg-white"
        >
          <option value="">Select Client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.full_name} — {client.company}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={e => setName(e.target.value)}
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
          onClick={createProject}
          disabled={!name || !selectedClient || loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>

      {/* Project List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4">All Projects</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3">Project</th>
              <th className="py-2 px-3">Client</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{project.name}</td>
                <td className="py-2 px-3">{project.clients?.full_name}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{project.status}</span>
                </td>
                <td className="py-2 px-3">
                  <a href={`/admin/projects/${project.id}`} className="text-indigo-600 hover:underline text-sm">
                    Manage
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}