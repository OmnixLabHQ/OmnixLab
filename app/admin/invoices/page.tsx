'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_id: string
  offer_id: string | null
  total_amount: number
  currency: string
  status: string
  discount: number
  tax: number
  subtotal: number
  due_date: string
  client_name: string
  project_name: string
  created_at: string
  updated_at: string
  sent_at: string | null
  paid_at: string | null
  items: InvoiceItem[]
  payments: any[]
}

const ITEMS_PER_PAGE = 10

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedInvoices, setPaginatedInvoices] = useState<Invoice[]>([])
  
  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  
  // Form states
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('')
  const [formClientId, setFormClientId] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formCurrency, setFormCurrency] = useState('USD')
  const [formDueDate, setFormDueDate] = useState('')
  const [formDiscount, setFormDiscount] = useState('0')
  const [formTax, setFormTax] = useState('0')
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 }
  ])
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  
  // Refund form
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  
  // Data
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  // UI states
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    outstanding: 0,
    paid: 0,
    overdue: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, invoices])

  useEffect(() => {
    updatePagination()
  }, [filteredInvoices, currentPage])

  useEffect(() => {
    calculateStats()
  }, [invoices])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name, company, email')
        .order('created_at', { ascending: false })
      setClients(clientsData || [])

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
      setProjects(projectsData || [])

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      const invoicesWithDetails = await Promise.all(
        (invoicesData || []).map(async (invoice) => {
          let clientName = 'Unknown'
          if (invoice.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', invoice.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          let projectName = 'General'
          if (invoice.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', invoice.project_id)
              .single()
            projectName = project?.name || 'General'
          }

          // Fetch invoice items
          const { data: itemsData } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id)

          // Fetch payments
          const { data: paymentsData } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoice.id)

          return {
            ...invoice,
            client_name: clientName,
            project_name: projectName,
            items: itemsData || [],
            payments: paymentsData || [],
          }
        })
      )

      setInvoices(invoicesWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch invoices error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats() {
    const total = invoices.length
    const outstanding = invoices
      .filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.total_amount - getPaidAmount(inv)), 0)
    const paid = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0)
    const overdue = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total_amount - getPaidAmount(inv)), 0)

    setStats({ total, outstanding, paid, overdue })
  }

  function getPaidAmount(invoice: Invoice) {
    return (invoice.payments || [])
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  function applyFilters() {
    let filtered = [...invoices]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number?.toLowerCase().includes(term) ||
          invoice.client_name?.toLowerCase().includes(term) ||
          invoice.project_name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
    setCurrentPage(1)
  }

  function updatePagination() {
    const total = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE)
    setTotalPages(total || 1)
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setPaginatedInvoices(filteredInvoices.slice(start, end))
  }

  function calculateItemAmount(item: InvoiceItem) {
    return item.quantity * item.unit_price
  }

  function calculateSubtotal() {
    return formItems.reduce((sum, item) => sum + calculateItemAmount(item), 0)
  }

  function calculateTotal() {
    const subtotal = calculateSubtotal()
    const discount = parseFloat(formDiscount) || 0
    const tax = parseFloat(formTax) || 0
    return subtotal - discount + (subtotal * tax / 100)
  }

  function resetForm() {
    setFormInvoiceNumber('')
    setFormClientId('')
    setFormProjectId('')
    setFormCurrency('USD')
    setFormDueDate('')
    setFormDiscount('0')
    setFormTax('0')
    setFormItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function addItem() {
    setFormItems([...formItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function removeItem(index: number) {
    if (formItems.length === 1) return
    const newItems = formItems.filter((_, i) => i !== index)
    setFormItems(newItems)
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: any) {
    const newItems = [...formItems]
    newItems[index] = { ...newItems[index], [field]: value }
    newItems[index].amount = calculateItemAmount(newItems[index])
    setFormItems(newItems)
  }

  async function handleCreateInvoice() {
    if (!formClientId || formItems.length === 0 || !formItems[0].description) {
      alert('Please fill in required fields: Client and at least one line item')
      return
    }

    setSaving(true)
    try {
      const subtotal = calculateSubtotal()
      const discount = parseFloat(formDiscount) || 0
      const tax = parseFloat(formTax) || 0
      const total = subtotal - discount + (subtotal * tax / 100)

      const invoiceNumber = formInvoiceNumber || `INV-${Date.now()}`

      const { data: newInvoice } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: formClientId,
          project_id: formProjectId || null,
          subtotal: subtotal,
          discount: discount,
          tax: tax,
          total_amount: total,
          currency: formCurrency,
          status: 'draft',
          due_date: formDueDate || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newInvoice) {
        // Insert invoice items
        const itemsToInsert = formItems.map(item => ({
          invoice_id: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
        }))
        await supabase.from('invoice_items').insert(itemsToInsert)

        // Create activity log
        await supabase.from('activity_logs').insert({
          user_id: formClientId,
          action_type: 'invoice_created',
          description: `Invoice ${invoiceNumber} created`,
          entity_type: 'invoice',
          entity_id: newInvoice.id,
        })
      }

      setShowCreateModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Create invoice error:', error)
      alert('Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditInvoice() {
    if (!selectedInvoice || !formClientId || formItems.length === 0) {
      alert('Please fill in required fields')
      return
    }

    setSaving(true)
    try {
      const subtotal = calculateSubtotal()
      const discount = parseFloat(formDiscount) || 0
      const tax = parseFloat(formTax) || 0
      const total = subtotal - discount + (subtotal * tax / 100)

      await supabase
        .from('invoices')
        .update({
          client_id: formClientId,
          project_id: formProjectId || null,
          subtotal: subtotal,
          discount: discount,
          tax: tax,
          total_amount: total,
          currency: formCurrency,
          due_date: formDueDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedInvoice.id)

      // Delete old items and insert new ones
      await supabase.from('invoice_items').delete().eq('invoice_id', selectedInvoice.id)
      
      const itemsToInsert = formItems.map(item => ({
        invoice_id: selectedInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
      }))
      await supabase.from('invoice_items').insert(itemsToInsert)

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: formClientId,
        action_type: 'invoice_updated',
        description: `Invoice ${selectedInvoice.invoice_number} updated`,
        entity_type: 'invoice',
        entity_id: selectedInvoice.id,
      })

      setShowEditModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Edit invoice error:', error)
      alert('Failed to edit invoice')
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicateInvoice(invoice: Invoice) {
    if (!confirm(`Duplicate invoice ${invoice.invoice_number}?`)) return

    const { data: newInvoice } = await supabase
      .from('invoices')
      .insert({
        invoice_number: `${invoice.invoice_number}-COPY`,
        client_id: invoice.client_id,
        project_id: invoice.project_id,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        tax: invoice.tax,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        status: 'draft',
        due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newInvoice && invoice.items) {
      const itemsToInsert = invoice.items.map(item => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }))
      await supabase.from('invoice_items').insert(itemsToInsert)
    }

    fetchData()
  }

  async function handleSendInvoice(invoice: Invoice) {
    if (!confirm(`Send invoice ${invoice.invoice_number} to ${invoice.client_name}?`)) return

    setProcessing(true)
    try {
      await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)

      // Create notification
      await supabase.from('notifications').insert({
        user_id: invoice.client_id,
        type: 'invoice_sent',
        title: 'New Invoice Available',
        message: `Invoice ${invoice.invoice_number} is now available`,
        read: false,
        created_at: new Date().toISOString(),
      })

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: invoice.client_id,
        action_type: 'invoice_sent',
        description: `Invoice ${invoice.invoice_number} sent to client`,
        entity_type: 'invoice',
        entity_id: invoice.id,
      })

      fetchData()
    } catch (error) {
      console.error('Send invoice error:', error)
      alert('Failed to send invoice')
    } finally {
      setProcessing(false)
    }
  }

  async function handleRecordPayment() {
    if (!selectedInvoice || !paymentAmount) {
      alert('Please enter payment amount')
      return
    }

    setProcessing(true)
    try {
      const amount = parseFloat(paymentAmount)
      const paidAmount = getPaidAmount(selectedInvoice)
      const remainingAmount = selectedInvoice.total_amount - paidAmount

      if (amount > remainingAmount) {
        alert(`Payment amount exceeds remaining balance: ${remainingAmount}`)
        setProcessing(false)
        return
      }

      // Create payment record
      await supabase.from('payments').insert({
        invoice_id: selectedInvoice.id,
        client_id: selectedInvoice.client_id,
        amount: amount,
        currency: selectedInvoice.currency,
        method: paymentMethod,
        reference: paymentReference,
        status: 'successful',
        created_at: paymentDate || new Date().toISOString(),
      })

      // Update invoice status
      const newPaidAmount = paidAmount + amount
      let newStatus = 'partially_paid'
      if (newPaidAmount >= selectedInvoice.total_amount) {
        newStatus = 'paid'
      }

      await supabase
        .from('invoices')
        .update({
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedInvoice.id)

      // Create notification
      await supabase.from('notifications').insert({
        user_id: selectedInvoice.client_id,
        type: 'payment_received',
        title: 'Payment Received',
        message: `Payment of ${amount} received for invoice ${selectedInvoice.invoice_number}`,
        read: false,
        created_at: new Date().toISOString(),
      })

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: selectedInvoice.client_id,
        action_type: 'payment_recorded',
        description: `Payment of ${amount} recorded for invoice ${selectedInvoice.invoice_number}`,
        entity_type: 'invoice',
        entity_id: selectedInvoice.id,
      })

      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentMethod('bank_transfer')
      setPaymentReference('')
      setPaymentDate('')
      fetchData()
    } catch (error) {
      console.error('Record payment error:', error)
      alert('Failed to record payment')
    } finally {
      setProcessing(false)
    }
  }

  async function handleIssueRefund() {
    if (!selectedInvoice || !refundAmount) {
      alert('Please enter refund amount')
      return
    }

    setProcessing(true)
    try {
      const amount = parseFloat(refundAmount)

      // Create refund record
      await supabase.from('payments').insert({
        invoice_id: selectedInvoice.id,
        client_id: selectedInvoice.client_id,
        amount: -amount,
        currency: selectedInvoice.currency,
        method: 'refund',
        reference: `REFUND-${Date.now()}`,
        status: 'refunded',
        created_at: new Date().toISOString(),
      })

      // Update invoice status
      await supabase
        .from('invoices')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedInvoice.id)

      // Create notification
      await supabase.from('notifications').insert({
        user_id: selectedInvoice.client_id,
        type: 'refund_issued',
        title: 'Refund Issued',
        message: `Refund of ${amount} issued for invoice ${selectedInvoice.invoice_number}`,
        read: false,
        created_at: new Date().toISOString(),
      })

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: selectedInvoice.client_id,
        action_type: 'refund_issued',
        description: `Refund of ${amount} issued for invoice ${selectedInvoice.invoice_number} - ${refundReason}`,
        entity_type: 'invoice',
        entity_id: selectedInvoice.id,
      })

      setShowRefundModal(false)
      setRefundAmount('')
      setRefundReason('')
      fetchData()
    } catch (error) {
      console.error('Issue refund error:', error)
      alert('Failed to issue refund')
    } finally {
      setProcessing(false)
    }
  }

  async function handleCancelInvoice(invoice: Invoice) {
    if (!confirm(`Cancel invoice ${invoice.invoice_number}?`)) return

    await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    fetchData()
  }

  async function handleVoidInvoice(invoice: Invoice) {
    if (!confirm(`Void invoice ${invoice.invoice_number}? This cannot be undone.`)) return

    await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    fetchData()
  }

  async function handleDownloadPDF(invoice: Invoice) {
    // For now, open print view
    window.open(`/portal/invoices/${invoice.id}/print`, '_blank')
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      sent: 'bg-blue-500/20 text-blue-300',
      viewed: 'bg-cyan-500/20 text-cyan-300',
      partially_paid: 'bg-yellow-500/20 text-yellow-300',
      paid: 'bg-green-500/20 text-green-300',
      overdue: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-400',
      refunded: 'bg-orange-500/20 text-orange-300',
    }
    return map[status.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0)
  }

  function formatDate(date: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredInvoices.length} total invoices
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Invoices</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(stats.outstanding, 'USD')}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.paid, 'USD')}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(stats.overdue, 'USD')}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by invoice number, client, or project..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="draft" className="bg-gray-900">Draft</option>
          <option value="sent" className="bg-gray-900">Sent</option>
          <option value="viewed" className="bg-gray-900">Viewed</option>
          <option value="partially_paid" className="bg-gray-900">Partially Paid</option>
          <option value="paid" className="bg-gray-900">Paid</option>
          <option value="overdue" className="bg-gray-900">Overdue</option>
          <option value="cancelled" className="bg-gray-900">Cancelled</option>
          <option value="refunded" className="bg-gray-900">Refunded</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Invoice</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Due Date</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="text-4xl mb-3">🧾</div>
                  <p className="text-gray-500">No invoices found</p>
                  <p className="text-gray-600 text-xs mt-1">Create your first invoice to get started</p>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelectedInvoice(invoice); setShowDetailModal(true); }}
                      className="text-white font-medium hover:text-blue-400 text-left"
                    >
                      {invoice.invoice_number}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{invoice.client_name}</td>
                  <td className="py-3 px-4 text-gray-300">{invoice.project_name}</td>
                  <td className="py-3 px-4 text-white font-medium">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(invoice.due_date)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(invoice.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { setSelectedInvoice(invoice); setShowDetailModal(true); }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View
                      </button>
                      {invoice.status === 'draft' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setFormClientId(invoice.client_id || '');
                              setFormProjectId(invoice.project_id || '');
                              setFormCurrency(invoice.currency || 'USD');
                              setFormDueDate(invoice.due_date || '');
                              setFormDiscount(String(invoice.discount || 0));
                              setFormTax(String(invoice.tax || 0));
                              setFormItems(invoice.items?.map(item => ({
                                description: item.description,
                                quantity: item.quantity,
                                unit_price: item.unit_price,
                                amount: item.amount,
                              })) || [{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
                              setShowEditModal(true);
                            }}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSendInvoice(invoice)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => handleDuplicateInvoice(invoice)}
                            className="text-purple-400 hover:text-purple-300 text-xs"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleCancelInvoice(invoice)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
                        <>
                          <button
                            onClick={() => { setSelectedInvoice(invoice); setShowPaymentModal(true); }}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            Record Payment
                          </button>
                          <button
                            onClick={() => handleSendInvoice(invoice)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs"
                          >
                            Resend
                          </button>
                        </>
                      )}
                      {['paid', 'partially_paid'].includes(invoice.status) && (
                        <button
                          onClick={() => { setSelectedInvoice(invoice); setShowRefundModal(true); }}
                          className="text-orange-400 hover:text-orange-300 text-xs"
                        >
                          Refund
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        className="text-yellow-400 hover:text-yellow-300 text-xs"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create Invoice</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                    placeholder="Auto-generated if blank"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Client *</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">Select client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-gray-900">
                        {client.full_name} ({client.company})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Project</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-gray-900">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="USD" className="bg-gray-900">USD</option>
                    <option value="EUR" className="bg-gray-900">EUR</option>
                    <option value="GBP" className="bg-gray-900">GBP</option>
                    <option value="NGN" className="bg-gray-900">NGN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Line Items *</label>
                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="col-span-5 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="Qty"
                        className="col-span-2 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="Unit Price"
                        className="col-span-3 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                      />
                      <div className="col-span-1 flex items-center justify-center text-white">
                        {formatCurrency(item.quantity * item.unit_price, formCurrency)}
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="col-span-1 px-2 py-2 bg-red-600 text-white rounded-lg text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-2 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20"
                >
                  + Add Item
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Discount</label>
                  <input
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Tax (%)</label>
                  <input
                    type="number"
                    value={formTax}
                    onChange={(e) => setFormTax(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal(), formCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>Discount:</span>
                  <span>-{formatCurrency(parseFloat(formDiscount) || 0, formCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>Tax:</span>
                  <span>{formatCurrency(calculateSubtotal() * (parseFloat(formTax) || 0) / 100, formCurrency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white mt-3 pt-3 border-t border-white/10">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal(), formCurrency)}</span>
                </div>
              </div>

              <button
                onClick={handleCreateInvoice}
                disabled={saving || !formClientId || formItems.length === 0 || !formItems[0].description}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Invoice</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Client *</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">Select client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-gray-900">
                        {client.full_name} ({client.company})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Project</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="" className="bg-gray-900">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-gray-900">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  >
                    <option value="USD" className="bg-gray-900">USD</option>
                    <option value="EUR" className="bg-gray-900">EUR</option>
                    <option value="GBP" className="bg-gray-900">GBP</option>
                    <option value="NGN" className="bg-gray-900">NGN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Line Items *</label>
                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="col-span-5 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="Qty"
                        className="col-span-2 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="Unit Price"
                        className="col-span-3 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                      />
                      <div className="col-span-1 flex items-center justify-center text-white">
                        {formatCurrency(item.quantity * item.unit_price, formCurrency)}
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="col-span-1 px-2 py-2 bg-red-600 text-white rounded-lg text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-2 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20"
                >
                  + Add Item
                </button>
              </div>

              <button
                onClick={handleEditInvoice}
                disabled={saving || !formClientId || formItems.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedInvoice.invoice_number}</h2>
                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm text-white">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project</p>
                  <p className="text-sm text-white">{selectedInvoice.project_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm text-white">{formatDate(selectedInvoice.due_date)}</p>
                </div>
              </div>

              {/* Line Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Line Items</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-gray-400">
                        <th className="py-2">Description</th>
                        <th className="py-2">Qty</th>
                        <th className="py-2">Unit Price</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-white/5">
                          <td className="py-2 text-gray-300">{item.description}</td>
                          <td className="py-2 text-gray-300">{item.quantity}</td>
                          <td className="py-2 text-gray-300">{formatCurrency(item.unit_price, selectedInvoice.currency)}</td>
                          <td className="py-2 text-white text-right">{formatCurrency(item.amount, selectedInvoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment History */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Payment History</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-gray-400">
                        <th className="py-2">Date</th>
                        <th className="py-2">Method</th>
                        <th className="py-2">Reference</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.payments.map((payment, index) => (
                        <tr key={index} className="border-b border-white/5">
                          <td className="py-2 text-gray-300">{formatDate(payment.created_at)}</td>
                          <td className="py-2 text-gray-300">{payment.method}</td>
                          <td className="py-2 text-gray-300">{payment.reference || '—'}</td>
                          <td className="py-2 text-white text-right">{formatCurrency(payment.amount, selectedInvoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-white">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                {selectedInvoice.sent_at && (
                  <div>
                    <p className="text-xs text-gray-500">Sent</p>
                    <p className="text-sm text-white">{formatDate(selectedInvoice.sent_at)}</p>
                  </div>
                )}
                {selectedInvoice.paid_at && (
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="text-sm text-white">{formatDate(selectedInvoice.paid_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Amount *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder={`Remaining: ${formatCurrency(selectedInvoice.total_amount - getPaidAmount(selectedInvoice), selectedInvoice.currency)}`}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="bank_transfer" className="bg-gray-900">Bank Transfer</option>
                  <option value="wire_transfer" className="bg-gray-900">Wire Transfer</option>
                  <option value="paystack" className="bg-gray-900">Paystack</option>
                  <option value="flutterwave" className="bg-gray-900">Flutterwave</option>
                  <option value="usdt" className="bg-gray-900">USDT</option>
                  <option value="cash" className="bg-gray-900">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reference</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Payment reference"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleRecordPayment}
                disabled={processing || !paymentAmount}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Issue Refund</h2>
              <button onClick={() => setShowRefundModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Refund Amount *</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reason</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Reason for refund..."
                />
              </div>
              <button
                onClick={handleIssueRefund}
                disabled={processing || !refundAmount}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Issue Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}