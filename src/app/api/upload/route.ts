import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '../../../lib/supabase'

// Storage bucket name
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

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

    // Upload file using helper function
    const { data, error } = await dbHelpers.uploadFile(file, folder)

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { success: false, error: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: data?.url,
      path: data?.path,
      fileName: data?.fileName
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

    // Delete file using helper function
    const { data, error } = await dbHelpers.deleteFile(filePath)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { success: false, error: error },
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
