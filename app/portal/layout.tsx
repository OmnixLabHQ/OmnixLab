'use client'
import PortalShell from '@/components/PortalShell'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>
}