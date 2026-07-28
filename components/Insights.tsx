'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const articles = [
  {
    title: 'Why Every Business Needs a Trading Bot in 2026',
    excerpt: 'Discover how algorithmic trading is leveling the playing field for businesses of all sizes...',
    category: 'Trading',
    date: 'Jul 15, 2026',
    readTime: '5 min read',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    title: 'The Ultimate Guide to Modern Web Development',
    excerpt: 'Learn about the latest frameworks, tools, and best practices for building scalable web applications...',
    category: 'Development',
    date: 'Jul 10, 2026',
    readTime: '8 min read',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    title: 'AI Integration: Transforming Business Operations',
    excerpt: 'How artificial intelligence is revolutionizing customer service, analytics, and automation...',
    category: 'AI',
    date: 'Jul 5, 2026',
    readTime: '6 min read',
    gradient: 'from-purple-500 to-pink-600'
  }
]

export default function Insights() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Insights</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Latest From Omnix Lab
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Thoughts, insights, and expertise from our development team
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className={`h-48 bg-gradient-to-br ${article.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-5 left-5 w-20 h-20 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-5 right-5 w-32 h-32 border-2 border-white rounded-full"></div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {article.excerpt}
                </p>
                <span className="text-indigo-600 font-medium text-sm group-hover:underline">
                  Read More →
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}