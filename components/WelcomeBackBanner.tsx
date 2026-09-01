'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function WelcomeBackBannerContent() {
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const shouldShow = searchParams?.get('welcome') === '1'
    if (!shouldShow) return

    const fetchClientName = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data: client } = await supabase
          .from('clients')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (client?.full_name) {
          setName(client.full_name)
        }
      } catch (error) {
        console.error('Failed to fetch client name:', error)
      }
    }

    fetchClientName()
    setVisible(true)

    const timer = setTimeout(() => setVisible(false), 10000)
    return () => clearTimeout(timer)
  }, [searchParams])

  if (!visible) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <span className="text-gray-400 text-xl">✕</span>
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              Welcome back{name ? `, ${name}` : ''}!
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              It&apos;s great to see you again. Your projects and updates are
              ready for you.
            </p>

            <div className="mt-4 flex gap-3">
              <a
                href="/portal/projects"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                View Projects
              </a>
              <a
                href="/portal/dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WelcomeBackBanner() {
  return (
    <Suspense fallback={null}>
      <WelcomeBackBannerContent />
    </Suspense>
  )
}
