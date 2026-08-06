import { NextResponse } from 'next/server'
import { generatePost, updateWebsiteBlog } from '@/lib/seo-bot'

export async function GET() {
  try {
    const post = generatePost()
    const blogUpdated = updateWebsiteBlog(post)
    
    return NextResponse.json({ 
      success: true, 
      post: {
        title: post.title,
        category: post.category,
        slug: post.slug,
      },
      blogUpdated 
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}