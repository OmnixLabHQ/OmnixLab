'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import WelcomeBackBanner from '@/components/WelcomeBackBanner'
import GlobalSearch from '@/components/GlobalSearch'
import ActiveProjectCard from '@/components/dashboard/ActiveProjectCard'
import ActionRequired from '@/components/dashboard/ActionRequired'
import FinancialSummary from '@/components/dashboard/FinancialSummary'
import RecentActivity from '@/components/dashboard/RecentActivity'
import UpcomingSchedule from '@/components/dashboard/UpcomingSchedule'
import NotificationBell from '@/components/NotificationBell'

interface DashboardStats {
  activeProjects: number
  completedProjects: number
  outstanding: number
  unreadMessages: number
  pendingActions: number
  activeProjectsList: any[]
}

function DashboardContent() {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    completedProjects: 0,
    outstanding: 0,
    unreadMessages: 0,
    pendingActions: 0,
    activeProjectsList: [],
  })
  const [loading, setLoading] = useState(true)
  const [hasProjects, setHasProjects] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/portal/login')
        return
      }

      // Fetch client name
      const { data: client } = await supabase
        .from('clients')
        .select('full_name, company, approved')
        .eq('id', user.id)
        .single()

      if (client?.full_name) {
        setClientName(client.full_name)
      }

      // Fetch active projects
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      // Fetch completed projects
      const { data: completedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id)
        .eq('status', 'completed')

      // Fetch outstanding invoices
      const { data: outstandingInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('client_id', user.id)
        .in('status', ['sent', 'overdue', 'unpaid'])

      const outstanding =
        outstandingInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      // Fetch incomplete tasks
      const { data: incompleteTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('completed_by', null)
        .limit(20)

      const pendingActions = incompleteTasks?.length || 0

      // Fetch unread messages (simplified: count all client-visible messages)
      let unreadMessages = 0
      try {
        const { count } = await supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_type', 'admin')
        unreadMessages = count || 0
      } catch {
        unreadMessages = 0
      }

      setStats({
        activeProjects: activeProjects?.length || 0,
        completedProjects: completedProjects?.length || 0,
        outstanding,
        unreadMessages,
        pendingActions,
        activeProjectsList: activeProjects || [],
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
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
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
              Welcome to Omnix Lab{clientName ? `, ${clientName}` : ''}!
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
                { step: 1, title: 'Start Your First Project', description: 'Tell us what you want to build', completed: false },
                { step: 2, title: 'Complete Your Profile', description: 'Add your company information', completed: false },
                { step: 3, title: 'Submit Requirements', description: 'Share documents and specifications', completed: false },
                { step: 4, title: 'Project Kickoff', description: 'Meet your Omnix Lab team', completed: false },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
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
            <Link
              href="/portal/start-project"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 text-center transition-colors"
            >
              <div className="text-3xl mb-2">💡</div>
              <p className="font-semibold">Start a Project</p>
              <p className="text-sm text-blue-100 mt-1">Begin your journey with us</p>
            </Link>
            <Link
              href="/portal/settings"
              className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 text-center transition-colors"
            >
              <div className="text-3xl mb-2">👤</div>
              <p className="font-semibold text-gray-900">Complete Profile</p>
              <p className="text-sm text-gray-500 mt-1">Set up your account</p>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}
              {clientName ? `, ${clientName}` : ''}
            </h1>
            <p className="text-gray-600 mt-2">
              Here&apos;s what&apos;s happening with your projects.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <NotificationBell />
            <Link
              href="/portal/start-project"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              + New Project
            </Link>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/portal/projects" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                <p className="text-sm text-gray-600">Active Projects</p>
              </div>
            </div>
          </Link>

          <Link href="/portal/projects?filter=completed" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </Link>

          <Link href="/portal/invoices" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.outstanding.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Outstanding</p>
              </div>
            </div>
          </Link>

          <Link href="/portal/messages" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💬</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                <p className="text-sm text-gray-600">Unread Messages</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <ActiveProjectCard />
            <ActionRequired />
            <UpcomingSchedule />
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            <FinancialSummary />
            <RecentActivity />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Need Something?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <Link href="/portal/ideas" className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="text-2xl mb-2">✨</span>
              <span className="text-sm font-medium text-gray-700">Share Idea</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <WelcomeBackBanner />
      <DashboardContent />
    </Suspense>
  )
}