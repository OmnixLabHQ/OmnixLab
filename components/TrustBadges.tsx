'use client'

import { motion } from 'framer-motion'

const badges = [
  { icon: '✅', title: '50+ Projects', desc: 'Completed successfully' },
  { icon: '⭐', title: '15+ Clients', desc: 'Worldwide' },
  { icon: '🏆', title: '4+ Years', desc: 'Industry experience' },
  { icon: '🔒', title: '99% Uptime', desc: 'Guaranteed reliability' },
  { icon: '💰', title: 'Fair Pricing', desc: 'No hidden costs' },
  { icon: '🚀', title: 'Fast Delivery', desc: 'On time, every time' },
]

export default function TrustBadges() {
  return (
    <section className="py-12 px-6 lg:px-8 bg-gradient-to-r from-indigo-50 via-white to-purple-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-8"
        >
          Why clients trust us
        </motion.p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
              whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
              className="bg-white rounded-2xl p-5 text-center border border-gray-100 cursor-default transition-shadow"
            >
              <div className="text-2xl mb-2">{badge.icon}</div>
              <div className="font-bold text-sm text-gray-900">{badge.title}</div>
              <div className="text-xs text-gray-500 mt-1">{badge.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}