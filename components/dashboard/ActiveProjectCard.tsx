'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
}

export default function ActiveProjectCard() {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveProject()
  }, [])

  async function fetchActiveProject() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Failed to fetch project:', error)
        setLoading(false)
        return
      }

      setProject(data)
      setLoading(false)
    } catch (error) {
      console.error('Project fetch error:', error)
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'on_hold':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🚀</div>
        <h3 className="font-semibold text-gray-900 mb-1">
          No Active Projects
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Start your first project with Omnix Lab
        </p>
        <Link
          href="/portal/start-project"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Start a Project →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Active Project
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              {project.name}
            </h3>
          </div>
          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(project.status)}`}>
            {(project.status || 'pending').replace(/_/g, ' ')}
          </span>
        </div>

        {/* Project Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Timeline Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div>
            <p className="text-xs text-gray-400">Start Date</p>
            <p className="font-medium">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString()
                : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">End Date</p>
            <p className="font-medium">
              {project.end_date
                ? new Date(project.end_date).toLocaleDateString()
                : 'Not set'}
            </p>
          </div>
        </div>

        <Link
          href={`/portal/projects/${project.id}`}
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          View Project →
        </Link>
      </div>
    </div>
  )
}
