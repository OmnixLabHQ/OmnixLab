'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const C = {
  bg: '#070A0F',
  surface: '#0D1117',
  border: '#1E293B',
  text: '#F8FAFC',
  text2: '#94A3B8',
  accent: '#E11D2E',
  red: '#EF4444',
  blue: '#38BDF8',
}

function FailedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference') || ''
  const reason = searchParams.get('reason') || ''

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '100%' }}>
        {/* Failed Icon */}
        <div style={{
          width: '64px', height: '64px', background: 'rgba(239,68,68,0.2)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <span style={{ fontSize: '32px', color: C.red }}>✕</span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, textAlign: 'center', margin: '0 0 8px 0' }}>
          Payment Unsuccessful
        </h1>
        <p style={{ fontSize: '14px', color: C.text2, textAlign: 'center', margin: '0 0 24px 0' }}>
          Your payment could not be completed. Please try again.
        </p>

        {/* Reference */}
        {reference && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Transaction Reference</p>
            <p style={{ fontSize: '14px', color: C.text, fontFamily: 'monospace', margin: 0 }}>{reference}</p>
          </div>
        )}

        {/* Reason if available */}
        {reason && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Reason</p>
            <p style={{ fontSize: '14px', color: C.text, margin: 0 }}>{reason.replace(/_/g, ' ')}</p>
          </div>
        )}

        {/* Notification */}
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: C.red, margin: 0 }}>
            Payment unsuccessful — Your payment could not be completed.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '100%', padding: '14px', background: C.accent, color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <Link
            href="/portal/payments"
            style={{
              display: 'block', width: '100%', padding: '14px', background: C.surface,
              color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px',
              fontSize: '15px', fontWeight: '600', textAlign: 'center', textDecoration: 'none',
            }}
          >
            Back to Payments
          </Link>
          <Link
            href="/portal/support"
            style={{
              display: 'block', width: '100%', padding: '10px',
              color: C.text2, fontSize: '14px', textAlign: 'center', textDecoration: 'none',
            }}
          >
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FailedPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#070A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <FailedContent />
    </Suspense>
  )
}