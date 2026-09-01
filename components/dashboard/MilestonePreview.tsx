'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Milestone {
  id: string
  title: string
  status: string
  progress: number
  due_date: string
  project_id: string
}

export default function MilestonePreview() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMilestones()
  }, [])

  async function fetchMilestones() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Get active projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id)
        .neq('status', 'completed')
        .limit(5)

      if (!projects || projects.length === 0) {
        setLoading(false)
        return
      }

      const projectIds = projects.map((p) => p.id)

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .in('project_id', projectIds)
        .order('due_date', { ascending: true })
        .limit(5)

      if (error) {
        console.error('Milestones fetch error:', error)
        setLoading(false)
        return
      }

      setMilestones(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Milestones fetch exception:', error)
      setLoading(false)
    }
  }

  function getStatusDot(status: string) {
    const dots: Record<string, string> = {
      pending: '⚪',
      in_progress: '🔵',
      completed: '🟢',
      approved: '✅',
      rejected: '🔴',
    }
    return dots[status] || '⚪'
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (milestones.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Milestones</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span>{getStatusDot(milestone.status)}</span>
              <p className="font-medium text-gray-900 text-sm">{milestone.title}</p>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${milestone.progress || 0}%` }}
              ></div>
            </div>
            {milestone.due_date && (
              <p className="text-xs text-gray-400 mt-1">
                Due {new Date(milestone.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-200 text-center">
        <Link href="/portal/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Projects →
        </Link>
      </div>
    </div>
  )
}
