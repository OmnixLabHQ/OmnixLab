'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  created_at: string
  last_active: string | null
  projects_count: number
  permissions: string[]
}

const ROLES: Record<string, { label: string; description: string; permissions: string[] }> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full access to everything',
    permissions: ['*'],
  },
  admin: {
    label: 'Administrator',
    description: 'Most operational functions',
    permissions: [
      'clients.view', 'clients.create', 'clients.edit',
      'projects.view', 'projects.create', 'projects.edit',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
      'payments.view', 'payments.verify',
      'files.view', 'files.upload',
      'messages.view', 'messages.reply',
      'ideas.view', 'ideas.edit',
      'support.view', 'support.reply',
      'analytics.view',
      'team.view',
    ],
  },
  project_manager: {
    label: 'Project Manager',
    description: 'Projects, milestones, requirements, files and client communication',
    permissions: [
      'clients.view',
      'projects.view', 'projects.create', 'projects.edit',
      'requirements.view', 'requirements.create', 'requirements.edit',
      'milestones.view', 'milestones.create', 'milestones.edit',
      'tasks.view', 'tasks.create', 'tasks.edit',
      'files.view', 'files.upload',
      'messages.view', 'messages.reply',
      'ideas.view',
    ],
  },
  finance: {
    label: 'Finance Manager',
    description: 'Invoices, payments and financial reports',
    permissions: [
      'clients.view',
      'projects.view',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
      'payments.view', 'payments.verify', 'payments.refund',
      'analytics.view',
    ],
  },
  support: {
    label: 'Support Agent',
    description: 'Messages and support tickets',
    permissions: [
      'clients.view',
      'projects.view',
      'messages.view', 'messages.reply',
      'support.view', 'support.reply',
      'files.view',
    ],
  },
  content_manager: {
    label: 'Content Manager',
    description: 'Blog and website content',
    permissions: [
      'website.view', 'website.edit',
      'leads.view',
    ],
  },
  developer: {
    label: 'Developer / Technical Staff',
    description: 'Assigned project information and technical tasks',
    permissions: [
      'clients.view',
      'projects.view',
      'requirements.view',
      'milestones.view',
      'tasks.view', 'tasks.edit',
      'files.view', 'files.upload',
      'messages.view', 'messages.reply',
    ],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to basic information',
    permissions: [
      'clients.view',
      'projects.view',
      'analytics.view',
    ],
  },
}

