'use client'

import { motion } from 'framer-motion'

const reviews = [
  {
    name: 'Michael Chen',
    role: 'CEO, FinEdge Capital',
    text: 'Omnix Lab delivered our trading platform ahead of schedule. The bot has been running flawlessly for 6 months.',
    rating: 5,
    platform: 'Google',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Sarah Johnson',
    role: 'Founder, CloudStack Solutions',
    text: 'We needed a complex SaaS dashboard built in 6 weeks. Omnix Lab delivered in 5. Exceptional quality.',
    rating: 5,
    platform: 'Google',
    color: 'from-green-500 to-green-600',
  },
  {
    name: 'David Okafor',
    role: 'CTO, DataVault Systems',
    text: 'After working with 3 agencies, we found Omnix Lab. Enterprise-level quality with startup agility.',
    rating: 5,
    platform: 'Google',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Amina Yusuf',
    role: 'CEO, NexGen Trading',
    text: 'Our crypto trading bot generates consistent returns. Best investment we made this year. Highly recommended.',
    rating: 5,
    platform: 'Google',
    color: 'from-green-500 to-green-600',
  },
  {
    name: 'James Okonkwo',
    role: 'Founder, TechBridge Solutions',
    text: 'Professional, responsive, and technically brilliant. Omnix Lab is our go-to development partner.',
    rating: 5,
    platform: 'Google',
    color: 'from-blue-500 to-blue-600',
  },
]

export default function SocialProof() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Social Proof</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            What Our <span className="text-indigo-600">Clients Say</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Verified reviews from real clients on Google and Trustpilot
          </p>
        </motion.div>

        {/* Platform Badges Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 mb-16"
        >
          {/* Google Badge */}
          <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-900">4.9 Rating on Google</p>
                <p className="text-xs text-gray-500">30+ Verified Reviews</p>
              </div>
            </div>
          </div>

          {/* Trustpilot Badge */}
          <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00B67A"/>
              </svg>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-900">4.8 Rating on Trustpilot</p>
                <p className="text-xs text-gray-500">Verified Company</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all"
            >
              {/* Platform Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${review.color} text-white text-xs font-bold`}>
                  {review.platform}
                </div>
                <div className="flex gap-0.5">
                  {[...Array(review.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          <a
            href="https://www.google.com/search?q=Omnix+Lab+reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="white"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/>
            </svg>
            See Google Reviews
          </a>
          <a
            href="https://www.trustpilot.com/evaluate/omnixlab-production.up.railway.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            <span>⭐</span>
            Leave a Trustpilot Review
          </a>
        </motion.div>

      </div>
    </section>
  )
}