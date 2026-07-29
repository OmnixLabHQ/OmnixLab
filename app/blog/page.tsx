'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getAllPosts, BlogPost } from '@/lib/blog'
import { motion, AnimatePresence } from 'framer-motion'

export default function BlogPage() {
  const posts = getAllPosts()
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Blog</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Insights & Articles</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Expert insights on development, trading bots, AI, and technology trends
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.slug}
              onClick={() => setSelectedPost(post)}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <span className="text-6xl">{post.image}</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{post.date}</span>
                  <span className="text-indigo-600 font-medium text-sm group-hover:underline">
                    Read More
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Close button */}
              <div className="sticky top-0 bg-white rounded-t-3xl p-4 flex justify-end border-b border-gray-100">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="p-6 md:p-8">
                {/* Category & Meta */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                    {selectedPost.category}
                  </span>
                  <span className="text-sm text-gray-400">{selectedPost.date}</span>
                  <span className="text-sm text-gray-400">{selectedPost.readTime}</span>
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {selectedPost.title}
                </h2>

                {/* Author */}
                <div className="flex items-center gap-3 pb-6 mb-6 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    AN
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedPost.author}</p>
                    <p className="text-xs text-gray-500">Founder, Omnix Lab</p>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                  {selectedPost.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-gray-700 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white text-center">
                  <h3 className="text-lg font-bold mb-2">Ready to start your project?</h3>
                  <p className="text-indigo-100 text-sm mb-4">Let us discuss how we can help your business grow.</p>
                  <Link
                    href="/contact"
                    className="inline-flex px-6 py-2.5 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors text-sm"
                  >
                    Get in Touch →
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}