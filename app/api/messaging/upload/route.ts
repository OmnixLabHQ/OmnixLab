import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file || !uploadedBy) {
      return NextResponse.json({ success: false, error: 'Missing file or user' }, { status: 400 })
    }

    const fileName = `message-${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let uploadResult = await supabaseAdmin.storage
      .from('message-attachments')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      })

    if (uploadResult.error) {
      await supabaseAdmin.storage.createBucket('message-attachments', { public: true })
      uploadResult = await supabaseAdmin.storage
        .from('message-attachments')
        .upload(fileName, buffer, {
          contentType: file.type || 'application/octet-stream',
        })
    }

    if (uploadResult.error) {
      return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('message-attachments')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      fileUrl: urlData?.publicUrl || '',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}