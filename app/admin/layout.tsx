'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/clients', label: 'Clients', icon: '👥' },
  { href: '/admin/leads', label: 'Leads', icon: '🎯' },
  { href: '/admin/projects', label: 'Projects', icon: '📁' },
  { href: '/admin/project-requests', label: 'Requests', icon: '[R]' },
  { href: '/admin/requirements', label: 'Requirements', icon: '📋' },
  { href: '/admin/milestones', label: 'Milestones', icon: '🎯' },
  { href: '/admin/files', label: 'Files', icon: '📄' },
  { href: '/admin/ideas', label: 'Ideas', icon: '💡' },
  { href: '/admin/messages', label: 'Messages', icon: '💬' },
  { href: '/admin/offers', label: 'Offers', icon: '📝' },
  { href: '/admin/invoices', label: 'Invoices', icon: '💰' },
  { href: '/admin/payments', label: 'Payments', icon: '💳' },
  { href: '/admin/support', label: 'Support', icon: '🎫' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/activity', label: 'Activity', icon: '⚡' },
  { href: '/admin/team', label: 'Team', icon: '👤' },
  { href: '/admin/website', label: 'Website', icon: '🌐' },
  { href: '/admin/reports', label: 'Reports', icon: '📑' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '🔒' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [adminName, setAdminName] = useState('Admin')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }
      const { data: admin } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      if (!admin) {
        router.push('/portal')
        return
      }
      setAdminName(user.email || 'Admin')
      setLoading(false)
    }
    checkAdmin()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-gray-900 border-r border-white/10 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {!collapsed && (
            <div>
              <p className="font-bold text-white">Omnix Lab</p>
              <p className="text-xs text-gray-400">Admin Portal</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{adminName}</p>
                <button
                  onClick={() => {
                    supabase.auth.signOut()
                    router.push('/portal/login')
                  }}
                  className="text-xs text-gray-400 hover:text-red-400"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            {adminNav.find(item => item.href === pathname)?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-white/10">
              <span className="text-lg">🔍</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10">
              <span className="text-lg">🔔</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}