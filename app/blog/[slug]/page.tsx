import { getPostBySlug, getAllPosts } from '@/lib/blog'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found' }
  
  return {
    title: `${post.title} | Omnix Lab Blog`,
    description: post.excerpt,
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-8 inline-block">
          ← Back to Blog
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
              {post.category}
            </span>
            <span className="text-sm text-gray-400">{post.date}</span>
            <span className="text-sm text-gray-400">{post.readTime}</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-3 pb-8 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              AN
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{post.author}</p>
              <p className="text-xs text-gray-500">Founder, Omnix Lab</p>
            </div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none">
          {post.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Ready to start your project?</h3>
          <p className="text-indigo-100 mb-6">Let us discuss how we can help your business grow.</p>
          <Link
            href="/contact"
            className="inline-flex px-8 py-3 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            Get in Touch →
          </Link>
        </div>
      </article>
    </div>
  )
}