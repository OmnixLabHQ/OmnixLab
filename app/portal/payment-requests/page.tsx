'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const STEPS = ['Project', 'Business', 'Scope', 'Timeline & Budget', 'Files', 'Review']

const PROJECT_TYPES = [
  'Website', 'Web Application', 'SaaS Platform', 'Mobile Application',
  'AI Solution', 'Trading Platform', 'Automation', 'Custom Software', 'Other'
]

const OBJECTIVES = [
  'Launch something new', 'Improve an existing product', 'Automate a business process',
  'Replace an existing system', 'Increase revenue', 'Improve customer experience',
  'Internal business operations', 'Other'
]

const FEATURES = [
  'Authentication', 'User Accounts', 'Admin Dashboard', 'Client Portal',
  'Payments', 'Subscriptions', 'Notifications', 'Messaging', 'File Management',
  'Analytics', 'AI Features', 'API Integrations', 'Third-party Integrations',
  'Search', 'Role-based Access', 'Reporting', 'Automation', 'Other'
]

const TARGET_USERS = [
  'Customers', 'Employees', 'Administrators', 'Businesses', 'Partners',
  'Public Users', 'Other'
]

const BUDGET_RANGES = [
  'Under $1,000', '$1,000 - $5,000', '$5,000 - $10,000',
  '$10,000 - $25,000', '$25,000 - $50,000', '$50,000+', 'I\'m not sure yet'
]

const TIMELINES = [
  'As soon as possible', 'Within 1 month', '1 - 3 months',
  '3 - 6 months', '6+ months', 'Flexible'
]

