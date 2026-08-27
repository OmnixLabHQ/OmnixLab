'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Project {
  id: number
  client_id: string
  name: string
  description?: string
  status: string
  progress: number
  progress_mode?: string
  priority?: string
  expected_completion_date?: string | null
  created_at: string
  budget?: number
  client_name?: string
  client_email?: string
  client_company?: string
}

interface Milestone {
  id: number
  project_id: number
  name: string
  description?: string
  status: string
  due_date?: string | null
  weight?: number
  created_at: string
}

interface Task {
  id: number
  project_id: number
  title: string
  description?: string
  status: string
  priority?: string
  due_date?: string | null
  milestone_id?: number | null
  created_at: string
}

interface Requirement {
  id: number
  project_id: number
  title: string
  description?: string
  status: string
  priority?: string
  due_date?: string | null
  created_at: string
}

interface Deliverable {
  id: number
  project_id: number
  title: string
  description?: string
  status: string
  version?: string
  created_at: string
}

interface ProjectFile {
  id: number
  project_id: number
  file_name: string
  file_type: string
  file_url: string
  visibility?: string
  created_at: string
}

interface Invoice {
  id: number
  project_id: number
  invoice_number: string
  total: number
  amount: number
  status: string
  due_date?: string | null
  created_at: string
}

interface Activity {
  id: string
  description: string
  action_type?: string
  created_at: string
}

interface InternalNote {
  id: number
  project_id: number
  content: string
  created_at: string
}

const PROJECT_STATUSES = [
  'draft',
  'awaiting_client',
  'planning',
  'in_progress',
  'in_review',
  'client_approval',
  'revision',
  'on_hold',
  'blocked',
  'completed',
  'cancelled',
  'archived',
]

