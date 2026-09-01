'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    // Supabase automatically handles email verification via URL hash
    // The session is set up if the token is valid
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')

        // Log security event
        await supabase.from('security_events').insert({
          user_id: user.id,
          event_type: 'EMAIL_VERIFIED',
          metadata: {},
        })

        // Redirect after 3 seconds
        setTimeout(() => router.push('/portal/onboarding'), 3000)
      } else {
        setStatus('failed')
        setMessage('Invalid or expired verification link. Please request a new one.')
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to onboarding...</p>
            <Link href="/portal/onboarding" className="mt-4 inline-block text-indigo-600 hover:underline">
              Continue now →
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link href="/portal/login" className="text-indigo-600 hover:underline">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
