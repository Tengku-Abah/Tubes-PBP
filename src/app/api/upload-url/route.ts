import { NextRequest, NextResponse } from 'next/server'

import { saveRemoteImage } from '@/lib/local-storage'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, folder = 'products' } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image URL provided' },
        { status: 400 }
      )
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(imageUrl)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const response = await fetch(parsedUrl)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to download image: ${response.statusText}` },
        { status: 400 }
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image type. Please provide JPEG, PNG, WebP, or GIF images.' },
        { status: 400 }
      )
    }

    const imageBuffer = await response.arrayBuffer()

    if (imageBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const stored = await saveRemoteImage(imageUrl, String(folder))

    return NextResponse.json({
      success: true,
      url: stored.url,
      path: stored.path,
      fileName: stored.fileName,
      originalUrl: imageUrl
    })
  } catch (error) {
    console.error('URL upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process image URL' },
      { status: 500 }
    )
  }
}
