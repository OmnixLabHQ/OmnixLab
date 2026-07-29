import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const metadata = {
  title: 'Blog | Omnix Lab - Development Insights & Tech Trends',
  description: 'Expert insights on web development, trading bots, AI, and technology trends from Omnix Lab.',
}

export default function BlogPage() {
  const posts = getAllPosts()

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
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
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
                  <span className="text-indigo-600 font-medium text-sm group-hover:underline">Read More</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}