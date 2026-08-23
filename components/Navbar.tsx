'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services', hasDropdown: true },
  { label: 'Work', href: '/work' },
  { label: 'Insights', href: '/blog' },          // user‑facing label "Insights", route stays /blog
  { label: 'About', href: '/about' },
]

const servicesDropdown = [
  { label: 'Custom Software', href: '/services#custom-software' },
  { label: 'Web Applications', href: '/services#web-applications' },
  { label: 'SaaS Platforms', href: '/services#saas' },
  { label: 'AI & Automation', href: '/services#ai-automation' },
  { label: 'Trading Technology', href: '/services#trading-technology' },
  { label: 'Mobile Development', href: '/services#mobile' },
]

export default function Navbar() {
  const pathname = usePathname()
    if (pathname.startsWith('/portal')) return null
      if (pathname.startsWith('/portal')) return null
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setServicesOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Floating Navbar Container */}
      <div className="fixed top-4 left-4 right-4 md:left-6 md:right-6 z-50">
        <nav
          className={`mx-auto max-w-7xl rounded-2xl transition-all duration-300 ${
            scrolled
              ? 'bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg'
              : 'bg-white/40 backdrop-blur-lg border border-white/20 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between px-5 md:px-6 h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900">
                Omnix<span className="text-gray-400 font-normal">Lab</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <div key={item.label} className="relative">
                    <Link
                      href={item.href}
                      onMouseEnter={() => item.hasDropdown && setServicesOpen(true)}
                      onMouseLeave={() => item.hasDropdown && setServicesOpen(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white/60 text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                      }`}
                    >
                      {item.label}
                      {item.hasDropdown && (
                        <span className="ml-1 text-xs text-gray-400">▾</span>
                      )}
                    </Link>

                    {/* Services Dropdown */}
                    {item.hasDropdown && servicesOpen && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-0 mt-2 w-64 rounded-xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-xl p-2"
                      >
                        {servicesDropdown.map((service) => (
                          <Link
                            key={service.label}
                            href={service.href}
                            className="block px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            {service.label}
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <Link
                            href="/services"
                            className="block px-4 py-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                          >
                            Explore all services →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/portal"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-white/60 transition-colors"
              >
                Client Workspace
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start a Project
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 hover:bg-white/60 transition-colors"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Full‑screen Glass Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 bg-white/90 backdrop-blur-xl border-l border-white/30 shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <span className="text-lg font-bold text-gray-900">Omnix<span className="text-gray-400">Lab</span></span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-gray-800 hover:bg-white/60 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-gray-200 my-6"></div>

            <Link
              href="/portal"
              className="block px-4 py-3 rounded-xl text-base font-medium text-gray-800 border border-gray-200 hover:bg-white/60 transition-colors mb-3"
            >
              Client Workspace
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-3 rounded-xl text-center bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Start a Project
            </Link>
          </div>
        </div>
      )}
    </>
  )
}