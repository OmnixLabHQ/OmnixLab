import { getAllPosts } from '@/lib/blog'
import { BlogClient } from './BlogClient'
import autoPosts from '@/lib/auto-posts.json'

export const revalidate = 60

export const metadata = {
  title: 'Blog | Omnix Lab - Development Insights & Tech Trends',
  description: 'Expert insights on web development, trading bots, AI, and technology trends from Omnix Lab.',
}

export default function BlogPage() {
  const manualPosts = getAllPosts()
  const allPosts = [...autoPosts, ...manualPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return <BlogClient posts={allPosts} />
}