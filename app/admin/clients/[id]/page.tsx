'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Client {
  id: string
  full_name: string
  company: string
  email: string
  phone: string
  approved: boolean
  created_at: string
}

interface Project {
  id: number
  name: string
  status: string
  progress: number
}

interface Invoice {
  id: number
  invoice_number: string
  total: number
  amount: number
  status: string
  due_date: string | null
}

interface Payment {
  id: number
  amount: number
  status: string
  payment_method: string
  created_at: string
}

interface Activity {
  id: string
  description: string
  created_at: string
}

export default function AdminClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const [stats, setStats] = useState({
    activeProjects: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    outstanding: 0,
  })

  useEffect(() => {
    if (clientId) fetchClientData()
  }, [clientId])

  const fetchClientData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError || !clientData) {
        console.error('Client not found')
        setLoading(false)
        return
      }

      setClient(clientData)

      const [pR, invR, payR, actR] = await Promise.allSettled([
        supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(20),
      ])

      if (pR.status === 'fulfilled') setProjects(pR.value.data || [])
      if (invR.status === 'fulfilled') setInvoices(invR.value.data || [])
      if (payR.status === 'fulfilled') setPayments(payR.value.data || [])
      if (actR.status === 'fulfilled') setActivity(actR.value.data || [])

      // Calculate stats
      const activeProjects = (pR.status === 'fulfilled' ? pR.value.data || [] : []).filter((p: any) => ['active', 'in_progress', 'development'].includes(p.status)).length
      const totalInvoiced = (invR.status === 'fulfilled' ? invR.value.data || [] : []).reduce((sum: number, inv: any) => sum + (inv.total || inv.amount || 0), 0)
      const totalPaid = (payR.status === 'fulfilled' ? payR.value.data || [] : []).filter((p: any) => ['success', 'successful'].includes(p.status)).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      const outstanding = (invR.status === 'fulfilled' ? invR.value.data || [] : []).filter((inv: any) => ['sent', 'viewed', 'overdue'].includes(inv.status)).reduce((sum: number, inv: any) => sum + ((inv.total || inv.amount || 0)), 0)

      setStats({ activeProjects, totalInvoiced, totalPaid, outstanding })
      setLoading(false)
    } catch (err) {
      console.error('Fetch client error:', err)
      setLoading(false)
    }
  }, [clientId])

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      planning: 'bg-blue-500/20 text-blue-300',
      in_progress: 'bg-green-500/20 text-green-300',
      active: 'bg-green-500/20 text-green-300',
      completed: 'bg-emerald-500/20 text-emerald-300',
      overdue: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-400',
    }
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 mb-4">Client not found</p>
        <Link href="/admin/clients" className="text-blue-400 hover:underline">Back to Clients</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="text-gray-400 hover:text-white text-sm inline-block">← Back to Clients</Link>

      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{client.company || client.full_name}</h1>
            <p className="text-sm text-gray-400 mt-1">{client.full_name} • {client.email}</p>
            <p className="text-xs text-gray-500 mt-1">Client since {formatDate(client.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${client.approved ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {client.approved ? 'Active' : 'Pending'}
            </span>
            <Link href={`/admin/chat?client=${client.id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Message</Link>
            <Link href={`/admin/projects?client=${client.id}`} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">+ Project</Link>
            <Link href={`/admin/invoices?client=${client.id}`} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg">+ Invoice</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Active Projects</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.activeProjects}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Invoiced</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalInvoiced)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Outstanding</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(stats.outstanding)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {['overview', 'projects', 'invoices', 'payments', 'activity'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
              {activity.length === 0 ? <p className="text-gray-500">No activity</p> : (
                <div className="space-y-2">
                  {activity.slice(0, 8).map(a => (
                    <div key={a.id} className="text-sm text-gray-300">{a.description}</div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-3">
            {projects.length === 0 ? <p className="text-gray-500">No projects</p> : projects.map(p => (
              <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10">
                <div>
                  <p className="text-white font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400">Progress: {p.progress || 0}%</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(p.status)}`}>{p.status}</span>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {invoices.length === 0 ? <p className="text-gray-500">No invoices</p> : invoices.map(inv => (
              <Link key={inv.id} href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10">
                <div>
                  <p className="text-white font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-400">Due: {formatDate(inv.due_date || '')}</p>
                </div>
                <span className="text-white">{formatCurrency(inv.total || inv.amount)}</span>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-3">
            {payments.length === 0 ? <p className="text-gray-500">No payments</p> : payments.map(pay => (
              <div key={pay.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{formatCurrency(pay.amount)}</p>
                  <p className="text-xs text-gray-400">{pay.payment_method} • {formatDate(pay.created_at)}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${pay.status === 'success' || pay.status === 'successful' ? 'bg-green-500/20 text-green-300' : pay.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>{pay.status}</span>
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
      </div>
    </div>
  )
}
