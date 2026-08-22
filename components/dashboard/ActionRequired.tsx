'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface ActionItem {
  id: string
  type: string
  title: string
  description: string
  dueDate?: string
  url: string
  priority: string
}

export default function ActionRequired() {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActions()
  }, [])

  async function fetchActions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const actionItems: ActionItem[] = []

      // Fetch pending approvals
      const { data: approvals, error: approvalsError } = await supabase
        .from('approvals')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .limit(5)

      if (!approvalsError && approvals) {
        approvals.forEach((approval: any) => {
          actionItems.push({
            id: `approval-${approval.id}`,
            type: 'approval',
            title: `Approve: ${approval.title || 'Approval needed'}`,
            description: approval.description || 'Approval needed',
            dueDate: approval.updated_at,
            url: `/portal/projects/${approval.project_id}`,
            priority: 'high',
          })
        })
      }

      // Fetch unpaid invoices
      const { data: unpaidInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .in('status', ['sent', 'overdue', 'unpaid'])
        .limit(5)

      if (!invoicesError && unpaidInvoices) {
        unpaidInvoices.forEach((invoice: any) => {
          actionItems.push({
            id: `payment-${invoice.id}`,
            type: 'payment',
            title: `Pay Invoice`,
            description: `Amount due: $${(invoice.amount || 0).toLocaleString()}`,
            dueDate: invoice.due_date,
            url: `/portal/invoices/${invoice.id}`,
            priority: 'high',
          })
        })
      }

      // Fetch incomplete tasks
      const { data: incompleteTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed_by', null)
        .limit(5)

      if (!tasksError && incompleteTasks) {
        incompleteTasks.forEach((task: any) => {
          actionItems.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title || 'Complete Task',
            description: 'Task needs attention',
            dueDate: task.due_date,
            url: `/portal/projects/${task.project_id}`,
            priority: 'medium',
          })
        })
      }

      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      actionItems.sort(
        (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
      )

      setActions(actionItems)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch actions:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-xl">⚠️</span>
          <h3 className="font-semibold text-gray-900">Action Required</h3>
          <span className="ml-auto text-sm text-gray-500">{actions.length} items</span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {actions.map((action) => (
          <Link key={action.id} href={action.url} className="block p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {action.type === 'payment' && <span className="text-xl">💰</span>}
                {action.type === 'task' && <span className="text-xl">📋</span>}
                {action.type === 'approval' && <span className="text-xl">✅</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{action.title}</p>
                {action.description && <p className="text-sm text-gray-600 mt-0.5">{action.description}</p>}
              </div>
              {action.dueDate && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500">Due</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(action.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}