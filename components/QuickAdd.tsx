 'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickAdd() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const actions = [
    { label: 'Upload File', icon: '📤', href: '/portal/files' },
    { label: 'New Message', icon: '💬', href: '/portal/messages' },
    { label: 'Create Task', icon: '✅', href: '/portal/dashboard' },
    { label: 'Request Change', icon: '🔄', href: '/portal/messages' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 space-y-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setOpen(false)
                router.push(action.href)
              }}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-xl rounded-2xl px-4 py-3 w-48 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <span>{action.icon}</span>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center text-2xl"
      >
        {open ? '✕' : '+'}
      </button>
    </div>
  )
}
