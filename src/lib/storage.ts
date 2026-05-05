import { buildStorageUrl, resolveStoredAssetUrl } from './storage-path'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

export const uploadFile = async (
  file: File,
  folder: string = 'products'
): Promise<UploadResult> => {
  try {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'File type not allowed. Please upload JPEG, PNG, WebP, or GIF files.'
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok || !result?.success) {
      return {
        success: false,
        error: result?.error || result?.message || 'Failed to upload file'
      }
    }

    return {
      success: true,
      url: result.url,
      path: result.path
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'Failed to upload file'
    }
  }
}

export const deleteFile = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    })
    const result = await response.json()

    if (!response.ok || !result?.success) {
      return {
        success: false,
        error: result?.error || 'Failed to delete file'
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

export const getPublicUrl = (filePath: string): string => {
  return buildStorageUrl(filePath)
}

export const listFiles = async (folder: string = 'products') => {
  return { success: true, data: [], folder }
}

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
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      ctx?.drawImage(img, 0, 0, width, height)

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

export const resolvePublicAssetUrl = (filePath?: string | null) => {
  return resolveStoredAssetUrl(filePath, '')
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
