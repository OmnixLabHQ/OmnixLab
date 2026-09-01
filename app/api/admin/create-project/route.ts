import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const formData = await request.formData()
  const clientId = formData.get('client_id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { error } = await supabase.from('projects').insert({
    client_id: clientId,
    name,
    description,
    status: 'planning'
  })

  if (error) {
    return NextResponse.redirect(new URL('/admin/projects?error=1', request.url))
  }

  return NextResponse.redirect(new URL('/admin/projects?success=1', request.url))
}
