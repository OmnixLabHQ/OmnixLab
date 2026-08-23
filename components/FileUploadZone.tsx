'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { notifyTelegram } from '@/lib/notify'

interface UploadedFile {
  id: number
  file_name: string
  file_url: string
  status: string
  admin_comment: string | null
  client_message: string | null
  created_at: string
  project_id: number | null
}

export default function FileUploadZone({
  userId,
  projectId,
}: {
  userId: string
  projectId?: number | null
}) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [clientMessage, setClientMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) return
    fetchFiles()

    const channel = supabase
      .channel(`files-${userId}-${projectId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: projectId
            ? `uploaded_by=eq.${userId},project_id=eq.${projectId}`
            : `uploaded_by=eq.${userId}`,
        },
        () => fetchFiles()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, projectId])

  const fetchFiles = async () => {
    let query = supabase
      .from('files')
      .select('*')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data } = await query
    setFiles(data || [])
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !userId) return
    setUploading(true)

    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file)

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const fileUrl = supabase.storage.from('project-files').getPublicUrl(fileName).data.publicUrl

    const { error: insertError } = await supabase.from('files').insert({
      uploaded_by: userId,
      file_name: file.name,
      file_url: fileUrl,
      status: 'Under Review',
      client_message: clientMessage || null,
      project_id: projectId || null,
    })

    if (insertError) {
      alert('Failed to save file metadata: ' + insertError.message)
    } else {
      // Telegram notification
      await notifyTelegram(`📁 New file uploaded: ${file.name}\nMessage: ${clientMessage || 'None'}`)

      setClientMessage('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setUploading(false)
  }

  const removeFile = async (fileId: number) => {
    const fileToRemove = files.find(f => f.id === fileId)
    if (!fileToRemove) return

    const path = fileToRemove.file_url.split('/project-files/')[1]
    if (path) {
      await supabase.storage.from('project-files').remove([path])
    }

    await supabase.from('files').delete().eq('id', fileId)
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-700'
      case 'Checked':
        return 'bg-blue-100 text-blue-700'
      case 'Reviewed':
      case 'Approved':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">
        📁 {projectId ? 'Project Files' : 'Files'}
      </h3>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
        <input
          type="text"
          placeholder="Add a comment (optional)"
          value={clientMessage}
          onChange={e => setClientMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            className="text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-gray-500">No files uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline truncate"
                  >
                    {file.file_name}
                  </a>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(file.status)}`}>
                    {file.status}
                  </span>
                </div>
                {file.client_message && (
                  <p className="text-xs text-gray-500 mt-1">💬 {file.client_message}</p>
                )}
                {file.admin_comment && (
                  <p className="text-xs text-green-600 mt-1">✅ {file.admin_comment}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="text-red-400 hover:text-red-600 text-sm shrink-0"
                title="Remove file"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}