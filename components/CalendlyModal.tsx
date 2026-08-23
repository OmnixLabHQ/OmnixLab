'use client'
import { useEffect, useRef } from 'react'

export default function CalendlyModal({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on background click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Load Calendly widget when modal opens
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.Calendly) {
        // @ts-ignore
        window.Calendly.initInlineWidget({
          url: 'https://calendly.com/helloafrica-omnixlabsupport/30min',
          parentElement: document.getElementById('calendly-container'),
          prefill: {},
          utm: {},
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={containerRef}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[85vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Book a Free Consultation
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Calendly container */}
        <div id="calendly-container" className="h-full" style={{ minWidth: '320px', height: '100%' }}></div>
      </div>
    </div>
  )
}