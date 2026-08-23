'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MilestoneCard from '@/components/MilestoneCard'
import PaymentModal from '@/components/PaymentModal'

export default function ProjectCard({
  project,
  userId,
}: {
  project: any
  userId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [milestones, setMilestones] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)

  useEffect(() => {
    if (expanded) {
      fetchData()

      const channel = supabase
        .channel(`project-${project.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'milestones', filter: `project_id=eq.${project.id}` },
          () => fetchData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'invoices', filter: `project_id=eq.${project.id}` },
          () => fetchData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'requirement_requests', filter: `project_id=eq.${project.id}` },
          () => fetchData()
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [expanded, project.id])

  const fetchData = async () => {
    const { data: milestonesData } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true })
    setMilestones(milestonesData || [])

    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', project.id)
    setInvoices(invoicesData || [])

    const { data: requirementsData } = await supabase
      .from('requirement_requests')
      .select('*')
      .eq('project_id', project.id)
    setRequirements(requirementsData || [])
  }

  const handlePay = (invoice: any) => {
    setPaymentInvoice(invoice)
  }

  const handleAccept = async (milestone: any) => {
    const isLast = milestones.indexOf(milestone) === milestones.length - 1
    await supabase
      .from('milestones')
      .update({ status: 'accepted', completed_at: new Date().toISOString() })
      .eq('id', milestone.id)

    if (isLast) {
      await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', project.id)
    }
  }

  const handleDecline = async (milestone: any) => {
    await supabase
      .from('milestones')
      .update({ status: 'declined' })
      .eq('id', milestone.id)
  }

  const handleRequestRevision = async (milestone: any) => {
    await supabase
      .from('milestones')
      .update({ status: 'revision-requested' })
      .eq('id', milestone.id)
  }

  const handleRequirementSubmit = async (requirementId: number, response: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !response.trim()) return

    await supabase
      .from('requirement_requests')
      .update({ client_response: response, status: 'filled' })
      .eq('id', requirementId)

    // After update, refetch requirements and check if all are filled
    await fetchData()

    // If no unfilled requirements left, update project status to ongoing
    const { data: remainingReq } = await supabase
      .from('requirement_requests')
      .select('status')
      .eq('project_id', project.id)
      .neq('status', 'filled')

    if ((remainingReq || []).length === 0) {
      await supabase
        .from('projects')
        .update({ status: 'ongoing' })
        .eq('id', project.id)
    }
  }

  const findInvoiceForMilestone = (milestoneId: number) => {
    return invoices.find(inv => inv.milestone_id === milestoneId)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Project header */}
      <div
        className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              project.status === 'completed' ? 'bg-green-100 text-green-700' :
              project.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {project.status}
            </span>
          </div>
        </div>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded workspace */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-6">
          {/* Requirements section */}
          <div>
            <h4 className="font-semibold mb-2">📋 Project Requirements</h4>
            {requirements.length === 0 ? (
              <p className="text-sm text-gray-400">No requirements requested yet.</p>
            ) : (
              <div className="space-y-3">
                {requirements.map(req => (
                  <div key={req.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{req.title}</p>
                        {req.description && <p className="text-sm text-gray-500 mt-1">{req.description}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        req.status === 'filled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'filled' ? 'Filled' : 'Pending'}
                      </span>
                    </div>

                    {req.status !== 'filled' ? (
                      <RequirementResponseForm
                        requirement={req}
                        onSubmit={handleRequirementSubmit}
                      />
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Your response: {req.client_response}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones section */}
          <div>
            <h4 className="font-semibold mb-2">📌 Milestones</h4>
            <div className="space-y-3">
              {milestones.map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  invoice={findInvoiceForMilestone(milestone.id)}
                  projectId={project.id}
                  userId={userId}
                  onPay={handlePay}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onRequestRevision={handleRequestRevision}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {paymentInvoice && <PaymentModal invoice={paymentInvoice} onClose={() => setPaymentInvoice(null)} />}
    </div>
  )
}

// Requirement response form component
function RequirementResponseForm({
  requirement,
  onSubmit,
}: {
  requirement: any
  onSubmit: (id: number, response: string) => void
}) {
  const [response, setResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!response.trim()) return
    setSubmitting(true)
    await onSubmit(requirement.id, response)
    setSubmitting(false)
    setResponse('')
  }

  return (
    <div className="mt-3">
      <textarea
        value={response}
        onChange={e => setResponse(e.target.value)}
        rows={3}
        placeholder="Enter your requirements / response..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || !response.trim()}
        className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  )
}