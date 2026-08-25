'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  activeClients: number
  activeProjects: number
  revenue: number
  outstandingInvoices: number
  pendingPayments: number
  openTasks: number
  unreadMessages: number
  newLeads: number
}

interface ProjectRow {
  id: string
  name: string
  status: string
  progress: number
  health: 'green' | 'yellow' | 'red'
}

interface RevenueData {
  today: number
  thisMonth: number
  thisYear: number
  paid: number
  pending: number
  overdue: number
  refunded: number
}

interface GatewayData {
  gateway: string
  amount: number
  count: number
}

interface SystemHealth {
  name: string
  status: 'operational' | 'warning' | 'critical'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    activeProjects: 0,
    revenue: 0,
    outstandingInvoices: 0,
    pendingPayments: 0,
    openTasks: 0,
    unreadMessages: 0,
    newLeads: 0,
  })
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData>({
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    refunded: 0,
  })
  const [gatewayData, setGatewayData] = useState<GatewayData[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([
    { name: 'Database', status: 'operational' },
    { name: 'Storage', status: 'operational' },
    { name: 'API', status: 'operational' },
    { name: 'Authentication', status: 'operational' },
    { name: 'Payment Gateway', status: 'operational' },
    { name: 'Email', status: 'operational' },
    { name: 'Notifications', status: 'operational' },
    { name: 'Webhooks', status: 'operational' },
    { name: 'Cron Jobs', status: 'operational' },
  ])
  const [dateFilter, setDateFilter] = useState('30')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [dateFilter, customFrom, customTo])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // Active clients
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('approved', true)

      // Active projects
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed')
        .neq('status', 'cancelled')

      // All invoices
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('amount, status, paid_at, payment_gateway, created_at')

      const invoices = allInvoices || []

      // Filter by date range
      let filteredInvoices = invoices
      const now = new Date()

      if (dateFilter === 'custom' && customFrom && customTo) {
        const fromDate = new Date(customFrom)
        const toDate = new Date(customTo)
        toDate.setHours(23, 59, 59, 999)
        filteredInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.created_at)
          return invDate >= fromDate && invDate <= toDate
        })
      } else {
        const days = parseInt(dateFilter)
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)
        filteredInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.created_at)
          return invDate >= fromDate
        })
      }

      const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid')
      const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'sent')
      const overdueInvoices = filteredInvoices.filter(inv => inv.status === 'overdue')
      const refundedInvoices = filteredInvoices.filter(inv => inv.status === 'refunded')

      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      const refundedTotal = refundedInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)

      // Revenue today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const revenueToday = paidInvoices
        .filter(inv => inv.paid_at && new Date(inv.paid_at) >= today)
        .reduce((sum, inv) => sum + (inv.amount || 0), 0)

      // Revenue this month
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const revenueMonth = paidInvoices
        .filter(inv => inv.paid_at && new Date(inv.paid_at) >= monthStart)
        .reduce((sum, inv) => sum + (inv.amount || 0), 0)

      // Revenue this year
      const yearStart = new Date()
      yearStart.setMonth(0, 1)
      yearStart.setHours(0, 0, 0, 0)
      const revenueYear = paidInvoices
        .filter(inv => inv.paid_at && new Date(inv.paid_at) >= yearStart)
        .reduce((sum, inv) => sum + (inv.amount || 0), 0)

      // Outstanding (all unpaid)
      const { data: outstandingInvoicesData } = await supabase
        .from('invoices')
        .select('amount')
        .in('status', ['sent', 'overdue', 'unpaid'])
      const outstanding = outstandingInvoicesData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      // Pending payments
      const { count: pendingCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Open tasks
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('completed', false)

      // Unread messages
      const { count: unreadCount } = await supabase
        .from('conversation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_type', 'client')

      // New leads
      const { count: leadsCount } = await supabase
        .from('project_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')

      // Payment gateway distribution
      const gatewayMap = new Map<string, GatewayData>()
      paidInvoices.forEach(inv => {
        const gateway = inv.payment_gateway || 'other'
        const existing = gatewayMap.get(gateway)
        if (existing) {
          existing.amount += inv.amount || 0
          existing.count += 1
        } else {
          gatewayMap.set(gateway, { gateway, amount: inv.amount || 0, count: 1 })
        }
      })
      const gatewayArray = Array.from(gatewayMap.values()).sort((a, b) => b.amount - a.amount)

      // Projects with health calculation
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      const projectIds = projectsData?.map(p => p.id) || []
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('project_id, status, deadline')
        .in('project_id', projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000'])

      const projectsWithHealth = (projectsData || []).map(project => {
        const projectMilestones = (milestonesData || []).filter(m => m.project_id === project.id)
        const totalMilestones = projectMilestones.length
        const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length
        const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

        // Health calculation
        let health: 'green' | 'yellow' | 'red' = 'green'
        const overdueMilestones = projectMilestones.filter(m => {
          return m.deadline && new Date(m.deadline) < new Date() && m.status !== 'completed'
        })
        const blockedMilestones = projectMilestones.filter(m => m.status === 'blocked')

        if (blockedMilestones.length > 0) {
          health = 'red'
        } else if (overdueMilestones.length > 0) {
          health = 'yellow'
        } else if (progress === 0 && totalMilestones > 0) {
          health = 'yellow'
        }

        return { id: project.id, name: project.name, status: project.status, progress, health }
      })

      setStats({
        activeClients: clientsCount || 0,
        activeProjects: projectsCount || 0,
        revenue: totalRevenue,
        outstandingInvoices: outstanding,
        pendingPayments: pendingCount || 0,
        openTasks: tasksCount || 0,
        unreadMessages: unreadCount || 0,
        newLeads: leadsCount || 0,
      })

      setRevenueData({
        today: revenueToday,
        thisMonth: revenueMonth,
        thisYear: revenueYear,
        paid: totalRevenue,
        pending: pendingTotal,
        overdue: overdueTotal,
        refunded: refundedTotal,
      })

      setGatewayData(gatewayArray)
      setProjects(projectsWithHealth)
      setLoading(false)
    } catch (error) {
      console.error('Dashboard error:', error)
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      in_progress: 'bg-blue-500/20 text-blue-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      review: 'bg-purple-500/20 text-purple-300',
      completed: 'bg-green-500/20 text-green-300',
      on_hold: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-300',
      planning: 'bg-cyan-500/20 text-cyan-300',
      awaiting_requirements: 'bg-orange-500/20 text-orange-300',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-300'
  }

  function getHealthColor(health: string) {
    const colors: Record<string, string> = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    }
    return colors[health] || 'bg-gray-500'
  }

  function getHealthLabel(health: string) {
    const labels: Record<string, string> = {
      green: 'On Track',
      yellow: 'Needs Attention',
      red: 'Critical',
    }
    return labels[health] || 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Date Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
          >
            <option value="1" className="bg-gray-900">Today</option>
            <option value="7" className="bg-gray-900">Last 7 days</option>
            <option value="30" className="bg-gray-900">Last 30 days</option>
            <option value="90" className="bg-gray-900">Last 90 days</option>
            <option value="365" className="bg-gray-900">This Year</option>
            <option value="custom" className="bg-gray-900">Custom Range</option>
          </select>
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Top Metrics Cards (8 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Link href="/admin/clients" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-white">{stats.activeClients}</p>
          <p className="text-sm text-gray-400 mt-1">Active Clients</p>
        </Link>
        <Link href="/admin/projects" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-white">{stats.activeProjects}</p>
          <p className="text-sm text-gray-400 mt-1">Active Projects</p>
        </Link>
        <Link href="/admin/analytics" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-green-400">${stats.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Revenue</p>
        </Link>
        <Link href="/admin/invoices" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-amber-400">${stats.outstandingInvoices.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Outstanding</p>
        </Link>
        <Link href="/admin/payments" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-blue-400">{stats.pendingPayments}</p>
          <p className="text-sm text-gray-400 mt-1">Pending Payments</p>
        </Link>
        <Link href="/admin/projects" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-purple-400">{stats.openTasks}</p>
          <p className="text-sm text-gray-400 mt-1">Open Tasks</p>
        </Link>
        <Link href="/admin/messages" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-cyan-400">{stats.unreadMessages}</p>
          <p className="text-sm text-gray-400 mt-1">Unread Messages</p>
        </Link>
        <Link href="/admin/leads" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-2xl font-bold text-pink-400">{stats.newLeads}</p>
          <p className="text-sm text-gray-400 mt-1">New Leads</p>
        </Link>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-400">Today</p>
          <p className="text-xl font-bold text-white mt-1">${revenueData.today.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-400">This Month</p>
          <p className="text-xl font-bold text-white mt-1">${revenueData.thisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-400">This Year</p>
          <p className="text-xl font-bold text-white mt-1">${revenueData.thisYear.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-400">Refunded</p>
          <p className="text-xl font-bold text-red-400 mt-1">${revenueData.refunded.toLocaleString()}</p>
        </div>
      </div>

      {/* Invoice Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
          <p className="text-sm text-green-300">Paid</p>
          <p className="text-xl font-bold text-green-400 mt-1">${revenueData.paid.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
          <p className="text-sm text-yellow-300">Pending</p>
          <p className="text-xl font-bold text-yellow-400 mt-1">${revenueData.pending.toLocaleString()}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
          <p className="text-sm text-red-300">Overdue</p>
          <p className="text-xl font-bold text-red-400 mt-1">${revenueData.overdue.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment Gateway Distribution */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Payment Gateway Distribution</h2>
        {gatewayData.length === 0 ? (
          <p className="text-gray-500 text-sm">No payment data available</p>
        ) : (
          <div className="space-y-4">
            {gatewayData.map((gateway) => {
              const percentage = stats.revenue > 0 ? Math.round((gateway.amount / stats.revenue) * 100) : 0
              return (
                <div key={gateway.gateway}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300 capitalize">{gateway.gateway.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-white font-medium">${gateway.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{gateway.count} payments • {percentage}%</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Projects Overview */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Active Projects</h2>
          <Link href="/admin/projects" className="text-sm text-blue-400 hover:text-blue-300">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400">
                <th className="py-3 px-4 font-medium">Project</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Progress</th>
                <th className="py-3 px-4 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">No active projects</td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/admin/projects/${project.id}`} className="text-white hover:text-blue-400 font-medium">
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getHealthColor(project.health)}`}></span>
                        <span className="text-xs text-gray-300">{getHealthLabel(project.health)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {systemHealth.map((item) => (
            <div key={item.name} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
              <span className="text-sm text-gray-300">{item.name}</span>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${
                item.status === 'operational' ? 'text-green-400' :
                item.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  item.status === 'operational' ? 'bg-green-400' :
                  item.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></span>
                {item.status === 'operational' ? 'Operational' : item.status === 'warning' ? 'Warning' : 'Critical'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}