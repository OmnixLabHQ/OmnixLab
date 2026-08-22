'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface UpcomingItem {
  id: string
  type: 'task' | 'invoice'
  title: string
  dueDate: string
  projectId?: string
  projectName?: string
  url: string
  amount?: number
  status?: string
}

export default function UpcomingSchedule() {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcoming()
  }, [])

  async function fetchUpcoming() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // Next 30 days

      const upcomingItems: UpcomingItem[] = []

      // Fetch upcoming tasks (incomplete) with due dates within next 30 days
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .eq('completed_by', null)
        .gte('due_date', now.toISOString())
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true })
        .limit(10)

      if (!tasksError && tasks) {
        tasks.forEach((task: any) => {
          upcomingItems.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title,
            dueDate: task.due_date,
            projectId: task.project_id,
            projectName: task.projects?.name || 'Unknown Project',
            url: `/portal/projects/${task.project_id}`,
          })
        })
      }

      // Fetch upcoming invoices (unpaid) with due dates within next 30 days
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, projects(name)')
        .eq('client_id', user.id)
        .in('status', ['sent', 'overdue', 'unpaid'])
        .gte('due_date', now.toISOString())
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true })
        .limit(10)

      if (!invoicesError && invoices) {
        invoices.forEach((invoice: any) => {
          upcomingItems.push({
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            title: `Invoice ${invoice.id.slice(0, 8)}`,
            dueDate: invoice.due_date,
            projectId: invoice.project_id,
            projectName: invoice.projects?.name || 'Unknown Project',
            url: `/portal/invoices/${invoice.id}`,
            amount: invoice.amount,
            status: invoice.status,
          })
        })
      }

      // Sort all by due date
      upcomingItems.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )

      setItems(upcomingItems.slice(0, 8))
      setLoading(false)
    } catch (error) {
      console.error('Upcoming fetch error:', error)
      setLoading(false)
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  function isDueSoon(dateStr: string) {
    const due = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Upcoming</h3>
        <p className="text-sm text-gray-500">No upcoming deadlines in the next 30 days.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Upcoming</h3>
        <span className="text-xs text-gray-400">Next 30 days</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {item.type === 'task' ? (
                  <span className="text-lg">📋</span>
                ) : (
                  <span className="text-lg">💰</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">
                  {item.projectName} • {formatDate(item.dueDate)}
                </p>
                {item.type === 'invoice' && item.amount && (
                  <p className="text-xs font-semibold text-gray-700">
                    ${item.amount.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {isDueSoon(item.dueDate) && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                Soon
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}