'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalClients: number
  newClients: number
  activeClients: number
  returningClients: number
  clientRetention: number
  avgLifetimeValue: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  delayedProjects: number
  avgCompletionDays: number
  milestoneCompletionRate: number
  totalRevenue: number
  outstandingInvoices: number
  paidInvoices: number
  overdueInvoices: number
  paymentFailures: number
  collectionsRate: number
  totalLogins: number
  totalMessages: number
  totalFiles: number
  totalIdeas: number
  totalRequirements: number
  revenueByMonth: { month: string; amount: number }[]
  revenueByClient: { client: string; amount: number }[]
  projectsByStatus: { status: string; count: number }[]
  paymentsByMethod: { method: string; count: number }[]
  clientsByMonth: { month: string; count: number }[]
  revenueToday: number
  revenueThisMonth: number
  revenueThisYear: number
  refunds: number
}

const TIME_RANGES: Record<string, string> = {
  'today': 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '180d': 'Last 6 Months',
  '365d': 'Last 12 Months',
  'all': 'All Time',
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalClients: 0,
    newClients: 0,
    activeClients: 0,
    returningClients: 0,
    clientRetention: 0,
    avgLifetimeValue: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    delayedProjects: 0,
    avgCompletionDays: 0,
    milestoneCompletionRate: 0,
    totalRevenue: 0,
    outstandingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    paymentFailures: 0,
    collectionsRate: 0,
    totalLogins: 0,
    totalMessages: 0,
    totalFiles: 0,
    totalIdeas: 0,
    totalRequirements: 0,
    revenueByMonth: [],
    revenueByClient: [],
    projectsByStatus: [],
    paymentsByMethod: [],
    clientsByMonth: [],
    revenueToday: 0,
    revenueThisMonth: 0,
    revenueThisYear: 0,
    refunds: 0,
  })
  
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'projects' | 'financial' | 'engagement'>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const dateFilter = getDateFilter(timeRange)
      
      const [
        clientsData,
        projectsData,
        invoicesData,
        paymentsData,
        milestonesData,
        messagesData,
        filesData,
        ideasData,
        requirementsData,
        activityData,
      ] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: true }),
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('invoices').select('*').order('created_at', { ascending: true }),
        supabase.from('payments').select('*').order('created_at', { ascending: true }),
        supabase.from('milestones').select('*').order('created_at', { ascending: true }),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('files').select('*').order('created_at', { ascending: true }),
        supabase.from('ideas').select('*').order('created_at', { ascending: true }),
        supabase.from('requirements').select('*').order('created_at', { ascending: true }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: true }),
      ])

      const clients = clientsData.data || []
      const projects = projectsData.data || []
      const invoices = invoicesData.data || []
      const payments = paymentsData.data || []
      const milestones = milestonesData.data || []
      const messages = messagesData.data || []
      const files = filesData.data || []
      const ideas = ideasData.data || []
      const requirements = requirementsData.data || []
      const activities = activityData.data || []

      const filteredClients = filterByDate(clients, dateFilter)
      const filteredPayments = filterByDate(payments, dateFilter)
      const filteredMessages = filterByDate(messages, dateFilter)
      const filteredFiles = filterByDate(files, dateFilter)
      const filteredIdeas = filterByDate(ideas, dateFilter)
      const filteredRequirements = filterByDate(requirements, dateFilter)

      // Client analytics
      const totalClients = clients.length
      const newClients = filteredClients.length
      const activeClients = clients.filter(c => (c.status || '') === 'active').length
      const returningClients = clients.filter(c => {
        const clientProjects = projects.filter(p => p.client_id === c.id)
        return clientProjects.length > 1
      }).length
      const clientRetention = totalClients > 0 ? (returningClients / totalClients) * 100 : 0
      
      const clientRevenue = clients.map(client => {
        const clientInvoices = invoices.filter(inv => inv.client_id === client.id)
        return clientInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      })
      const avgLifetimeValue = totalClients > 0 ? clientRevenue.reduce((a, b) => a + b, 0) / totalClients : 0

      // Project analytics
      const totalProjects = projects.length
      const activeProjects = projects.filter(p => ['planning', 'active', 'development'].includes(p.status || '')).length
      const completedProjects = projects.filter(p => p.status === 'completed').length
      const delayedProjects = projects.filter(p => {
        return p.expected_completion_date && new Date(p.expected_completion_date) < new Date() && p.status !== 'completed'
      }).length
      
      const completedDurations = projects
        .filter(p => p.status === 'completed' && p.created_at && p.completed_at)
        .map(p => {
          const start = new Date(p.created_at)
          const end = new Date(p.completed_at)
          return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        })
      const avgCompletionDays = completedDurations.length > 0 
        ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length) 
        : 0

      const totalMilestones = milestones.length
      const completedMilestones = milestones.filter(m => m.status === 'completed').length
      const milestoneCompletionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

      // Financial analytics
      const successfulPayments = payments.filter(p => p.status === 'successful')
      const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const yearStart = new Date(now.getFullYear(), 0, 1)
      
      const revenueToday = successfulPayments
        .filter(p => new Date(p.created_at) >= todayStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      
      const revenueThisMonth = successfulPayments
        .filter(p => new Date(p.created_at) >= monthStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      
      const revenueThisYear = successfulPayments
        .filter(p => new Date(p.created_at) >= yearStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      
      const refunds = payments
        .filter(p => p.status === 'refunded')
        .reduce((sum, p) => sum + Math.abs(p.amount || 0), 0)
      
      const outstandingInvoices = invoices
        .filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status || ''))
        .reduce((sum, inv) => {
          const paid = payments
            .filter(p => p.invoice_id === inv.id && p.status === 'successful')
            .reduce((s, p) => s + p.amount, 0)
          return sum + ((inv.total_amount || 0) - paid)
        }, 0)
      
      const paidInvoices = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      
      const overdueInvoices = invoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      
      const paymentFailures = payments.filter(p => p.status === 'failed').length
      const collectionsRate = (paidInvoices + outstandingInvoices) > 0 
        ? (paidInvoices / (paidInvoices + outstandingInvoices)) * 100 
        : 0

      // Engagement analytics
      const totalLogins = activities.filter(a => a.action_type === 'login').length
      const totalMessages = messages.length
      const totalFiles = files.length
      const totalIdeas = ideas.length
      const totalRequirements = requirements.length

      // Charts
      const revenueByMonth = getRevenueByMonth(payments, timeRange)
      const revenueByClient = getRevenueByClient(clients, invoices)
      const projectsByStatus = getProjectsByStatus(projects)
      const paymentsByMethod = getPaymentsByMethod(payments)
      const clientsByMonth = getClientsByMonth(clients, timeRange)

      setAnalytics({
        totalClients,
        newClients,
        activeClients,
        returningClients,
        clientRetention: Math.round(clientRetention),
        avgLifetimeValue,
        totalProjects,
        activeProjects,
        completedProjects,
        delayedProjects,
        avgCompletionDays,
        milestoneCompletionRate: Math.round(milestoneCompletionRate),
        totalRevenue,
        outstandingInvoices,
        paidInvoices,
        overdueInvoices,
        paymentFailures,
        collectionsRate: Math.round(collectionsRate),
        totalLogins,
        totalMessages,
        totalFiles,
        totalIdeas,
        totalRequirements,
        revenueByMonth,
        revenueByClient,
        projectsByStatus,
        paymentsByMethod,
        clientsByMonth,
        revenueToday,
        revenueThisMonth,
        revenueThisYear,
        refunds,
      })

      setLoading(false)
    } catch (error) {
      console.error('Fetch analytics error:', error)
      setLoading(false)
    }
  }, [timeRange])

  function getDateFilter(range: string): Date | null {
    if (range === 'all' || range === 'today') return null
    const now = new Date()
    const filter = new Date(now)
    const days = parseInt(range.replace('d', '')) || 30
    filter.setDate(now.getDate() - days)
    return filter
  }

  function filterByDate(data: any[], dateFilter: Date | null) {
    if (!dateFilter) return data
    return data.filter(item => {
      const date = item.created_at ? new Date(item.created_at) : null
      return date && date >= dateFilter
    })
  }

  function getRevenueByMonth(payments: any[], range: string): { month: string; amount: number }[] {
    const monthsMap: Record<string, number> = {
      'today': 1,
      '7d': 1,
      '30d': 3,
      '90d': 3,
      '180d': 6,
      '365d': 12,
      'all': 12,
    }
    const months = monthsMap[range] || 3
    const result: { month: string; amount: number }[] = []
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.created_at)
        return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'successful'
      })
      
      const amount = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      result.push({ month: monthKey, amount })
    }
    
    return result
  }

  function getRevenueByClient(clients: any[], invoices: any[]): { client: string; amount: number }[] {
    const result: { client: string; amount: number }[] = []
    
    const sortedClients = [...clients].sort((a, b) => {
      const aRevenue = invoices.filter(inv => inv.client_id === a.id).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      const bRevenue = invoices.filter(inv => inv.client_id === b.id).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      return bRevenue - aRevenue
    })
    
    sortedClients.slice(0, 10).forEach(client => {
      const revenue = invoices
        .filter(inv => inv.client_id === client.id)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      result.push({
        client: client.full_name || client.company || 'Unknown',
        amount: revenue,
      })
    })
    
    return result
  }

  function getProjectsByStatus(projects: any[]): { status: string; count: number }[] {
    const statusMap: Record<string, number> = {}
    
    projects.forEach(project => {
      const status = project.status || 'unknown'
      statusMap[status] = (statusMap[status] || 0) + 1
    })
    
    return Object.entries(statusMap).map(([status, count]) => ({
      status: (status || 'unknown').replace(/_/g, ' '),
      count,
    }))
  }

  function getPaymentsByMethod(payments: any[]): { method: string; count: number }[] {
    const methodMap: Record<string, number> = {}
    
    payments.filter(p => p.status === 'successful').forEach(payment => {
      const method = payment.method || 'unknown'
      methodMap[method] = (methodMap[method] || 0) + 1
    })
    
    return Object.entries(methodMap).map(([method, count]) => ({
      method: (method || 'unknown').replace(/_/g, ' '),
      count,
    }))
  }

  function getClientsByMonth(clients: any[], range: string): { month: string; count: number }[] {
    const monthsMap: Record<string, number> = {
      'today': 1,
      '7d': 1,
      '30d': 3,
      '90d': 3,
      '180d': 6,
      '365d': 12,
      'all': 12,
    }
    const months = monthsMap[range] || 3
    const result: { month: string; count: number }[] = []
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthClients = clients.filter(c => {
        const clientDate = new Date(c.created_at)
        return clientDate >= monthStart && clientDate <= monthEnd
      })
      
      result.push({ month: monthKey, count: monthClients.length })
    }
    
    return result
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  function formatCompactCurrency(amount: number): string {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${(amount || 0).toFixed(0)}`
  }

  function renderBarChart(data: { label: string; value: number }[], color: string = 'bg-blue-500') {
    const maxValue = Math.max(...data.map(d => d.value), 1)
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-20 truncate" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden">
              <div
                className={`h-full ${color} rounded-lg transition-all duration-500 flex items-center`}
                style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }}
              >
                {item.value > 0 && (
                  <span className="text-[10px] text-white px-2 truncate">
                    {item.value >= 1000 ? formatCompactCurrency(item.value) : item.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time business intelligence and performance metrics
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          {Object.entries(TIME_RANGES).map(([value, label]) => (
            <option key={value} value={value} className="bg-gray-900">{label}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'clients', label: 'Clients' },
          { id: 'projects', label: 'Projects' },
          { id: 'financial', label: 'Financial' },
          { id: 'engagement', label: 'Engagement' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-sm text-blue-300">Total Clients</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.totalClients}</p>
              <p className="text-xs text-blue-300 mt-1">+{analytics.newClients} this period</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-sm text-green-300">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCompactCurrency(analytics.totalRevenue)}</p>
              <p className="text-xs text-green-300 mt-1">{analytics.collectionsRate}% collections</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
              <p className="text-sm text-purple-300">Active Projects</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.activeProjects}</p>
              <p className="text-xs text-purple-300 mt-1">{analytics.completedProjects} completed</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-sm text-orange-300">Outstanding</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCompactCurrency(analytics.outstandingInvoices)}</p>
              <p className="text-xs text-orange-300 mt-1">{formatCompactCurrency(analytics.overdueInvoices)} overdue</p>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
            {analytics.revenueByMonth.length > 0 ? (
              renderBarChart(
                analytics.revenueByMonth.map(item => ({
                  label: item.month,
                  value: item.amount,
                })),
                'bg-gradient-to-r from-blue-500 to-green-500'
              )
            ) : (
              <p className="text-gray-500">No revenue data</p>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Projects by Status</h4>
              {analytics.projectsByStatus.length > 0 ? (
                renderBarChart(
                  analytics.projectsByStatus.map(item => ({
                    label: item.status,
                    value: item.count,
                  })),
                  'bg-purple-500'
                )
              ) : (
                <p className="text-gray-500">No project data</p>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Payment Methods</h4>
              {analytics.paymentsByMethod.length > 0 ? (
                renderBarChart(
                  analytics.paymentsByMethod.map(item => ({
                    label: item.method,
                    value: item.count,
                  })),
                  'bg-green-500'
                )
              ) : (
                <p className="text-gray-500">No payment data</p>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Client Growth</h4>
              {analytics.clientsByMonth.length > 0 ? (
                renderBarChart(
                  analytics.clientsByMonth.map(item => ({
                    label: item.month,
                    value: item.count,
                  })),
                  'bg-cyan-500'
                )
              ) : (
                <p className="text-gray-500">No client data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Total Clients</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.totalClients}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">New Clients</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.newClients}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Active Clients</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.activeClients}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Returning Clients</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{analytics.returningClients}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Client Retention Rate</h3>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-white">{analytics.clientRetention}%</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {analytics.returningClients} of {analytics.totalClients} clients have multiple projects
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Average Lifetime Value</h3>
              <p className="text-4xl font-bold text-green-400">{formatCurrency(analytics.avgLifetimeValue)}</p>
              <p className="text-sm text-gray-400 mt-2">Per client</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Clients by Revenue</h3>
            {analytics.revenueByClient.length > 0 ? (
              renderBarChart(
                analytics.revenueByClient.map(item => ({
                  label: item.client,
                  value: item.amount,
                })),
                'bg-blue-500'
              )
            ) : (
              <p className="text-gray-500">No client revenue data</p>
            )}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Total Projects</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.totalProjects}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Active Projects</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.activeProjects}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.completedProjects}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Delayed</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{analytics.delayedProjects}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Average Completion Time</h3>
              <p className="text-4xl font-bold text-purple-400">{analytics.avgCompletionDays} days</p>
              <p className="text-sm text-gray-400 mt-2">Average project duration</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Milestone Completion Rate</h3>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-white">{analytics.milestoneCompletionRate}%</span>
                </div>
                <p className="text-sm text-gray-400">Milestones completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Projects by Status</h3>
            {analytics.projectsByStatus.length > 0 ? (
              renderBarChart(
                analytics.projectsByStatus.map(item => ({
                  label: item.status,
                  value: item.count,
                })),
                'bg-purple-500'
              )
            ) : (
              <p className="text-gray-500">No project data</p>
            )}
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-sm text-green-300">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(analytics.totalRevenue)}</p>
              <p className="text-xs text-green-300 mt-1">Today: {formatCompactCurrency(analytics.revenueToday)}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm text-yellow-300">Outstanding</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(analytics.outstandingInvoices)}</p>
              <p className="text-xs text-yellow-300 mt-1">Overdue: {formatCompactCurrency(analytics.overdueInvoices)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-sm text-blue-300">Paid Invoices</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(analytics.paidInvoices)}</p>
              <p className="text-xs text-blue-300 mt-1">This month: {formatCompactCurrency(analytics.revenueThisMonth)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-sm text-red-300">Payment Failures</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.paymentFailures}</p>
              <p className="text-xs text-red-300 mt-1">Refunds: {formatCompactCurrency(analytics.refunds)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Collections Rate</h3>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-white">{analytics.collectionsRate}%</span>
                </div>
                <p className="text-sm text-gray-400">Percentage of invoices collected</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Revenue This Year</h3>
              <p className="text-4xl font-bold text-green-400">{formatCurrency(analytics.revenueThisYear)}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Methods Distribution</h3>
            {analytics.paymentsByMethod.length > 0 ? (
              renderBarChart(
                analytics.paymentsByMethod.map(item => ({
                  label: item.method,
                  value: item.count,
                })),
                'bg-green-500'
              )
            ) : (
              <p className="text-gray-500">No payment data</p>
            )}
          </div>
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Portal Logins</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.totalLogins}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Messages</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.totalMessages}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Files</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{analytics.totalFiles}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Ideas</p>
              <p className="text-3xl font-bold text-cyan-400 mt-2">{analytics.totalIdeas}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Requirements</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">{analytics.totalRequirements}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Engagement Overview</h3>
            <div className="space-y-4">
              {[
                { label: 'Portal Logins', value: analytics.totalLogins, color: 'bg-blue-500' },
                { label: 'Messages', value: analytics.totalMessages, color: 'bg-green-500' },
                { label: 'Files', value: analytics.totalFiles, color: 'bg-purple-500' },
                { label: 'Ideas', value: analytics.totalIdeas, color: 'bg-cyan-500' },
                { label: 'Requirements', value: analytics.totalRequirements, color: 'bg-orange-500' },
              ].map((item, index) => {
                const maxValue = Math.max(...[
                  analytics.totalLogins,
                  analytics.totalMessages,
                  analytics.totalFiles,
                  analytics.totalIdeas,
                  analytics.totalRequirements,
                ], 1)
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-lg`}
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}