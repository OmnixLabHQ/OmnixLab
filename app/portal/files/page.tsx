'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface FileItem {
  id: string
  uploaded_by: string
  file_name: string
  file_url: string
  created_at: string
  status: string
  admin_comment: string
  client_message: string
  client_id: string
  project_id: string | null
  folder: string
  description: string
  file_size: number
  file_type: string
  version: number
  uploaded_by_name: string
  is_archived: boolean
  starred: boolean
}

interface Project {
  id: string
  name: string
}

interface FileVersion {
  id: string
  file_id: string
  version_number: number
  file_url: string
  file_name: string
  file_size: number
  uploaded_by_name: string
  comment: string
  created_at: string
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [clientMessage, setClientMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('client_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch files:', error)
        setLoading(false)
        return
      }

      setFiles(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Files fetch error:', error)
      setLoading(false)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProjects(data || [])
      }
    } catch (error) {
      console.error('Projects fetch error:', error)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
    fetchProjects()
  }, [fetchFiles, fetchProjects])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('You must be logged in to upload files')
        setUploading(false)
        return
      }

      // Fetch client name for uploaded_by_name
      const { data: clientData } = await supabase
        .from('clients')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const uploadedByName = clientData?.full_name || 'Client'

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload file. Please try again.')
        setUploading(false)
        return
      }

      setUploadProgress(50)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client-files')
        .getPublicUrl(fileName)

      const fileUrl = urlData?.publicUrl

      if (!fileUrl) {
        alert('Failed to get file URL')
        setUploading(false)
        return
      }

      setUploadProgress(80)

      // Determine file type from extension
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      const fileTypeMap: Record<string, string> = {
        pdf: 'pdf',
        doc: 'document',
        docx: 'document',
        txt: 'text',
        rtf: 'document',
        png: 'image',
        jpg: 'image',
        jpeg: 'image',
        webp: 'image',
        svg: 'image',
        xls: 'spreadsheet',
        xlsx: 'spreadsheet',
        csv: 'spreadsheet',
        ppt: 'presentation',
        pptx: 'presentation',
        zip: 'archive',
        rar: 'archive',
        fig: 'design',
        psd: 'design',
        ai: 'design',
        sketch: 'design',
      }

      const fileType = fileTypeMap[extension] || 'other'

      // Insert file record
      const { data: insertData, error: insertError } = await supabase
        .from('files')
        .insert({
          uploaded_by: user.id,
          file_name: file.name,
          file_url: fileUrl,
          status: 'pending',
          client_message: clientMessage || null,
          client_id: user.id,
          project_id: selectedProject || null,
          folder: 'general',
          description: '',
          file_size: file.size,
          file_type: fileType,
          version: 1,
          uploaded_by_name: uploadedByName,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        alert('Failed to save file record')
        setUploading(false)
        return
      }

      setUploadProgress(100)

      // Insert first version record
      if (insertData) {
        await supabase.from('file_versions').insert({
          file_id: insertData.id,
          version_number: 1,
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: user.id,
          uploaded_by_name: uploadedByName,
          comment: clientMessage || 'Initial upload',
        })
      }

      // Reset
      setClientMessage('')
      setSelectedProject('')
      setShowUploadModal(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh files list
      await fetchFiles()
      setUploading(false)
      setUploadProgress(0)
    } catch (error) {
      console.error('Upload exception:', error)
      alert('An error occurred during upload')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleViewVersions(file: FileItem) {
    setSelectedFile(file)
    setShowVersions(true)
    setVersions([])

    try {
      const { data, error } = await supabase
        .from('file_versions')
        .select('*')
        .eq('file_id', file.id)
        .order('version_number', { ascending: false })

      if (!error && data) {
        setVersions(data || [])
      }
    } catch (error) {
      console.error('Versions fetch error:', error)
    }
  }

  async function handleStarFile(fileId: string, currentStarred: boolean) {
    try {
      const { error } = await supabase
        .from('files')
        .update({ starred: !currentStarred })
        .eq('id', fileId)

      if (error) {
        console.error('Star error:', error)
        return
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, starred: !currentStarred } : f))
      )
    } catch (error) {
      console.error('Star exception:', error)
    }
  }

  async function handleArchiveFile(fileId: string) {
    if (!confirm('Archive this file? It will be hidden from the main list.')) return

    try {
      const { error } = await supabase
        .from('files')
        .update({ is_archived: true })
        .eq('id', fileId)

      if (error) {
        console.error('Archive error:', error)
        alert('Failed to archive file')
        return
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch (error) {
      console.error('Archive exception:', error)
    }
  }

  function getStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; color: string; dot: string }> = {
      pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800', dot: '🟡' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800', dot: '🟢' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', dot: '🔴' },
      reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-800', dot: '🔵' },
      requires_action: { label: 'Requires Action', color: 'bg-orange-100 text-orange-800', dot: '🟠' },
      archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800', dot: '⚪' },
    }
    return statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800', dot: '⚪' }
  }

  function getFileIcon(fileType: string) {
    const iconMap: Record<string, string> = {
      pdf: '📕',
      document: '📘',
      text: '📄',
      image: '🖼️',
      spreadsheet: '📗',
      presentation: '📙',
      archive: '📦',
      design: '🎨',
      other: '📄',
    }
    return iconMap[fileType] || '📄'
  }

  function formatFileSize(bytes: number) {
    if (!bytes) return '—'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = projectFilter === 'all' || file.project_id === projectFilter
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter
    return matchesSearch && matchesProject && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Files</h1>
            <p className="text-gray-600 mt-2">
              Securely access, upload and manage files shared across your Omnix projects.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            + Upload Files
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reviewed">Reviewed</option>
            <option value="requires_action">Requires Action</option>
          </select>
        </div>

        {/* Files Table */}
        {filteredFiles.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || projectFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Upload your first file to get started.'}
            </p>
            {!searchTerm && projectFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Upload a File
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_150px_80px_120px_100px_120px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              <span>File</span>
              <span>Project</span>
              <span>Version</span>
              <span>Status</span>
              <span>Size</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredFiles.map((file) => {
                const statusInfo = getStatusDisplay(file.status)
                const projectName = projects.find((p) => p.id === file.project_id)?.name || '—'
                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_150px_80px_120px_100px_120px] gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                  >
                    {/* File Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getFileIcon(file.file_type)}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{file.file_name}</p>
                          {file.starred && <span className="text-amber-400">⭐</span>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {file.uploaded_by_name || 'Unknown'} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Project */}
                    <span className="text-sm text-gray-600 truncate">{projectName}</span>

                    {/* Version */}
                    <span className="text-sm text-gray-600">v{file.version}</span>

                    {/* Status */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                      {statusInfo.dot} {statusInfo.label}
                    </span>

                    {/* Size */}
                    <span className="text-sm text-gray-500">{formatFileSize(file.file_size)}</span>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        title="Download"
                      >
                        ⬇️
                      </a>
                      <button
                        onClick={() => handleStarFile(file.id, file.starred || false)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title={file.starred ? 'Unstar' : 'Star'}
                      >
                        {file.starred ? '⭐' : '☆'}
                      </button>
                      <button
                        onClick={() => handleViewVersions(file)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        title="Versions"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleArchiveFile(file.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Archive"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Upload Files</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <span className="text-gray-400 text-xl">✕</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project (optional)
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  placeholder="Add a note about this file..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                />
              </div>

              {/* File Input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100 disabled:opacity-50"
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Uploading...</span>
                    <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {showVersions && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Version History — {selectedFile.file_name}
              </h3>
              <button
                onClick={() => setShowVersions(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <span className="text-gray-400 text-xl">✕</span>
              </button>
            </div>

            {versions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Loading versions...</p>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-4 rounded-lg border ${
                      index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          v{version.version_number}
                          {index === 0 && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {version.uploaded_by_name || 'Unknown'} •{' '}
                          {new Date(version.created_at).toLocaleDateString()}
                        </p>
                        {version.comment && (
                          <p className="text-sm text-gray-600 mt-1">💬 {version.comment}</p>
                        )}
                      </div>
                      <a
                        href={version.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}