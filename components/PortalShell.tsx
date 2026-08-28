'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'
import GlobalSearch from '@/components/GlobalSearch'

interface PortalShellProps {
  children: React.ReactNode
}

export default function PortalShell({ children }: PortalShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [clientName, setClientName] = useState('Client')
  const [clientEmail, setClientEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const publicPaths = ['/portal', '/portal/login', '/portal/register', '/portal/forgot-password', '/portal/reset-password']
  const isPublic = publicPaths.includes(pathname)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        if (!isPublic) router.push('/portal/login')
        setLoading(false)
        return
      }
      setUser(authUser)
      setClientEmail(authUser.email || '')
      const { data: client } = await supabase
        .from('clients')
        .select('full_name')
        .eq('id', authUser.id)
        .single()
      if (client) setClientName(client.full_name || 'Client')
      setLoading(false)
    }
    checkAuth()
  }, [pathname, isPublic, router])

  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isPublic && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (isPublic) {
    return <>{children}</>
  }

        const navItems = [
    { href: '/portal/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/portal/projects', label: 'Projects', icon: '📁' },
    { href: '/portal/project-requests', label: 'Requests', icon: '📋' },
    { href: '/portal/messages', label: 'Messages', icon: '💬' },
    { href: '/portal/files', label: 'Files', icon: '📄' },
    { href: '/portal/ideas', label: 'Ideas', icon: '💡' },
    { href: '/portal/invoices', label: 'Invoices', icon: '🧾' },
    { href: '/portal/payments', label: 'Payments', icon: '💳' },
    { href: '/portal/start-project', label: 'Start a Project', icon: '🚀' },
  ]

  const secondaryNavItems = [
    { href: '/portal/settings', label: 'Settings', icon: '⚙️' },
    { href: '/portal/support', label: 'Help & Support', icon: '❓' },
  ]

   const mobileBottomItems = [
    { href: '/portal/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/portal/projects', label: 'Projects', icon: '📁' },
    { href: '/portal/messages', label: 'Messages', icon: '💬' },
    { href: '/portal/files', label: 'Files', icon: '📄' },
    { href: '/portal/invoices', label: 'Invoices', icon: '🧾' },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-6 pt-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">O</div>
        <div>
          <p className="font-bold text-lg leading-tight text-gray-900 dark:text-white">
            Omnix<span className="text-gray-400">Lab</span>
          </p>
          <p className="text-xs text-gray-500">Client Portal</p>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname === item.href || (item.href !== '/portal/dashboard' && pathname.startsWith(item.href))
                ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4 mx-4"></div>

      {/* Secondary Navigation */}
      <nav className="space-y-1 px-4 pb-4">
        {secondaryNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname === item.href
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Logout */}
        <button
          onClick={() => router.push('/portal/logout')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex-col hidden lg:flex fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto transition-transform duration-300">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition flex-shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
              <span className="text-lg font-bold">OmnixLab</span>
            </div>
            {/* Breadcrumb / Page Title */}
            <h1 className="hidden md:block text-lg font-bold text-gray-900 truncate">
              {navItems.find(item => item.href === pathname)?.label ||
               secondaryNavItems.find(item => item.href === pathname)?.label ||
               'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Global Search (desktop) */}
            <div className="hidden md:block w-64">
              <GlobalSearch />
            </div>

            <NotificationBell />

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  {clientName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold leading-tight">{clientName}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">{clientEmail}</p>
                </div>
                <svg className="hidden sm:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50">
                  <Link href="/portal/settings/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                  <Link href="/portal/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
                  <Link href="/portal/settings/security" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Security</Link>
                  <Link href="/portal/support" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Help & Support</Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button
                    onClick={() => router.push('/portal/logout')}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-20 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex justify-around items-center py-2">
          {mobileBottomItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-xs font-medium ${
                pathname === item.href ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center text-xs font-medium text-gray-500"
          >
            <span className="text-xl">☰</span>
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}