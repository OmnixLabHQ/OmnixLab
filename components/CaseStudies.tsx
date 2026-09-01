'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

const caseStudies = [
  {
    title: 'Crypto Trading Platform',
    client: 'FinEdge Capital',
    category: 'Trading Bot',
    problem: 'Manual trading was causing delays and missed opportunities in volatile markets.',
    solution: 'Built an automated high-frequency trading system with real-time market analysis and risk management.',
    results: [
      '300% increase in trade execution speed',
      '45% reduction in trading costs',
      '24/7 automated operation',
      '$2M+ processed monthly'
    ],
    gradient: 'from-emerald-500 to-teal-600',
    icon: '📈'
  },
  {
    title: 'E-Commerce Platform',
    client: 'CloudStack Solutions',
    category: 'Web Development',
    problem: 'Outdated platform couldn\'t handle growing traffic and lacked mobile optimization.',
    solution: 'Developed a modern, responsive e-commerce platform with inventory management and analytics.',
    results: [
      '200% increase in mobile sales',
      '60% faster page load times',
      '50,000+ products managed',
      '99.9% uptime achieved'
    ],
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🛒'
  },
  {
    title: 'Healthcare SaaS',
    client: 'MediCare Plus',
    category: 'Software Development',
    problem: 'Patient data scattered across systems, causing scheduling conflicts and delays.',
    solution: 'Created a centralized patient management system with telemedicine and secure records.',
    results: [
      '80% reduction in scheduling time',
      '10,000+ patients onboarded',
      'HIPAA compliant',
      '95% patient satisfaction'
    ],
    gradient: 'from-purple-500 to-pink-600',
    icon: '🏥'
  }
]

export default function CaseStudies() {
  const [activeStudy, setActiveStudy] = useState(0)

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Case Studies</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Real Results, Real Impact
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            See how we&apos;ve helped businesses transform their digital presence
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {caseStudies.map((study, i) => (
            <button
              key={i}
              onClick={() => setActiveStudy(i)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeStudy === i
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {study.icon} {study.title}
            </button>
          ))}
        </div>

        {/* Active Case Study */}
        <motion.div
          key={activeStudy}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100"
        >
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className={`inline-flex px-4 py-2 rounded-full bg-gradient-to-r ${caseStudies[activeStudy].gradient} text-white text-sm font-medium mb-6`}>
                {caseStudies[activeStudy].category}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{caseStudies[activeStudy].title}</h3>
              <p className="text-indigo-600 font-medium mb-6">Client: {caseStudies[activeStudy].client}</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">🔴 Problem</h4>
                  <p className="text-gray-600">{caseStudies[activeStudy].problem}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">🟢 Solution</h4>
                  <p className="text-gray-600">{caseStudies[activeStudy].solution}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">📊 Key Results</h4>
              <div className="space-y-3">
                {caseStudies[activeStudy].results.map((result, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: j * 0.15 }}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"
                  >
                    <span className="text-2xl">✅</span>
                    <span className="font-medium text-gray-900">{result}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
