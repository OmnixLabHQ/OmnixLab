'use client'

import { motion } from 'framer-motion'

const trustItems = [
  {
    icon: '🔒',
    title: 'Enterprise Security',
    desc: 'End-to-end encryption, secure authentication, and regular security audits',
    badges: ['GDPR Ready', 'SSL/TLS', 'OAuth 2.0']
  },
  {
    icon: '📋',
    title: 'Compliance Standards',
    desc: 'We build solutions that meet global regulatory requirements',
    badges: ['HIPAA', 'PCI-DSS', 'ISO 27001']
  },
  {
    icon: '⚡',
    title: 'Performance Guaranteed',
    desc: 'Lightning-fast load times and 99.9% uptime SLA',
    badges: ['<100ms TTFB', '99.9% Uptime', 'CDN Global']
  },
  {
    icon: '🔄',
    title: 'Agile Methodology',
    desc: 'Transparent development with daily updates and weekly sprints',
    badges: ['Scrum', 'Kanban', 'CI/CD']
  },
  {
    icon: '📞',
    title: 'Dedicated Support',
    desc: 'Priority support with guaranteed response times',
    badges: ['2hr Response', '24/7 Critical', 'Slack Access']
  },
  {
    icon: '🌍',
    title: 'Global Delivery',
    desc: 'Serving clients across time zones with seamless communication',
    badges: ['UTC-8 to UTC+8', 'English', 'Remote-First']
  }
]

export default function EnterpriseTrust() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Enterprise Ready</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Fortune 500 Companies Trust Us
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            We meet the rigorous standards that enterprise clients demand
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.desc}</p>
              <div className="flex flex-wrap gap-2">
                {item.badges.map((badge, j) => (
                  <span
                    key={j}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
