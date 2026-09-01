'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Idea {
  id: string
  client_id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  project_id: string | null
  problem_statement: string | null
  proposed_solution: string | null
  business_impact: string | null
  business_impact_score: number | null
  created_at: string
  updated_at: string
}

interface Comment {
  id: string
  idea_id: string
  client_id: string
  comment: string
  visibility: string
  created_at: string
}

interface Attachment {
  id: string
  idea_id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  created_at: string
}

interface Activity {
  id: string
  idea_id: string
  activity_type: string
  description: string
  created_at: string
}

interface Project {
  id: string
  name: string
}

export default function IdeaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ideaId = params?.id as string

  const [idea, setIdea] = useState<Idea | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => {
    if (ideaId) fetchData()
  }, [ideaId])

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('client_id', user.id)
        .single()

      if (ideaError || !ideaData) {
        router.push('/portal/ideas')
        return
      }

      setIdea(ideaData)

      const { data: commentsData } = await supabase
        .from('idea_comments')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true })

      if (commentsData) setComments(commentsData)

      const { data: attachmentsData } = await supabase
        .from('idea_attachments')
        .select('*')
        .eq('idea_id', ideaId)

      if (attachmentsData) setAttachments(attachmentsData)

      const { data: activitiesData } = await supabase
        .from('idea_activity')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false })

      if (activitiesData) setActivities(activitiesData)

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)

      if (projectsData) setProjects(projectsData)

      setLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setLoading(false)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return

    setSendingComment(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('idea_comments').insert({
        idea_id: ideaId,
        client_id: user.id,
        comment: newComment,
        visibility: 'client',
      })

      await supabase.from('idea_activity').insert({
        idea_id: ideaId,
        activity_type: 'comment_added',
        description: 'Comment added',
        client_id: user.id,
      })

      setNewComment('')
      await fetchData()
    } catch (error) {
      console.error('Comment error:', error)
    } finally {
      setSendingComment(false)
    }
  }

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', dot: '⚪' },
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      needs_information: { label: 'Needs Information', color: 'bg-orange-100 text-orange-800', dot: '🟠' },
      validated: { label: 'Validated', color: 'bg-green-100 text-green-800', dot: '🟢' },
      prioritized: { label: 'Prioritized', color: 'bg-purple-100 text-purple-800', dot: '🟣' },
      planned: { label: 'Planned', color: 'bg-indigo-100 text-indigo-800', dot: '🔷' },
      in_development: { label: 'In Development', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', dot: '✅' },
      declined: { label: 'Declined', color: 'bg-red-100 text-red-800', dot: '🔴' },
      archived: { label: 'Archived', color: 'bg-gray-100 text-gray-600', dot: '⚫' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '⚪' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!idea) return null

  const statusInfo = getStatusDisplay(idea.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/portal/ideas" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Ideas
        </Link>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Submitted {new Date(idea.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.dot} {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Idea Details</h3>
          <div className="space-y-4">
            {idea.problem_statement && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Problem</p>
                <p className="text-gray-700">{idea.problem_statement}</p>
              </div>
            )}
            {idea.proposed_solution && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Proposed Solution</p>
                <p className="text-gray-700">{idea.proposed_solution}</p>
              </div>
            )}
            {idea.business_impact && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Business Impact</p>
                <p className="text-gray-700">{idea.business_impact}</p>
              </div>
            )}
            {idea.description && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                <p className="text-gray-700">{idea.description}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Category: <strong>{idea.category.replace(/_/g, ' ')}</strong></span>
              <span>Priority: <strong>{idea.priority}</strong></span>
              <span>Impact Score: <strong>{idea.business_impact_score}/10</strong></span>
            </div>
          </div>
        </div>

        {/* Discussion */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Discussion</h3>
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{comment.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl"
            />
            <button
              onClick={handleAddComment}
              disabled={sendingComment || !newComment.trim()}
              className="px-5 py-3 bg-blue-600 text-white font-medium rounded-xl disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Attachments</h3>
            <div className="space-y-2">
              {attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <span>📎</span>
                  <span className="text-sm text-gray-700">{att.file_name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        {activities.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <span>📌</span>
                  <div>
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleString()}
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
