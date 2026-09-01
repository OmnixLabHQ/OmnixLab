'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  total: number
  amount: number
  currency: string
  description: string
  paystack_reference: string | null
  paid_at: string | null
  payment_gateway: string | null
}

interface Client {
  id: string
  full_name: string
  company: string
  email: string
  phone: string
}

interface Receipt {
  id: string
  receipt_number: string
  amount: number
  currency: string
  created_at: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  payment_method: string
  provider_reference: string
  paid_at: string
  created_at: string
}

export default function ReceiptPrintPage() {
  const params = useParams()
  const invoiceId = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (invoiceId) {
      fetchReceiptData()
    }
  }, [invoiceId])

  useEffect(() => {
    if (!loading && invoice && receipt) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [loading, invoice, receipt])

  async function fetchReceiptData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch invoice
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('client_id', user.id)
        .single()

      if (invoiceData) {
        setInvoice(invoiceData)

        // Fetch client
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', invoiceData.client_id)
          .single()

        if (clientData) setClient(clientData)

        // Fetch receipt
        const { data: receiptData } = await supabase
          .from('receipts')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (receiptData) setReceipt(receiptData)

        // Fetch successful payment
        const { data: paymentData } = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .eq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (paymentData) setPayment(paymentData)
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
        <p className="text-gray-500">Loading receipt...</p>
      </div>
    )
  }

  if (!invoice || !receipt) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Receipt not found</p>
          <Link href={`/portal/invoices/${invoiceId}`} className="text-blue-600 hover:underline">
            Back to Invoice
          </Link>
        </div>
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

      {/* Print Header Bar - hidden when printing */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/portal/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
          ← Back to Invoice
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Receipt Document */}
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-700">OMNIX LAB</h1>
          <p className="text-sm text-gray-600">Global Software Development Partner</p>
          <p className="text-sm text-gray-600">helloafrica@omnixlab-production.up.railway.app</p>
          <p className="text-sm text-gray-600">+234 703 370 2874</p>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-8">
          <div className="inline-block bg-green-100 text-green-800 px-6 py-2 rounded-full">
            <h2 className="text-xl font-bold">PAYMENT RECEIPT</h2>
          </div>
          <p className="text-sm text-gray-500 mt-2">{receipt.receipt_number}</p>
        </div>

        {/* Receipt Details */}
        <div className="border-2 border-green-200 rounded-xl p-6 mb-8">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Received From:</span>
              <span className="font-medium text-gray-900">{client?.full_name || 'Client'}</span>
            </div>
            {client?.company && (
              <div className="flex justify-between">
                <span className="text-gray-600">Company:</span>
                <span className="font-medium text-gray-900">{client.company}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice Number:</span>
              <span className="font-medium text-gray-900">
                {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-bold text-green-700 text-lg">
                {formatCurrency(receipt.amount || payment?.amount || invoice.total || invoice.amount, receipt.currency || invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium text-gray-900">
                {payment?.payment_method || invoice.payment_gateway || 'Paystack'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(receipt.created_at).toLocaleDateString()}
              </span>
            </div>
            {payment?.provider_reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Reference:</span>
                <span className="font-mono text-sm text-gray-900">{payment.provider_reference}</span>
              </div>
            )}
            {invoice.paystack_reference && !payment?.provider_reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Reference:</span>
                <span className="font-mono text-sm text-gray-900">{invoice.paystack_reference}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-6 py-3">
            <span className="text-2xl">✅</span>
            <span className="font-bold text-green-700">PAYMENT CONFIRMED</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 text-center mt-12">
          <p className="text-xs text-gray-500">
            This receipt confirms payment for services provided by Omnix Lab.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Omnix Lab • Global Software Development • helloafrica@omnixlab-production.up.railway.app
          </p>
        </div>
      </div>
    </div>
  )
}
