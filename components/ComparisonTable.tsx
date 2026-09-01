'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const comparisons = [
  { feature: 'Custom Development', omnix: true, agency: true, freelancer: true, other: false },
  { feature: 'Enterprise Architecture', omnix: true, agency: true, freelancer: false, other: false },
  { feature: 'Trading Bot Expertise', omnix: true, agency: false, freelancer: false, other: false },
  { feature: '24/7 Support', omnix: true, agency: true, freelancer: false, other: false },
  { feature: 'NDA Protection', omnix: true, agency: true, freelancer: false, other: false },
  { feature: 'Post-Launch Support', omnix: true, agency: true, freelancer: false, other: false },
  { feature: 'Dedicated PM', omnix: true, agency: true, freelancer: false, other: false },
  { feature: 'Code Documentation', omnix: true, agency: true, freelancer: false, other: false },
  { feature: 'Scalability Planning', omnix: true, agency: true, freelancer: false, other: false },
  { feature: 'Fixed-Price Option', omnix: true, agency: false, freelancer: true, other: false },
  { feature: 'Source Code Ownership', omnix: true, agency: true, freelancer: true, other: false },
  { feature: 'Performance Guarantee', omnix: true, agency: false, freelancer: false, other: false },
]

export default function ComparisonTable() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">The Difference</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose Omnix Lab
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            See how we compare to traditional agencies and freelancers
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-5 text-sm font-bold text-gray-900">Feature</th>
                  <th className="p-5 text-center text-sm font-bold bg-indigo-50">
                    <span className="text-indigo-600">Omnix Lab</span>
                  </th>
                  <th className="p-5 text-center text-sm font-bold text-gray-600">Agency</th>
                  <th className="p-5 text-center text-sm font-bold text-gray-600">Freelancer</th>
                  <th className="p-5 text-center text-sm font-bold text-gray-600">Other</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-5 text-sm text-gray-700 font-medium">{row.feature}</td>
                    <td className="p-5 text-center bg-indigo-50/50">
                      {row.omnix ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full text-sm font-bold">✓</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {row.agency ? (
                        <span className="text-green-500 font-bold">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {row.freelancer ? (
                        <span className="text-green-500 font-bold">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {row.other ? (
                        <span className="text-green-500 font-bold">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Start Working With Us →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
