'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Requirement {
  id: string
  title: string
  status: string
  due_date: string
  project_id: string
}

export default function RequirementsPreview() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequirements()
  }, [])

  async function fetchRequirements() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Requirements fetch error:', error)
        setLoading(false)
        return
      }

      const reqs = data || []
      setRequirements(reqs.slice(0, 3))
      setTotalCount(reqs.length)
      setCompletedCount(reqs.filter((r) => r.status === 'accepted' || r.status === 'completed').length)
      setLoading(false)
    } catch (error) {
      console.error('Requirements fetch exception:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (totalCount === 0) {
    return null
  }

  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Requirements</h3>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">{completedCount} of {totalCount} completed</span>
            <span className="text-sm font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {requirements.map((req) => (
          <div key={req.id} className="p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
            <span className="text-xs text-gray-500">
              {req.status.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-200 text-center">
        <Link href="/portal/files" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Requirements →
        </Link>
      </div>
    </div>
  )
}
