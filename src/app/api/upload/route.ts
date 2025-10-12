import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { dbHelpers, supabaseAdmin } from '../../../lib/supabase'

// Ensure Node.js runtime for filesystem access
export const runtime = 'nodejs'

// Storage bucket name
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Mode: create signed upload URL via JSON body
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      const folder: string = body?.folder || 'avatars'
      const fileExt: string = (body?.fileExt || 'png').toLowerCase()

      const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      if (!allowedExt.includes(fileExt)) {
        return NextResponse.json(
          { success: false, error: 'Ekstensi file tidak diizinkan' },
          { status: 400 }
        )
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const path = `${folder}/${fileName}`

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(path)

      if (error) {
        console.error('createSignedUploadUrl error:', error)
        return NextResponse.json(
          { success: false, error: error.message || 'Gagal membuat signed upload URL' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        path,
        token: (data as any)?.token,
        signedUrl: (data as any)?.signedUrl,
      })
    }

    // Default: handle multipart/form-data upload via server
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'products'

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

    // Try Supabase upload first
    const supa = await dbHelpers.uploadFile(file, folder)

    if (!supa.error && supa.data) {
      return NextResponse.json({
        success: true,
        url: supa.data.url,
        path: supa.data.path,
        fileName: supa.data.fileName
      })
    }

    // Fallback: save file locally to /public/uploads when Supabase is unreachable
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(uploadsDir, { recursive: true })
      const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const absPath = path.join(uploadsDir, fileName)
      const relPath = `uploads/${fileName}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(absPath, buffer)

      return NextResponse.json({
        success: true,
        url: `/${relPath}`,
        path: relPath,
        fileName
      })
    } catch (fallbackErr) {
      console.error('Local upload fallback error:', fallbackErr)
      return NextResponse.json(
        { success: false, error: 'Failed to upload file (Supabase + local fallback failed)' },
        { status: 500 }
      )
    }

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

    // If local file under /public/uploads, delete from filesystem
    if (filePath.startsWith('/uploads/') || filePath.startsWith('uploads/')) {
      const abs = path.join(process.cwd(), 'public', filePath.replace(/^\//, ''))
      try {
        await fs.unlink(abs)
        return NextResponse.json({ success: true, message: 'File deleted successfully' })
      } catch (err: any) {
        if (err?.code === 'ENOENT') {
          // File already gone
          return NextResponse.json({ success: true, message: 'File not found, considered deleted' })
        }
        console.error('Local delete error:', err)
        return NextResponse.json({ success: false, error: 'Failed to delete local file' }, { status: 500 })
      }
    }

    // Otherwise, delete via Supabase Storage
    const { data, error } = await dbHelpers.deleteFile(filePath)
    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { success: false, error: error },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, message: 'File deleted successfully' })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
