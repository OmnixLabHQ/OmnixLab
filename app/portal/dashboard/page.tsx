'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import WelcomeBackBanner from '@/components/WelcomeBackBanner'
import GlobalSearch from '@/components/GlobalSearch'
import NotificationBell from '@/components/NotificationBell'

interface Project {
  id: string
  name: string
  status: string
  progress: number
  current_milestone: string
  deadline: string
}

interface Requirement {
  id: string
  title: string
  status: string
  project_id: string | null
}

interface Activity {
  id: string
  title: string
  description: string | null
  created_at: string
}

interface File {
  id: string
  file_name: string
  created_at: string
}

interface MessagePreview {
  id: string
  title: string
  last_message: string
}

interface Payment {
  id: string
  amount: number
  dueDate: string
  invoiceNumber: string
}

interface Idea {
  id: string
  title: string
  status: string
}

interface DashboardData {
  clientName: string
  activeProjects: number
  completedProjects: number
  pendingActions: number
  unreadMessages: number
  outstandingBalance: number
  upcomingPayments: Payment[]
  recentActivity: Activity[]
  recentFiles: File[]
  recentMessages: MessagePreview[]
  pendingRequirements: Requirement[]
  pendingApprovals: Array<{ id: string; title: string; project_id: string | null }>
  activeProjectsList: Project[]
  ideas: Idea[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProjects, setHasProjects] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      // Fetch client name
      const { data: client } = await supabase
        .from('clients')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Fetch active projects
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .neq('status', 'completed')
        .neq('status', 'cancelled')

      // Fetch completed projects
      const { data: completedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id)
        .eq('status', 'completed')

