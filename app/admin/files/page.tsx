'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminFilesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingFileId, setEditingFileId] = useState<number | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [feedback, setFeedback] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchClients()
    fetchFiles()

    const channel = supabase
      .channel('admin-files')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, () => fetchFiles())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name, company').order('created_at', { ascending: false })
    setClients(data || [])
  }

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('files')
      .select('*, clients(full_name, company, email)')
      .order('created_at', { ascending: false })
    setFiles(data || [])
  }

  const uploadFile = async () => {
    if (!selectedFile || !selectedClient) return
    setUploading(true)

    const fileName = `admin-${Date.now()}-${selectedFile.name}`
    const { error: uploadError } = await supabase.storage.from('project-files').upload(fileName, selectedFile)
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const fileUrl = supabase.storage.from('project-files').getPublicUrl(fileName).data.publicUrl

    const { data: user } = await supabase.auth.getUser()
    await supabase.from('files').insert({
      uploaded_by: user?.user?.id,
      file_name: selectedFile.name,
      file_url: fileUrl,
      status: 'Under Review',
      client_message: comment || null,
      project_id: null,
      // If you have client_id column in files table, add: client_id: selectedClient
    })

    setComment('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
    fetchFiles()
  }

  const updateFileReview = async (fileId: number) => {
    if (!newStatus) return
    await supabase
      .from('files')
      .update({ status: newStatus, admin_comment: feedback || null })
      .eq('id', fileId)
    setEditingFileId(null)
    setNewStatus('')
    setFeedback('')
    fetchFiles()
  }

  const deleteFile = async (fileId: number) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    const path = file.file_url.split('/project-files/')[1]
    if (path) await supabase.storage.from('project-files').remove([path])
    await supabase.from('files').delete().eq('id', fileId)
    fetchFiles()
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return 'bg-yellow-100 text-yellow-700'
      case 'Checked': return 'bg-blue-100 text-blue-700'
      case 'Reviewed':
      case 'Approved': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Files</h1>

      {/* Upload File */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <h2 className="text-lg font-bold">Upload File to Client</h2>
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl bg-white"
        >
          <option value="">Select Client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.full_name} — {client.company}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Comment for client (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <button
          onClick={uploadFile}
          disabled={!selectedFile || !selectedClient || uploading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4">All Files</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 px-4">File</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Client Comment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Admin Feedback</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{file.file_name}</td>
                  <td className="py-3 px-4">
                    {file.clients?.full_name || 'Unknown'}
                    <div className="text-xs text-gray-500">{file.clients?.email}</div>
                  </td>
                  <td className="py-3 px-4">{file.client_message || '—'}</td>
                  <td className="py-3 px-4">
                    {editingFileId === file.id ? (
                      <select
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        className="border rounded-lg px-2 py-1"
                      >
                        <option value="">Select status</option>
                        <option>Under Review</option>
                        <option>Checked</option>
                        <option>Reviewed</option>
                        <option>Approved</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(file.status)}`}>
                        {file.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingFileId === file.id ? (
                      <input
                        type="text"
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Add feedback"
                        className="border rounded-lg px-2 py-1"
                      />
                    ) : (
                      file.admin_comment || '—'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingFileId === file.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => updateFileReview(file.id)} className="text-green-600 hover:underline text-xs">Save</button>
                        <button onClick={() => setEditingFileId(null)} className="text-gray-500 hover:underline text-xs">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditingFileId(file.id)
                          setNewStatus(file.status)
                          setFeedback(file.admin_comment || '')
                        }} className="text-indigo-600 hover:underline text-xs">Review</button>
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">Download</a>
                        <button onClick={() => deleteFile(file.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}