import { BlogClient } from './BlogClient'
import { getAllPosts } from '@/lib/blog'
import { unstable_noStore as noStore } from 'next/cache'

export const metadata = {
  title: 'Blog | Omnix Lab - Development Insights & Tech Trends',
  description: 'Expert insights on web development, trading bots, AI, and technology trends from Omnix Lab.',
}

export default function BlogPage() {
  noStore()
  const posts = getAllPosts()
  return <BlogClient posts={posts} />
}