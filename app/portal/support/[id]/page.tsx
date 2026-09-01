'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface SupportTicket {
  id: string
  client_id: string
  project_id: string | null
  subject: string
  description: string | null
  category: string
  priority: string
  status: string
  resolution: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

interface Project {
  id: string
  name: string
}

export default function SupportTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params?.id as string

  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ticketId) fetchData()
  }, [ticketId])

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('client_id', user.id)
        .single()

      if (ticketError || !ticketData) {
        router.push('/portal/support')
        return
      }

      setTicket(ticketData)

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      open: { label: 'Open', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      assigned: { label: 'Assigned', color: 'bg-indigo-100 text-indigo-800', dot: '🔷' },
      in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      waiting_for_client: { label: 'Waiting for Client', color: 'bg-orange-100 text-orange-800', dot: '🟠' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', dot: '🟢' },
      closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', dot: '⚫' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '⚪' }
  }

  function getProjectName(projectId: string | null) {
    if (!projectId) return '—'
    return projects.find((p) => p.id === projectId)?.name || '—'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!ticket) return null

  const statusInfo = getStatusDisplay(ticket.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/support" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Support
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.dot} {statusInfo.label}
            </span>
          </div>

          {ticket.description && (
            <div className="mt-6">
              <p className="text-xs text-gray-500 uppercase mb-2">Description</p>
              <p className="text-gray-700">{ticket.description}</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Category</p>
              <p className="font-medium text-gray-900">{ticket.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Priority</p>
              <p className="font-medium text-gray-900">{ticket.priority}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Project</p>
              <p className="font-medium text-gray-900">{getProjectName(ticket.project_id)}</p>
            </div>
          </div>
        </div>

        {ticket.resolution && (
          <div className="bg-white border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-800 mb-2">Resolution</h3>
            <p className="text-gray-700">{ticket.resolution}</p>
            {ticket.resolved_at && (
              <p className="text-xs text-gray-500 mt-2">
                Resolved {new Date(ticket.resolved_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {ticket.status === 'waiting_for_client' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
            <p className="text-amber-800">
              <strong>Action Required:</strong> The Omnix Lab team needs additional information from you. Please respond to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
