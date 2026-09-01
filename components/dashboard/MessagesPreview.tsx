'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Message {
  id: string
  sender_type: string
  content: string
  created_at: string
  private: boolean
}

export default function MessagesPreview() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', user.id)
        .eq('private', false)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('Messages fetch error:', error)
        setLoading(false)
        return
      }

      setMessages(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Messages fetch exception:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="font-semibold text-gray-900 mb-1">No Messages</h3>
        <p className="text-sm text-gray-600 mb-4">Message the Omnix team anytime.</p>
        <Link
          href="/portal/messages"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Send Message
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Messages</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {messages.map((msg) => (
          <div key={msg.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm">{msg.sender_type === 'admin' ? '👨‍💼' : '👤'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm">
                    {msg.sender_type === 'admin' ? 'Omnix Lab' : 'You'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate mt-0.5">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-200 text-center">
        <Link href="/portal/messages" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Messages →
        </Link>
      </div>
    </div>
  )
}
