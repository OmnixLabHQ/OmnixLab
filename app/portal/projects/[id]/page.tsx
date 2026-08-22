'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  client_id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  created_at: string
}

interface Milestone {
  id: string
  project_id: string
  title: string
  description: string | null
  status: string
  start_date: string | null
  deadline: string | null
  completion_percentage: number
  payment_amount: number | null
  payment_status: string
  created_at: string
}

interface Task {
  id: string
  project_id: string
  title: string
  completed_by: string | null
  due_date: string | null
  created_at: string
}

interface Requirement {
  id: string
  project_id: string
  client_id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
}

interface Approval {
  id: string
  project_id: string
  client_id: string
  title: string
  description: string | null
  status: string
  version: number
  created_at: string
}

interface ChangeRequest {
  id: string
  project_id: string
  client_id: string
  title: string
  description: string | null
  status: string
  priority: string
  estimated_cost: number | null
  created_at: string
}

interface Invoice {
  id: string
  amount: number
  status: string
  due_date: string | null
  created_at: string
}

interface ActivityLog {
  id: string
  type: string
  title: string
  description: string | null
  created_at: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // New requirement modal
  const [showRequirementModal, setShowRequirementModal] = useState(false)
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    priority: 'normal',
    due_date: '',
  })

  // New change request modal
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false)
  const [newChangeRequest, setNewChangeRequest] = useState({
    title: '',
    description: '',
    priority: 'normal',
  })

  useEffect(() => {
    if (projectId) fetchData()
  }, [projectId])

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('client_id', user.id)
        .single()

      if (projectError || !projectData) {
        router.push('/portal/projects')
        return
      }

      setProject(projectData)

      // Milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (milestonesData) setMilestones(milestonesData)

      // Tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (tasksData) setTasks(tasksData)

      // Requirements
      const { data: requirementsData } = await supabase
        .from('requirements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (requirementsData) setRequirements(requirementsData)

      // Approvals
      const { data: approvalsData } = await supabase
        .from('approvals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (approvalsData) setApprovals(approvalsData)

      // Change Requests
      const { data: changeRequestsData } = await supabase
        .from('change_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (changeRequestsData) setChangeRequests(changeRequestsData)

      // Invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (invoicesData) setInvoices(invoicesData)

      // Activity
      const { data: activitiesData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (activitiesData) setActivities(activitiesData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  async function handleAddRequirement() {
    if (!newRequirement.title.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('requirements').insert({
      project_id: projectId,
      client_id: user.id,
      title: newRequirement.title,
      description: newRequirement.description,
      priority: newRequirement.priority,
      due_date: newRequirement.due_date || null,
      status: 'pending',
    })

    await supabase.from('activity_logs').insert({
      client_id: user.id,
      project_id: projectId,
      type: 'requirement',
      title: 'Requirement Added',
      description: newRequirement.title,
    })

    setShowRequirementModal(false)
    setNewRequirement({ title: '', description: '', priority: 'normal', due_date: '' })
    await fetchData()
  }

  async function handleAddChangeRequest() {
    if (!newChangeRequest.title.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('change_requests').insert({
      project_id: projectId,
      client_id: user.id,
      title: newChangeRequest.title,
      description: newChangeRequest.description,
      priority: newChangeRequest.priority,
      status: 'submitted',
    })

    await supabase.from('activity_logs').insert({
      client_id: user.id,
      project_id: projectId,
      type: 'change_request',
      title: 'Change Request Submitted',
      description: newChangeRequest.title,
    })

    setShowChangeRequestModal(false)
    setNewChangeRequest({ title: '', description: '', priority: 'normal' })
    await fetchData()
  }

  async function handleApproveApproval(approvalId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('approvals')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', approvalId)

    await supabase.from('activity_logs').insert({
      client_id: user.id,
      project_id: projectId,
      type: 'approval',
      title: 'Approval Granted',
      description: 'Item approved by client',
    })

    await fetchData()
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-red-100 text-red-800',
      review: 'bg-purple-100 text-purple-800',
      not_started: 'bg-gray-100 text-gray-800',
      awaiting_client: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-amber-100 text-amber-800',
      changes_requested: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
      in_development: 'bg-blue-100 text-blue-800',
      estimated: 'bg-purple-100 text-purple-800',
      needs_changes: 'bg-orange-100 text-orange-800',
      accepted: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  function getMilestoneProgress() {
    if (milestones.length === 0) return 0
    const completed = milestones.filter((m) => m.status === 'completed').length
    return Math.round((completed / milestones.length) * 100)
  }

  function getProjectHealth(): { label: string; color: string; dot: string } {
    if (milestones.length === 0) return { label: 'New', color: 'text-gray-500', dot: '⚪' }
    const blockedMilestones = milestones.filter((m) => m.status === 'blocked').length
    if (blockedMilestones > 0) return { label: 'At Risk', color: 'text-red-600', dot: '🔴' }
    const overdueMilestones = milestones.filter((m) => m.deadline && new Date(m.deadline) < new Date() && m.status !== 'completed').length
    if (overdueMilestones > 0) return { label: 'At Risk', color: 'text-amber-600', dot: '🟡' }
    return { label: 'Healthy', color: 'text-green-600', dot: '🟢' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!project) return null

  const projectHealth = getProjectHealth()
  const milestoneProgress = getMilestoneProgress()

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'milestones', label: `Milestones (${milestones.length})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'requirements', label: `Requirements (${requirements.length})` },
    { key: 'approvals', label: `Approvals (${approvals.length})` },
    { key: 'changes', label: `Change Requests (${changeRequests.length})` },
    { key: 'invoices', label: `Invoices (${invoices.length})` },
    { key: 'activity', label: 'Activity' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link href="/portal/projects" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          ← Back to Projects
        </Link>

        {/* Project Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                {(project.status || 'pending').replace(/_/g, ' ')}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100`}>
                {projectHealth.dot} {projectHealth.label}
              </span>
            </div>
          </div>

          {project.description && (
            <p className="text-gray-600 mt-4">{project.description}</p>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">{project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">End Date</p>
              <p className="font-medium text-gray-900">{project.end_date ? new Date(project.end_date).toLocaleDateString() : '—'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Milestone Progress</p>
              <p className="font-medium text-gray-900">{milestoneProgress}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Project Health</p>
              <p className={`font-medium ${projectHealth.color}`}>{projectHealth.dot} {projectHealth.label}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-2xl font-bold text-gray-900">{milestones.length}</p>
                <p className="text-sm text-gray-600">Milestones</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                <p className="text-sm text-gray-600">Tasks</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-2xl font-bold text-gray-900">
                  ${invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Invoiced</p>
              </div>
            </div>

            {/* Current Milestone */}
            {milestones.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Current Milestone</h3>
                {milestones.filter((m) => m.status === 'in_progress').map((milestone) => (
                  <div key={milestone.id} className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-gray-900">{milestone.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {milestone.completion_percentage}% complete
                      {milestone.deadline && ` • Due ${new Date(milestone.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
                {milestones.filter((m) => m.status === 'in_progress').length === 0 && (
                  <p className="text-gray-500 text-sm">No milestone currently in progress.</p>
                )}
              </div>
            )}

            {/* Recent Activity */}
            {activities.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {activities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <span>📌</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        {activity.description && <p className="text-sm text-gray-600">{activity.description}</p>}
                        <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {milestones.length === 0 ? (
              <p className="text-gray-500">No milestones yet.</p>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.status === 'completed' ? 'bg-green-100' :
                        milestone.status === 'in_progress' ? 'bg-blue-100' :
                        milestone.status === 'blocked' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-sm">
                          {milestone.status === 'completed' ? '✓' :
                           milestone.status === 'in_progress' ? '●' :
                           milestone.status === 'blocked' ? '!' : index + 1}
                        </span>
                      </div>
                      {index < milestones.length - 1 && <div className="w-0.5 h-10 bg-gray-200"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-gray-900">{milestone.title}</p>
                      <p className="text-sm text-gray-600">{milestone.status.replace(/_/g, ' ')}</p>
                      {milestone.deadline && (
                        <p className="text-xs text-gray-500">Due {new Date(milestone.deadline).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {milestones.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No milestones yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{milestone.title}</p>
                        {milestone.description && <p className="text-sm text-gray-600">{milestone.description}</p>}
                        {milestone.deadline && (
                          <p className="text-xs text-gray-500">Due {new Date(milestone.deadline).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusColor(milestone.status)}`}>
                          {milestone.status.replace(/_/g, ' ')}
                        </span>
                        {milestone.completion_percentage > 0 && (
                          <p className="text-xs text-gray-500 mt-1">{milestone.completion_percentage}%</p>
                        )}
                      </div>
                    </div>
                    {milestone.completion_percentage > 0 && (
                      <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${milestone.completion_percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {tasks.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No tasks yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${task.completed_by ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      {task.due_date && <p className="text-xs text-gray-500">Due {new Date(task.due_date).toLocaleDateString()}</p>}
                    </div>
                    <span className="text-sm">{task.completed_by ? '✅' : '⏳'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowRequirementModal(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
            >
              + Add Requirement
            </button>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {requirements.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No requirements yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {requirements.map((req) => (
                    <div key={req.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{req.title}</p>
                        {req.description && <p className="text-sm text-gray-600">{req.description}</p>}
                        {req.due_date && <p className="text-xs text-gray-500">Due {new Date(req.due_date).toLocaleDateString()}</p>}
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(req.status)}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {approvals.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No approvals pending.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {approvals.map((approval) => (
                  <div key={approval.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{approval.title}</p>
                        {approval.description && <p className="text-sm text-gray-600">{approval.description}</p>}
                        <p className="text-xs text-gray-500">Version {approval.version}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(approval.status)}`}>
                          {approval.status.replace(/_/g, ' ')}
                        </span>
                        {approval.status === 'pending' && (
                          <button
                            onClick={() => handleApproveApproval(approval.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowChangeRequestModal(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
            >
              + Request Change
            </button>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {changeRequests.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No change requests yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {changeRequests.map((cr) => (
                    <div key={cr.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{cr.title}</p>
                        {cr.description && <p className="text-sm text-gray-600">{cr.description}</p>}
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(cr.status)}`}>
                        {cr.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No invoices yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/portal/invoices/${invoice.id}`}
                    className="p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">${(invoice.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{new Date(invoice.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {activities.length === 0 ? (
              <p className="text-gray-500">No activity yet.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <span>📌</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.description && <p className="text-sm text-gray-600">{activity.description}</p>}
                      <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Requirement Modal */}
      {showRequirementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Requirement</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newRequirement.title}
                onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                placeholder="Requirement title"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              <textarea
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
              />
              <select
                value={newRequirement.priority}
                onChange={(e) => setNewRequirement({ ...newRequirement, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="date"
                value={newRequirement.due_date}
                onChange={(e) => setNewRequirement({ ...newRequirement, due_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              <div className="flex gap-3">
                <button onClick={handleAddRequirement} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl">
                  Add Requirement
                </button>
                <button onClick={() => setShowRequirementModal(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Modal */}
      {showChangeRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Change</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newChangeRequest.title}
                onChange={(e) => setNewChangeRequest({ ...newChangeRequest, title: e.target.value })}
                placeholder="Change request title"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              <textarea
                value={newChangeRequest.description}
                onChange={(e) => setNewChangeRequest({ ...newChangeRequest, description: e.target.value })}
                placeholder="Describe the change..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
              />
              <div className="flex gap-3">
                <button onClick={handleAddChangeRequest} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl">
                  Submit Request
                </button>
                <button onClick={() => setShowChangeRequestModal(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}