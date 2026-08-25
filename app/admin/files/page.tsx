'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface FileItem {
  id: string
  client_id: string
  project_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  status: string
  version: number
  uploaded_by_name: string
  is_archived: boolean
  folder: string
  created_at: string
  client_name: string
  project_name: string
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [versions, setVersions] = useState<any[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProjectId, setUploadProjectId] = useState('')
  const [uploadClientId, setUploadClientId] = useState('')
  const [uploadCategory, setUploadCategory] = useState('general')
  const [renameValue, setRenameValue] = useState('')
  const [moveProjectId, setMoveProjectId] = useState('')
  const [shareClientId, setShareClientId] = useState('')
  const [shareProjectId, setShareProjectId] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, categoryFilter, files])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
      setProjects(projectsData || [])

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name, company')
        .order('created_at', { ascending: false })
      setClients(clientsData || [])

      const { data: filesData } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })

      const filesWithNames = await Promise.all(
        (filesData || []).map(async (file) => {
          let clientName = 'Unknown'
          if (file.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, company')
              .eq('id', file.client_id)
              .single()
            clientName = client?.full_name || client?.company || 'Unknown'
          }

          let projectName = 'General'
          if (file.project_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', file.project_id)
              .single()
            projectName = project?.name || 'General'
          }

          return {
            ...file,
            client_name: clientName,
            project_name: projectName,
          }
        })
      )

      setFiles(filesWithNames)
      setLoading(false)
    } catch (error) {
      console.error('Fetch files error:', error)
      setLoading(false)
    }
  }, [])

  function applyFilters() {
    let filtered = [...files]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (f) =>
          f.file_name?.toLowerCase().includes(term) ||
          f.client_name?.toLowerCase().includes(term) ||
          f.project_name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((f) => f.file_type === categoryFilter)
    }

    setFilteredFiles(filtered)
  }

  async function handleUpload() {
    if (!uploadFile) {
      alert('Please select a file')
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const fileName = `${Date.now()}-${uploadFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(fileName, uploadFile)

      if (uploadError) {
        alert('Upload failed: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('client-files')
        .getPublicUrl(fileName)

      const extension = uploadFile.name.split('.').pop()?.toLowerCase() || ''
      const fileTypeMap: Record<string, string> = {
        pdf: 'pdf', doc: 'document', docx: 'document', txt: 'text',
        png: 'image', jpg: 'image', jpeg: 'image', webp: 'image',
        xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
        ppt: 'presentation', pptx: 'presentation',
        zip: 'archive', rar: 'archive',
        fig: 'design', psd: 'design', ai: 'design',
      }
      const fileType = fileTypeMap[extension] || 'other'

      const { data: newFile } = await supabase
        .from('files')
        .insert({
          client_id: uploadClientId || null,
          project_id: uploadProjectId || null,
          file_name: uploadFile.name,
          file_url: urlData?.publicUrl,
          file_size: uploadFile.size,
          file_type: fileType,
          status: 'uploaded',
          version: 1,
          uploaded_by: user?.id,
          uploaded_by_name: 'Admin',
          folder: uploadCategory,
        })
        .select()
        .single()

      if (newFile) {
        await supabase.from('file_versions').insert({
          file_id: newFile.id,
          version_number: 1,
          file_url: urlData?.publicUrl,
          file_name: uploadFile.name,
          file_size: uploadFile.size,
          uploaded_by: user?.id,
          uploaded_by_name: 'Admin',
          comment: 'Initial upload',
        })
      }

      setShowUploadModal(false)
      setUploadFile(null)
      setUploadProjectId('')
      setUploadClientId('')
      setUploadCategory('general')
      fetchData()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRename() {
    if (!selectedFile || !renameValue.trim()) return

    await supabase
      .from('files')
      .update({ file_name: renameValue })
      .eq('id', selectedFile.id)

    setShowRenameModal(false)
    setRenameValue('')
    fetchData()
  }

  async function handleMove() {
    if (!selectedFile) return

    await supabase
      .from('files')
      .update({ project_id: moveProjectId || null })
      .eq('id', selectedFile.id)

    setShowMoveModal(false)
    setMoveProjectId('')
    fetchData()
  }

  async function handleShare() {
    if (!selectedFile) return

    await supabase
      .from('files')
      .update({
        client_id: shareClientId || selectedFile.client_id,
        project_id: shareProjectId || selectedFile.project_id,
      })
      .eq('id', selectedFile.id)

    setShowShareModal(false)
    setShareClientId('')
    setShareProjectId('')
    fetchData()
  }

  async function handleArchiveFile(file: FileItem) {
    if (!confirm(`Archive "${file.file_name}"?`)) return
    await supabase.from('files').update({ is_archived: true }).eq('id', file.id)
    fetchData()
  }

  async function handleRestoreFile(file: FileItem) {
    await supabase.from('files').update({ is_archived: false }).eq('id', file.id)
    fetchData()
  }

  async function handleDeleteFile(file: FileItem) {
    if (!confirm(`Delete "${file.file_name}" permanently?`)) return
    await supabase.from('file_versions').delete().eq('file_id', file.id)
    await supabase.from('files').delete().eq('id', file.id)
    fetchData()
  }

  async function fetchVersions(file: FileItem) {
    setSelectedFile(file)
    setShowDetailModal(true)
    const { data } = await supabase
      .from('file_versions')
      .select('*')
      .eq('file_id', file.id)
      .order('version_number', { ascending: false })
    setVersions(data || [])
  }

  async function handleRestoreVersion(version: any) {
    if (!selectedFile) return

    await supabase
      .from('files')
      .update({
        file_url: version.file_url,
        file_name: version.file_name,
        version: version.version_number,
      })
      .eq('id', selectedFile.id)

    fetchVersions(selectedFile)
    fetchData()
  }

  function getFileIcon(fileType: string) {
    const map: Record<string, string> = {
      pdf: '📕', document: '📘', text: '📄', image: '🖼️',
      spreadsheet: '📗', presentation: '📙', archive: '📦',
      design: '🎨', other: '📄',
    }
    return map[fileType] || '📄'
  }

  function formatFileSize(bytes: number) {
    if (!bytes) return '—'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  if (loading) {
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
        <h1 className="text-2xl font-bold text-white">Files</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Upload File
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by file name, client, or project..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="uploaded" className="bg-gray-900">Uploaded</option>
          <option value="approved" className="bg-gray-900">Approved</option>
          <option value="rejected" className="bg-gray-900">Rejected</option>
          <option value="review" className="bg-gray-900">Review</option>
          <option value="pending" className="bg-gray-900">Pending</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Types</option>
          <option value="pdf" className="bg-gray-900">PDF</option>
          <option value="document" className="bg-gray-900">Document</option>
          <option value="image" className="bg-gray-900">Image</option>
          <option value="spreadsheet" className="bg-gray-900">Spreadsheet</option>
          <option value="archive" className="bg-gray-900">Archive</option>
          <option value="design" className="bg-gray-900">Design</option>
        </select>
      </div>

      {/* Files Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">File</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Project</th>
              <th className="py-3 px-4 font-medium">Size</th>
              <th className="py-3 px-4 font-medium">Version</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Uploaded</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">No files found</td>
              </tr>
            ) : (
              filteredFiles.map((file) => (
                <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span>{getFileIcon(file.file_type)}</span>
                      <button onClick={() => { setSelectedFile(file); setShowPreviewModal(true); }} className="text-white font-medium hover:text-blue-400">
                        {file.file_name}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{file.client_name}</td>
                  <td className="py-3 px-4 text-gray-300">{file.project_name}</td>
                  <td className="py-3 px-4 text-gray-300">{formatFileSize(file.file_size)}</td>
                  <td className="py-3 px-4 text-gray-300">v{file.version}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      file.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                      file.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(file.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">Download</a>
                      <button onClick={() => { setSelectedFile(file); setRenameValue(file.file_name); setShowRenameModal(true); }} className="text-green-400 hover:text-green-300 text-xs">Rename</button>
                      <button onClick={() => { setSelectedFile(file); setMoveProjectId(file.project_id || ''); setShowMoveModal(true); }} className="text-yellow-400 hover:text-yellow-300 text-xs">Move</button>
                      <button onClick={() => { setSelectedFile(file); setShareClientId(file.client_id || ''); setShareProjectId(file.project_id || ''); setShowShareModal(true); }} className="text-purple-400 hover:text-purple-300 text-xs">Share</button>
                      <button onClick={() => fetchVersions(file)} className="text-cyan-400 hover:text-cyan-300 text-xs">Versions</button>
                      <button onClick={() => handleArchiveFile(file)} className="text-orange-400 hover:text-orange-300 text-xs">Archive</button>
                      <button onClick={() => handleDeleteFile(file)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">{selectedFile.file_name}</h2>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            {selectedFile.file_type === 'image' ? (
              <img src={selectedFile.file_url} alt={selectedFile.file_name} className="w-full rounded-xl" />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">Preview not available for this file type</p>
                <a href={selectedFile.file_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail/Versions Modal */}
      {showDetailModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Version History</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              {versions.length === 0 ? (
                <p className="text-gray-500 text-sm">No version history</p>
              ) : (
                versions.map((v, index) => (
                  <div key={v.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                    <div>
                      <p className="text-white text-sm font-medium">
                        v{v.version_number}
                        {index === 0 && <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">Current</span>}
                      </p>
                      <p className="text-gray-500 text-xs">{new Date(v.created_at).toLocaleDateString()}</p>
                      {v.comment && <p className="text-gray-400 text-xs mt-1">{v.comment}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={v.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs">Download</a>
                      {index > 0 && (
                        <button onClick={() => handleRestoreVersion(v)} className="text-green-400 text-xs">Restore</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Rename File</h2>
              <button onClick={() => setShowRenameModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm mb-3"
            />
            <button onClick={handleRename} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
              Rename
            </button>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Move File</h2>
              <button onClick={() => setShowMoveModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <select
              value={moveProjectId}
              onChange={(e) => setMoveProjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm mb-3"
            >
              <option value="" className="bg-gray-900">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">{p.name}</option>
              ))}
            </select>
            <button onClick={handleMove} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
              Move
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Share File</h2>
              <button onClick={() => setShowShareModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-3">
              <select
                value={shareClientId}
                onChange={(e) => setShareClientId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
              >
                <option value="" className="bg-gray-900">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900">{c.full_name} ({c.company})</option>
                ))}
              </select>
              <select
                value={shareProjectId}
                onChange={(e) => setShareProjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
              >
                <option value="" className="bg-gray-900">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-gray-900">{p.name}</option>
                ))}
              </select>
              <button onClick={handleShare} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Upload File</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">File *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Client</label>
                <select
                  value={uploadClientId}
                  onChange={(e) => setUploadClientId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="" className="bg-gray-900">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900">{c.full_name} ({c.company})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Project</label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="" className="bg-gray-900">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-900">{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="general" className="bg-gray-900">General</option>
                  <option value="requirements" className="bg-gray-900">Requirements</option>
                  <option value="designs" className="bg-gray-900">Designs</option>
                  <option value="contracts" className="bg-gray-900">Contracts</option>
                  <option value="deliverables" className="bg-gray-900">Deliverables</option>
                  <option value="invoices" className="bg-gray-900">Invoices</option>
                  <option value="receipts" className="bg-gray-900">Receipts</option>
                  <option value="technical" className="bg-gray-900">Technical Documents</option>
                </select>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}