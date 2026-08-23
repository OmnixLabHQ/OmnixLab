'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notifyTelegram } from '@/lib/notify'

export default function AdminProjectManagePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])

  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDesc, setMilestoneDesc] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDesc, setInvoiceDesc] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileComment, setFileComment] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!projectId) return

    fetchProject()
    fetchMilestones()
    fetchFiles()
    fetchInvoices()
    fetchMessages()

    const channels = [
      supabase
        .channel(`admin-project-${projectId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones', filter: `project_id=eq.${projectId}` }, () => fetchMilestones())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'files', filter: `project_id=eq.${projectId}` }, () => fetchFiles())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `project_id=eq.${projectId}` }, () => fetchInvoices())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` }, () => {
          fetchMessages()
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
        .subscribe(),
    ]

    return () => { channels.forEach(ch => supabase.removeChannel(ch)) }
  }, [projectId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchProject = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, clients(full_name, company, email)')
      .eq('id', projectId)
      .single()
    setProject(data)
  }

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setMilestones(data || [])
  }

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setFiles(data || [])
  }

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const createMilestone = async () => {
    if (!milestoneTitle.trim()) return
    await supabase.from('milestones').insert({
      project_id: projectId,
      title: milestoneTitle,
      description: milestoneDesc,
      status: 'pending',
    })
    setMilestoneTitle('')
    setMilestoneDesc('')
    fetchMilestones()
  }

  const updateMilestoneStatus = async (milestoneId: number, status: string) => {
    await supabase
      .from('milestones')
      .update({ status, completed_at: status === 'accepted' ? new Date().toISOString() : null })
      .eq('id', milestoneId)

    await notifyTelegram(`📌 Milestone status changed to ${status}`)
    fetchMilestones()
  }

  const uploadFile = async () => {
    if (!selectedFile) return
    setUploading(true)
    const fileName = `admin-${Date.now()}-${selectedFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, selectedFile)

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const fileUrl = supabase.storage.from('project-files').getPublicUrl(fileName).data.publicUrl

    const { data: user } = await supabase.auth.getUser()
    await supabase.from('files').insert({
      project_id: projectId,
      uploaded_by: user?.user?.id,
      file_name: selectedFile.name,
      file_url: fileUrl,
      status: 'Under Review',
      client_message: fileComment || null,
    })

    setSelectedFile(null)
    setFileComment('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
    fetchFiles()
  }

  const createInvoice = async () => {
    if (!invoiceAmount || !invoiceDesc) return
    await supabase.from('invoices').insert({
      project_id: projectId,
      client_id: project?.client_id,
      amount: parseFloat(invoiceAmount),
      description: invoiceDesc,
      status: 'unpaid',
    })
    setInvoiceAmount('')
    setInvoiceDesc('')
    fetchInvoices()
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('messages').insert({
      project_id: projectId,
      sender_id: user.id,
      sender_type: 'admin',
      content: newMessage,
      client_id: project?.client_id,
    })
    setNewMessage('')
    fetchMessages()
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Project</h1>
        <Link href="/admin/projects" className="text-indigo-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-2xl font-bold">{project.name}</h2>
        <p className="text-gray-600 mt-1">
          Client: <span className="font-semibold">{project.clients?.full_name}</span> ({project.clients?.company})
        </p>
        <p className="text-gray-500 text-sm">{project.clients?.email}</p>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
          project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {project.status}
        </span>
      </div>

      {/* Milestones Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <h2 className="text-lg font-bold">📌 Milestones</h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Milestone title"
            value={milestoneTitle}
            onChange={e => setMilestoneTitle(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl"
          />
          <input
            type="text"
            placeholder="Description"
            value={milestoneDesc}
            onChange={e => setMilestoneDesc(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl"
          />
          <button
            onClick={createMilestone}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-gray-500">{m.description}</p>
                <p className="text-xs text-gray-400">{m.status}</p>
              </div>
              <div className="flex gap-2">
                {m.status === 'pending' && (
                  <button
                    onClick={() => updateMilestoneStatus(m.id, 'in-progress')}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg"
                  >
                    Start
                  </button>
                )}
                {m.status === 'in-progress' && (
                  <button
                    onClick={() => updateMilestoneStatus(m.id, 'delivered')}
                    className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-lg"
                  >
                    Mark Delivered
                  </button>
                )}
                {m.status === 'delivered' && (
                  <span className="text-xs text-yellow-600">Awaiting client review</span>
                )}
                {m.status === 'revision-requested' && (
                  <span className="text-xs text-orange-600">Revision Requested</span>
                )}
                {m.status === 'accepted' && (
                  <span className="text-xs text-green-600">Accepted</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Files Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <h2 className="text-lg font-bold">📁 Files</h2>

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <input
            type="text"
            placeholder="Comment for client"
            value={fileComment}
            onChange={e => setFileComment(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl"
          />
          <button
            onClick={uploadFile}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <div>
                <p className="font-medium">{file.file_name}</p>
                {file.client_message && <p className="text-xs text-gray-500">💬 {file.client_message}</p>}
              </div>
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 text-sm hover:underline"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices / Offers Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <h2 className="text-lg font-bold">💰 Invoices / Offers</h2>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            value={invoiceAmount}
            onChange={e => setInvoiceAmount(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl"
          />
          <input
            type="text"
            placeholder="Description"
            value={invoiceDesc}
            onChange={e => setInvoiceDesc(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl"
          />
          <button
            onClick={createInvoice}
            disabled={!invoiceAmount || !invoiceDesc}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            Create Invoice
          </button>
        </div>

        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <div>
                <p className="font-medium">INV-{inv.id}</p>
                <p className="text-sm text-gray-500">{inv.description}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${inv.amount?.toLocaleString()}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-lg font-bold mb-4">💬 Chat with Client</h2>
        <div className="h-64 overflow-y-auto space-y-2 mb-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.sender_type === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-xl"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}