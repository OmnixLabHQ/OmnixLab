'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ClientData {
  id: string
  full_name: string
  company: string
  email: string
  phone: string
  approved: boolean
  created_at: string
}

export default function ClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.id as string

  const [client, setClient] = useState<ClientData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data states
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [ideas, setIdeas] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [showNote, setShowNote] = useState(false)

  // Form states
  const [projectForm, setProjectForm] = useState({ name: '', description: '', budget: '', start_date: '', end_date: '' })
  const [invoiceForm, setInvoiceForm] = useState({ amount: '', description: '', due_date: '' })
  const [messageForm, setMessageForm] = useState({ message: '' })
  const [noteForm, setNoteForm] = useState({ note: '' })

  useEffect(() => {
    if (clientId) {
      fetchClientData()
    }
  }, [clientId])

  const fetchClientData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      setClient(clientData)

      // Fetch all related data
      const [projectsRes, invoicesRes, paymentsRes, filesRes, ideasRes, offersRes, convosRes, activityRes] = await Promise.all([
        supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('files').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('ideas').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('offers').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('conversations').select('*').eq('client_id', clientId).order('last_message_at', { ascending: false }),
        supabase.from('activity_logs').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      ])

      setProjects(projectsRes.data || [])
      setInvoices(invoicesRes.data || [])
      setPayments(paymentsRes.data || [])
      setFiles(filesRes.data || [])
      setIdeas(ideasRes.data || [])
      setOffers(offersRes.data || [])
      setConversations(convosRes.data || [])
      setActivityLogs(activityRes.data || [])

      setLoading(false)
    } catch (error) {
      console.error('Fetch client error:', error)
      setLoading(false)
    }
  }, [clientId])

  async function handleCreateProject() {
    if (!projectForm.name) return
    await supabase.from('projects').insert({
      client_id: clientId,
      name: projectForm.name,
      description: projectForm.description,
      status: 'planning',
      start_date: projectForm.start_date || null,
      end_date: projectForm.end_date || null,
    })
    await supabase.from('activity_logs').insert({
      client_id: clientId,
      type: 'project',
      title: 'Project Created',
      description: projectForm.name,
    })
    setShowCreateProject(false)
    setProjectForm({ name: '', description: '', budget: '', start_date: '', end_date: '' })
    fetchClientData()
  }

  async function handleCreateInvoice() {
    if (!invoiceForm.amount) return
    await supabase.from('invoices').insert({
      client_id: clientId,
      amount: parseFloat(invoiceForm.amount),
      description: invoiceForm.description,
      status: 'sent',
      due_date: invoiceForm.due_date || null,
      invoice_number: `INV-${Date.now()}`,
    })
    await supabase.from('notifications').insert({
      client_id: clientId,
      type: 'invoice',
      title: 'New Invoice',
      message: `A new invoice for $${invoiceForm.amount} has been issued.`,
    })
    setShowCreateInvoice(false)
    setInvoiceForm({ amount: '', description: '', due_date: '' })
    fetchClientData()
  }

  async function handleSendMessage() {
    if (!messageForm.message) return
    // Create conversation if none exists
    let convoId = conversations[0]?.id
    if (!convoId) {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          client_id: clientId,
          title: 'General',
          category: 'general',
          status: 'open',
          priority: 'normal',
        })
        .select()
        .single()
      convoId = newConvo?.id
    }
    if (convoId) {
      await supabase.from('conversation_messages').insert({
        conversation_id: convoId,
        sender_id: clientId,
        sender_type: 'admin',
        body: messageForm.message,
        message_type: 'text',
      })
    }
    setShowMessage(false)
    setMessageForm({ message: '' })
    fetchClientData()
  }

  async function handleAddNote() {
    if (!noteForm.note) return
    await supabase.from('activity_logs').insert({
      client_id: clientId,
      type: 'note',
      title: 'Admin Note',
      description: noteForm.note,
    })
    setShowNote(false)
    setNoteForm({ note: '' })
    fetchClientData()
  }

  async function handleToggleSuspend() {
    if (!client) return
    await supabase.from('clients').update({ approved: !client.approved }).eq('id', clientId)
    fetchClientData()
  }

  async function handleImpersonate() {
    // Create impersonation audit log
    await supabase.from('audit_logs').insert({
      actor_id: clientId,
      action: 'impersonation_started',
      description: `Admin viewed as client ${client?.full_name}`,
    })
    // Redirect to client portal (would need session swap in production)
    router.push('/portal/dashboard')
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'projects', label: `Projects (${projects.length})` },
    { key: 'messages', label: `Messages (${conversations.length})` },
    { key: 'files', label: `Files (${files.length})` },
    { key: 'invoices', label: `Invoices (${invoices.length})` },
    { key: 'payments', label: `Payments (${payments.length})` },
    { key: 'ideas', label: `Ideas (${ideas.length})` },
    { key: 'offers', label: `Offers (${offers.length})` },
    { key: 'activity', label: 'Activity' },
    { key: 'notes', label: 'Notes' },
  ]

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/clients" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold text-white">{client.full_name}</h1>
          <p className="text-sm text-gray-400">
            {client.company} • {client.email}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowMessage(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
            Message
          </button>
          <button onClick={() => setShowCreateProject(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20">
            Create Project
          </button>
          <button onClick={() => setShowCreateInvoice(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20">
            Create Invoice
          </button>
          <button onClick={handleImpersonate} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg">
            View as Client
          </button>
          <button
            onClick={handleToggleSuspend}
            className={`px-4 py-2 text-sm rounded-lg ${
              client.approved ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {client.approved ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
          client.approved ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
        }`}>
          {client.approved ? 'Active' : 'Suspended'}
        </span>
        <span className="text-xs text-gray-400">Client since {new Date(client.created_at).toLocaleDateString()}</span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-2xl font-bold text-white">{projects.length}</p>
              <p className="text-sm text-gray-400">Projects</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-2xl font-bold text-green-400">
                ${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Total Paid</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-2xl font-bold text-amber-400">
                ${invoices.filter(i => ['sent', 'overdue', 'unpaid'].includes(i.status)).reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Outstanding</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-2xl font-bold text-purple-400">{files.length}</p>
              <p className="text-sm text-gray-400">Files</p>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Start</th>
                  <th className="py-3 px-4">End</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No projects</td></tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-3 px-4">
                        <Link href={`/admin/projects/${p.id}`} className="text-white hover:text-blue-400">{p.name}</Link>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{p.status}</td>
                      <td className="py-3 px-4 text-gray-300">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</td>
                      <td className="py-3 px-4 text-gray-300">{p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No invoices</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{inv.invoice_number || inv.id}</td>
                      <td className="py-3 px-4 text-white font-medium">${inv.amount?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          inv.status === 'paid' ? 'bg-green-500/20 text-green-300' :
                          inv.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No payments</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{p.internal_reference || p.id}</td>
                      <td className="py-3 px-4 text-white font-medium">${p.amount?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-300 capitalize">{p.payment_method?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 text-gray-300">{p.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-3 px-4">File</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-500">No files</td></tr>
                ) : (
                  files.map((f) => (
                    <tr key={f.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{f.file_name}</td>
                      <td className="py-3 px-4 text-gray-300">{f.status}</td>
                      <td className="py-3 px-4 text-gray-300">{new Date(f.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="space-y-3">
            {ideas.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No ideas</p>
            ) : (
              ideas.map((idea) => (
                <div key={idea.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white font-medium">{idea.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{idea.description}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full mt-2 inline-block ${
                    idea.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>{idea.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="space-y-3">
            {offers.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No offers</p>
            ) : (
              offers.map((offer) => (
                <div key={offer.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white font-medium">{offer.title || 'Offer'}</p>
                  <p className="text-gray-400 text-sm mt-1">{offer.description}</p>
                  <span className="text-xs text-gray-500">{offer.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-2">
            {activityLogs.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No activity</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                  <span>📌</span>
                  <div>
                    <p className="text-white text-sm font-medium">{log.title}</p>
                    {log.description && <p className="text-gray-400 text-xs mt-0.5">{log.description}</p>}
                    <p className="text-gray-500 text-xs mt-1">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <button onClick={() => setShowNote(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20">
              + Add Note
            </button>
            <div className="space-y-2">
              {activityLogs.filter(l => l.type === 'note').length === 0 ? (
                <p className="text-gray-500 py-4 text-center">No notes</p>
              ) : (
                activityLogs.filter(l => l.type === 'note').map((note) => (
                  <div key={note.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-gray-300 text-sm">{note.description}</p>
                    <p className="text-gray-500 text-xs mt-1">{new Date(note.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Create Project</h2>
              <button onClick={() => setShowCreateProject(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Project name *" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <textarea placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
                <input type="date" value={projectForm.end_date} onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              </div>
              <button onClick={handleCreateProject} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Create Project</button>
            </div>
          </div>
        </div>
      )}

      {showCreateInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Create Invoice</h2>
              <button onClick={() => setShowCreateInvoice(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input type="number" placeholder="Amount *" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <input type="text" placeholder="Description" value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm" />
              <button onClick={handleCreateInvoice} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Create Invoice</button>
            </div>
          </div>
        </div>
      )}

      {showMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Send Message</h2>
              <button onClick={() => setShowMessage(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <textarea placeholder="Message..." value={messageForm.message} onChange={(e) => setMessageForm({ message: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm resize-none mb-3" />
            <button onClick={handleSendMessage} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Send</button>
          </div>
        </div>
      )}

      {showNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Add Note</h2>
              <button onClick={() => setShowNote(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <textarea placeholder="Note..." value={noteForm.note} onChange={(e) => setNoteForm({ note: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm resize-none mb-3" />
            <button onClick={handleAddNote} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Add Note</button>
          </div>
        </div>
      )}
    </div>
  )
}