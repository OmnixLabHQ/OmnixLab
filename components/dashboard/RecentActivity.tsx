'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Activity {
  id: string
  type: string
  title: string
  description: string
  created_at: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

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

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Activity fetch error:', error)
        setActivities([])
        setLoading(false)
        return
      }

      setActivities(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Activity error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (activities.length === 0) {
    return null
  }

  function getIcon(type: string) {
    switch (type) {
      case 'invoice':
        return '💰'
      case 'project':
        return '📊'
      case 'file':
        return '📁'
      case 'message':
        return '💬'
      case 'payment':
        return '✅'
      default:
        return '📌'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <span className="text-lg">{getIcon(activity.type)}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
              {activity.description && (
                <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(activity.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
