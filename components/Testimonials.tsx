'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const testimonials = [
  {
    name: 'Michael Chen',
    role: 'CEO, FinEdge Capital',
    quote: 'Omnix Lab delivered our trading platform ahead of schedule. The bot has been running flawlessly for 6 months, generating consistent returns. Truly world-class development.',
    rating: 5,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Sarah Johnson',
    role: 'Founder, CloudStack Solutions',
    quote: 'We needed a complex SaaS dashboard built in 6 weeks. Omnix Lab delivered in 5. The attention to detail and communication throughout was exceptional.',
    rating: 5,
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    name: 'David Okafor',
    role: 'CTO, DataVault Systems',
    quote: 'After working with 3 different agencies, we finally found Omnix Lab. They understand enterprise requirements and deliver production-ready code. Highly recommended.',
    rating: 5,
    gradient: 'from-emerald-500 to-teal-600',
  },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            What our <span className="text-indigo-600">clients say</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Don&apos;t take our word for it — hear from the businesses we&apos;ve helped
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -8 }}
              className={`bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 ${active === i ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(item.rating)].map((_, j) => (
                  <span key={j} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 leading-relaxed mb-6 text-sm italic">
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                active === i ? 'w-8 bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}