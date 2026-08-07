import { NextResponse } from 'next/server'
import { generatePostForDate } from '@/lib/post-generator'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const post = generatePostForDate(today)
    
    const postsFile = path.join(process.cwd(), 'lib', 'auto-posts.json')
    let existingPosts: any[] = []
    
    try {
      const raw = fs.readFileSync(postsFile, 'utf-8')
      existingPosts = JSON.parse(raw)
    } catch (e) {
      existingPosts = []
    }
    
    const exists = existingPosts.find((p: any) => p.date === today)
    if (!exists) {
      existingPosts.unshift({
        slug: post.slug,
        title: post.title,
        excerpt: post.body.substring(0, 150) + '...',
        content: post.body,
        category: post.category,
        date: post.date,
        readTime: post.readTime,
        author: 'Akomolafe Nathaniel',
        image: post.image,
      })
      
      fs.writeFileSync(postsFile, JSON.stringify(existingPosts, null, 2))
    }

    return NextResponse.json({
      success: true,
      post: { title: post.title, slug: post.slug, date: post.date },
      totalAutoPosts: existingPosts.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}