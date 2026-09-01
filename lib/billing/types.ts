// ============================================
// OMNIX LAB BILLING ENGINE - SHARED TYPES
// ============================================

export type Currency = 'USD' | 'NGN' | 'EUR' | 'GBP' | 'GHS' | 'KES' | 'ZAR'

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'expired'
  | 'reversed'
  | 'refunded'
  | 'partially_refunded'

export type PaymentMethodType =
  | 'paystack'
  | 'flutterwave'
  | 'bank_transfer'
  | 'wire_transfer'
  | 'fedwire'
  | 'remitly'
  | 'worldremit'
  | 'western_union'
  | 'moneygram'
  | 'usdt'
  | 'local_wire'

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_id: string | null
  milestone_id: string | null
  amount: number
  subtotal: number
  tax: number
  discount: number
  total: number
  currency: Currency
  description: string
  status: InvoiceStatus
  payment_gateway: string | null
  payment_terms: string
  billing_address: string | null
  notes: string | null
  issue_date: string | null
  due_date: string | null
  paid_at: string | null
  viewed_at: string | null
  cancelled_at: string | null
  paystack_reference: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  client_id: string
  amount: number
  currency: Currency
  status: PaymentStatus
  payment_method: PaymentMethodType
  provider_reference: string | null
  internal_reference: string
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  payment_id: string
  invoice_id: string
  provider: string
  provider_reference: string | null
  amount: number
  currency: Currency
  status: PaymentStatus
  raw_response: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface PaymentRequest {
  id: string
  invoice_id: string
  client_id: string
  payment_method: PaymentMethodType
  amount: number
  currency: Currency
  message: string | null
  status: 'awaiting_instructions' | 'instructions_sent' | 'proof_submitted' | 'verified' | 'rejected' | 'cancelled'
  reference: string
  admin_instructions: string | null
  created_at: string
  updated_at: string
}

export interface InitializePaymentInput {
  invoiceId: string
  clientId: string
  email: string
  amount: number
  currency: Currency
  metadata?: Record<string, any>
}

export interface InitializePaymentResult {
  success: boolean
  authorization_url?: string
  reference?: string
  access_code?: string
  error?: string
}

export interface VerifyPaymentInput {
  reference: string
}

export interface VerifyPaymentResult {
  success: boolean
  status?: PaymentStatus
  amount?: number
  currency?: Currency
  providerReference?: string
  error?: string
}

export interface WebhookEvent {
  event: string
  data: {
    reference: string
    status: string
    amount: number
    currency: string
    metadata?: Record<string, any>
    paid_at?: string
    customer?: {
      email: string
    }
  }
}
