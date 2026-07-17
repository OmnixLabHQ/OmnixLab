'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch('/api/track-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: pathname,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || 'Direct',
            userAgent: navigator.userAgent,
          }),
        })
      } catch (error) {
        // Silently fail - don't affect user experience
        console.log('Tracking offline')
      }
    }

    trackVisit()
  }, [pathname])

  return null // This component renders nothing visually
}