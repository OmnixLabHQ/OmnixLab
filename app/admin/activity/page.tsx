'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setActivities(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity</h1>
        <p className="text-sm text-gray-400 mt-1">Recent business activity timeline</p>
      </div>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-gray-500">No activity recorded yet</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-white">{activity.description || '-'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activity.created_at
                    ? new Date(activity.created_at).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}