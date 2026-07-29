'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'Work', href: '/work' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        scrolled 
          ? 'w-[95%] md:w-[90%] max-w-5xl' 
          : 'w-[92%] md:w-[85%] max-w-4xl'
      }`}
    >
      <div className={`
        relative rounded-2xl border backdrop-blur-xl transition-all duration-500
        ${scrolled 
          ? 'bg-white/70 border-gray-200/50 shadow-2xl shadow-gray-200/30' 
          : 'bg-white/50 border-gray-200/30 shadow-lg shadow-gray-200/10'
        }
      `}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-50/30 via-white/20 to-purple-50/30 pointer-events-none"></div>
        
        <div className="relative flex items-center justify-between px-4 md:px-6 h-16">
          
          {/* Logo / Home Button */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-base">O</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:block">
              Omnix<span className="text-gray-400 font-normal">Lab</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? 'text-indigo-600 bg-indigo-50/80' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                    }
                  `}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop CTA */}
          <Link 
            href="/contact"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 flex-shrink-0"
          >
            Get in touch
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4l4 4-4 4"/>
            </svg>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col gap-1.5">
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`
          md:hidden transition-all duration-300 overflow-hidden
          ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100/50">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block px-4 py-3 rounded-xl text-base font-medium transition-all mb-1
                    ${isActive 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {link.name}
                </Link>
              )
            })}
            <Link 
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="block mt-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Get in touch →
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}