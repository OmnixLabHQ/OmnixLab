'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AdvancedHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image - Full Cover */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://i.ibb.co/kVk8sC5S/download-32.jpg')",
        }}
      />

      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Subtle bottom gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 py-20 text-center">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm tracking-widest text-blue-400 uppercase mb-4"
        >
          Digital Solutions
        </motion.p>

        {/* Headline - Centered, Bold, Capitalized */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6 capitalize"
        >
          We Build Large Scale Digital Systems Behind{' '}
          <span className="text-blue-400">Businesses</span> Worldwide.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8"
        >
          Websites Development, software Development, AI systems and Automation Solutions from strategy to deployment.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition shadow-lg shadow-blue-600/40"
          >
            Start A Project
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </Link>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-semibold rounded-full transition"
          >
            Explore Our Work
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </Link>
        </motion.div>

        {/* Stats - Glassmorphic Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { number: '50+', label: 'Projects Delivered' },
            { number: '15+', label: 'Global Clients' },
            { number: '4+', label: 'Years Experience' },
            { number: '99%', label: 'Client Satisfaction' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-white">{stat.number}</div>
              <div className="text-xs text-gray-300 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}