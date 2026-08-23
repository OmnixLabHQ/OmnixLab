'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface SecurityEvent {
  id: string
  event_type: string
  metadata: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error) {
        setEvents(data || [])
      }
      setLoading(false)
    } catch (error) {
      console.error('Events fetch error:', error)
      setLoading(false)
    }
  }

  function getEventIcon(type: string): string {
    if (type.includes('LOGIN')) return '🔐'
    if (type.includes('PASSWORD')) return '🔑'
    if (type.includes('MFA')) return '📱'
    if (type.includes('SUSPEND')) return '🚫'
    if (type.includes('EMAIL')) return '📧'
    return '📌'
  }

  function getEventLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.event_type.toLowerCase().includes(filter.toLowerCase()))

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
        <Link href="/portal/settings/security" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Security
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Events</h1>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'LOGIN', 'PASSWORD', 'MFA', 'EMAIL'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : getEventLabel(f)}
            </button>
          ))}
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-3">🔐</div>
            <p className="text-gray-500">No security events found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-4 flex items-start gap-3">
                  <span className="text-xl">{getEventIcon(event.event_type)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {getEventLabel(event.event_type)}
                    </p>
                    {event.ip_address && (
                      <p className="text-xs text-gray-500">IP: {event.ip_address}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}