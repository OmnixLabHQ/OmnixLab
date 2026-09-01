'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ReportData {
  clients: any[]
  projects: any[]
  invoices: any[]
  payments: any[]
  leads: any[]
  activities: any[]
}

interface ReportSummary {
  totalClients: number
  totalProjects: number
  totalInvoices: number
  totalPayments: number
  totalLeads: number
  totalRevenue: number
  outstandingAmount: number
  paidAmount: number
  overdueAmount: number
  conversionRate: number
  avgProjectDuration: number
  completedProjects: number
  delayedProjects: number
}

const REPORT_TYPES = [
  { id: 'financial', label: 'Financial Reports', icon: '$' },
  { id: 'client', label: 'Client Reports', icon: '[C]' },
  { id: 'project', label: 'Project Reports', icon: '[P]' },
  { id: 'lead', label: 'Lead Reports', icon: '[L]' },
  { id: 'activity', label: 'Activity Reports', icon: '[A]' },
]

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ReportSummary>({
    totalClients: 0,
    totalProjects: 0,
    totalInvoices: 0,
    totalPayments: 0,
    totalLeads: 0,
    totalRevenue: 0,
    outstandingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    conversionRate: 0,
    avgProjectDuration: 0,
    completedProjects: 0,
    delayedProjects: 0,
  })
  
  const [reportData, setReportData] = useState<ReportData>({
    clients: [],
    projects: [],
    invoices: [],
    payments: [],
    leads: [],
    activities: [],
  })
  
  const [activeReport, setActiveReport] = useState('financial')
  const [exporting, setExporting] = useState(false)
  
  // Date range filters
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        clientsData,
        projectsData,
        invoicesData,
        paymentsData,
        leadsData,
        activitiesData,
      ] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }),
      ])

      const clients = clientsData.data || []
      const projects = projectsData.data || []
      const invoices = invoicesData.data || []
      const payments = paymentsData.data || []
      const leads = leadsData.data || []
      const activities = activitiesData.data || []

      setReportData({
        clients,
        projects,
        invoices,
        payments,
        leads,
        activities,
      })

      calculateSummary(clients, projects, invoices, payments, leads)
      setLoading(false)
    } catch (error) {
      console.error('Fetch report data error:', error)
      setLoading(false)
    }
  }, [])

  function calculateSummary(
    clients: any[],
    projects: any[],
    invoices: any[],
    payments: any[],
    leads: any[]
  ) {
    const successfulPayments = payments.filter(p => p.status === 'successful')
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    const outstandingAmount = invoices
      .filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status || ''))
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    
    const wonLeads = leads.filter(l => l.status === 'won').length
    const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0
    
    const completedProjects = projects.filter(p => p.status === 'completed')
    const delayedProjects = projects.filter(p => {
      return p.expected_completion_date && 
             new Date(p.expected_completion_date) < new Date() && 
             p.status !== 'completed'
    })
    
    const projectDurations = completedProjects
      .filter(p => p.created_at && p.completed_at)
      .map(p => {
        const start = new Date(p.created_at)
        const end = new Date(p.completed_at)
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      })
    
    const avgProjectDuration = projectDurations.length > 0
      ? Math.round(projectDurations.reduce((a, b) => a + b, 0) / projectDurations.length)
      : 0

    setSummary({
      totalClients: clients.length,
      totalProjects: projects.length,
      totalInvoices: invoices.length,
      totalPayments: payments.length,
      totalLeads: leads.length,
      totalRevenue,
      outstandingAmount,
      paidAmount,
      overdueAmount,
      conversionRate: Math.round(conversionRate),
      avgProjectDuration,
      completedProjects: completedProjects.length,
      delayedProjects: delayedProjects.length,
    })
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  function formatDate(date: string): string {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function downloadCSV(filename: string, data: any[]) {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          const stringValue = typeof value === 'object' 
            ? JSON.stringify(value).replace(/"/g, '""')
            : String(value).replace(/"/g, '""')
          return `"${stringValue}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleExport(reportType: string, format: 'csv' | 'pdf') {
    setExporting(true)
    try {
      let exportData: any[] = []
      let filename = reportType

      switch (reportType) {
        case 'clients':
          exportData = reportData.clients
          break
        case 'projects':
          exportData = reportData.projects
          break
        case 'invoices':
          exportData = reportData.invoices
          break
        case 'payments':
          exportData = reportData.payments
          break
        case 'leads':
          exportData = reportData.leads
          break
        case 'activity':
          exportData = reportData.activities
          break
        case 'financial':
          exportData = [
            { metric: 'Total Revenue', value: summary.totalRevenue },
            { metric: 'Paid Amount', value: summary.paidAmount },
            { metric: 'Outstanding Amount', value: summary.outstandingAmount },
            { metric: 'Overdue Amount', value: summary.overdueAmount },
            { metric: 'Total Invoices', value: summary.totalInvoices },
            { metric: 'Total Payments', value: summary.totalPayments },
          ]
          break
        case 'project_summary':
          exportData = [
            { metric: 'Total Projects', value: summary.totalProjects },
            { metric: 'Completed Projects', value: summary.completedProjects },
            { metric: 'Delayed Projects', value: summary.delayedProjects },
            { metric: 'Average Duration (days)', value: summary.avgProjectDuration },
          ]
          break
        case 'lead_summary':
          exportData = [
            { metric: 'Total Leads', value: summary.totalLeads },
            { metric: 'Conversion Rate', value: `${summary.conversionRate}%` },
          ]
          break
      }

      if (format === 'csv') {
        downloadCSV(filename, exportData)
      } else if (format === 'pdf') {
        // For PDF, open print window
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write('<html><head><title>Report</title>')
          printWindow.document.write('<style>body { font-family: Arial; padding: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background: #f5f5f5; }</style>')
          printWindow.document.write('</head><body>')
          printWindow.document.write(`<h2>${reportType.replace(/_/g, ' ').toUpperCase()} Report</h2>`)
          printWindow.document.write(`<p>Generated: ${new Date().toLocaleString()}</p>`)
          printWindow.document.write('<table>')
          
          if (exportData.length > 0) {
            const headers = Object.keys(exportData[0])
            printWindow.document.write('<thead><tr>')
            headers.forEach(header => {
              printWindow.document.write(`<th>${header}</th>`)
            })
            printWindow.document.write('</tr></thead><tbody>')
            
            exportData.forEach(row => {
              printWindow.document.write('<tr>')
              headers.forEach(header => {
                printWindow.document.write(`<td>${row[header] || ''}</td>`)
              })
              printWindow.document.write('</tr>')
            })
            printWindow.document.write('</tbody>')
          }
          
          printWindow.document.write('</table></body></html>')
          printWindow.document.close()
          printWindow.print()
        }
      }

      // Log export action
      await supabase.from('audit_logs').insert({
        user_id: null,
        action_type: 'report_exported',
        description: `Exported ${reportType} report as ${format.toUpperCase()}`,
        entity_type: 'report',
        entity_id: null,
      })

    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export report')
    } finally {
      setExporting(false)
    }
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
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-400 mt-1">
            Generate and export business reports
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Time</option>
          <option value="today" className="bg-gray-900">Today</option>
          <option value="7d" className="bg-gray-900">Last 7 Days</option>
          <option value="30d" className="bg-gray-900">Last 30 Days</option>
          <option value="90d" className="bg-gray-900">Last 90 Days</option>
          <option value="365d" className="bg-gray-900">Last 12 Months</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-sm text-green-300">Total Revenue</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-xs text-green-300 mt-1">{summary.totalPayments} payments</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-300">Paid Amount</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.paidAmount)}</p>
          <p className="text-xs text-blue-300 mt-1">{summary.totalInvoices} invoices</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-300">Outstanding</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.outstandingAmount)}</p>
          <p className="text-xs text-yellow-300 mt-1">Awaiting collection</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-300">Overdue</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.overdueAmount)}</p>
          <p className="text-xs text-red-300 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {REPORT_TYPES.map(report => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeReport === report.id
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {report.label}
          </button>
        ))}
      </div>

      {/* Financial Reports */}
      {activeReport === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Revenue Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Revenue</span>
                  <span className="text-lg font-bold text-green-400">{formatCurrency(summary.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Paid Invoices</span>
                  <span className="text-lg font-bold text-blue-400">{formatCurrency(summary.paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Outstanding</span>
                  <span className="text-lg font-bold text-yellow-400">{formatCurrency(summary.outstandingAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Overdue</span>
                  <span className="text-lg font-bold text-red-400">{formatCurrency(summary.overdueAmount)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => handleExport('financial', 'csv')}
                  disabled={exporting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('financial', 'pdf')}
                  disabled={exporting}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Invoice Report</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="py-2">Invoice #</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.invoices.slice(0, 10).map(invoice => (
                    <tr key={invoice.id} className="border-b border-white/5">
                      <td className="py-2 text-white">{invoice.invoice_number || '-'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-300' :
                          invoice.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {invoice.status || '-'}
                        </span>
                      </td>
                      <td className="py-2 text-right text-white">{formatCurrency(invoice.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleExport('invoices', 'csv')}
                  disabled={exporting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  Export Invoices CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Reports */}
      {activeReport === 'client' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Clients</h3>
              <p className="text-3xl font-bold text-blue-400">{summary.totalClients}</p>
              <p className="text-sm text-gray-400 mt-1">Total clients</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Client Revenue</h3>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(summary.totalRevenue)}</p>
              <p className="text-sm text-gray-400 mt-1">Total from all clients</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Client Projects</h3>
              <p className="text-3xl font-bold text-purple-400">{summary.totalProjects}</p>
              <p className="text-sm text-gray-400 mt-1">Total projects</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Client List</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-2">Client</th>
                  <th className="py-2">Company</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.clients.slice(0, 20).map(client => (
                  <tr key={client.id} className="border-b border-white/5">
                    <td className="py-2 text-white">{client.full_name || '-'}</td>
                    <td className="py-2 text-gray-300">{client.company || '-'}</td>
                    <td className="py-2 text-gray-300">{client.email || '-'}</td>
                    <td className="py-2 text-gray-300">{client.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => handleExport('clients', 'csv')}
              disabled={exporting}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              Export Clients CSV
            </button>
          </div>
        </div>
      )}

      {/* Project Reports */}
      {activeReport === 'project' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Total Projects</h3>
              <p className="text-3xl font-bold text-white">{summary.totalProjects}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Completed</h3>
              <p className="text-3xl font-bold text-green-400">{summary.completedProjects}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Delayed</h3>
              <p className="text-3xl font-bold text-red-400">{summary.delayedProjects}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Avg Duration</h3>
              <p className="text-3xl font-bold text-purple-400">{summary.avgProjectDuration} days</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Project List</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-2">Project</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {reportData.projects.slice(0, 20).map(project => (
                  <tr key={project.id} className="border-b border-white/5">
                    <td className="py-2 text-white">{project.name || '-'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        project.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        project.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {project.status || '-'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">{formatDate(project.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleExport('projects', 'csv')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Export Projects CSV
              </button>
              <button
                onClick={() => handleExport('project_summary', 'csv')}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Export Summary CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Reports */}
      {activeReport === 'lead' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Total Leads</h3>
              <p className="text-3xl font-bold text-blue-400">{summary.totalLeads}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Conversion Rate</h3>
              <p className="text-3xl font-bold text-green-400">{summary.conversionRate}%</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Won Leads</h3>
              <p className="text-3xl font-bold text-purple-400">
                {reportData.leads.filter(l => l.status === 'won').length}
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Pipeline</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-2">Lead</th>
                  <th className="py-2">Source</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {reportData.leads.slice(0, 20).map(lead => (
                  <tr key={lead.id} className="border-b border-white/5">
                    <td className="py-2 text-white">{lead.name || '-'}</td>
                    <td className="py-2 text-gray-300">{lead.source || '-'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        lead.status === 'won' ? 'bg-green-500/20 text-green-300' :
                        lead.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {lead.status || '-'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">{formatDate(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleExport('leads', 'csv')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Export Leads CSV
              </button>
              <button
                onClick={() => handleExport('lead_summary', 'csv')}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Export Summary CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Reports */}
      {activeReport === 'activity' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {reportData.activities.slice(0, 20).map(activity => (
                <div key={activity.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-sm text-white">{activity.description || '-'}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(activity.created_at)}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleExport('activity', 'csv')}
              disabled={exporting}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              Export Activity CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
