'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (token) {
      fetchInvitation()
    } else {
      setError('Invalid invitation link.')
      setLoading(false)
    }
  }, [token])

  async function fetchInvitation() {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Invalid or expired invitation.')
        setLoading(false)
        return
      }

      // Check expiration
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired. Please request a new one.')
        setLoading(false)
        return
      }

      setInvitation(data)
      setLoading(false)
    } catch (error) {
      setError('Failed to load invitation.')
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError('')

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Create client record
        await supabase.from('clients').insert({
          id: authData.user.id,
          full_name: fullName,
          company: '',
          email: invitation.email,
          approved: true,
        })

        // Add to organization members
        await supabase.from('organization_members').insert({
          client_id: invitation.client_id,
          user_id: authData.user.id,
          role: invitation.role,
          status: 'active',
        })

        // Update invitation
        await supabase
          .from('invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', invitation.id)

        router.push('/portal/dashboard?welcome=1')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading invitation...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Accept Invitation</h1>

        {error ? (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">
            {error}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-center text-gray-600">
              You&apos;ve been invited to join Omnix Lab as{' '}
              <strong className="capitalize">{invitation?.role}</strong>
            </p>
            <p className="text-center text-gray-500 text-sm">{invitation?.email}</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
            <button
              onClick={handleAccept}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
            >
              Accept Invitation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
