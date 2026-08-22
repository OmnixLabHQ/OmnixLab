'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal/login')
        return
      }

      // Allowed admin emails (add more if needed)
      const adminEmails = ['helloafrica@omnixlabsupport.com']

      if (adminEmails.includes(user.email || '')) {
        setIsAdmin(true)
      } else {
        router.push('/portal/login')
      }
      setLoading(false)
    }
    checkAdmin()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAdmin) return null

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/clients', label: 'Clients', icon: '👥' },
    { href: '/admin/chat', label: 'Chat Inbox', icon: '💬' },
    { href: '/admin/projects', label: 'Projects', icon: '🗂️' },
    { href: '/admin/files', label: 'Files', icon: '📁' },
    { href: '/admin/invoices', label: 'Invoices & Offers', icon: '💰' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-6 fixed inset-y-0 left-0 z-50 lg:static">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">O</div>
          <span className="text-xl font-bold">Omnix Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        <a
          href="/portal/logout"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition"
        >
          🚪 Sign Out
        </a>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-10 overflow-auto bg-gray-50 text-gray-900">
        {children}
      </div>
    </div>
  )
}