const ALL_PERMISSIONS = [
  'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
  'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
  'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
  'payments.view', 'payments.verify', 'payments.refund',
  'files.view', 'files.upload', 'files.delete',
  'messages.view', 'messages.reply',
  'ideas.view', 'ideas.edit',
  'support.view', 'support.reply',
  'analytics.view',
  'team.view', 'team.manage',
  'leads.view', 'leads.manage',
  'website.view', 'website.edit',
  'settings.manage',
  'audit.view',
  'users.manage',
]

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modal states
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  
  // Form states
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState('viewer')
  const [formPassword, setFormPassword] = useState('')
  const [formStatus, setFormStatus] = useState('active')
  
  // Permissions state
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  
  // Sessions state
  const [sessions, setSessions] = useState<any[]>([])
  
  // UI states
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    roles: {} as Record<string, number>,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: membersData } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      const membersWithDetails = await Promise.all(
        (membersData || []).map(async (member) => {
          // Count projects assigned
          const { data: projectsData } = await supabase
            .from('projects')
            .select('id')
            .eq('project_manager_id', member.id)

          return {
            ...member,
            projects_count: projectsData?.length || 0,
            permissions: member.permissions || ROLES[member.role]?.permissions || [],
          }
        })
      )

      setMembers(membersWithDetails)
      calculateStats(membersWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('Fetch team error:', error)
      setLoading(false)
    }
  }, [])

  function calculateStats(members: TeamMember[]) {
    const total = members.length
    const active = members.filter(m => m.status === 'active').length
    const suspended = members.filter(m => m.status === 'suspended').length
    const roles: Record<string, number> = {}
    
    members.forEach(m => {
      roles[m.role] = (roles[m.role] || 0) + 1
    })

    setStats({ total, active, suspended, roles })
  }

  async function handleCreateMember() {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      alert('Please fill in name, email, and password')
      return
    }

    setInviting(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formEmail,
        password: formPassword,
        email_confirm: true,
      })

      if (authError) {
        alert('Failed to create user: ' + authError.message)
        setInviting(false)
        return
      }

      // Create admin user record
      const permissions = ROLES[formRole]?.permissions || []
      const { data: newMember } = await supabase
        .from('admin_users')
        .insert({
          id: authData.user.id,
          full_name: formName,
          email: formEmail,
          role: formRole,
          status: formStatus,
          permissions: permissions,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newMember) {
        await supabase.from('audit_logs').insert({
          user_id: authData.user.id,
          action_type: 'team_member_created',
          description: `Team member ${formName} created with role ${formRole}`,
          entity_type: 'admin_user',
          entity_id: newMember.id,
        })
      }

      setShowCreateModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Create member error:', error)
      alert('Failed to create member')
    } finally {
      setInviting(false)
    }
  }

  async function handleEditMember() {
    if (!selectedMember || !formName.trim() || !formEmail.trim()) {
      alert('Please fill in required fields')
      return
    }

    setSaving(true)
    try {
      await supabase
        .from('admin_users')
        .update({
          full_name: formName,
          email: formEmail,
          role: formRole,
          status: formStatus,
          permissions: ROLES[formRole]?.permissions || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMember.id)

      await supabase.from('audit_logs').insert({
        user_id: selectedMember.id,
        action_type: 'team_member_updated',
        description: `Team member ${formName} updated`,
        entity_type: 'admin_user',
        entity_id: selectedMember.id,
      })

      setShowEditModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Edit member error:', error)
      alert('Failed to update member')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePermissions() {
    if (!selectedMember) return

    setSaving(true)
    try {
      await supabase
        .from('admin_users')
        .update({
          permissions: Array.from(selectedPermissions),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMember.id)

      await supabase.from('audit_logs').insert({
        user_id: selectedMember.id,
        action_type: 'permissions_updated',
        description: `Permissions updated for ${selectedMember.full_name}`,
        entity_type: 'admin_user',
        entity_id: selectedMember.id,
      })

      setShowPermissionsModal(false)
      fetchData()
    } catch (error) {
      console.error('Update permissions error:', error)
      alert('Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(member: TeamMember) {
    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    const action = newStatus === 'suspended' ? 'Suspend' : 'Reactivate'
    
    if (!confirm(`${action} ${member.full_name}?`)) return

    await supabase
      .from('admin_users')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.id)

    await supabase.from('audit_logs').insert({
      user_id: member.id,
      action_type: newStatus === 'suspended' ? 'member_suspended' : 'member_reactivated',
      description: `${action} ${member.full_name}`,
      entity_type: 'admin_user',
      entity_id: member.id,
    })

    fetchData()
  }

  async function fetchSessions(member: TeamMember) {
    setSelectedMember(member)
    setShowSessionsModal(true)
    
    const { data } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('user_id', member.id)
      .order('last_active', { ascending: false })
    
    setSessions(data || [])
  }

  async function handleRevokeSession(sessionId: string) {
    if (!confirm('Revoke this session?')) return

    await supabase
      .from('admin_sessions')
      .delete()
      .eq('id', sessionId)

    if (selectedMember) {
      fetchSessions(selectedMember)
    }
  }

  async function handleRevokeAllSessions(member: TeamMember) {
    if (!confirm(`Revoke all sessions for ${member.full_name}?`)) return

    await supabase
      .from('admin_sessions')
      .delete()
      .eq('user_id', member.id)

    if (selectedMember) {
      fetchSessions(selectedMember)
    }
  }

  function togglePermission(permission: string) {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permission)) {
      newSelected.delete(permission)
    } else {
      newSelected.add(permission)
    }
    setSelectedPermissions(newSelected)
  }

  function resetForm() {
    setFormName('')
    setFormEmail('')
    setFormRole('viewer')
    setFormPassword('')
    setFormStatus('active')
    setSelectedPermissions(new Set())
  }

  function getRoleColor(role: string) {
    const map: Record<string, string> = {
      super_admin: 'bg-red-500/20 text-red-300',
      admin: 'bg-purple-500/20 text-purple-300',
      project_manager: 'bg-blue-500/20 text-blue-300',
      finance: 'bg-green-500/20 text-green-300',
      support: 'bg-cyan-500/20 text-cyan-300',
      content_manager: 'bg-orange-500/20 text-orange-300',
      developer: 'bg-yellow-500/20 text-yellow-300',
      viewer: 'bg-gray-500/20 text-gray-300',
    }
    return map[role] || 'bg-gray-500/20 text-gray-300'
  }

  function getStatusColor(status: string) {
    return status === 'active'
      ? 'bg-green-500/20 text-green-300'
      : 'bg-red-500/20 text-red-300'
  }

  function formatDate(date: string) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const filteredMembers = members.filter(member => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      if (!member.full_name?.toLowerCase().includes(term) && 
          !member.email?.toLowerCase().includes(term)) return false
    }
    if (roleFilter !== 'all' && member.role !== roleFilter) return false
    if (statusFilter !== 'all' && member.status !== statusFilter) return false
    return true
  })

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
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-sm text-gray-400 mt-1">
            {stats.total} team members - {stats.active} active
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Team Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Members</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Suspended</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.suspended}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Roles</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{Object.keys(stats.roles).length}</p>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Role Distribution</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.roles).map(([role, count]) => (
            <span
              key={role}
              className={`px-3 py-1.5 text-xs font-medium rounded-full ${getRoleColor(role)}`}
            >
              {ROLES[role]?.label || role}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm placeholder-gray-500 focus:border-blue-500 outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Roles</option>
          {Object.entries(ROLES).map(([value, role]) => (
            <option key={value} value={value} className="bg-gray-900">{role.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="all" className="bg-gray-900">All Statuses</option>
          <option value="active" className="bg-gray-900">Active</option>
          <option value="suspended" className="bg-gray-900">Suspended</option>
        </select>
      </div>

      {/* Team Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="py-3 px-4 font-medium">Member</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Projects</th>
              <th className="py-3 px-4 font-medium">Last Active</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="text-4xl mb-3">[ ]</div>
                  <p className="text-gray-500">No team members found</p>
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-300">
                          {(member.full_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.full_name || '-'}</p>
                        <p className="text-gray-400 text-xs">{member.email || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                      {ROLES[member.role]?.label || member.role || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                      {member.status || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{member.projects_count}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(member.last_active || '')}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(member.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedMember(member)
                          setFormName(member.full_name)
                          setFormEmail(member.email)
                          setFormRole(member.role)
                          setFormStatus(member.status)
                          setShowEditModal(true)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMember(member)
                          setSelectedPermissions(new Set(member.permissions || []))
                          setShowPermissionsModal(true)
                        }}
                        className="text-purple-400 hover:text-purple-300 text-xs"
                      >
                        Permissions
                      </button>
                      <button
                        onClick={() => fetchSessions(member)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs"
                      >
                        Sessions
                      </button>
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className={member.status === 'active' ? 'text-red-400 hover:text-red-300 text-xs' : 'text-green-400 hover:text-green-300 text-xs'}
                      >
                        {member.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Add Team Member</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="john@omnixlab.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password *</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                  placeholder="Temporary password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  {Object.entries(ROLES).map(([value, role]) => (
                    <option key={value} value={value} className="bg-gray-900">
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="active" className="bg-gray-900">Active</option>
                  <option value="suspended" className="bg-gray-900">Suspended</option>
                </select>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Role Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {(ROLES[formRole]?.permissions || []).slice(0, 5).map(perm => (
                    <span key={perm} className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded">
                      {perm}
                    </span>
                  ))}
                  {(ROLES[formRole]?.permissions || []).length > 5 && (
                    <span className="px-2 py-0.5 bg-white/10 text-gray-400 text-xs rounded">
                      +{(ROLES[formRole]?.permissions || []).length - 5} more
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCreateMember}
                disabled={inviting || !formName.trim() || !formEmail.trim() || !formPassword.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {inviting ? 'Creating...' : 'Add Team Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Edit Team Member</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  {Object.entries(ROLES).map(([value, role]) => (
                    <option key={value} value={value} className="bg-gray-900">
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  <option value="active" className="bg-gray-900">Active</option>
                  <option value="suspended" className="bg-gray-900">Suspended</option>
                </select>
              </div>
              <button
                onClick={handleEditMember}
                disabled={saving || !formName.trim() || !formEmail.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Permissions</h2>
                <p className="text-sm text-gray-400">{selectedMember.full_name}</p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-3">
              {ALL_PERMISSIONS.map(permission => (
                <label key={permission} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.has(permission)}
                    onChange={() => togglePermission(permission)}
                    className="w-4 h-4 bg-white/10 border-white/20 rounded"
                  />
                  <span className="text-sm text-white">{permission}</span>
                </label>
              ))}
              <button
                onClick={handleUpdatePermissions}
                disabled={saving}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Active Sessions</h2>
                <p className="text-sm text-gray-400">{selectedMember.full_name}</p>
              </div>
              <button onClick={() => setShowSessionsModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">X</button>
            </div>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active sessions</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{session.device || 'Unknown Device'}</p>
                        <p className="text-xs text-gray-400">
                          {session.browser || 'Unknown Browser'} - {session.location || 'Unknown Location'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last Active: {formatDate(session.last_active)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => handleRevokeAllSessions(selectedMember)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Revoke All Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
