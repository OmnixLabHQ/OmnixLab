'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface DeviceSession {
  id: string
  device_name: string
  browser: string
  os: string
  ip_address: string | null
  location: string | null
  is_current: boolean
  last_active_at: string
  created_at: string
}

export default function SessionsSettingsPage() {
  const [sessions, setSessions] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch(`/api/auth/sessions?userId=${user.id}`)
      const result = await response.json()

      if (result.success) {
        setSessions(result.sessions)
      }
      setLoading(false)
    } catch (error) {
      console.error('Sessions fetch error:', error)
      setLoading(false)
    }
  }

  async function handleRevoke(sessionId: string) {
    if (!confirm('Revoke this session?')) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await fetch('/api/auth/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: user.id }),
    })

    setMessage('Session revoked successfully')
    await fetchSessions()
  }

  async function handleRevokeAll() {
    if (!confirm('Revoke all other sessions? You will remain signed in on this device.')) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.auth.signOut({ scope: 'others' })

    setMessage('All other sessions revoked')
    await fetchSessions()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/settings" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Settings
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sessions & Devices</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 mb-4">{message}</div>
        )}

        {/* Sessions List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Active Sessions</h2>
            <p className="text-sm text-gray-600">{sessions.length} active sessions</p>
          </div>
          <div className="divide-y divide-gray-100">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No active sessions found</div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {session.device_name.includes('iPhone') ? '📱' :
                       session.device_name.includes('Windows') ? '🖥️' :
                       session.device_name.includes('Mac') ? '💻' : '💻'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{session.device_name}</p>
                        {session.is_current && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">This Device</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{session.browser} • {session.os}</p>
                      <p className="text-xs text-gray-500">
                        {session.location || 'Location unknown'} • Last active: {new Date(session.last_active_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!session.is_current && (
                    <button
                      onClick={() => handleRevoke(session.id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded-lg"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Session Management</h3>
          <button
            onClick={handleRevokeAll}
            className="w-full p-4 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-xl transition-colors"
          >
            Sign Out All Other Devices
          </button>
        </div>
      </div>
    </div>
  )
}
