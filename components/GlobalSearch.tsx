'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  title: string
  description: string
  type: string
  url: string
}

interface SearchResults {
  projects: SearchResult[]
  files: SearchResult[]
  invoices: SearchResult[]
  payments: SearchResult[]
  ideas: SearchResult[]
  messages: SearchResult[]
  tickets: SearchResult[]
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      return
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&clientId=${user.id}`)
        const data = await response.json()

        if (data.success) {
          setResults(data.results)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query])

  function getTotalResults(): number {
    if (!results) return 0
    return Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
  }

  function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      Project: '📊',
      File: '📁',
      Invoice: '💰',
      Payment: '💳',
      Idea: '💡',
      Message: '💬',
      'Support Ticket': '🎫',
    }
    return icons[type] || '📌'
  }

  const totalResults = getTotalResults()

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search projects, files, invoices, messages..."
          className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults(null)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
          ) : !results || totalResults === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                {totalResults} result(s) found
              </div>

              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Projects</p>
                  {results.projects.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">{result.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Files */}
              {results.files.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Files</p>
                  {results.files.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {results.invoices.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Invoices</p>
                  {results.invoices.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Payments */}
              {results.payments.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Payments</p>
                  {results.payments.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Ideas */}
              {results.ideas.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Ideas</p>
                  {results.ideas.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">{result.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Messages */}
              {results.messages.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Messages</p>
                  {results.messages.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                          <p className="text-xs text-gray-500 truncate">{result.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Support Tickets */}
              {results.tickets.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Support Tickets</p>
                  {results.tickets.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.title}</p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">{result.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
