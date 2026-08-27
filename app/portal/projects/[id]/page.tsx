'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Project {
  id: number
  client_id: string
  name: string
  status: string
  progress: number
  expected_completion_date: string | null
  created_at: string
  description?: string
}

interface Milestone {
  id: number
  project_id: number
  name: string
  status: string
  due_date: string | null
  created_at: string
}

interface Task {
  id: number
  project_id: number
  milestone_id?: number
  title: string
  status: string
  due_date: string | null
  created_at: string
}

interface Requirement {
  id: number
  project_id: number
  title: string
  status: string
  priority: string
  created_at: string
}

interface ProjectFile {
  id: number
  project_id: number
  file_name: string
  file_type: string
  created_at: string
}

interface Deliverable {
  id: number
  project_id: number
  title: string
  status: string
  version?: string
  created_at: string
}

interface Idea {
  id: number
  project_id: number
  title: string
  status: string
  created_at: string
}

interface Invoice {
  id: number
  project_id: number
  invoice_number: string
  total: number
  amount: number
  status: string
  due_date: string | null
  created_at: string
}

interface Payment {
  id: number
  invoice_id: number
  amount: number
  status: string
  created_at: string
}

interface Activity {
  id: string
  description: string
  created_at: string
}

export default function ClientProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (projectId) fetchProjectData()
  }, [projectId])

  const fetchProjectData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', Number(projectId))
        .eq('client_id', user.id)
        .single()

      if (projectError || !projectData) {
        setError('Project not found or access denied')
        setLoading(false)
        return
      }

      setProject(projectData)

      const invoiceIdsResult = await supabase.from('invoices').select('id').eq('project_id', projectData.id)
      const invoiceIds = invoiceIdsResult.data?.map((i: any) => i.id) || []

      const results = await Promise.allSettled([
        supabase.from('milestones').select('*').eq('project_id', projectData.id).order('due_date', { ascending: true }),
        supabase.from('tasks').select('*').eq('project_id', projectData.id).order('due_date', { ascending: true }),
        supabase.from('requirements').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        supabase.from('files').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('deliverables').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        supabase.from('ideas').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        invoiceIds.length > 0
          ? supabase.from('payments').select('*').in('invoice_id', invoiceIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase.from('activity_logs').select('*').eq('entity_type', 'project').eq('entity_id', String(projectData.id)).order('created_at', { ascending: false }).limit(10),
      ])

      const [mR, tR, reqR, fR, dR, iR, invR, payR, actR] = results

      if (mR.status === 'fulfilled') setMilestones(mR.value.data || [])
      if (tR.status === 'fulfilled') setTasks(tR.value.data || [])
      if (reqR.status === 'fulfilled') setRequirements(reqR.value.data || [])
      if (fR.status === 'fulfilled') setFiles(fR.value.data || [])
      if (dR.status === 'fulfilled') setDeliverables(dR.value.data || [])
      if (iR.status === 'fulfilled') setIdeas(iR.value.data || [])
      if (invR.status === 'fulfilled') setInvoices(invR.value.data || [])
      if (payR.status === 'fulfilled') setPayments(payR.value.data || [])
      if (actR.status === 'fulfilled') setActivity(actR.value.data || [])

      setLoading(false)
    } catch (err) {
      console.error('Project fetch error:', err)
      setError('Failed to load project')
      setLoading(false)
    }
  }, [projectId, router])

  const completedMilestones = milestones.filter(m => m.status === 'completed').length
  const totalMilestones = milestones.length
  const progress = project?.progress || (totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0)

  const outstandingInvoices = invoices.filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status))
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)
  const totalPaid = payments.filter(p => ['success', 'successful'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingDeliverables = deliverables.filter(d => ['awaiting_approval', 'in_review', 'submitted'].includes(d.status))

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      in_progress: 'bg-green-100 text-green-800',
      development: 'bg-green-100 text-green-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-emerald-100 text-emerald-800',
      paused: 'bg-gray-100 text-gray-600',
      on_hold: 'bg-amber-100 text-amber-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchProjectData} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl">Try Again</button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/portal/projects" className="text-gray-600 hover:text-gray-900 text-sm mb-6 inline-block">← Back to Projects</Link>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-600 mt-1">Project ID: OMN-{project.id}</p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
            <div><p className="text-xs text-gray-500">Started</p><p className="text-gray-900 font-medium">{formatDate(project.created_at)}</p></div>
            <div><p className="text-xs text-gray-500">Expected Delivery</p><p className="text-gray-900 font-medium">{formatDate(project.expected_completion_date || '')}</p></div>
            <div><p className="text-xs text-gray-500">Milestones</p><p className="text-gray-900 font-medium">{completedMilestones} / {totalMilestones}</p></div>
            <div><p className="text-xs text-gray-500">Outstanding</p><p className="text-amber-600 font-medium">{formatCurrency(totalOutstanding)}</p></div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link href={`/portal/messages?project=${project.id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Message Team</Link>
            <Link href={`/portal/files?project=${project.id}`} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">Project Files</Link>
            <Link href={`/portal/invoices?project=${project.id}`} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">View Invoices</Link>
            <Link href={`/portal/ideas?project=${project.id}`} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">Submit Idea</Link>
          </div>
        </div>

        {/* Action Required */}
        {(outstandingInvoices.length > 0 || pendingDeliverables.length > 0) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Action Required</h2>
            <div className="space-y-2">
              {outstandingInvoices.map(inv => (
                <Link key={inv.id} href={`/portal/invoices/${inv.id}`} className="block p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">
                  <p className="text-sm font-medium text-amber-800">Invoice {inv.invoice_number} due - {formatCurrency(inv.total || inv.amount || 0)}</p>
                </Link>
              ))}
              {pendingDeliverables.map(d => (
                <Link key={d.id} href={`/portal/projects/${project.id}/deliverables/${d.id}`} className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                  <p className="text-sm font-medium text-blue-800">{d.title} - Awaiting Approval</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h2>
          {milestones.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No milestones yet</p>
          ) : (
            <div className="space-y-3">
              {milestones.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${m.status === 'completed' ? 'bg-green-500' : m.status === 'in_progress' || m.status === 'active' ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      {m.due_date && <p className="text-xs text-gray-500">Due: {formatDate(m.due_date)}</p>}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    m.status === 'completed' ? 'bg-green-100 text-green-800' :
                    m.status === 'in_progress' || m.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    t.status === 'completed' ? 'bg-green-100 text-green-800' :
                    t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables / Approvals */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliverables & Approvals</h2>
          {deliverables.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Deliverables will appear here when your team submits work for review.</p>
          ) : (
            <div className="space-y-2">
              {deliverables.slice(0, 5).map(d => (
                <Link key={d.id} href={`/portal/projects/${project.id}/deliverables/${d.id}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.title}</p>
                    {d.version && <p className="text-xs text-gray-500">Version: {d.version}</p>}
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    d.status === 'approved' ? 'bg-green-100 text-green-800' :
                    d.status === 'awaiting_approval' || d.status === 'in_review' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{d.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
            <Link href={`/portal/projects/${project.id}/requirements`} className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {requirements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No requirements submitted</p>
          ) : (
            <div className="space-y-2">
              {requirements.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    r.status === 'approved' ? 'bg-green-100 text-green-800' :
                    r.status === 'pending' || r.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Files */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Files</h2>
            <Link href={`/portal/files?project=${project.id}`} className="text-sm text-blue-600 hover:underline">View All Files</Link>
          </div>
          {files.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No files uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {files.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{f.file_name}</p>
                  <p className="text-xs text-gray-500">{f.file_type}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ideas */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ideas</h2>
            <Link href={`/portal/ideas?project=${project.id}`} className="text-sm text-blue-600 hover:underline">Submit Idea</Link>
          </div>
          {ideas.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No ideas submitted yet</p>
          ) : (
            <div className="space-y-2">
              {ideas.map(i => (
                <div key={i.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{i.title}</p>
                  <span className="text-xs text-gray-500">{i.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-gray-500">Project Value</p><p className="text-xl font-bold text-gray-900">{formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0))}</p></div>
            <div><p className="text-xs text-gray-500">Paid</p><p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p></div>
            <div><p className="text-xs text-gray-500">Outstanding</p><p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p></div>
          </div>
          <Link href={`/portal/invoices?project=${project.id}`} className="block text-center text-sm text-blue-600 hover:underline mt-4">View Invoices</Link>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Project activity will appear here as work progresses.</p>
          ) : (
            <div className="space-y-3">
              {activity.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}