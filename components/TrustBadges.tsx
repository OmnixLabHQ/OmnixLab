'use client'

import { motion } from 'framer-motion'

const companies = [
  { name: 'TechNova', icon: 'circle' },
  { name: 'CryptoPals', icon: 'shield' },
  { name: 'FinEdge', icon: 'chart' },
  { name: 'TradeFlow', icon: 'arrow' },
  { name: 'WealthBridge', icon: 'building' },
  { name: 'DataNest', icon: 'hexagon' },
]

function CompanyIcon({ type }: { type: string }) {
  switch (type) {
    case 'circle':
      return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /></svg>
    case 'shield':
      return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l7 3v6c0 4.4-3.6 7.5-7 9-3.4-1.5-7-4.6-7-9V6l7-3z" /></svg>
    case 'chart':
      return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21V3m0 18h18M8 17v-4m4 4v-7m4 7V9" /></svg>
    case 'arrow':
      return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h13l-3-3m3 3l-3 3m-7 10H3l3-3m-3 3l3 3" /></svg>
    case 'building':
      return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16m-9-5h4m-4-4h4M5 21h14" /></svg>
    case 'hexagon':
      return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l7 4v7l-7 4-7-4V7l7-4z" /></svg>
    default:
      return null
  }
}

export default function TrustedBy() {
  return (
    <section className="py-12 px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center mb-8">
          Trusted by innovative companies worldwide
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {companies.map((company) => (
            <div key={company.name} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
              <CompanyIcon type={company.icon} />
              <span className="text-sm font-semibold">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}