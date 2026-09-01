'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface ActivityEntry {
  id: string
  type: string
  title: string
  message: string
  created_at: string
}

export default function ActivitySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchActivities()
  }, [])

  async function fetchActivities() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch notifications as activity (or create from audit logs if available)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Activity fetch error:', error)
        setLoading(false)
        return
      }

      const mappedActivities: ActivityEntry[] = (data || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        created_at: n.created_at,
      }))

      setActivities(mappedActivities)
      setLoading(false)
    } catch (error) {
      console.error('Activity exception:', error)
      setLoading(false)
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'project':
        return '📊'
      case 'invoice':
        return '💰'
      case 'payment':
        return '✅'
      case 'message':
        return '💬'
      case 'file':
        return '📁'
      case 'system':
        return '🔔'
      case 'account':
        return '👤'
      default:
        return '📌'
    }
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case 'project':
        return 'Projects'
      case 'invoice':
        return 'Invoices'
      case 'payment':
        return 'Payments'
      case 'message':
        return 'Messages'
      case 'file':
        return 'Files'
      case 'system':
        return 'System'
      case 'account':
        return 'Account'
      default:
        return 'Other'
    }
  }

  const filteredActivities =
    filter === 'all' ? activities : activities.filter((a) => a.type === filter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/settings" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Settings
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity & Audit</h1>
        <p className="text-gray-600 mb-6">
          View your recent account and portal activity.
        </p>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('project')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === 'project' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setFilter('invoice')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === 'invoice' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setFilter('payment')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === 'payment' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter('file')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === 'file' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setFilter('account')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === 'account' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Security
          </button>
        </div>

        {/* Activity List */}
        {filteredActivities.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-500">No activity found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-xl">{getTypeIcon(activity.type)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{getTypeLabel(activity.type)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Security-critical actions (login, password changes, email changes)
            are permanently recorded and cannot be deleted.
          </p>
        </div>
      </div>
    </div>
  )
}
