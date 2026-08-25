'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeClients: 0,
    activeProjects: 0,
    revenue: 0,
    outstandingInvoices: 0,
    pendingPayments: 0,
    newLeads: 0,
  })
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
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

      // Revenue (paid invoices)
      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
      const revenue = paidInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      // Outstanding invoices
      const { data: outstandingInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .in('status', ['sent', 'overdue', 'unpaid'])
      const outstanding = outstandingInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      // Pending payments
      const { count: pendingCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // New leads (project_requests with status new)
      const { count: leadsCount } = await supabase
        .from('project_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')

      // Active projects list
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      setStats({
        activeClients: clientsCount || 0,
        activeProjects: projectsCount || 0,
        revenue,
        outstandingInvoices: outstanding,
        pendingPayments: pendingCount || 0,
        newLeads: leadsCount || 0,
      })
      setProjects(projectsData || [])
      setLoading(false)
    } catch (error) {
      console.error('Dashboard error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link href="/admin/clients" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-3xl font-bold text-white">{stats.activeClients}</p>
          <p className="text-sm text-gray-400 mt-1">Active Clients</p>
        </Link>
        <Link href="/admin/projects" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-3xl font-bold text-white">{stats.activeProjects}</p>
          <p className="text-sm text-gray-400 mt-1">Active Projects</p>
        </Link>
        <Link href="/admin/analytics" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-3xl font-bold text-green-400">${stats.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Revenue</p>
        </Link>
        <Link href="/admin/invoices" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-3xl font-bold text-amber-400">${stats.outstandingInvoices.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Outstanding</p>
        </Link>
        <Link href="/admin/payments" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-3xl font-bold text-blue-400">{stats.pendingPayments}</p>
          <p className="text-sm text-gray-400 mt-1">Pending Payments</p>
        </Link>
        <Link href="/admin/leads" className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
          <p className="text-3xl font-bold text-purple-400">{stats.newLeads}</p>
          <p className="text-sm text-gray-400 mt-1">New Leads</p>
        </Link>
      </div>

      {/* Projects Overview */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Active Projects</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    No active projects
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <Link href={`/admin/projects/${project.id}`} className="text-white hover:text-blue-400">
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full max-w-[150px] h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Revenue Overview</h2>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Chart will be added in Analytics phase
        </div>
      </div>
    </div>
  )
}