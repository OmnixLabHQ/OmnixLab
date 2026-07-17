'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Omnix<span className="text-gray-400 font-normal">Lab</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/services" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Services</Link>
            <Link href="/work" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Work</Link>
            <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
          </div>

          {/* Desktop CTA */}
          <Link 
            href="/contact"
            className="hidden lg:inline-flex px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Get in touch
          </Link>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {isOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-gray-100 mt-2">
            <div className="flex flex-col gap-4">
              <Link href="/services" className="text-lg text-gray-700 hover:text-gray-900 py-2" onClick={() => setIsOpen(false)}>Services</Link>
              <Link href="/work" className="text-lg text-gray-700 hover:text-gray-900 py-2" onClick={() => setIsOpen(false)}>Work</Link>
              <Link href="/about" className="text-lg text-gray-700 hover:text-gray-900 py-2" onClick={() => setIsOpen(false)}>About</Link>
              <Link href="/contact" className="text-lg text-gray-700 hover:text-gray-900 py-2" onClick={() => setIsOpen(false)}>Contact</Link>
              <Link 
                href="/contact"
                className="inline-flex justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors mt-2"
                onClick={() => setIsOpen(false)}
              >
                Get in touch
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}