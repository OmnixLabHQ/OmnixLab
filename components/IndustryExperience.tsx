'use client'

import { motion } from 'framer-motion'

const industries = [
  { name: 'FinTech & Banking', icon: '🏦', desc: 'Trading platforms, payment systems, financial dashboards', projects: '15+' },
  { name: 'Healthcare', icon: '🏥', desc: 'Patient management, telemedicine, HIPAA-compliant systems', projects: '8+' },
  { name: 'E-Commerce', icon: '🛒', desc: 'Online stores, marketplaces, inventory management', projects: '20+' },
  { name: 'SaaS & Startups', icon: '🚀', desc: 'MVPs, scalable platforms, subscription systems', projects: '25+' },
  { name: 'Logistics', icon: '🚚', desc: 'Delivery apps, fleet management, real-time tracking', projects: '6+' },
  { name: 'Education', icon: '📚', desc: 'LMS platforms, course marketplaces, virtual classrooms', projects: '5+' },
]

export default function IndustryExperience() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Industry Expertise</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Industries We Serve
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Deep experience across regulated and high-growth sectors
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                {industry.projects} projects
              </div>
              <div className="text-5xl mb-4">{industry.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{industry.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{industry.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}