      // Fetch outstanding invoices
      const { data: outstandingInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .in('status', ['sent', 'overdue', 'unpaid'])

      // Fetch pending requirements
      const { data: pendingRequirementsData } = await supabase
        .from('requirements')
        .select('*')
        .eq('client_id', user.id)
        .neq('status', 'completed')
        .neq('status', 'accepted')
        .limit(5)

      // Fetch pending approvals
      const { data: pendingApprovalsData } = await supabase
        .from('approvals')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .limit(5)

      // Fetch activity logs
      const { data: activityData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch recent files
      const { data: filesData } = await supabase
        .from('files')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch recent conversations
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(3)

      // Fetch ideas
      const { data: ideasData } = await supabase
        .from('ideas')
        .select('*')
        .eq('client_id', user.id)
        .eq('deleted', false)
        .order('updated_at', { ascending: false })
        .limit(3)

      // Fetch milestones for progress calculation
      const projectIds = (activeProjects || []).map(p => p.id)
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .in('project_id', projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000'])

      // Calculate project progress from milestones
      const projectsWithProgress: Project[] = (activeProjects || []).map(project => {
        const projectMilestones = (milestonesData || []).filter(m => m.project_id === project.id)
        const totalMilestones = projectMilestones.length
        const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length
        const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

        const currentMilestone = projectMilestones.find(m => m.status === 'in_progress')?.title || ''

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          progress,
          current_milestone: currentMilestone,
          deadline: project.end_date || '',
        }
      })

      // Calculate outstanding balance
      const outstandingBalance = (outstandingInvoices || []).reduce(
        (sum, inv) => sum + (inv.amount || inv.total || 0),
        0
      )

      // Calculate pending actions
      const pendingActions = (pendingRequirementsData?.length || 0) +
        (pendingApprovalsData?.length || 0) +
        (outstandingInvoices?.length || 0)

      // Build upcoming payments
      const upcomingPayments: Payment[] = (outstandingInvoices || [])
        .map(inv => ({
          id: inv.id,
          amount: inv.amount || inv.total || 0,
          dueDate: inv.due_date || '',
          invoiceNumber: inv.invoice_number || `INV-${String(inv.id).slice(0, 8)}`,
        }))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3)

      setData({
        clientName: client?.full_name || 'Client',
        activeProjects: activeProjects?.length || 0,
        completedProjects: completedProjects?.length || 0,
        pendingActions,
        unreadMessages: 0,
        outstandingBalance,
        upcomingPayments,
        recentActivity: (activityData || []).map(a => ({
          id: a.id,
          title: a.title,
          description: a.description || null,
          created_at: a.created_at,
        })),
        recentFiles: (filesData || []).map(f => ({
          id: f.id,
          file_name: f.file_name,
          created_at: f.created_at,
        })),
        recentMessages: (conversationsData || []).map(c => ({
          id: c.id,
          title: c.title,
          last_message: '',
        })),
        pendingRequirements: (pendingRequirementsData || []).map(r => ({
          id: r.id,
          title: r.title,
          status: r.status,
          project_id: r.project_id || null,
        })),
        pendingApprovals: (pendingApprovalsData || []).map(a => ({
          id: a.id,
          title: a.title,
          project_id: a.project_id || null,
        })),
        activeProjectsList: projectsWithProgress,
        ideas: (ideasData || []).map(i => ({
          id: i.id,
          title: i.title,
          status: i.status,
        })),
      })

      setHasProjects(
        (activeProjects?.length || 0) > 0 || (completedProjects?.length || 0) > 0
      )
      setLoading(false)
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setLoading(false)
    }
  }

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Empty state for brand new clients
  if (!hasProjects) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Omnix Lab{data?.clientName ? `, ${data.clientName}` : ''}!
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Your project workspace is ready. Start your first project and
              you&apos;ll be able to track development, milestones, files,
              payments, and communication all in one place.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
            <h3 className="font-semibold text-gray-900 mb-6">Getting Started</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Start Your First Project', description: 'Tell us what you want to build' },
                { step: 2, title: 'Complete Your Profile', description: 'Add your company information' },
                { step: 3, title: 'Submit Requirements', description: 'Share documents and specifications' },
                { step: 4, title: 'Project Kickoff', description: 'Meet your Omnix Lab team' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/portal/start-project" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 text-center transition-colors">
              <div className="text-3xl mb-2">💡</div>
              <p className="font-semibold">Start a Project</p>
            </Link>
            <Link href="/portal/settings" className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 text-center transition-colors">
              <div className="text-3xl mb-2">👤</div>
              <p className="font-semibold text-gray-900">Complete Profile</p>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <WelcomeBackBanner />
      </Suspense>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {data?.clientName}
            </h1>
            <p className="text-gray-600 mt-2">
              Here&apos;s what&apos;s happening across your Omnix projects.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <GlobalSearch />
            <NotificationBell />
            <Link
              href="/portal/start-project"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              + Start New Project
            </Link>
          </div>
        </div>

        {/* EXECUTIVE SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/portal/projects" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Active Projects</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data?.activeProjects}</p>
            <p className="text-xs text-gray-500 mt-1">View Projects →</p>
          </Link>
          <Link href="/portal/dashboard" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Actions Required</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{data?.pendingActions}</p>
            <p className="text-xs text-gray-500 mt-1">Tasks waiting for you →</p>
          </Link>
          <Link href="/portal/invoices" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              ${(data?.outstandingBalance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">View Payments →</p>
          </Link>
          <Link href="/portal/messages" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Unread Messages</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{data?.unreadMessages || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Open Messages →</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* ACTION REQUIRED */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">🔴 Action Required</h3>
                <span className="text-sm text-gray-500">{data?.pendingActions || 0} items</span>
              </div>

              {/* Pending Approvals */}
              {data?.pendingApprovals && data.pendingApprovals.length > 0 && (
                <div className="space-y-3 mb-4">
                  {data.pendingApprovals.map((approval) => (
                    <Link
                      key={approval.id}
                      href={approval.project_id ? `/portal/projects/${approval.project_id}` : '/portal/projects'}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">🔴 {approval.title}</p>
                        <p className="text-xs text-gray-600">Approval required</p>
                      </div>
                      <span className="text-red-600 text-sm">Review →</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pending Requirements */}
              {data?.pendingRequirements && data.pendingRequirements.length > 0 && (
                <div className="space-y-3 mb-4">
                  {data.pendingRequirements.map((req) => (
                    <Link
                      key={req.id}
                      href={req.project_id ? `/portal/projects/${req.project_id}` : '/portal/projects'}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">🟡 {req.title}</p>
                        <p className="text-xs text-gray-600">Status: {req.status.replace(/_/g, ' ')}</p>
                      </div>
                      <span className="text-amber-600 text-sm">Upload →</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Outstanding Invoices */}
              {data?.upcomingPayments && data.upcomingPayments.length > 0 && (
                <div className="space-y-3">
                  {data.upcomingPayments.map((payment) => (
                    <Link
                      key={payment.id}
                      href={`/portal/invoices/${payment.id}`}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">🟢 Pay {payment.invoiceNumber}</p>
                        <p className="text-xs text-gray-600">Due {new Date(payment.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className="text-green-600 text-sm font-semibold">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {(!data?.pendingApprovals || data.pendingApprovals.length === 0) &&
               (!data?.pendingRequirements || data.pendingRequirements.length === 0) &&
               (!data?.upcomingPayments || data.upcomingPayments.length === 0) && (
                <p className="text-gray-500 text-sm">No pending actions. You&apos;re all caught up! ✅</p>
              )}
            </div>

            {/* YOUR PROJECTS */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Your Projects</h3>
                <Link href="/portal/projects" className="text-sm text-blue-600">View All →</Link>
              </div>
              {data?.activeProjectsList && data.activeProjectsList.length > 0 ? (
                <div className="space-y-4">
                  {data.activeProjectsList.map((project) => (
                    <Link
                      key={project.id}
                      href={`/portal/projects/${project.id}`}
                      className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          project.status === 'review' ? 'bg-purple-100 text-purple-700' :
                          project.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.current_milestone || 'No current milestone'}
                        {project.deadline && ` • Due ${new Date(project.deadline).toLocaleDateString()}`}
                      </p>
                      <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-medium text-gray-900">{project.progress || 0}%</span>
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500">Health: </span>
                        <span className={project.progress >= 50 ? 'text-green-600' : 'text-amber-600'}>
                          {project.progress >= 50 ? '🟢 Healthy' : '🟡 In Progress'}
                        </span>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-sm text-blue-600">Open Project →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No active projects.</p>
              )}
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {data.recentActivity.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">📌</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-6">
            {/* UPCOMING */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📅 Upcoming</h3>
              {data?.upcomingPayments && data.upcomingPayments.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingPayments.map((payment) => (
                    <Link
                      key={payment.id}
                      href={`/portal/invoices/${payment.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          Due {new Date(payment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No upcoming payments.</p>
              )}
            </div>

            {/* FINANCIAL OVERVIEW */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💰 Financial Overview</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                ${(data?.outstandingBalance || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
              <Link href="/portal/payments" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                View Payments →
              </Link>
            </div>

            {/* MESSAGES PREVIEW */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💬 Messages</h3>
              {data?.recentMessages && data.recentMessages.length > 0 ? (
                <div className="space-y-2">
                  {data.recentMessages.map((msg) => (
                    <Link
                      key={msg.id}
                      href="/portal/messages"
                      className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{msg.title}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No messages yet.</p>
              )}
              <Link href="/portal/messages" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                Open Messages →
              </Link>
            </div>

            {/* RECENT FILES */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📁 Recent Files</h3>
              {data?.recentFiles && data.recentFiles.length > 0 ? (
                <div className="space-y-2">
                  {data.recentFiles.slice(0, 3).map((file) => (
                    <Link
                      key={file.id}
                      href="/portal/files"
                      className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">📄 {file.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No files yet.</p>
              )}
              <Link href="/portal/files" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                View All Files →
              </Link>
            </div>

            {/* IDEAS */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💡 Your Ideas</h3>
              {data?.ideas && data.ideas.length > 0 ? (
                <div className="space-y-2">
                  {data.ideas.map((idea) => (
                    <Link
                      key={idea.id}
                      href={`/portal/ideas/${idea.id}`}
                      className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{idea.title}</p>
                      <p className="text-xs text-gray-500">{idea.status.replace(/_/g, ' ')}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No ideas yet.</p>
              )}
              <Link href="/portal/ideas" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                View Ideas →
              </Link>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Need Something?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Link href="/portal/start-project" className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="text-2xl mb-2">💡</span>
              <span className="text-sm font-medium text-gray-700">Start Project</span>
            </Link>
            <Link href="/portal/messages" className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="text-2xl mb-2">💬</span>
              <span className="text-sm font-medium text-gray-700">Send Message</span>
            </Link>
            <Link href="/portal/files" className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="text-2xl mb-2">📁</span>
              <span className="text-sm font-medium text-gray-700">Upload File</span>
            </Link>
            <Link href="/portal/invoices" className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="text-2xl mb-2">💰</span>
              <span className="text-sm font-medium text-gray-700">View Invoice</span>
            </Link>
            <Link href="/portal/support" className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="text-2xl mb-2">🎫</span>
              <span className="text-sm font-medium text-gray-700">Request Help</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}