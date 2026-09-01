'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BlogPost } from '@/lib/blog'
import { motion, AnimatePresence } from 'framer-motion'

interface BlogClientProps {
  posts: BlogPost[]
}

export function BlogClient({ posts }: BlogClientProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  return (
    <div className="bg-gray-950 text-white min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-blue-400 mb-3">Insights</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Insights & Articles</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Expert insights on development, trading bots, AI, and technology trends
          </p>
        </div>

        {/* Blog Grid - Glassmorphic Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.slug}
              onClick={() => setSelectedPost(post)}
              className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Image area */}
              <div className="h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-b border-white/10">
                <span className="text-6xl opacity-60">{post.image}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{post.date}</span>
                  <span className="text-blue-400 font-medium text-sm group-hover:underline">
                    Read More
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup - Dark */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10"
            >
              <div className="sticky top-0 bg-gray-900 rounded-t-3xl p-4 flex justify-end border-b border-white/10">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                    {selectedPost.category}
                  </span>
                  <span className="text-sm text-gray-400">{selectedPost.date}</span>
                  <span className="text-sm text-gray-400">{selectedPost.readTime}</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {selectedPost.title}
                </h2>

                <div className="flex items-center gap-3 pb-6 mb-6 border-b border-white/10">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    AN
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedPost.author}</p>
                    <p className="text-xs text-gray-400">Founder, Omnix Lab</p>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none">
                  {selectedPost.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-gray-300 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white text-center">
                  <h3 className="text-lg font-bold mb-2">Ready to start your project?</h3>
                  <p className="text-indigo-100 text-sm mb-4">Let us discuss how we can help your business grow.</p>
                  <Link
                    href="/contact"
                    className="inline-flex px-6 py-2.5 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-100 transition-colors text-sm"
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
