'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProjectData {
  id: string
  client_id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  created_at: string
  client_name: string
  progress: number
  health: 'green' | 'yellow' | 'red'
}

export default function ProjectCommandCenter() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<ProjectData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data states
  const [requirements, setRequirements] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [ideas, setIdeas] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  // Modal states
  const [showCreateMilestone, setShowCreateMilestone] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateRequirement, setShowCreateRequirement] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)

  // Form states
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', deadline: '', budget: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'normal', due_date: '' })
  const [requirementForm, setRequirementForm] = useState({ title: '', description: '', priority: 'normal', due_date: '' })
  const [editProjectForm, setEditProjectForm] = useState({ name: '', description: '', status: '', end_date: '' })

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  const fetchProjectData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch project
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (!projectData) {
        router.push('/admin/projects')
        return
      }

      // Fetch client name
      const { data: clientData } = await supabase
        .from('clients')
        .select('full_name, company')
        .eq('id', projectData.client_id)
        .single()

      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      // Calculate progress and health
      const totalMilestones = milestonesData?.length || 0
      const completedMilestones = milestonesData?.filter(m => m.status === 'completed').length || 0
      const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

      let health: 'green' | 'yellow' | 'red' = 'green'
      const overdueMilestones = milestonesData?.filter(m => {
        return m.deadline && new Date(m.deadline) < new Date() && m.status !== 'completed'
      }) || []
      const blockedMilestones = milestonesData?.filter(m => m.status === 'blocked') || []
      if (blockedMilestones.length > 0) health = 'red'
      else if (overdueMilestones.length > 0) health = 'yellow'

      // Fetch all related data
      const [reqRes, taskRes, filesRes, ideasRes, convosRes, invoicesRes, paymentsRes, activityRes] = await Promise.all([
        supabase.from('requirements').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('files').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('ideas').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('conversations').select('*').eq('project_id', projectId).order('last_message_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('invoice_id', projectId).order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      ])

      setProject({
        ...projectData,
        client_name: clientData?.full_name || clientData?.company || 'Unknown',
        progress,
        health,
      })
      setMilestones(milestonesData || [])
      setRequirements(reqRes.data || [])
      setTasks(taskRes.data || [])
      setFiles(filesRes.data || [])
      setIdeas(ideasRes.data || [])
      setConversations(convosRes.data || [])
      setInvoices(invoicesRes.data || [])
      setPayments(paymentsRes.data || [])
      setActivityLogs(activityRes.data || [])
      setTeamMembers([])

      setLoading(false)
    } catch (error) {
      console.error('Fetch project error:', error)
      setLoading(false)
    }
  }, [projectId, router])

  async function handleCreateMilestone() {
    if (!milestoneForm.title) return
    await supabase.from('milestones').insert({
      project_id: projectId,
      title: milestoneForm.title,
      description: milestoneForm.description,
      deadline: milestoneForm.deadline || null,
      status: 'upcoming',
    })
    await supabase.from('activity_logs').insert({
      client_id: project?.client_id,
      project_id: projectId,
      type: 'milestone',
      title: 'Milestone Created',
      description: milestoneForm.title,
    })
    setShowCreateMilestone(false)
    setMilestoneForm({ title: '', description: '', deadline: '', budget: '' })
    fetchProjectData()
  }

  async function handleCreateTask() {
    if (!taskForm.title) return
    await supabase.from('tasks').insert({
      project_id: projectId,
      title: taskForm.title,
      description: taskForm.description,
      status: 'todo',
      priority: taskForm.priority,
      due_date: taskForm.due_date || null,
      completed: false,
    })
    setShowCreateTask(false)
    setTaskForm({ title: '', description: '', priority: 'normal', due_date: '' })
    fetchProjectData()
  }

  async function handleCreateRequirement() {
    if (!requirementForm.title) return
    await supabase.from('requirements').insert({
      project_id: projectId,
      client_id: project?.client_id,
      title: requirementForm.title,
      description: requirementForm.description,
      priority: requirementForm.priority,
      due_date: requirementForm.due_date || null,
      status: 'draft',
    })
    setShowCreateRequirement(false)
    setRequirementForm({ title: '', description: '', priority: 'normal', due_date: '' })
    fetchProjectData()
  }

  async function handleUpdateProject() {
    await supabase.from('projects').update({
      name: editProjectForm.name,
      description: editProjectForm.description,
      status: editProjectForm.status,
      end_date: editProjectForm.end_date || null,
    }).eq('id', projectId)
    setShowEditProject(false)
    fetchProjectData()
  }

  async function handleMilestoneStatusChange(milestoneId: string, newStatus: string) {
    await supabase.from('milestones').update({ status: newStatus }).eq('id', milestoneId)
    if (newStatus === 'completed') {
      await supabase.from('activity_logs').insert({
        client_id: project?.client_id,
        project_id: projectId,
        type: 'milestone',
        title: 'Milestone Completed',
        description: 'Milestone marked as completed',
      })
      await supabase.from('notifications').insert({
        client_id: project?.client_id,
        type: 'milestone',
        title: 'Milestone Completed',
        message: 'A milestone has been completed.',
      })
    }
    fetchProjectData()
  }

  async function handleTaskStatusChange(taskId: string, completed: boolean) {
    await supabase.from('tasks').update({ completed }).eq('id', taskId)
    fetchProjectData()
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'requirements', label: `Requirements (${requirements.length})` },
    { key: 'milestones', label: `Milestones (${milestones.length})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'files', label: `Files (${files.length})` },
    { key: 'ideas', label: `Ideas (${ideas.length})` },
    { key: 'messages', label: `Messages (${conversations.length})` },
    { key: 'invoices', label: `Invoices (${invoices.length})` },
    { key: 'payments', label: `Payments (${payments.length})` },
    { key: 'activity', label: 'Activity' },
    { key: 'team', label: 'Team' },
    { key: 'settings', label: 'Settings' },
  ]

  if (loading || !project) {
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
          <Link href="/admin/projects" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Back to Projects
          </Link>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="text-sm text-gray-400">
            {project.client_name} • Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditProject(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20"
          >
            Edit Project
          </button>
        </div>
      </div>

      {/* Health + Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-400">Progress</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
            </div>
            <span className="text-white font-bold">{project.progress}%</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-400">Health</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-3 h-3 rounded-full ${
              project.health === 'green' ? 'bg-green-500' :
              project.health === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            <span className="text-white font-medium">
              {project.health === 'green' ? 'On Track' :
               project.health === 'yellow' ? 'Needs Attention' : 'Critical'}
            </span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-400">Status</p>
          <p className="text-white font-medium mt-2 capitalize">{project.status.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">Project Description</h3>
              <p className="text-gray-300">{project.description || 'No description provided.'}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-400">Start Date</p>
                <p className="text-white font-medium mt-1">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-400">Target Completion</p>
                <p className="text-white font-medium mt-1">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">Recent Activity</h3>
              {activityLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-sm">
                      <span>📌</span>
                      <div>
                        <p className="text-gray-300">{log.title}</p>
                        <p className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REQUIREMENTS */}
        {activeTab === 'requirements' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateRequirement(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
            >
              + Add Requirement
            </button>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-500">No requirements</td></tr>
                  ) : (
                    requirements.map((req) => (
                      <tr key={req.id} className="border-b border-white/5">
                        <td className="py-3 px-4 text-white">{req.title}</td>
                        <td className="py-3 px-4 text-gray-300 capitalize">{req.priority}</td>
                        <td className="py-3 px-4 text-gray-300">{req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            req.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                            req.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>{req.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MILESTONES */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateMilestone(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
            >
              + Add Milestone
            </button>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-500">No milestones</td></tr>
                  ) : (
                    milestones.map((milestone) => (
                      <tr key={milestone.id} className="border-b border-white/5">
                        <td className="py-3 px-4 text-white">{milestone.title}</td>
                        <td className="py-3 px-4 text-gray-300">
                          {milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={milestone.status}
                            onChange={(e) => handleMilestoneStatusChange(milestone.id, e.target.value)}
                            className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1"
                          >
                            <option value="upcoming" className="bg-gray-900">Upcoming</option>
                            <option value="active" className="bg-gray-900">Active</option>
                            <option value="awaiting_client" className="bg-gray-900">Awaiting Client</option>
                            <option value="review" className="bg-gray-900">Review</option>
                            <option value="approved" className="bg-gray-900">Approved</option>
                            <option value="completed" className="bg-gray-900">Completed</option>
                            <option value="blocked" className="bg-gray-900">Blocked</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
            >
              + Add Task
            </button>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due</th>
                    <th className="py-3 px-4">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-500">No tasks</td></tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="border-b border-white/5">
                        <td className="py-3 px-4 text-white">{task.title}</td>
                        <td className="py-3 px-4 text-gray-300 capitalize">{task.priority || 'normal'}</td>
                        <td className="py-3 px-4 text-gray-300">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => handleTaskStatusChange(task.id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-500"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FILES */}
        {activeTab === 'files' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-3 px-4">File</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-500">No files</td></tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{file.file_name}</td>
                      <td className="py-3 px-4 text-gray-300">{file.status}</td>
                      <td className="py-3 px-4 text-gray-300">{new Date(file.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* IDEAS */}
        {activeTab === 'ideas' && (
          <div className="space-y-3">
            {ideas.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No ideas</p>
            ) : (
              ideas.map((idea) => (
                <div key={idea.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white font-medium">{idea.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{idea.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            {conversations.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No conversations</p>
            ) : (
              conversations.map((convo) => (
                <Link key={convo.id} href="/admin/messages" className="block bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                  <p className="text-white font-medium">{convo.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{convo.category} • {convo.status}</p>
                </Link>
              ))
            )}
          </div>
        )}

        {/* INVOICES */}
        {activeTab === 'invoices' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No invoices</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{inv.invoice_number || inv.id}</td>
                      <td className="py-3 px-4 text-white font-medium">${inv.amount?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-300">{inv.status}</td>
                      <td className="py-3 px-4 text-gray-300">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No payments</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{p.internal_reference || p.id}</td>
                      <td className="py-3 px-4 text-white font-medium">${p.amount?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-300 capitalize">{p.payment_method?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 text-gray-300">{p.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="space-y-2">
            {activityLogs.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No activity</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                  <span>📌</span>
                  <div>
                    <p className="text-white text-sm font-medium">{log.title}</p>
                    {log.description && <p className="text-gray-400 text-xs mt-0.5">{log.description}</p>}
                    <p className="text-gray-500 text-xs mt-1">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TEAM */}
        {activeTab === 'team' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Project Team</h3>
            <p className="text-gray-400 text-sm">Team members will be assigned in the Team phase.</p>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Project Settings</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Project Name</p>
                <p className="text-white">{project.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-white capitalize">{project.status.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-white">{project.client_name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Milestone Modal */}
      {showCreateMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Add Milestone</h2>
              <button onClick={() => setShowCreateMilestone(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Milestone title *" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <textarea placeholder="Description" value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm resize-none" />
              <input type="date" value={milestoneForm.deadline} onChange={(e) => setMilestoneForm({ ...milestoneForm, deadline: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <button onClick={handleCreateMilestone} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Add Milestone</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Add Task</h2>
              <button onClick={() => setShowCreateTask(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Task title *" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <textarea placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm resize-none" />
              <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">
                <option value="low" className="bg-gray-900">Low</option>
                <option value="normal" className="bg-gray-900">Normal</option>
                <option value="high" className="bg-gray-900">High</option>
                <option value="critical" className="bg-gray-900">Critical</option>
              </select>
              <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <button onClick={handleCreateTask} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Add Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Requirement Modal */}
      {showCreateRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Add Requirement</h2>
              <button onClick={() => setShowCreateRequirement(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Requirement title *" value={requirementForm.title} onChange={(e) => setRequirementForm({ ...requirementForm, title: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <textarea placeholder="Description" value={requirementForm.description} onChange={(e) => setRequirementForm({ ...requirementForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm resize-none" />
              <select value={requirementForm.priority} onChange={(e) => setRequirementForm({ ...requirementForm, priority: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">
                <option value="low" className="bg-gray-900">Low</option>
                <option value="normal" className="bg-gray-900">Normal</option>
                <option value="high" className="bg-gray-900">High</option>
                <option value="critical" className="bg-gray-900">Critical</option>
              </select>
              <input type="date" value={requirementForm.due_date} onChange={(e) => setRequirementForm({ ...requirementForm, due_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <button onClick={handleCreateRequirement} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Add Requirement</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Edit Project</h2>
              <button onClick={() => setShowEditProject(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input type="text" value={editProjectForm.name} onChange={(e) => setEditProjectForm({ ...editProjectForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <textarea value={editProjectForm.description} onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm resize-none" />
              <select value={editProjectForm.status} onChange={(e) => setEditProjectForm({ ...editProjectForm, status: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">
                <option value="planning" className="bg-gray-900">Planning</option>
                <option value="active" className="bg-gray-900">Active</option>
                <option value="review" className="bg-gray-900">Review</option>
                <option value="completed" className="bg-gray-900">Completed</option>
                <option value="paused" className="bg-gray-900">Paused</option>
                <option value="cancelled" className="bg-gray-900">Cancelled</option>
              </select>
              <input type="date" value={editProjectForm.end_date} onChange={(e) => setEditProjectForm({ ...editProjectForm, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <button onClick={handleUpdateProject} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Update Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}