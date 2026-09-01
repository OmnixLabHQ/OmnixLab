'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Idea {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
}

export default function IdeasPreview() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [needsAttention, setNeedsAttention] = useState(0)

  useEffect(() => {
    fetchIdeas()
  }, [])

  async function fetchIdeas() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('client_id', user.id)
        .eq('deleted', false)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Failed to fetch ideas:', error)
        setLoading(false)
        return
      }

      setIdeas(data || [])
      setNeedsAttention(
        data?.filter((i) => ['needs_information', 'under_review'].includes(i.status)).length || 0
      )
      setLoading(false)
    } catch (error) {
      console.error('Ideas fetch error:', error)
      setLoading(false)
    }
  }

  function getStatusDot(status: string) {
    const dots: Record<string, string> = {
      draft: '⚪',
      submitted: '🔵',
      under_review: '🟡',
      needs_information: '🟠',
      validated: '🔷',
      prioritized: '🟣',
      planned: '🔵',
      in_development: '🔵',
      completed: '🟢',
      declined: '🔴',
      archived: '⚪',
    }
    return dots[status] || '⚪'
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">💡</div>
        <h3 className="font-semibold text-gray-900 mb-1">No Ideas Yet</h3>
        <p className="text-sm text-gray-600 mb-4">
          Have a product idea or feature request?
        </p>
        <Link
          href="/portal/ideas/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Submit an Idea
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Your Ideas</h3>
          {needsAttention > 0 && (
            <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
              {needsAttention} need attention
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {ideas.map((idea) => (
          <Link
            key={idea.id}
            href={`/portal/ideas/${idea.id}`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <span className="text-lg">{getStatusDot(idea.status)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {idea.title || 'Untitled'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {idea.status.replace(/_/g, ' ')} • {new Date(idea.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 text-center">
        <Link
          href="/portal/ideas"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Ideas →
        </Link>
      </div>
    </div>
  )
}
