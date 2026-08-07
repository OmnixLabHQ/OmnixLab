import { NextResponse } from 'next/server'
import { generatePostForDate } from '@/lib/post-generator'
import { updateWebsiteBlog } from '@/lib/seo-bot'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const post = generatePostForDate(today)
    const blogUpdated = updateWebsiteBlog(post)

    return NextResponse.json({
      success: true,
      post: {
        title: post.title,
        category: post.category,
        slug: post.slug,
        date: post.date,
      },
      blogUpdated,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}