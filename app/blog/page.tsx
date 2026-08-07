import { getAllPosts } from '@/lib/blog'
import { BlogClient } from './BlogClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog | Omnix Lab - Development Insights & Tech Trends',
  description: 'Expert insights on web development, trading bots, AI, and technology trends from Omnix Lab.',
}

export default function BlogPage() {
  const posts = getAllPosts()
  return <BlogClient posts={posts} />
}