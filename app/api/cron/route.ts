import { NextResponse } from 'next/server'
import { generatePostForDate } from '@/lib/post-generator'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const post = generatePostForDate(today)

    const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        slug: post.slug,
        title: post.title,
        excerpt: post.body.substring(0, 150) + '...',
        content: post.body,
        category: post.category,
        date: post.date,
        read_time: post.readTime,
        author: 'Akomolafe Nathaniel',
        image: post.image,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ success: false, error: errorText })
    }

    return NextResponse.json({
      success: true,
      post: { title: post.title, slug: post.slug, date: post.date },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}
