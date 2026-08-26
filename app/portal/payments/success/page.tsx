'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface PaymentDetails {
  id: number
  amount: number
  currency: string
  status: string
  payment_method: string
  provider_reference: string
  paid_at: string
  invoice_number: string
  receipt_number: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference') || ''
  
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (reference) {
      fetchPaymentDetails(reference)
    } else {
      setLoading(false)
    }
  }, [reference])

  const fetchPaymentDetails = async (ref: string) => {
    try {
      // Fetch payment by provider reference
      const { data: paymentData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_reference', ref)
        .single()

      if (error || !paymentData) {
        console.error('Payment not found:', error)
        setLoading(false)
        return
      }

      // Get invoice number
      let invoiceNumber = 'N/A'
      if (paymentData.invoice_id) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('id', paymentData.invoice_id)
          .single()
        invoiceNumber = invoice?.invoice_number || 'N/A'
      }

      // Get receipt number
      let receiptNumber = ''
      if (paymentData.id) {
        const { data: receipt } = await supabase
          .from('receipts')
          .select('receipt_number')
          .eq('payment_id', paymentData.id)
          .single()
        receiptNumber = receipt?.receipt_number || ''
      }

      setPayment({
        id: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        status: paymentData.status,
        payment_method: paymentData.payment_method || 'Paystack',
        provider_reference: paymentData.provider_reference || ref,
        paid_at: paymentData.paid_at || paymentData.created_at,
        invoice_number: invoiceNumber,
        receipt_number: receiptNumber,
      })
      setLoading(false)
    } catch (err) {
      console.error('Fetch payment details error:', err)
      setLoading(false)
    }
  }

  function formatCurrency(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount || 0)
    } catch {
      return `${currency} ${(amount || 0).toLocaleString()}`
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-green-400">[OK]</span>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Your payment has been received and processed.
        </p>

        {/* Payment Details */}
        {payment && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-sm font-bold text-white">
                  {formatCurrency(payment.amount, payment.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Invoice</span>
                <span className="text-sm text-white font-medium">{payment.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Method</span>
                <span className="text-sm text-white font-medium">{payment.payment_method}</span>
              </div>
              {payment.receipt_number && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Receipt</span>
                  <span className="text-sm text-white font-medium font-mono">{payment.receipt_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Reference</span>
                <span className="text-sm text-white font-mono text-xs">{payment.provider_reference}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notification per blueprint Section 23 */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-400 text-center">
            Payment successful — Your payment has been received.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/portal/payments')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            View Payments
          </button>
          <Link
            href="/portal/invoices"
            className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors text-center"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}