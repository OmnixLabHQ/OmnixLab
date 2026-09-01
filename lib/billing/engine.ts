// ============================================
// OMNIX LAB BILLING ENGINE - CORE SERVICE
// Single source of truth for all billing operations
// ============================================

import { createClient } from '@supabase/supabase-js'
import type {
  Currency,
  PaymentMethodType,
  PaymentStatus,
  VerifyPaymentResult,
} from './types'

// These are safe to have at module level for server-side use
const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'

function getSupabaseAdmin() {
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY)
}

function getPaystackSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY || ''
}

export class BillingEngine {
  /**
   * Verify a payment with Paystack
   */
  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    try {
      const secretKey = getPaystackSecretKey()
      if (!secretKey) {
        return { success: false, error: 'Paystack not configured' }
      }

      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok || !data.status) {
        return {
          success: false,
          error: data.message || 'Failed to verify payment',
        }
      }

      const transaction = data.data

      let status: PaymentStatus = 'pending'
      if (transaction.status === 'success') status = 'success'
      else if (transaction.status === 'failed') status = 'failed'
      else if (transaction.status === 'abandoned') status = 'abandoned'
      else if (transaction.status === 'reversed') status = 'reversed'

      return {
        success: true,
        status,
        amount: transaction.amount / 100,
        currency: transaction.currency as Currency,
        providerReference: transaction.reference,
      }
    } catch (error) {
      console.error('Billing engine verify error:', error)
      return { success: false, error: 'Payment verification failed' }
    }
  }

  /**
   * Process a successful payment from webhook
   */
  async processSuccessfulPayment(
    reference: string,
    amount: number,
    currency: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      // Find payment by provider reference
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('provider_reference', reference)
        .single()

      if (paymentError || !payment) {
        // Try to find by invoice paystack_reference
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('*')
          .eq('paystack_reference', reference)
          .single()

        if (!invoice) {
          return { success: false, error: 'Payment not found' }
        }

        const now = new Date().toISOString()

        // Update invoice
        await supabaseAdmin
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: now,
            updated_at: now,
            payment_gateway: 'paystack',
          })
          .eq('id', invoice.id)

        // Create payment record
        const { data: newPayment } = await supabaseAdmin
          .from('payments')
          .insert({
            invoice_id: invoice.id,
            client_id: invoice.client_id,
            amount: amount,
            currency: currency,
            status: 'success',
            payment_method: 'paystack',
            provider_reference: reference,
            internal_reference: `OMX-PAY-${Date.now()}`,
            paid_at: now,
          })
          .select()
          .single()

        // Create receipt
        if (newPayment) {
          const receiptNumber = `RCT-${Date.now()}`
          await supabaseAdmin.from('receipts').insert({
            invoice_id: invoice.id,
            payment_id: newPayment.id,
            client_id: invoice.client_id,
            receipt_number: receiptNumber,
            amount: invoice.total || invoice.amount,
            currency: invoice.currency || currency,
          })
        }

        // Notify client
        await supabaseAdmin.from('notifications').insert({
          client_id: invoice.client_id,
          type: 'invoice',
          title: 'Payment Received',
          message: `Your invoice payment has been confirmed.`,
          data: { invoice_id: invoice.id },
        })

        // Log audit
        await supabaseAdmin.from('financial_audit_logs').insert({
          invoice_id: invoice.id,
          action: 'payment_confirmed',
          after_data: { reference },
        })

        return { success: true }
      }

      // Payment record exists - update it
      const now = new Date().toISOString()

      await supabaseAdmin
        .from('payments')
        .update({
          status: 'success',
          paid_at: now,
        })
        .eq('id', payment.id)

      // Update invoice
      await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: now,
          updated_at: now,
          payment_gateway: 'paystack',
        })
        .eq('id', payment.invoice_id)

      // Create receipt if not exists
      const { data: existingReceipt } = await supabaseAdmin
        .from('receipts')
        .select('id')
        .eq('payment_id', payment.id)
        .single()

      if (!existingReceipt) {
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('client_id, total, amount, currency')
          .eq('id', payment.invoice_id)
          .single()

        if (invoice) {
          const receiptNumber = `RCT-${Date.now()}`
          await supabaseAdmin.from('receipts').insert({
            invoice_id: payment.invoice_id,
            payment_id: payment.id,
            client_id: invoice.client_id,
            receipt_number: receiptNumber,
            amount: invoice.total || invoice.amount,
            currency: invoice.currency || currency,
          })
        }
      }

      // Notify client
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('client_id')
        .eq('id', payment.invoice_id)
        .single()

      if (invoice) {
        await supabaseAdmin.from('notifications').insert({
          client_id: invoice.client_id,
          type: 'invoice',
          title: 'Payment Received',
          message: `Your invoice payment has been confirmed.`,
          data: { invoice_id: payment.invoice_id },
        })
      }

      // Log audit
      await supabaseAdmin.from('financial_audit_logs').insert({
        invoice_id: payment.invoice_id,
        payment_id: payment.id,
        action: 'payment_confirmed',
        after_data: { reference },
      })

      return { success: true }
    } catch (error) {
      console.error('Process payment error:', error)
      return { success: false, error: 'Payment processing failed' }
    }
  }

  /**
   * Request manual payment instructions
   */
  async requestPaymentInstructions(input: {
    invoiceId: string
    clientId: string
    amount: number
    currency: string
    method: string
    message?: string
  }): Promise<{ success: boolean; error?: string }> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      const reference = `PMR-${Date.now()}`

      const { error } = await supabaseAdmin.from('payment_requests').insert({
        invoice_id: input.invoiceId,
        client_id: input.clientId,
        payment_method: input.method,
        amount: input.amount,
        currency: input.currency,
        message: input.message || null,
        status: 'awaiting_instructions',
        reference,
      })

      if (error) {
        console.error('Payment request error:', error)
        return { success: false, error: 'Failed to create payment request' }
      }

      // Notify client
      await supabaseAdmin.from('notifications').insert({
        client_id: input.clientId,
        type: 'invoice',
        title: 'Payment Request Submitted',
        message: `Your request for ${input.method} payment instructions has been received.`,
        data: { request_reference: reference },
      })

      // Log audit
      await supabaseAdmin.from('financial_audit_logs').insert({
        invoice_id: input.invoiceId,
        actor_id: input.clientId,
        action: 'payment_instructions_requested',
        after_data: { method: input.method, reference },
      })

      return { success: true }
    } catch (error) {
      console.error('Payment request exception:', error)
      return { success: false, error: 'Failed to create payment request' }
    }
  }
}

// Export singleton
export const billingEngine = new BillingEngine()
