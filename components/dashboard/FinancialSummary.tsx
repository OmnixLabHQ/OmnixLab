'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FinancialData {
  totalInvoiced: number
  totalPaid: number
  outstanding: number
  overdue: number
  nextPaymentDue?: string
}

export default function FinancialSummary() {
  const [data, setData] = useState<FinancialData>({
    totalInvoiced: 0,
    totalPaid: 0,
    outstanding: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinancialData()
  }, [])

  async function fetchFinancialData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)

      if (error) {
        console.error('Failed to fetch invoices:', error)
        setLoading(false)
        return
      }

      if (!invoices || invoices.length === 0) {
        setLoading(false)
        return
      }

      const totalInvoiced =
        invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      const totalPaid =
        invoices
          .filter((inv) => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      const outstanding =
        invoices
          .filter((inv) => ['sent', 'overdue', 'unpaid'].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      const overdue =
        invoices
          .filter((inv) => inv.status === 'overdue')
          .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      // Find next payment due
      const nextPayment = invoices
        .filter((inv) => ['sent', 'unpaid'].includes(inv.status))
        .sort(
          (a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )[0]

      setData({
        totalInvoiced,
        totalPaid,
        outstanding,
        overdue,
        nextPaymentDue: nextPayment?.due_date,
      })
      setLoading(false)
    } catch (error) {
      console.error('Financial fetch error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Financial Overview</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500">📈</span>
            <span className="text-sm text-gray-600">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${data.totalPaid.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500">📉</span>
            <span className="text-sm text-gray-600">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${data.outstanding.toLocaleString()}
          </p>
        </div>

        {data.overdue > 0 && (
          <div className="p-4 bg-red-50 rounded-lg col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-500">⏰</span>
              <span className="text-sm text-red-700 font-medium">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              ${data.overdue.toLocaleString()}
            </p>
          </div>
        )}

        {data.nextPaymentDue && (
          <div className="col-span-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Next payment due:{' '}
              {new Date(data.nextPaymentDue).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