export default function StartProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successRequestId, setSuccessRequestId] = useState('')

  const [form, setForm] = useState({
    projectName: '',
    projectType: '',
    description: '',
    objective: '',
    company: '',
    website: '',
    industry: '',
    country: '',
    timezone: '',
    existingSystem: 'no',
    existingSystemDetails: '',
    features: [] as string[],
    otherFeatures: '',
    targetUsers: [] as string[],
    estimatedUsers: '',
    platforms: [] as string[],
    integrations: [] as string[],
    integrationDetails: '',
    budgetRange: '',
    timeline: '',
    preferredStartDate: '',
    targetLaunchDate: '',
    priority: 'normal',
    declaration: false,
  })

  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('company, full_name, email')
          .eq('id', user.id)
          .single()
        if (client) {
          setForm(prev => ({
            ...prev,
            company: client.company || '',
            country: '', // could be from profile if available
            timezone: '',
          }))
        }
      }
    }
    fetchProfile()
  }, [])

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayItem = (
    key: 'features' | 'targetUsers' | 'platforms' | 'integrations',
    item: string
  ) => {
    setForm(prev => {
      const current = prev[key] as string[]
      if (current.includes(item)) {
        return { ...prev, [key]: current.filter(i => i !== item) }
      }
      return { ...prev, [key]: [...current, item] }
    })
  }

  const handleNext = () => {
    if (step === 0) {
      if (!form.projectName.trim() || !form.projectType || form.description.trim().length < 10) {
        setError('Please provide a project name, type, and description (min 10 characters).')
        return
      }
    }
    if (step === 1 && !form.company.trim()) {
      setError('Company name is required.')
      return
    }
    setError('')
    setStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setError('')
    setStep(prev => Math.max(prev - 1, 0))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length + files.length > 10) {
      setError('Maximum 10 files allowed.')
      return
    }
    const totalSize = selected.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > 10 * 25 * 1024 * 1024) {
      setError('Total file size cannot exceed 250 MB.')
      return
    }
    setFiles(prev => [...prev, ...selected])
    setError('')
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!form.declaration) {
      setError('Please confirm the declaration before submitting.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      const requestNumber = `REQ-${Date.now()}`

      // Insert project request
      const { data: request, error: requestError } = await supabase
        .from('project_requests')
        .insert({
          client_id: user.id,
          request_number: requestNumber,
          project_name: form.projectName,
          project_type: form.projectType,
          description: form.description,
          objective: form.objective,
          company: form.company,
          website: form.website,
          industry: form.industry,
          country: form.country,
          timezone: form.timezone,
          existing_system: form.existingSystem === 'yes',
          existing_system_details: form.existingSystemDetails,
          budget_range: form.budgetRange,
          timeline: form.timeline,
          preferred_start_date: form.preferredStartDate || null,
          target_launch_date: form.targetLaunchDate || null,
          priority: form.priority,
          status: 'submitted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Insert features
      if (form.features.length > 0) {
        await supabase.from('project_request_features').insert(
          form.features.map(feature => ({ request_id: request.id, feature }))
        )
      }

      // Insert target users
      if (form.targetUsers.length > 0) {
        await supabase.from('project_request_target_users').insert(
          form.targetUsers.map(user => ({ request_id: request.id, target_user: user }))
        )
      }

      // Insert platforms
      if (form.platforms.length > 0) {
        await supabase.from('project_request_platforms').insert(
          form.platforms.map(platform => ({ request_id: request.id, platform }))
        )
      }

      // Insert integrations
      if (form.integrations.length > 0) {
        await supabase.from('project_request_integrations').insert(
          form.integrations.map(integration => ({ request_id: request.id, integration }))
        )
      }

      // Upload files
      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${Date.now()}-${file.name}`
          const { error: uploadError } = await supabase.storage
            .from('project-request-files')
            .upload(fileName, file)

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('project-request-files')
              .getPublicUrl(fileName)
            await supabase.from('project_request_files').insert({
              request_id: request.id,
              client_id: user.id,
              file_name: file.name,
              storage_path: fileName,
              mime_type: file.type,
              size: file.size,
              uploaded_at: new Date().toISOString(),
              visibility: 'admin',
            })
          }
        }
      }

      // Activity
      try {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'project_request_submitted',
          description: `Project request ${requestNumber} submitted`,
          entity_type: 'project_request',
          entity_id: request.id.toString(),
          result: 'success',
          created_at: new Date().toISOString(),
        })
      } catch (e) {}

      // Notify admin
      try {
        await supabase.from('notifications').insert({
          client_id: null,
          type: 'project_request',
          title: 'New Project Request',
          message: `New request ${requestNumber} from ${form.company}`,
          read: false,
          created_at: new Date().toISOString(),
        })
      } catch (e) {}

      setSuccessRequestId(requestNumber)
      setSubmitting(false)
    } catch (err: any) {
      console.error('Submission error:', err)
      setError('Failed to submit: ' + err.message)
      setSubmitting(false)
    }
  }

  if (successRequestId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-green-600">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Request Received</h1>
          <p className="text-gray-600 mb-4">Thanks for sharing your project with Omnix Lab. Our team will review the information and contact you through your workspace.</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-500">Request ID</p>
            <p className="text-lg font-bold text-gray-900">{successRequestId}</p>
            <p className="text-sm text-gray-500">Status: Under Review</p>
          </div>
          <div className="flex gap-3">
            <Link href="/portal/dashboard" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
              Dashboard
            </Link>
            <Link href={`/portal/project-requests`} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
              View Requests
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/dashboard" className="text-gray-600 hover:text-gray-900 text-sm mb-6 inline-block">
          ← Back to Workspace
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Start a Project</h1>
        <p className="text-gray-600 mb-8">Let's build something valuable. Tell us what you're looking to build.</p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs font-medium ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                {String(i + 1).padStart(2, '0')} {s}
              </span>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input type="text" value={form.projectName} onChange={(e) => updateForm('projectName', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" placeholder="e.g., E-commerce Platform" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type *</label>
                <select value={form.projectType} onChange={(e) => updateForm('projectType', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900">
                  <option value="">Select type...</option>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" placeholder="Describe what you want to build..." />
                <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
                <select value={form.objective} onChange={(e) => updateForm('objective', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900">
                  <option value="">Select...</option>
                  {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" value={form.company} onChange={(e) => updateForm('company', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Website</label>
                <input type="url" value={form.website} onChange={(e) => updateForm('website', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select value={form.industry} onChange={(e) => updateForm('industry', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900">
                  <option value="">Select...</option>
                  {['Fintech','Healthcare','E-commerce','Education','Real Estate','Technology','Logistics','Professional Services','Media','Other'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" value={form.country} onChange={(e) => updateForm('country', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <input type="text" value={form.timezone} onChange={(e) => updateForm('timezone', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" placeholder="e.g., Africa/Lagos" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do you have an existing system?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={form.existingSystem === 'no'} onChange={() => updateForm('existingSystem', 'no')} className="w-4 h-4" /><span className="text-sm">No</span></label>
                  <label className="flex items-center gap-2"><input type="radio" checked={form.existingSystem === 'yes'} onChange={() => updateForm('existingSystem', 'yes')} className="w-4 h-4" /><span className="text-sm">Yes</span></label>
                </div>
                {form.existingSystem === 'yes' && (
                  <input type="text" value={form.existingSystemDetails} onChange={(e) => updateForm('existingSystemDetails', e.target.value)} className="w-full mt-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" placeholder="Existing URL" />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desired Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map(f => (
                    <label key={f} className="flex items-center gap-2">
                      <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggleArrayItem('features', f)} className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Features</label>
                <input type="text" value={form.otherFeatures} onChange={(e) => updateForm('otherFeatures', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Users</label>
                <div className="grid grid-cols-2 gap-2">
                  {TARGET_USERS.map(u => (
                    <label key={u} className="flex items-center gap-2">
                      <input type="checkbox" checked={form.targetUsers.includes(u)} onChange={() => toggleArrayItem('targetUsers', u)} className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{u}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Users</label>
                <input type="text" value={form.estimatedUsers} onChange={(e) => updateForm('estimatedUsers', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" placeholder="e.g., 100-1,000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {['Web','iOS','Android','Desktop','API','Cloud'].map(p => (
                    <label key={p} className="flex items-center gap-2">
                      <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => toggleArrayItem('platforms', p)} className="w-4 h-4" />
                      <span className="text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Integrations</label>
                <div className="flex flex-wrap gap-2">
                  {['Payment Gateway','Email','SMS','WhatsApp','Telegram','CRM','Accounting','Analytics','Other'].map(i => (
                    <label key={i} className="flex items-center gap-2">
                      <input type="checkbox" checked={form.integrations.includes(i)} onChange={() => toggleArrayItem('integrations', i)} className="w-4 h-4" />
                      <span className="text-sm">{i}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                <select value={form.budgetRange} onChange={(e) => updateForm('budgetRange', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900">
                  <option value="">Select...</option>
                  {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                <select value={form.timeline} onChange={(e) => updateForm('timeline', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900">
                  <option value="">Select...</option>
                  {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Start Date</label>
                  <input type="date" value={form.preferredStartDate} onChange={(e) => updateForm('preferredStartDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Launch Date</label>
                  <input type="date" value={form.targetLaunchDate} onChange={(e) => updateForm('targetLaunchDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => updateForm('priority', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900">
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Files</label>
                <input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" />
                <p className="text-xs text-gray-400 mt-1">Max 10 files, 25 MB each</p>
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="text-red-500 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Your Request</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-500">Project:</span> <span className="font-medium">{form.projectName}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="font-medium">{form.projectType}</span></div>
                <div><span className="text-gray-500">Description:</span> <span className="font-medium">{form.description}</span></div>
                <div><span className="text-gray-500">Company:</span> <span className="font-medium">{form.company}</span></div>
                <div><span className="text-gray-500">Budget:</span> <span className="font-medium">{form.budgetRange}</span></div>
                <div><span className="text-gray-500">Timeline:</span> <span className="font-medium">{form.timeline}</span></div>
                <div><span className="text-gray-500">Features:</span> <span className="font-medium">{form.features.join(', ') || 'None'}</span></div>
                <div><span className="text-gray-500">Files:</span> <span className="font-medium">{files.length} file(s)</span></div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={form.declaration} onChange={(e) => updateForm('declaration', e.target.checked)} className="w-4 h-4 mt-0.5" />
                  <span className="text-sm text-gray-700">I confirm that the information provided is accurate.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={form.declaration} onChange={(e) => updateForm('declaration', e.target.checked)} className="w-4 h-4 mt-0.5" />
                  <span className="text-sm text-gray-700">I understand that submitting this request does not automatically constitute project approval.</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <button onClick={handleBack} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl">Back</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl">Continue</button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Project Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}