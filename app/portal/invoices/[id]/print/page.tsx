'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_id: string | null
  amount: number
  subtotal: number
  tax: number
  discount: number
  total: number
  description: string
  status: string
  payment_gateway: string | null
  due_date: string | null
  issue_date: string | null
  paid_at: string | null
  paystack_reference: string | null
  created_at: string
  currency: string
  payment_terms: string
  notes: string
}

interface Client {
  id: string
  full_name: string
  company: string
  email: string
  phone: string
}

interface Project {
  id: string
  name: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export default function PrintInvoicePage() {
  const params = useParams()
  const invoiceId = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData()
    }
  }, [invoiceId])

  useEffect(() => {
    if (!loading && invoice) {
      // Auto-trigger print after data loads
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [loading, invoice])

  async function fetchInvoiceData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('client_id', user.id)
        .single()

      if (invoiceData) {
        setInvoice(invoiceData)

        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', invoiceData.client_id)
          .single()

        if (clientData) setClient(clientData)

        if (invoiceData.project_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', invoiceData.project_id)
            .single()

          if (projectData) setProject(projectData)
        }

        const { data: itemsData } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('id', { ascending: true })

        if (itemsData) setItems(itemsData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  function formatCurrency(amount: number, currency: string = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount || 0)
    } catch {
      return `${currency} ${(amount || 0).toLocaleString()}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {/* Print Header Bar */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/portal/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
          ← Back to Invoice
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice Document */}
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">OMNIX LAB</h1>
            <p className="text-sm text-gray-600">Global Software Development Partner</p>
            <p className="text-sm text-gray-600">Hello@omnixlabssupport.com</p>
            <p className="text-sm text-gray-600">+234 703 370 2874</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm font-medium text-gray-700">
              {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
            </p>
            <p className="text-sm text-gray-500">
              {invoice.issue_date
                ? new Date(invoice.issue_date).toLocaleDateString()
                : new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bill To</p>
            <p className="font-medium text-gray-900">{client?.full_name || 'Client'}</p>
            {client?.company && <p className="text-sm text-gray-600">{client.company}</p>}
            {client?.email && <p className="text-sm text-gray-600">{client.email}</p>}
            {client?.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Details</p>
            <p className="text-sm text-gray-700">Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</p>
            <p className="text-sm text-gray-700">Terms: {invoice.payment_terms || 'Net 14'}</p>
            <p className="text-sm text-gray-700">Currency: {invoice.currency || 'USD'}</p>
            {project && <p className="text-sm text-gray-700">Project: {project.name}</p>}
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="py-2 px-3 text-left text-sm font-semibold">Description</th>
              <th className="py-2 px-3 text-right text-sm font-semibold">Qty</th>
              <th className="py-2 px-3 text-right text-sm font-semibold">Unit Price</th>
              <th className="py-2 px-3 text-right text-sm font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-2 px-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="py-2 px-3 text-sm text-gray-900 text-right">
                    {formatCurrency(item.unit_price, invoice.currency)}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-900 text-right">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 px-3 text-sm text-gray-900">{invoice.description || 'Invoice'}</td>
                <td className="py-2 px-3 text-sm text-gray-900 text-right">1</td>
                <td className="py-2 px-3 text-sm text-gray-900 text-right">
                  {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
                </td>
                <td className="py-2 px-3 text-sm text-gray-900 text-right">
                  {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm text-gray-900">
                {formatCurrency(invoice.subtotal || invoice.amount, invoice.currency)}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Discount</span>
                <span className="text-sm text-green-600">
                  -{formatCurrency(invoice.discount, invoice.currency)}
                </span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Tax</span>
                <span className="text-sm text-gray-900">
                  {formatCurrency(invoice.tax, invoice.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-gray-300 mt-1">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</p>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 text-center">
          <p className="text-xs text-gray-500">
            Thank you for choosing Omnix Lab as your software development partner.
          </p>
          <p className="text-xs text-gray-400">
            Omnix Lab • Global Software Development • Hello@omnixlabssupport.com
          </p>
        </div>
      </div>
    </div>
  )
}