export default function AdminProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [notes, setNotes] = useState<InternalNote[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Modal states
  const [showEditProject, setShowEditProject] = useState(false)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showRequestRequirement, setShowRequestRequirement] = useState(false)
  const [showUploadDeliverable, setShowUploadDeliverable] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [showProgressOverride, setShowProgressOverride] = useState(false)

  // Form states
  const [formProjectName, setFormProjectName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPriority, setFormPriority] = useState('medium')
  const [formDeadline, setFormDeadline] = useState('')
  const [formBudget, setFormBudget] = useState('')
  const [formStatus, setFormStatus] = useState('')
  const [formProgress, setFormProgress] = useState('')
  const [formProgressReason, setFormProgressReason] = useState('')

  const [formMilestoneName, setFormMilestoneName] = useState('')
  const [formMilestoneDescription, setFormMilestoneDescription] = useState('')
  const [formMilestoneDueDate, setFormMilestoneDueDate] = useState('')
  const [formMilestoneWeight, setFormMilestoneWeight] = useState('10')

  const [formTaskTitle, setFormTaskTitle] = useState('')
  const [formTaskDescription, setFormTaskDescription] = useState('')
  const [formTaskPriority, setFormTaskPriority] = useState('medium')
  const [formTaskDueDate, setFormTaskDueDate] = useState('')
  const [formTaskMilestoneId, setFormTaskMilestoneId] = useState('')

  const [formRequirementTitle, setFormRequirementTitle] = useState('')
  const [formRequirementDescription, setFormRequirementDescription] = useState('')
  const [formRequirementPriority, setFormRequirementPriority] = useState('medium')
  const [formRequirementDueDate, setFormRequirementDueDate] = useState('')

  const [formDeliverableTitle, setFormDeliverableTitle] = useState('')
  const [formDeliverableDescription, setFormDeliverableDescription] = useState('')
  const [formDeliverableFile, setFormDeliverableFile] = useState<File | null>(null)

  const [formInvoiceAmount, setFormInvoiceAmount] = useState('')
  const [formInvoiceDueDate, setFormInvoiceDueDate] = useState('')
  const [formInvoiceNotes, setFormInvoiceNotes] = useState('')

  const [formNoteContent, setFormNoteContent] = useState('')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  const fetchProjectData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', Number(projectId))
        .single()

      if (projectError || !projectData) {
        setError('Project not found')
        setLoading(false)
        return
      }

      // Fetch client
      let clientData = null
      if (projectData.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('full_name, email, company')
          .eq('id', projectData.client_id)
          .single()
        clientData = client
      }

      setProject({
        ...projectData,
        client_name: clientData?.full_name || 'Unknown',
        client_email: clientData?.email || '',
        client_company: clientData?.company || '',
      })

      // Fetch all related data with error tolerance
      const [mR, tR, reqR, dR, fR, invR, actR, nR] = await Promise.allSettled([
        supabase.from('milestones').select('*').eq('project_id', projectData.id).order('due_date', { ascending: true }),
        supabase.from('tasks').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        supabase.from('requirements').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        supabase.from('deliverables').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        supabase.from('files').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').eq('entity_type', 'project').eq('entity_id', String(projectData.id)).order('created_at', { ascending: false }).limit(20),
        supabase.from('internal_notes').select('*').eq('project_id', projectData.id).order('created_at', { ascending: false }),
      ])

      if (mR.status === 'fulfilled') setMilestones(mR.value.data || [])
      if (tR.status === 'fulfilled') setTasks(tR.value.data || [])
      if (reqR.status === 'fulfilled') setRequirements(reqR.value.data || [])
      if (dR.status === 'fulfilled') setDeliverables(dR.value.data || [])
      if (fR.status === 'fulfilled') setFiles(fR.value.data || [])
      if (invR.status === 'fulfilled') setInvoices(invR.value.data || [])
      if (actR.status === 'fulfilled') setActivity(actR.value.data || [])
      if (nR.status === 'fulfilled') setNotes(nR.value.data || [])

      setLoading(false)
    } catch (err) {
      console.error('Fetch project data error:', err)
      setError('Failed to load project')
      setLoading(false)
    }
  }, [projectId])

  const handleSaveProject = async () => {
    if (!project || !formProjectName.trim()) return
    setSaving(true)
    try {
      await supabase
        .from('projects')
        .update({
          name: formProjectName,
          description: formDescription,
          priority: formPriority,
          expected_completion_date: formDeadline || null,
          budget: formBudget ? parseFloat(formBudget) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      await logActivity(project.id, `Project updated`)
      setShowEditProject(false)
      fetchProjectData()
    } catch (err) {
      console.error('Save project error:', err)
      alert('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    if (!project || !formStatus) return
    setSaving(true)
    try {
      await supabase
        .from('projects')
        .update({ status: formStatus, updated_at: new Date().toISOString() })
        .eq('id', project.id)

      await logActivity(project.id, `Project status changed to ${formStatus}`)
      setShowStatusChange(false)
      fetchProjectData()
    } catch (err) {
      console.error('Status change error:', err)
      alert('Failed to change status')
    } finally {
      setSaving(false)
    }
  }

  const handleProgressOverride = async () => {
    if (!project || !formProgress) return
    setSaving(true)
    try {
      await supabase
        .from('projects')
        .update({
          progress: Math.min(100, Math.max(0, parseInt(formProgress))),
          progress_mode: 'manual',
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      await logActivity(project.id, `Project progress manually set to ${formProgress}% (Reason: ${formProgressReason})`)
      setShowProgressOverride(false)
      fetchProjectData()
    } catch (err) {
      console.error('Progress override error:', err)
      alert('Failed to update progress')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMilestone = async () => {
    if (!project || !formMilestoneName.trim()) return
    setSaving(true)
    try {
      await supabase.from('milestones').insert({
        project_id: project.id,
        name: formMilestoneName,
        description: formMilestoneDescription,
        status: 'upcoming',
        due_date: formMilestoneDueDate || null,
        weight: parseFloat(formMilestoneWeight) || 0,
        created_at: new Date().toISOString(),
      })

      await logActivity(project.id, `Milestone "${formMilestoneName}" created`)
      setShowAddMilestone(false)
      resetMilestoneForm()
      fetchProjectData()
    } catch (err) {
      console.error('Add milestone error:', err)
      alert('Failed to add milestone')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTask = async () => {
    if (!project || !formTaskTitle.trim()) return
    setSaving(true)
    try {
      await supabase.from('tasks').insert({
        project_id: project.id,
        title: formTaskTitle,
        description: formTaskDescription,
        status: 'todo',
        priority: formTaskPriority,
        due_date: formTaskDueDate || null,
        milestone_id: formTaskMilestoneId ? parseInt(formTaskMilestoneId) : null,
        created_at: new Date().toISOString(),
      })

      await logActivity(project.id, `Task "${formTaskTitle}" created`)
      setShowAddTask(false)
      resetTaskForm()
      fetchProjectData()
    } catch (err) {
      console.error('Add task error:', err)
      alert('Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  const handleRequestRequirement = async () => {
    if (!project || !formRequirementTitle.trim()) return
    setSaving(true)
    try {
      await supabase.from('requirements').insert({
        project_id: project.id,
        title: formRequirementTitle,
        description: formRequirementDescription,
        status: 'requested',
        priority: formRequirementPriority,
        due_date: formRequirementDueDate || null,
        created_at: new Date().toISOString(),
      })

      await supabase.from('notifications').insert({
        user_id: project.client_id,
        type: 'requirement_requested',
        title: 'New Requirement Requested',
        message: `Please provide: ${formRequirementTitle}`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })

      await logActivity(project.id, `Requirement "${formRequirementTitle}" requested`)
      setShowRequestRequirement(false)
      resetRequirementForm()
      fetchProjectData()
    } catch (err) {
      console.error('Request requirement error:', err)
      alert('Failed to request requirement')
    } finally {
      setSaving(false)
    }
  }

  const handleAddDeliverable = async () => {
    if (!project || !formDeliverableTitle.trim()) return
    setSaving(true)
    try {
      let fileUrl = null
      if (formDeliverableFile) {
        const fileName = `${Date.now()}-${formDeliverableFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('deliverables')
          .upload(fileName, formDeliverableFile)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('deliverables').getPublicUrl(fileName)
          fileUrl = urlData?.publicUrl
        }
      }

      await supabase.from('deliverables').insert({
        project_id: project.id,
        title: formDeliverableTitle,
        description: formDeliverableDescription,
        status: 'awaiting_approval',
        version: 'V1',
        file_url: fileUrl,
        created_at: new Date().toISOString(),
      })

      await supabase.from('notifications').insert({
        user_id: project.client_id,
        type: 'deliverable_submitted',
        title: 'New Deliverable Available',
        message: `"${formDeliverableTitle}" has been submitted for your review`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })

      await logActivity(project.id, `Deliverable "${formDeliverableTitle}" submitted`)
      setShowUploadDeliverable(false)
      resetDeliverableForm()
      fetchProjectData()
    } catch (err) {
      console.error('Add deliverable error:', err)
      alert('Failed to add deliverable')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!project || !formInvoiceAmount) return
    setSaving(true)
    try {
      const amount = parseFloat(formInvoiceAmount)
      const invoiceNumber = `INV-${Date.now()}`

      await supabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        client_id: project.client_id,
        project_id: project.id,
        amount: amount,
        total: amount,
        subtotal: amount,
        discount: 0,
        tax: 0,
        currency: 'USD',
        status: 'sent',
        due_date: formInvoiceDueDate || null,
        issue_date: new Date().toISOString().split('T')[0],
        payment_terms: 'Net 14',
        notes: formInvoiceNotes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      await supabase.from('notifications').insert({
        user_id: project.client_id,
        type: 'invoice_sent',
        title: 'New Invoice Available',
        message: `Invoice ${invoiceNumber} is now available`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })

      await logActivity(project.id, `Invoice ${invoiceNumber} created`)
      setShowCreateInvoice(false)
      resetInvoiceForm()
      fetchProjectData()
    } catch (err) {
      console.error('Create invoice error:', err)
      alert('Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!project || !formNoteContent.trim()) return
    setSaving(true)
    try {
      await supabase.from('internal_notes').insert({
        project_id: project.id,
        content: formNoteContent,
        created_at: new Date().toISOString(),
      })
      setShowAddNote(false)
      setFormNoteContent('')
      fetchProjectData()
    } catch (err) {
      console.error('Add note error:', err)
      alert('Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateMilestoneStatus = async (milestoneId: number, newStatus: string) => {
    try {
      await supabase.from('milestones').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', milestoneId)
      await logActivity(Number(projectId), `Milestone ${newStatus}`)
      fetchProjectData()
    } catch (err) {
      console.error('Update milestone error:', err)
      alert('Failed to update milestone')
    }
  }

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', taskId)
      fetchProjectData()
    } catch (err) {
      console.error('Update task error:', err)
      alert('Failed to update task')
    }
  }

  const logActivity = async (projectId: number, description: string) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: null,
        action_type: 'project_updated',
        description,
        entity_type: 'project',
        entity_id: String(projectId),
        result: 'success',
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.log('Activity log failed (non-fatal):', e)
    }
  }

  function resetMilestoneForm() {
    setFormMilestoneName('')
    setFormMilestoneDescription('')
    setFormMilestoneDueDate('')
    setFormMilestoneWeight('10')
  }

  function resetTaskForm() {
    setFormTaskTitle('')
    setFormTaskDescription('')
    setFormTaskPriority('medium')
    setFormTaskDueDate('')
    setFormTaskMilestoneId('')
  }

  function resetRequirementForm() {
    setFormRequirementTitle('')
    setFormRequirementDescription('')
    setFormRequirementPriority('medium')
    setFormRequirementDueDate('')
  }

  function resetDeliverableForm() {
    setFormDeliverableTitle('')
    setFormDeliverableDescription('')
    setFormDeliverableFile(null)
  }

  function resetInvoiceForm() {
    setFormInvoiceAmount('')
    setFormInvoiceDueDate('')
    setFormInvoiceNotes('')
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      awaiting_client: 'bg-amber-500/20 text-amber-300',
      planning: 'bg-blue-500/20 text-blue-300',
      in_progress: 'bg-green-500/20 text-green-300',
      in_review: 'bg-purple-500/20 text-purple-300',
      client_approval: 'bg-cyan-500/20 text-cyan-300',
      revision: 'bg-orange-500/20 text-orange-300',
      on_hold: 'bg-yellow-500/20 text-yellow-300',
      blocked: 'bg-red-500/20 text-red-300',
      completed: 'bg-emerald-500/20 text-emerald-300',
      cancelled: 'bg-gray-500/20 text-gray-400',
      archived: 'bg-gray-500/20 text-gray-400',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
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

  if (error || !project) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
        <Link href="/admin/projects" className="text-blue-400 hover:underline">Back to Projects</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/projects" className="text-gray-400 hover:text-white text-sm inline-block">← Back to Projects</Link>

      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-sm text-gray-400 mt-1">
              OMN-{project.id} • Client: {project.client_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
            <button
              onClick={() => {
                setFormProjectName(project.name)
                setFormDescription(project.description || '')
                setFormPriority(project.priority || 'medium')
                setFormDeadline(project.expected_completion_date || '')
                setFormBudget(project.budget?.toString() || '')
                setShowEditProject(true)
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              Edit Project
            </button>
            <button
              onClick={() => {
                setFormStatus(project.status)
                setShowStatusChange(true)
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
            >
              Change Status
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>{project.progress || 0}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(project.progress || 0, 100)}%` }}
            />
          </div>
          <button
            onClick={() => {
              setFormProgress(String(project.progress || 0))
              setFormProgressReason('')
              setShowProgressOverride(true)
            }}
            className="text-xs text-blue-400 hover:underline mt-2"
          >
            Manual Override
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setShowAddMilestone(true)} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg">+ Milestone</button>
          <button onClick={() => setShowAddTask(true)} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg">+ Task</button>
          <button onClick={() => setShowRequestRequirement(true)} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg">Request Requirement</button>
          <button onClick={() => setShowUploadDeliverable(true)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg">Upload Deliverable</button>
          <button onClick={() => setShowCreateInvoice(true)} className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg">Create Invoice</button>
          <button onClick={() => setShowAddNote(true)} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg">+ Note</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {['overview', 'milestones', 'tasks', 'requirements', 'deliverables', 'files', 'invoices', 'activity', 'notes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap ${
              activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-400">Milestones</p>
                <p className="text-2xl font-bold text-white">{milestones.filter(m => m.status === 'completed').length} / {milestones.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-400">Tasks</p>
                <p className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'completed').length} / {tasks.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-400">Outstanding</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(invoices.filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0))}
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
              {activity.length === 0 ? <p className="text-gray-500">No activity yet</p> : (
                <div className="space-y-2">
                  {activity.slice(0, 5).map(a => (
                    <div key={a.id} className="text-sm text-gray-300">{a.description}</div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-3">
            {milestones.length === 0 ? <p className="text-gray-500">No milestones</p> : milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{m.name}</p>
                  {m.due_date && <p className="text-xs text-gray-400">Due: {formatDate(m.due_date)}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    m.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    m.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>{m.status}</span>
                  {m.status !== 'completed' && (
                    <button onClick={() => handleUpdateMilestoneStatus(m.id, 'completed')} className="text-green-400 text-xs">Complete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {tasks.length === 0 ? <p className="text-gray-500">No tasks</p> : tasks.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{t.title}</p>
                  {t.due_date && <p className="text-xs text-gray-400">Due: {formatDate(t.due_date)}</p>}
                </div>
                <select
                  value={t.status}
                  onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                  className="bg-white/10 border border-white/20 text-white rounded px-2 py-1 text-xs"
                >
                  <option value="todo" className="bg-gray-900">To Do</option>
                  <option value="in_progress" className="bg-gray-900">In Progress</option>
                  <option value="blocked" className="bg-gray-900">Blocked</option>
                  <option value="in_review" className="bg-gray-900">In Review</option>
                  <option value="completed" className="bg-gray-900">Completed</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-3">
            {requirements.length === 0 ? <p className="text-gray-500">No requirements</p> : requirements.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{r.title}</p>
                  {r.due_date && <p className="text-xs text-gray-400">Due: {formatDate(r.due_date)}</p>}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  r.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                  r.status === 'requested' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-3">
            {deliverables.length === 0 ? <p className="text-gray-500">No deliverables</p> : deliverables.map(d => (
              <div key={d.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{d.title}</p>
                  {d.version && <p className="text-xs text-gray-400">Version: {d.version}</p>}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  d.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                  d.status === 'awaiting_approval' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>{d.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-3">
            {files.length === 0 ? <p className="text-gray-500">No files</p> : files.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-white font-medium">{f.file_name}</p>
                <span className="text-xs text-gray-400">{f.visibility || 'client_visible'}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {invoices.length === 0 ? <p className="text-gray-500">No invoices</p> : invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-400">Due: {formatDate(inv.due_date || '')}</p>
                </div>
                <span className="text-white">{formatCurrency(inv.total || inv.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-2">
            {activity.length === 0 ? <p className="text-gray-500">No activity</p> : activity.map(a => (
              <div key={a.id} className="text-sm text-gray-300">{a.description}</div>
            ))}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-2">
            {notes.length === 0 ? <p className="text-gray-500">No internal notes</p> : notes.map(n => (
              <div key={n.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-white">{n.content}</p>
                <p className="text-xs text-gray-400">{formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Edit Project</h2><button onClick={() => setShowEditProject(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Name</label><input type="text" value={formProjectName} onChange={(e) => setFormProjectName(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Priority</label><select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="low" className="bg-gray-900">Low</option><option value="medium" className="bg-gray-900">Medium</option><option value="high" className="bg-gray-900">High</option></select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Deadline</label><input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Budget</label><input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleSaveProject} disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {showStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Change Status</h2><button onClick={() => setShowStatusChange(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm">
                {PROJECT_STATUSES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
              </select>
              <button onClick={handleStatusChange} disabled={saving} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Updating...' : 'Update Status'}</button>
            </div>
          </div>
        </div>
      )}

      {showProgressOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Manual Progress Override</h2><button onClick={() => setShowProgressOverride(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Progress (0-100)</label><input type="number" value={formProgress} onChange={(e) => setFormProgress(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Reason</label><textarea value={formProgressReason} onChange={(e) => setFormProgressReason(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleProgressOverride} disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Updating...' : 'Update Progress'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Add Milestone</h2><button onClick={() => setShowAddMilestone(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Name</label><input type="text" value={formMilestoneName} onChange={(e) => setFormMilestoneName(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={formMilestoneDescription} onChange={(e) => setFormMilestoneDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Due Date</label><input type="date" value={formMilestoneDueDate} onChange={(e) => setFormMilestoneDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Weight (%)</label><input type="number" value={formMilestoneWeight} onChange={(e) => setFormMilestoneWeight(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleAddMilestone} disabled={saving} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Adding...' : 'Add Milestone'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Add Task</h2><button onClick={() => setShowAddTask(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Title</label><input type="text" value={formTaskTitle} onChange={(e) => setFormTaskTitle(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={formTaskDescription} onChange={(e) => setFormTaskDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Priority</label><select value={formTaskPriority} onChange={(e) => setFormTaskPriority(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="low" className="bg-gray-900">Low</option><option value="medium" className="bg-gray-900">Medium</option><option value="high" className="bg-gray-900">High</option></select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Due Date</label><input type="date" value={formTaskDueDate} onChange={(e) => setFormTaskDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleAddTask} disabled={saving} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Adding...' : 'Add Task'}</button>
            </div>
          </div>
        </div>
      )}

      {showRequestRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Request Requirement</h2><button onClick={() => setShowRequestRequirement(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Title</label><input type="text" value={formRequirementTitle} onChange={(e) => setFormRequirementTitle(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={formRequirementDescription} onChange={(e) => setFormRequirementDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Priority</label><select value={formRequirementPriority} onChange={(e) => setFormRequirementPriority(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="low" className="bg-gray-900">Low</option><option value="medium" className="bg-gray-900">Medium</option><option value="high" className="bg-gray-900">High</option></select></div>
              <button onClick={handleRequestRequirement} disabled={saving} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Sending...' : 'Request Requirement'}</button>
            </div>
          </div>
        </div>
      )}

      {showUploadDeliverable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Upload Deliverable</h2><button onClick={() => setShowUploadDeliverable(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Title</label><input type="text" value={formDeliverableTitle} onChange={(e) => setFormDeliverableTitle(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={formDeliverableDescription} onChange={(e) => setFormDeliverableDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">File</label><input type="file" onChange={(e) => setFormDeliverableFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white" /></div>
              <button onClick={handleAddDeliverable} disabled={saving} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Uploading...' : 'Upload Deliverable'}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Create Invoice</h2><button onClick={() => setShowCreateInvoice(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Amount</label><input type="number" value={formInvoiceAmount} onChange={(e) => setFormInvoiceAmount(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Due Date</label><input type="date" value={formInvoiceDueDate} onChange={(e) => setFormInvoiceDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Notes</label><textarea value={formInvoiceNotes} onChange={(e) => setFormInvoiceNotes(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleCreateInvoice} disabled={saving} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Creating...' : 'Create Invoice'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Add Internal Note</h2><button onClick={() => setShowAddNote(false)} className="text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Note</label><textarea value={formNoteContent} onChange={(e) => setFormNoteContent(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleAddNote} disabled={saving} className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Adding...' : 'Add Note'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}