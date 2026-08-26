'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface InvoiceItem {
  id?: string
  invoice_id?: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface Payment {
  id: string
  invoice_id: string
  amount: number
  currency: string
  method: string
  payment_method: string
  status: string
  provider_reference: string
  created_at: string
}

interface Invoice {
  id: number
  invoice_number: string
  client_id: string
  project_id: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  amount: number
  currency: string
  status: string
  due_date: string | null
  issue_date: string | null
  notes: string | null
  payment_terms: string
  created_at: string
  client_name?: string
  project_name?: string
  paid_amount?: number
  pending_amount?: number
  items?: InvoiceItem[]
  payments?: Payment[]
}

const ITEMS_PER_PAGE = 10

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showReconciliation, setShowReconciliation] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedInvoices, setPaginatedInvoices] = useState<Invoice[]>([])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false)

  const [formClientId, setFormClientId] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formCurrency, setFormCurrency] = useState('USD')
  const [formDueDate, setFormDueDate] = useState('')
  const [formIssueDate, setFormIssueDate] = useState('')
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 14')
  const [formNotes, setFormNotes] = useState('')
  const [formDiscount, setFormDiscount] = useState('0')
  const [formTax, setFormTax] = useState('0')
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ])

  const [recordPaymentAmount, setRecordPaymentAmount] = useState('')
  const [recordPaymentMethod, setRecordPaymentMethod] = useState('bank_transfer')
  const [recordPaymentReference, setRecordPaymentReference] = useState('')

  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  const [saving, setSaving] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const [stats, setStats] = useState({
    totalInvoiced: 0,
    collected: 0,
    outstanding: 0,
    overdue: 0,
    drafts: 0,
    awaitingPayment: 0,
    partiallyPaid: 0,
    paid: 0,
    averageInvoiceValue: 0,
    collectionRate: 0,
    avgDaysToPayment: 0,
  })

  const [pipeline, setPipeline] = useState({
    created: 0,
    sent: 0,
    viewed: 0,
    paymentStarted: 0,
    paymentCompleted: 0,
    paid: 0,
  })

  const [reconciliation, setReconciliation] = useState({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    mismatches: 0,
    totalPaymentAmount: 0,
  })

  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; amount: number }[]>([])
  const [statusDistribution, setStatusDistribution] = useState<{ status: string; count: number }[]>([])

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
    calculateStats(invoices)
  }, [invoices])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name, company, email')
        .order('created_at', { ascending: false })
      setClients(clientsData || [])

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, client_id')
        .order('created_at', { ascending: false })
      setProjects(projectsData || [])

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: true })

      const allPayments = paymentsData || []

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

          const invoicePayments = allPayments.filter((p: any) => p.invoice_id === invoice.id)
          const paidAmount = invoicePayments
            .filter((p: any) => ['success', 'successful'].includes(p.status))
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
          const pendingAmount = invoicePayments
            .filter((p: any) => ['pending', 'under_review', 'needs_review'].includes(p.status))
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

          return {
            ...invoice,
            client_name: clientName,
            project_name: projectName,
            paid_amount: paidAmount,
            pending_amount: pendingAmount,
          }
        })
      )

      setInvoices(invoicesWithDetails)
      calculateStats(invoicesWithDetails, allPayments)
      calculatePipeline(invoicesWithDetails, allPayments)
      calculateReconciliation(allPayments)
      calculateMonthlyRevenue(allPayments)
      calculateStatusDistribution(invoicesWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch invoices error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats(invoices: Invoice[], payments: any[] = []) {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)
    const collected = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0)
    const outstanding = invoices
      .filter((inv) => ['sent', 'viewed', 'overdue', 'partially_paid'].includes(inv.status))
      .reduce((sum, inv) => sum + ((inv.total || inv.amount || 0) - (inv.paid_amount || 0)), 0)
    const overdue = invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + ((inv.total || inv.amount || 0) - (inv.paid_amount || 0)), 0)
    const drafts = invoices.filter((inv) => inv.status === 'draft').length
    const awaitingPayment = invoices.filter((inv) => ['sent', 'viewed'].includes(inv.status)).length
    const partiallyPaid = invoices.filter((inv) => inv.status === 'partially_paid').length
    const paid = invoices.filter((inv) => inv.status === 'paid').length
    const averageInvoiceValue = invoices.length > 0 ? totalInvoiced / invoices.length : 0
    const collectionRate = totalInvoiced > 0 ? (collected / totalInvoiced) * 100 : 0

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && (inv as any).paid_at)
    const daysArray = paidInvoices.map((inv) => {
      const created = new Date(inv.created_at)
      const paidAt = new Date((inv as any).paid_at || inv.created_at)
      return Math.ceil((paidAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    })
    const avgDaysToPayment = daysArray.length > 0 ? Math.round(daysArray.reduce((a, b) => a + b, 0) / daysArray.length) : 0

    setStats({
      totalInvoiced,
      collected,
      outstanding,
      overdue,
      drafts,
      awaitingPayment,
      partiallyPaid,
      paid,
      averageInvoiceValue,
      collectionRate: Math.round(collectionRate),
      avgDaysToPayment,
    })
  }

  function calculatePipeline(invoices: Invoice[], payments: any[]) {
    const created = invoices.length
    const sent = invoices.filter((inv) => ['sent', 'viewed', 'partially_paid', 'paid', 'overdue'].includes(inv.status)).length
    const viewed = invoices.filter((inv) => (inv as any).viewed_at).length
    const paymentStarted = payments.filter((p: any) => ['initiated', 'pending', 'processing'].includes(p.status)).length
    const paymentCompleted = payments.filter((p: any) => ['success', 'successful'].includes(p.status)).length
    const paid = invoices.filter((inv) => inv.status === 'paid').length

    setPipeline({ created, sent, viewed, paymentStarted, paymentCompleted, paid })
  }

  function calculateReconciliation(payments: any[]) {
    const totalPayments = payments.length
    const successfulPayments = payments.filter((p: any) => ['success', 'successful'].includes(p.status)).length
    const pendingPayments = payments.filter((p: any) => ['pending', 'under_review', 'needs_review', 'processing'].includes(p.status)).length
    const failedPayments = payments.filter((p: any) => p.status === 'failed').length
    const totalPaymentAmount = payments
      .filter((p: any) => ['success', 'successful'].includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    const mismatches = payments.filter((p: any) => !p.invoice_id).length

    setReconciliation({ totalPayments, successfulPayments, pendingPayments, failedPayments, mismatches, totalPaymentAmount })
  }

  function calculateMonthlyRevenue(payments: any[]) {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      months[key] = 0
    }

    payments
      .filter((p: any) => ['success', 'successful'].includes(p.status))
      .forEach((p: any) => {
        const date = new Date(p.created_at)
        const key = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        if (months[key] !== undefined) {
          months[key] += p.amount || 0
        }
      })

    setMonthlyRevenue(Object.entries(months).map(([month, amount]) => ({ month, amount })))
  }

  function calculateStatusDistribution(invoices: Invoice[]) {
    const map: Record<string, number> = {}
    invoices.forEach((inv) => {
      map[inv.status] = (map[inv.status] || 0) + 1
    })
    setStatusDistribution(Object.entries(map).map(([status, count]) => ({ status, count })))
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
    return subtotal - discount + (subtotal * tax) / 100
  }

  function resetForm() {
    setFormClientId('')
    setFormProjectId('')
    setFormCurrency('USD')
    setFormDueDate('')
    setFormIssueDate('')
    setFormPaymentTerms('Net 14')
    setFormNotes('')
    setFormDiscount('0')
    setFormTax('0')
    setFormItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function addItem() {
    setFormItems([...formItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function removeItem(index: number) {
    if (formItems.length === 1) return
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: any) {
    const newItems = [...formItems]
    newItems[index] = { ...newItems[index], [field]: value }
    newItems[index].amount = calculateItemAmount(newItems[index])
    setFormItems(newItems)
  }

  async function handleCreateInvoice(sendImmediately: boolean) {
    if (!formClientId) {
      alert('Please select a client')
      return
    }
    if (formItems.length === 0 || !formItems[0].description.trim()) {
      alert('Please add at least one line item')
      return
    }

    setSaving(true)
    try {
      const subtotal = calculateSubtotal()
      const discount = parseFloat(formDiscount) || 0
      const tax = parseFloat(formTax) || 0
      const total = subtotal - discount + (subtotal * tax) / 100
      const invoiceNumber = `INV-${Date.now()}`

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: formClientId,
          project_id: formProjectId || null,
          subtotal,
          discount,
          tax,
          total,
          amount: total,
          currency: formCurrency,
          status: sendImmediately ? 'sent' : 'draft',
          due_date: formDueDate || null,
          issue_date: formIssueDate || new Date().toISOString().split('T')[0],
          payment_terms: formPaymentTerms,
          notes: formNotes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (invoiceError) {
        alert('Failed to create invoice: ' + invoiceError.message)
        setSaving(false)
        return
      }

      if (newInvoice) {
        await supabase.from('invoice_items').insert(
          formItems.map((item) => ({
            invoice_id: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
          }))
        )

        try {
          await supabase.from('audit_logs').insert({
            user_id: formClientId,
            action_type: sendImmediately ? 'invoice_sent' : 'invoice_created',
            description: `${sendImmediately ? 'Invoice sent' : 'Draft created'}: ${invoiceNumber}`,
            entity_type: 'invoice',
            entity_id: String(newInvoice.id),
            result: 'success',
            created_at: new Date().toISOString(),
          })
        } catch (e) {}

        if (sendImmediately) {
          try {
            await supabase.from('notifications').insert({
              user_id: formClientId,
              type: 'invoice_sent',
              title: 'New Invoice Available',
              message: `Invoice ${invoiceNumber} is now available`,
              read: false,
              channel: 'in_app',
              delivery_status: 'delivered',
              created_at: new Date().toISOString(),
            })
          } catch (e) {}
        }
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
    if (!selectedInvoice || !formClientId) return
    setSaving(true)
    try {
      const subtotal = calculateSubtotal()
      const discount = parseFloat(formDiscount) || 0
      const tax = parseFloat(formTax) || 0
      const total = subtotal - discount + (subtotal * tax) / 100

      await supabase
        .from('invoices')
        .update({
          client_id: formClientId,
          project_id: formProjectId || null,
          subtotal,
          discount,
          tax,
          total,
          amount: total,
          currency: formCurrency,
          due_date: formDueDate || null,
          payment_terms: formPaymentTerms,
          notes: formNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedInvoice.id)

      await supabase.from('invoice_items').delete().eq('invoice_id', selectedInvoice.id)
      await supabase.from('invoice_items').insert(
        formItems.map((item) => ({
          invoice_id: selectedInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
        }))
      )

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

  async function handleSendInvoice(invoice: Invoice) {
    if (!confirm(`Send ${invoice.invoice_number}?`)) return
    await supabase.from('invoices').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', invoice.id)
    try {
      await supabase.from('notifications').insert({
        user_id: invoice.client_id,
        type: 'invoice_sent',
        title: 'New Invoice Available',
        message: `Invoice ${invoice.invoice_number} is now available`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })
    } catch (e) {}
    fetchData()
  }

  async function handleSendReminder(invoice: Invoice) {
    if (!confirm(`Send reminder for ${invoice.invoice_number}?`)) return
    try {
      await supabase.from('notifications').insert({
        user_id: invoice.client_id,
        type: 'invoice_reminder',
        title: 'Invoice Reminder',
        message: `Reminder: ${invoice.invoice_number} is ${invoice.status === 'overdue' ? 'overdue' : 'due soon'}.`,
        read: false,
        channel: 'in_app',
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      })
      await supabase.from('audit_logs').insert({
        user_id: invoice.client_id,
        action_type: 'invoice_reminder_sent',
        description: `Reminder sent for ${invoice.invoice_number}`,
        entity_type: 'invoice',
        entity_id: String(invoice.id),
        result: 'success',
        created_at: new Date().toISOString(),
      })
    } catch (e) {}
    fetchData()
  }

  async function handleDuplicateInvoice(invoice: Invoice) {
    if (!confirm(`Duplicate ${invoice.invoice_number}?`)) return
    const { data: newInvoice } = await supabase
      .from('invoices')
      .insert({
        invoice_number: `INV-${Date.now()}`,
        client_id: invoice.client_id,
        project_id: invoice.project_id,
        subtotal: invoice.subtotal || invoice.amount || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        total: invoice.total || invoice.amount || 0,
        amount: invoice.total || invoice.amount || 0,
        currency: invoice.currency || 'USD',
        status: 'draft',
        due_date: null,
        issue_date: new Date().toISOString().split('T')[0],
        payment_terms: invoice.payment_terms || 'Net 14',
        notes: invoice.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newInvoice) {
      const { data: oldItems } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id)
      if (oldItems && oldItems.length > 0) {
        await supabase.from('invoice_items').insert(
          oldItems.map((item: any) => ({
            invoice_id: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          }))
        )
      }
    }
    fetchData()
  }

  async function handleCancelInvoice(invoice: Invoice) {
    const reason = prompt('Reason for cancellation:')
    if (reason === null) return
    await supabase
      .from('invoices')
      .update({ status: 'cancelled', notes: reason, cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', invoice.id)
    fetchData()
  }

  async function handleViewInvoice(invoice: Invoice) {
    setSelectedInvoice(invoice)
    setShowDetailModal(true)
    const { data: itemsData } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id)
    if (itemsData) setSelectedInvoice((prev) => prev ? { ...prev, items: itemsData } : prev)
  }

  async function handleViewPayments(invoice: Invoice) {
    setSelectedInvoice(invoice)
    setShowPaymentsModal(true)
    const { data: paymentsData } = await supabase.from('payments').select('*').eq('invoice_id', invoice.id).order('created_at', { ascending: false })
    if (paymentsData) setSelectedInvoice((prev) => prev ? { ...prev, payments: paymentsData } : prev)
  }

  async function handleRecordPayment() {
    if (!selectedInvoice || !recordPaymentAmount) return
    setSaving(true)
    try {
      const amount = parseFloat(recordPaymentAmount)
      await supabase.from('payments').insert({
        invoice_id: selectedInvoice.id,
        client_id: selectedInvoice.client_id,
        amount,
        currency: selectedInvoice.currency,
        method: recordPaymentMethod,
        payment_method: recordPaymentMethod,
        status: 'successful',
        provider_reference: recordPaymentReference || `MANUAL-${Date.now()}`,
        created_at: new Date().toISOString(),
      })

      const newPaid = (selectedInvoice.paid_amount || 0) + amount
      const total = selectedInvoice.total || selectedInvoice.amount || 0
      const newStatus = newPaid >= total ? 'paid' : 'partially_paid'
      await supabase.from('invoices').update({ status: newStatus, amount_paid: newPaid, paid_at: newStatus === 'paid' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', selectedInvoice.id)

      setShowRecordPaymentModal(false)
      setRecordPaymentAmount('')
      setRecordPaymentReference('')
      fetchData()
    } catch (error) {
      console.error('Record payment error:', error)
      alert('Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  async function handleApprovePayment(payment: Payment) {
    if (!confirm('Approve this payment?')) return
    await supabase.from('payments').update({ status: 'successful', updated_at: new Date().toISOString() }).eq('id', payment.id)
    if (selectedInvoice) {
      const newPaid = (selectedInvoice.paid_amount || 0) + payment.amount
      const total = selectedInvoice.total || selectedInvoice.amount || 0
      const newStatus = newPaid >= total ? 'paid' : 'partially_paid'
      await supabase.from('invoices').update({ status: newStatus, amount_paid: newPaid, paid_at: newStatus === 'paid' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', selectedInvoice.id)
    }
    fetchData()
    handleViewPayments(selectedInvoice!)
  }

  async function handleRejectPayment(payment: Payment) {
    if (!confirm('Reject this payment?')) return
    await supabase.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', payment.id)
    fetchData()
    handleViewPayments(selectedInvoice!)
  }

  function handlePreviewInvoice(invoice: Invoice) {
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
    return map[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount || 0)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-gray-400 mt-1">{filteredInvoices.length} total invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
            {showAnalytics ? 'Hide Analytics' : 'Analytics'}
          </button>
          <button onClick={() => setShowReconciliation(!showReconciliation)} className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg">
            {showReconciliation ? 'Hide Reconciliation' : 'Reconciliation'}
          </button>
          <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
            + Create Invoice
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Total Invoiced</p><p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalInvoiced, 'USD')}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Collected</p><p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.collected, 'USD')}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Outstanding</p><p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(stats.outstanding, 'USD')}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Overdue</p><p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(stats.overdue, 'USD')}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Drafts</p><p className="text-2xl font-bold text-gray-300 mt-1">{stats.drafts}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Awaiting Payment</p><p className="text-2xl font-bold text-blue-400 mt-1">{stats.awaitingPayment}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Partially Paid</p><p className="text-2xl font-bold text-yellow-400 mt-1">{stats.partiallyPaid}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Paid</p><p className="text-2xl font-bold text-green-400 mt-1">{stats.paid}</p></div>
      </div>

      {/* Analytics */}
      {showAnalytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Avg Invoice Value</p><p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.averageInvoiceValue, 'USD')}</p></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Collection Rate</p><p className="text-2xl font-bold text-green-400 mt-1">{stats.collectionRate}%</p></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Avg Days to Payment</p><p className="text-2xl font-bold text-purple-400 mt-1">{stats.avgDaysToPayment} days</p></div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Pipeline</h3>
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { label: 'Created', value: pipeline.created },
                { label: 'Sent', value: pipeline.sent },
                { label: 'Viewed', value: pipeline.viewed },
                { label: 'Payment Started', value: pipeline.paymentStarted },
                { label: 'Payment Completed', value: pipeline.paymentCompleted },
                { label: 'Invoice Paid', value: pipeline.paid },
              ].map((stage, index) => (
                <div key={stage.label} className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center min-w-[100px]">
                    <p className="text-xs text-gray-400">{stage.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{stage.value}</p>
                  </div>
                  {index < 5 && <span className="text-gray-500 text-lg">-</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue by Month</h3>
            <div className="space-y-3">
              {monthlyRevenue.map((item) => {
                const maxAmount = Math.max(...monthlyRevenue.map(m => m.amount), 1)
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-14">{item.month}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-lg transition-all" style={{ width: `${(item.amount / maxAmount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-white w-20 text-right">{formatCurrency(item.amount, 'USD')}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {statusDistribution.map((item) => (
                <div key={item.status} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center min-w-[90px]">
                  <span className={`block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
                  <p className="text-xl font-bold text-white mt-2">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation */}
      {showReconciliation && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Total Payments</p><p className="text-2xl font-bold text-white mt-1">{reconciliation.totalPayments}</p></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Successful</p><p className="text-2xl font-bold text-green-400 mt-1">{reconciliation.successfulPayments}</p></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Pending</p><p className="text-2xl font-bold text-yellow-400 mt-1">{reconciliation.pendingPayments}</p></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Failed</p><p className="text-2xl font-bold text-red-400 mt-1">{reconciliation.failedPayments}</p></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-gray-400">Total Amount</p><p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(reconciliation.totalPaymentAmount, 'USD')}</p></div>
          </div>
          {reconciliation.mismatches > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-sm text-red-400">[Warning] {reconciliation.mismatches} payment(s) without a valid invoice reference.</p>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search invoice number, client, project..." className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none">
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="draft" className="bg-gray-900">Draft</option>
          <option value="sent" className="bg-gray-900">Sent</option>
          <option value="viewed" className="bg-gray-900">Viewed</option>
          <option value="partially_paid" className="bg-gray-900">Partially Paid</option>
          <option value="paid" className="bg-gray-900">Paid</option>
          <option value="overdue" className="bg-gray-900">Overdue</option>
          <option value="cancelled" className="bg-gray-900">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Invoice</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Paid</th>
              <th className="py-3 px-4 font-medium">Balance</th>
              <th className="py-3 px-4 font-medium">Due</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvoices.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-gray-500">No invoices found</td></tr>
            ) : (
              paginatedInvoices.map((invoice) => {
                const balance = (invoice.total || invoice.amount || 0) - (invoice.paid_amount || 0)
                return (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4"><button onClick={() => handleViewInvoice(invoice)} className="text-white font-medium hover:text-blue-400">{invoice.invoice_number}</button></td>
                    <td className="py-3 px-4 text-gray-300">{invoice.client_name}</td>
                    <td className="py-3 px-4 text-gray-300">{invoice.project_name}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(invoice.total || invoice.amount, invoice.currency)}</td>
                    <td className="py-3 px-4 text-green-400">{formatCurrency(invoice.paid_amount || 0, invoice.currency)}</td>
                    <td className="py-3 px-4 text-yellow-400">{formatCurrency(balance, invoice.currency)}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(invoice.due_date || '')}</td>
                    <td className="py-3 px-4"><span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>{invoice.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleViewInvoice(invoice)} className="text-blue-400 hover:text-blue-300 text-xs">View</button>
                        {invoice.status === 'draft' && (
                          <>
                            <button onClick={() => { setSelectedInvoice(invoice); setFormClientId(invoice.client_id || ''); setFormProjectId(invoice.project_id || ''); setFormCurrency(invoice.currency || 'USD'); setFormDueDate(invoice.due_date || ''); setFormIssueDate(invoice.issue_date || ''); setFormPaymentTerms(invoice.payment_terms || 'Net 14'); setFormNotes(invoice.notes || ''); setFormDiscount(String(invoice.discount || 0)); setFormTax(String(invoice.tax || 0)); setShowEditModal(true); }} className="text-green-400 hover:text-green-300 text-xs">Edit</button>
                            <button onClick={() => handleSendInvoice(invoice)} className="text-cyan-400 hover:text-cyan-300 text-xs">Send</button>
                            <button onClick={() => handleDuplicateInvoice(invoice)} className="text-purple-400 hover:text-purple-300 text-xs">Duplicate</button>
                            <button onClick={() => handleCancelInvoice(invoice)} className="text-red-400 hover:text-red-300 text-xs">Cancel</button>
                          </>
                        )}
                        {['sent', 'viewed', 'overdue', 'partially_paid'].includes(invoice.status) && (
                          <>
                            <button onClick={() => { setSelectedInvoice(invoice); setShowRecordPaymentModal(true); }} className="text-green-400 hover:text-green-300 text-xs">Record</button>
                            <button onClick={() => handleSendReminder(invoice)} className="text-yellow-400 hover:text-yellow-300 text-xs">Reminder</button>
                          </>
                        )}
                        <button onClick={() => handleViewPayments(invoice)} className="text-orange-400 hover:text-orange-300 text-xs">Payments</button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-white/20">Next</button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Create Invoice</h2><button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Client *</label><select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="" className="bg-gray-900">Select client...</option>{clients.map((client) => <option key={client.id} value={client.id} className="bg-gray-900">{client.full_name} ({client.company})</option>)}</select></div>
                <div><label className="block text-sm text-gray-300 mb-1">Project</label><select value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="" className="bg-gray-900">No project</option>{projects.map((project) => <option key={project.id} value={project.id} className="bg-gray-900">{project.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Currency</label><select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="USD" className="bg-gray-900">USD</option><option value="EUR" className="bg-gray-900">EUR</option><option value="GBP" className="bg-gray-900">GBP</option><option value="NGN" className="bg-gray-900">NGN</option></select></div>
                <div><label className="block text-sm text-gray-300 mb-1">Issue Date</label><input type="date" value={formIssueDate} onChange={(e) => setFormIssueDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Due Date</label><input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Payment Terms</label><input type="text" value={formPaymentTerms} onChange={(e) => setFormPaymentTerms(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Line Items *</label>
                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Description" className="col-span-5 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="Qty" className="col-span-2 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
                      <input type="number" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} placeholder="Rate" className="col-span-3 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
                      <div className="col-span-1 flex items-center justify-center text-white text-xs">{formatCurrency(item.quantity * item.unit_price, formCurrency)}</div>
                      <button onClick={() => removeItem(index)} className="col-span-1 px-2 py-2 bg-red-600 text-white rounded-lg text-xs">X</button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-2 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20">+ Add Item</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Discount</label><input type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Tax (%)</label><input type="number" value={formTax} onChange={(e) => setFormTax(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Notes</label><textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-400"><span>Subtotal:</span><span>{formatCurrency(calculateSubtotal(), formCurrency)}</span></div>
                <div className="flex justify-between text-sm text-gray-400 mt-1"><span>Discount:</span><span>-{formatCurrency(parseFloat(formDiscount) || 0, formCurrency)}</span></div>
                <div className="flex justify-between text-sm text-gray-400 mt-1"><span>Tax:</span><span>{formatCurrency((calculateSubtotal() * (parseFloat(formTax) || 0)) / 100, formCurrency)}</span></div>
                <div className="flex justify-between text-lg font-bold text-white mt-2 pt-2 border-t border-white/10"><span>Total:</span><span className="text-green-400">{formatCurrency(calculateTotal(), formCurrency)}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCreateInvoice(false)} disabled={saving} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg disabled:opacity-50">Save Draft</button>
                <button onClick={() => handleCreateInvoice(true)} disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">Send Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Edit Invoice</h2><button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Client *</label><select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="" className="bg-gray-900">Select client...</option>{clients.map((client) => <option key={client.id} value={client.id} className="bg-gray-900">{client.full_name} ({client.company})</option>)}</select></div>
                <div><label className="block text-sm text-gray-300 mb-1">Project</label><select value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="" className="bg-gray-900">No project</option>{projects.map((project) => <option key={project.id} value={project.id} className="bg-gray-900">{project.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Currency</label><select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="USD" className="bg-gray-900">USD</option><option value="EUR" className="bg-gray-900">EUR</option><option value="GBP" className="bg-gray-900">GBP</option><option value="NGN" className="bg-gray-900">NGN</option></select></div>
                <div><label className="block text-sm text-gray-300 mb-1">Due Date</label><input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Payment Terms</label><input type="text" value={formPaymentTerms} onChange={(e) => setFormPaymentTerms(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Line Items *</label>
                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Description" className="col-span-5 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="Qty" className="col-span-2 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
                      <input type="number" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} placeholder="Rate" className="col-span-3 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
                      <div className="col-span-1 flex items-center justify-center text-white text-xs">{formatCurrency(item.quantity * item.unit_price, formCurrency)}</div>
                      <button onClick={() => removeItem(index)} className="col-span-1 px-2 py-2 bg-red-600 text-white rounded-lg text-xs">X</button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-2 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20">+ Add Item</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Discount</label><input type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Tax (%)</label><input type="number" value={formTax} onChange={(e) => setFormTax(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Notes</label><textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleEditInvoice} disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-xl w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div><h2 className="text-xl font-bold text-white">{selectedInvoice.invoice_number}</h2><span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>{selectedInvoice.status}</span></div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Client</p><p className="text-sm text-white font-medium">{selectedInvoice.client_name}</p></div>
                <div><p className="text-xs text-gray-500">Project</p><p className="text-sm text-white font-medium">{selectedInvoice.project_name}</p></div>
                <div><p className="text-xs text-gray-500">Issued</p><p className="text-sm text-white">{formatDate(selectedInvoice.issue_date || selectedInvoice.created_at)}</p></div>
                <div><p className="text-xs text-gray-500">Due</p><p className="text-sm text-white">{formatDate(selectedInvoice.due_date || '')}</p></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Line Items</p>
                <div className="space-y-2">
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item) => (
                      <div key={item.id} className="flex justify-between bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <div><p className="text-sm text-white font-medium">{item.description}</p><p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price, selectedInvoice.currency)}</p></div>
                        <p className="text-sm text-white font-medium">{formatCurrency(item.amount, selectedInvoice.currency)}</p>
                      </div>
                    ))
                  ) : <p className="text-xs text-gray-500">No items</p>}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatCurrency(selectedInvoice.subtotal || selectedInvoice.amount || 0, selectedInvoice.currency)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Discount</span><span className="text-white">-{formatCurrency(selectedInvoice.discount || 0, selectedInvoice.currency)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Tax</span><span className="text-white">{formatCurrency(selectedInvoice.tax || 0, selectedInvoice.currency)}</span></div>
                <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2"><span className="text-white">Total</span><span className="text-white">{formatCurrency(selectedInvoice.total || selectedInvoice.amount || 0, selectedInvoice.currency)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-green-400">Paid</span><span className="text-green-400">{formatCurrency(selectedInvoice.paid_amount || 0, selectedInvoice.currency)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-yellow-400">Balance</span><span className="text-yellow-400">{formatCurrency((selectedInvoice.total || selectedInvoice.amount || 0) - (selectedInvoice.paid_amount || 0), selectedInvoice.currency)}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePreviewInvoice(selectedInvoice)} className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg">Preview</button>
                <button onClick={() => { setShowDetailModal(false); setShowRecordPaymentModal(true); }} className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg">Record Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {showPaymentsModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Payments - {selectedInvoice.invoice_number}</h2><button onClick={() => setShowPaymentsModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button></div>
            <div className="space-y-3">
              {!selectedInvoice.payments || selectedInvoice.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payments yet</p>
              ) : (
                selectedInvoice.payments.map((payment) => (
                  <div key={payment.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                    <div><p className="text-white font-medium">{formatCurrency(payment.amount, payment.currency)}</p><p className="text-xs text-gray-400">{payment.payment_method || payment.method} • {formatDate(payment.created_at)}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${payment.status === 'successful' || payment.status === 'success' ? 'bg-green-500/20 text-green-300' : payment.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{payment.status}</span>
                      {(payment.status === 'pending' || payment.status === 'under_review' || payment.status === 'needs_review') && (
                        <>
                          <button onClick={() => handleApprovePayment(payment)} className="text-green-400 text-xs">Approve</button>
                          <button onClick={() => handleRejectPayment(payment)} className="text-red-400 text-xs">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white">Record Payment</h2><button onClick={() => setShowRecordPaymentModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Amount *</label><input type="number" value={recordPaymentAmount} onChange={(e) => setRecordPaymentAmount(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Method</label><select value={recordPaymentMethod} onChange={(e) => setRecordPaymentMethod(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"><option value="bank_transfer" className="bg-gray-900">Bank Transfer</option><option value="wire_transfer" className="bg-gray-900">Wire Transfer</option><option value="paystack" className="bg-gray-900">Paystack</option><option value="usdt" className="bg-gray-900">USDT</option><option value="cash" className="bg-gray-900">Cash</option></select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Reference</label><input type="text" value={recordPaymentReference} onChange={(e) => setRecordPaymentReference(e.target.value)} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" /></div>
              <button onClick={handleRecordPayment} disabled={saving || !recordPaymentAmount} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? 'Processing...' : 'Record Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}