'use client'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Preloader from '@/components/Preloader'
import ScrollProgress from '@/components/ScrollProgress'
import BackToTop from '@/components/BackToTop'
import WhatsAppBubble from '@/components/WhatsAppBubble'
import CursorGlow from '@/components/CursorGlow'
import VisitorTracker from '@/components/VisitorTracker'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPortal = pathname.startsWith('/portal')
  const isAdmin = pathname.startsWith('/admin')

  if (isPortal || isAdmin) {
    // No public navbar, footer, or marketing widgets
    return <>{children}</>
  }

  return (
    <>
      <Preloader />
      <ScrollProgress />
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <BackToTop />
      <WhatsAppBubble />
      <CursorGlow />
      <VisitorTracker />
    </>
  )
}