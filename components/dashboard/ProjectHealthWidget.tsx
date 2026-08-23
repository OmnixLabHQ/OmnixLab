'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ProjectHealth {
  id: string
  project_id: string
  health_status: string
  schedule_score: number
  budget_score: number
  client_score: number
  development_score: number
  risk_score: number
  notes: string
  updated_at: string
}

export default function ProjectHealthWidget() {
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
  }, [])

  async function fetchHealth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Get most recent active project
      const { data: project } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!project) {
        setLoading(false)
        return
      }

      setProjectName(project.name)

      // Fetch project health
      const { data: healthData } = await supabase
        .from('project_health')
        .select('*')
        .eq('project_id', project.id)
        .eq('client_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setHealth(healthData || null)
      setLoading(false)
    } catch (error) {
      console.error('Health fetch error:', error)
      setLoading(false)
    }
  }

  function getHealthDisplay(status: string) {
    const map: Record<string, { label: string; color: string; dot: string; barColor: string }> = {
      healthy: { label: 'Healthy', color: 'bg-green-100 text-green-800', dot: '🟢', barColor: 'bg-green-500' },
      at_risk: { label: 'At Risk', color: 'bg-amber-100 text-amber-800', dot: '🟡', barColor: 'bg-amber-500' },
      delayed: { label: 'Delayed', color: 'bg-red-100 text-red-800', dot: '🔴', barColor: 'bg-red-500' },
    }
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-800', dot: '⚪', barColor: 'bg-gray-500' }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded"></div>
            <div className="h-3 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!health) {
    return null
  }

  const healthInfo = getHealthDisplay(health.health_status)

  const scores = [
    { label: 'Schedule', value: health.schedule_score || 100 },
    { label: 'Budget', value: health.budget_score || 100 },
    { label: 'Client', value: health.client_score || 100 },
    { label: 'Development', value: health.development_score || 100 },
    { label: 'Risk', value: health.risk_score || 100 },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Project Health</h3>
        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${healthInfo.color}`}>
          {healthInfo.dot} {healthInfo.label}
        </span>
      </div>

      {projectName && (
        <p className="text-sm text-gray-600 mb-4">{projectName}</p>
      )}

      <div className="space-y-3">
        {scores.map((score) => (
          <div key={score.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{score.label}</span>
              <span className="text-xs font-semibold text-gray-700">{score.value}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  score.value >= 80 ? 'bg-green-500' :
                  score.value >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${score.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {health.notes && (
        <p className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded-lg">
          📝 {health.notes}
        </p>
      )}
    </div>
  )
}