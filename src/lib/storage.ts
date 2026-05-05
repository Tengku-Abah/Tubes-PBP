import { supabase } from './supabase'

// Storage bucket name
const BUCKET_NAME = 'product-images'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

/**
 * Upload file ke Supabase Storage
 */
export const uploadFile = async (
  file: File,
  folder: string = 'products'
): Promise<UploadResult> => {
  try {
    // Validasi file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'File type not allowed. Please upload JPEG, PNG, WebP, or GIF files.'
      }
    }

    // Validasi file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'Failed to upload file'
    }
  }
}

/**
 * Delete file dari Supabase Storage
 */
export const deleteFile = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: 'Failed to delete file'
    }
  }
}

/**
 * Get public URL dari file path
 */
export const getPublicUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

/**
 * List files dalam folder
 */
export const listFiles = async (folder: string = 'products') => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit: 100,
        offset: 0
      })

    if (error) {
      console.error('List files error:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }

  } catch (error) {
    console.error('List files error:', error)
    return { success: false, error: 'Failed to list files', data: [] }
  }
}

/**
 * Resize image sebelum upload (optional)
 */
export const resizeImage = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and resize
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Format file size untuk display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
