import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for server-side operations
const supabaseUrl = 'https://ieuvqzaywgsifrfgagld.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldXZxemF5d2dzaWZyZmdhZ2xkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2ODY3NSwiZXhwIjoyMDc0NDQ0Njc1fQ.Gni2eIu7uojWhtFNU6osyAqivSbcb5fGwaDAhoK1yLs'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Storage bucket name
const BUCKET_NAME = 'product-images'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// Maximum file size (10MB)
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

        // Validate URL format
        try {
            new URL(imageUrl)
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid URL format' },
                { status: 400 }
            )
        }

        console.log('Downloading image from URL:', imageUrl)

        // Download image from URL
        const response = await fetch(imageUrl)

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: `Failed to download image: ${response.statusText}` },
                { status: 400 }
            )
        }

        // Check content type
        const contentType = response.headers.get('content-type')
        if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid image type. Please provide JPEG, PNG, WebP, or GIF images.' },
                { status: 400 }
            )
        }

        // Get image data
        const imageBuffer = await response.arrayBuffer()

        // Check file size
        if (imageBuffer.byteLength > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: 'Image too large. Maximum size is 10MB.' },
                { status: 400 }
            )
        }

        // Generate unique filename - sama seperti upload file biasa
        const urlParts = imageUrl.split('.')
        const fileExt = urlParts[urlParts.length - 1] || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        console.log('Uploading to Supabase Storage:', filePath)

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, imageBuffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: contentType
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

        console.log('Image uploaded successfully:', urlData.publicUrl)

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: filePath,
            fileName: fileName,
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
