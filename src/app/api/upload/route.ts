import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Storage bucket name
const BUCKET_NAME = 'product-images'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'products'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validasi file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed. Please upload JPEG, PNG, WebP, or GIF files.' },
        { status: 400 }
      )
    }

    // Validasi file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      fileName: fileName
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      )
    }

    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
