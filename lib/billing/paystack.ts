// ============================================
// PAYSTACK PROVIDER IMPLEMENTATION
// ============================================

import { createHmac } from 'crypto'
import type {
  Currency,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from './types'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || ''
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export class PaystackProvider {
  private secretKey: string

  constructor() {
    this.secretKey = PAYSTACK_SECRET_KEY
    if (!this.secretKey) {
      console.error('PAYSTACK_SECRET_KEY is not configured')
    }
  }

  /**
   * Initialize a Paystack transaction
   */
  async initializePayment(
    input: InitializePaymentInput
  ): Promise<InitializePaymentResult> {
    try {
      const amountInKobo = Math.round(input.amount * 100) // Paystack expects smallest currency unit

      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: input.email,
          amount: amountInKobo,
          currency: input.currency,
          reference: `OMX-${input.invoiceId}-${Date.now()}`,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/payments/callback`,
          metadata: {
            invoice_id: input.invoiceId,
            client_id: input.clientId,
            ...input.metadata,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.status) {
        console.error('Paystack initialize failed:', data)
        return {
          success: false,
          error: data.message || 'Failed to initialize payment',
        }
      }

      return {
        success: true,
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
        access_code: data.data.access_code,
      }
    } catch (error) {
      console.error('Paystack initialize exception:', error)
      return {
        success: false,
        error: 'Payment initialization failed',
      }
    }
  }

  /**
   * Verify a Paystack transaction
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${input.reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error('Paystack verify failed:', data)
        return {
          success: false,
          error: data.message || 'Failed to verify payment',
        }
      }

      const transaction = data.data

      // Map Paystack status to our internal status
      let status: VerifyPaymentResult['status']

      if (transaction.status === 'success') {
        status = 'success'
      } else if (transaction.status === 'failed') {
        status = 'failed'
      } else if (transaction.status === 'abandoned') {
        status = 'abandoned'
      } else if (transaction.status === 'reversed') {
        status = 'reversed'
      } else if (transaction.status === 'ongoing') {
        status = 'pending'
      } else {
        status = 'pending'
      }

      return {
        success: true,
        status,
        amount: transaction.amount / 100, // Convert from kobo to main unit
        currency: transaction.currency as Currency,
        providerReference: transaction.reference,
      }
    } catch (error) {
      console.error('Paystack verify exception:', error)
      return {
        success: false,
        error: 'Payment verification failed',
      }
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    try {
      const hash = createHmac('sha512', this.secretKey)
        .update(payload)
        .digest('hex')
      return hash === signature
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }
}

// Singleton instance
export const paystackProvider = new PaystackProvider()
