import { getAllPosts } from '@/lib/blog'
import { BlogClient } from './BlogClient'

export const revalidate = 60

export const metadata = {
  title: 'Blog | Omnix Lab - Development Insights & Tech Trends',
  description: 'Expert insights on web development, trading bots, AI, and technology trends from Omnix Lab.',
}

export default function BlogPage() {
  const manualPosts = getAllPosts()
  
  // Try to load auto posts, but don't crash if file is missing or invalid
  let autoPosts: any[] = []
  try {
    const data = require('@/lib/auto-posts.json')
    autoPosts = Array.isArray(data) ? data : []
  } catch (e) {
    autoPosts = []
  }

  const allPosts = [...autoPosts, ...manualPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return <BlogClient posts={allPosts} />
}