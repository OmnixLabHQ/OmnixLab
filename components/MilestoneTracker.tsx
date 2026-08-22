'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import RevisionModal from '@/components/RevisionModal'

export default function MilestoneTracker({ projectId }: { projectId: number }) {
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [revisionMilestoneId, setRevisionMilestoneId] = useState<number | null>(null)

  useEffect(() => {
    fetchMilestones()
    const channel = supabase
      .channel(`milestones-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestones', filter: `project_id=eq.${projectId}` },
        () => fetchMilestones()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setMilestones(data || [])
    setLoading(false)
  }

  const acceptMilestone = async (milestone: any, isLast: boolean) => {
    await supabase
      .from('milestones')
      .update({ status: 'accepted', completed_at: new Date().toISOString() })
      .eq('id', milestone.id)

    if (isLast) {
      await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId)
    }
  }

  const declineMilestone = async (id: number) => {
    await supabase
      .from('milestones')
      .update({ status: 'revision-requested' })
      .eq('id', id)
  }

  const openRevision = (id: number) => {
    setRevisionMilestoneId(id)
  }

  if (loading) return <div className="text-sm text-gray-400">Loading milestones...</div>

  return (
    <>
      <div className="space-y-3">
        {milestones.map((m, index) => {
          const isLast = index === milestones.length - 1
          const isCompleted = m.status === 'accepted'
          const isOngoing = m.status === 'in-progress' || m.status === 'delivered'
          return (
            <div
              key={m.id}
              className={`p-4 rounded-xl border ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : isOngoing
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  <p className="font-medium">{m.title}</p>
                  {m.description && <p className="text-sm text-gray-500 mt-1">{m.description}</p>}
                  <p className="text-xs mt-1">
                    {isCompleted
                      ? `✅ Completed at ${new Date(m.completed_at).toLocaleDateString()}`
                      : isOngoing
                      ? `🔵 Ongoing (${m.status})`
                      : `⚪ Pending`}
                  </p>
                </div>

                {m.status === 'delivered' && (
                  <div className="flex gap-2 ml-4">
                    {!isLast ? (
                      <button
                        onClick={() => acceptMilestone(m, false)}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        onClick={() => acceptMilestone(m, true)}
                        className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800"
                      >
                        Accept Final Delivery
                      </button>
                    )}
                    <button
                      onClick={() => openRevision(m.id)}
                      className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => declineMilestone(m.id)}
                      className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {revisionMilestoneId && (
        <RevisionModal
          milestoneId={revisionMilestoneId}
          onClose={() => setRevisionMilestoneId(null)}
        />
      )}
    </>
  )
}