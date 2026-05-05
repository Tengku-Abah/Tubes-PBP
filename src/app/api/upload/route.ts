import { NextRequest, NextResponse } from 'next/server'

import { deleteStoredFile, saveRemoteImage, saveUploadedFile } from '@/lib/local-storage'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      const folder = String(body?.folder || 'avatars')
      const imageUrl = body?.imageUrl ? String(body.imageUrl) : null

      if (imageUrl) {
        const stored = await saveRemoteImage(imageUrl, folder)
        return NextResponse.json({
          success: true,
          path: stored.path,
          url: stored.url,
          fileName: stored.fileName,
          originalUrl: imageUrl
        })
      }

      return NextResponse.json({
        success: true,
        folder,
        message: 'Gunakan multipart/form-data untuk upload file lokal'
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = String(formData.get('folder') || 'products')

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed. Please upload JPEG, PNG, WebP, or GIF files.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const stored = await saveUploadedFile(file, folder)

    return NextResponse.json({
      success: true,
      url: stored.url,
      path: stored.path,
      fileName: stored.fileName
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

    await deleteStoredFile(filePath)
    return NextResponse.json({ success: true, message: 'File deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
