'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const sendVisit = async () => {
      try {
        const payload = {
          page: pathname,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || 'Direct',
          userAgent: navigator.userAgent,
          language: navigator.language || 'unknown',
          screen: `${window.screen.width}x${window.screen.height}`,
          platform: navigator.platform || 'unknown',
          connection: (navigator as any).connection?.effectiveType || 'unknown',
        }

        await fetch('/api/track-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (error) {
        // Silently fail, do not affect user experience
      }
    }

    sendVisit()
  }, [pathname])

  return null
}
