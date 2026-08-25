'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminReportsPage() {
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    invoices: 0,
    payments: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const [clientsData, projectsData, invoicesData, paymentsData] = await Promise.all([
      supabase.from('clients').select('id'),
      supabase.from('projects').select('id'),
      supabase.from('invoices').select('id, total_amount'),
      supabase.from('payments').select('id, amount, status'),
    ])

    const revenue = (paymentsData.data || [])
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    setStats({
      clients: clientsData.data?.length || 0,
      projects: projectsData.data?.length || 0,
      invoices: invoicesData.data?.length || 0,
      payments: paymentsData.data?.length || 0,
      revenue,
    })
    setLoading(false)
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
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-gray-400 mt-1">Business intelligence reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Clients</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.clients}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Projects</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.projects}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Invoices</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.invoices}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Payments</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.payments}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Revenue</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            ${stats.revenue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Financial Reports</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Revenue Report</li>
            <li>- Invoice Report</li>
            <li>- Payment Report</li>
            <li>- Outstanding Balances</li>
          </ul>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Client Reports</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Client Activity</li>
            <li>- Client Revenue</li>
            <li>- Client Projects</li>
          </ul>
        </div>
      </div>
    </div>
  )
}