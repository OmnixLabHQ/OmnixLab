'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
}

export default function NewIdeaPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'new_feature',
    priority: 'medium',
    project_id: '',
    problem_statement: '',
    proposed_solution: '',
    business_impact: '',
    business_impact_score: 5,
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('client_id', user.id)

    if (data) setProjects(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.title.trim()) {
      setError('Idea title is required')
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: idea, error: insertError } = await supabase
        .from('ideas')
        .insert({
          client_id: user.id,
          title: form.title,
          description: form.description,
          category: form.category,
          priority: form.priority,
          project_id: form.project_id || null,
          problem_statement: form.problem_statement,
          proposed_solution: form.proposed_solution,
          business_impact: form.business_impact,
          business_impact_score: form.business_impact_score,
          status: 'submitted',
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Create activity log
      await supabase.from('idea_activity').insert({
        idea_id: idea.id,
        activity_type: 'submitted',
        description: 'Idea submitted',
        client_id: user.id,
      })

      // Create notification
      await supabase.from('notifications').insert({
        client_id: user.id,
        type: 'system',
        title: 'Idea Submitted',
        message: `Your idea "${form.title}" has been submitted for review.`,
        data: { idea_id: idea.id },
      })

      router.push(`/portal/ideas/${idea.id}`)
    } catch (error) {
      console.error('Submit error:', error)
      setError('An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/ideas" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Ideas
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit an Idea</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tell us about your idea</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idea Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                  >
                    <option value="new_feature">New Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="bug">Bug / Problem</option>
                    <option value="automation">Automation</option>
                    <option value="integration">Integration</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="ui_ux">UI/UX</option>
                    <option value="business_process">Business Process</option>
                    <option value="new_product">New Product</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project (optional)</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Problem & Solution */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Problem & Solution</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What problem are you trying to solve?
                </label>
                <textarea
                  value={form.problem_statement}
                  onChange={(e) => setForm({ ...form, problem_statement: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What would you like to happen?
                </label>
                <textarea
                  value={form.proposed_solution}
                  onChange={(e) => setForm({ ...form, proposed_solution: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Business Impact */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Business Impact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why is this important?
                </label>
                <textarea
                  value={form.business_impact}
                  onChange={(e) => setForm({ ...form, business_impact: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Business Impact Score (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.business_impact_score}
                  onChange={(e) => setForm({ ...form, business_impact_score: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-center text-lg font-semibold text-gray-900">
                  {form.business_impact_score}/10
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Additional Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Idea'}
          </button>
        </form>
      </div>
    </div>
  )
}
