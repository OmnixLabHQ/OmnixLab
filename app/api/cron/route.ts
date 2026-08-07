import { NextResponse } from 'next/server'
import { generatePostForDate } from '@/lib/post-generator'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const post = generatePostForDate(today)

    // Check if today's post already exists
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('date', today)
      .limit(1)

    if (!existing || existing.length === 0) {
      // Insert new post
      const { error } = await supabase.from('blog_posts').insert({
        slug: post.slug,
        title: post.title,
        excerpt: post.body.substring(0, 150) + '...',
        content: post.body,
        category: post.category,
        date: post.date,
        read_time: post.readTime,
        author: 'Akomolafe Nathaniel',
        image: post.image,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      post: { title: post.title, slug: post.slug, date: post.date },
      saved: !existing || existing.length === 0,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}