'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'pending'
  added_at: string
}

export default function TeamSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer',
  })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch current client as owner
      const { data: client } = await supabase
        .from('clients')
        .select('id, full_name, email, created_at')
        .eq('id', user.id)
        .single()

      if (client) {
        const ownerMember: TeamMember = {
          id: client.id,
          name: client.full_name || 'Owner',
          email: client.email || '',
          role: 'Owner',
          status: 'active',
          added_at: client.created_at,
        }
        setMembers([ownerMember])
      }

      // Fetch organization members
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'active')

      if (orgMembers && orgMembers.length > 0) {
        // Fetch details for each member
        const memberDetails = await Promise.all(
          orgMembers.map(async (member) => {
            const { data: clientData } = await supabase
              .from('clients')
              .select('full_name, email, created_at')
              .eq('id', member.user_id)
              .single()

            return {
              id: member.user_id,
              name: clientData?.full_name || 'Member',
              email: clientData?.email || '',
              role: member.role,
              status: 'active' as const,
              added_at: clientData?.created_at || new Date().toISOString(),
            }
          })
        )
        setMembers((prev) => [...prev, ...memberDetails])
      }

      // Fetch pending invitations
      const { data: pendingInvites } = await supabase
        .from('invitations')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'pending')

      if (pendingInvites && pendingInvites.length > 0) {
        const pendingMembers = pendingInvites.map((invite) => ({
          id: invite.id,
          name: invite.email,
          email: invite.email,
          role: invite.role,
          status: 'pending' as const,
          added_at: invite.created_at,
        }))
        setMembers((prev) => [...prev, ...pendingMembers])
      }

      setLoading(false)
    } catch (error) {
      console.error('Team fetch error:', error)
      setLoading(false)
    }
  }

  async function handleInvite() {
    setSending(true)
    setError('')
    setMessage('')

    if (!inviteForm.email || !inviteForm.email.includes('@')) {
      setError('Please enter a valid email address')
      setSending(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSending(false)
        return
      }

      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          email: inviteForm.email,
          role: inviteForm.role,
          createdBy: user.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`Invitation sent to ${inviteForm.email}`)
        setInviteForm({ email: '', role: 'viewer' })
        setShowInviteForm(false)
        await fetchMembers()
      } else {
        setError(result.error || 'Failed to send invitation')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setSending(false)
    }
  }

  function getRoleColor(role: string): string {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'finance':
        return 'bg-green-100 text-green-800'
      case 'developer':
        return 'bg-orange-100 text-orange-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/settings" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Settings
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600 mt-1">
              Manage who has access to your Omnix Lab portal.
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            + Invite Member
          </button>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 mb-4">
            {error}
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Invite Team Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="teammate@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
                >
                  <option value="admin">Administrator</option>
                  <option value="finance">Finance Manager</option>
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleInvite}
                  disabled={sending}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Members ({members.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-gray-700">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {member.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Role Permissions</h3>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-900 text-sm">Owner</p>
              <p className="text-xs text-gray-500">Full access to all settings, billing, and team management</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Administrator</p>
              <p className="text-xs text-gray-500">Manage projects, files, and team members</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Finance Manager</p>
              <p className="text-xs text-gray-500">View and manage invoices and payments</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Developer</p>
              <p className="text-xs text-gray-500">View projects and upload files</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Viewer</p>
              <p className="text-xs text-gray-500">Read-only access to projects and files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
