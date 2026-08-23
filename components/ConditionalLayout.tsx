'use client'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPrivate = pathname.startsWith('/portal') || pathname.startsWith('/admin')

  return (
    <>
      {!isPrivate && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!isPrivate && <Footer />}
    </>
  )
}