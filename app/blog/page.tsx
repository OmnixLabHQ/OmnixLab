import { BlogClient } from './BlogClient'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog | Omnix Lab - Development Insights & Tech Trends',
  description: 'Expert insights on web development, trading bots, AI, and technology trends from Omnix Lab.',
}

export default async function BlogPage() {
  const { data: autoPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .order('date', { ascending: false })

  const { getAllPosts } = await import('@/lib/blog')
  const manualPosts = getAllPosts()

  const allPosts = [...(autoPosts || []), ...manualPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return <BlogClient posts={allPosts} />
}
