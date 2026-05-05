import { promises as fs } from 'fs'
import path from 'path'

import { buildStorageUrl, normalizeStoredFilePath } from './storage-path'

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_ROOT || 'product-images')

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

const ensureWithinRoot = (absolutePath: string) => {
  const relative = path.relative(STORAGE_ROOT, absolutePath)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid storage path')
  }
}

export const resolveStoredAbsolutePath = (storedPath: string) => {
  const normalized = normalizeStoredFilePath(storedPath)
  const absolutePath = path.resolve(STORAGE_ROOT, normalized)
  ensureWithinRoot(absolutePath)
  return absolutePath
}

export const ensureStorageDirectory = async (folder: string) => {
  const absoluteFolder = resolveStoredAbsolutePath(folder)
  await fs.mkdir(absoluteFolder, { recursive: true })
  return absoluteFolder
}

const getExtensionFromContentType = (contentType?: string | null) => {
  switch ((contentType || '').toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/svg+xml':
      return 'svg'
    default:
      return null
  }
}

const sanitizeFolder = (folder: string) => {
  return normalizeStoredFilePath(folder || 'products') || 'products'
}

export const saveUploadedFile = async (file: File, folder: string = 'products') => {
  const targetFolder = sanitizeFolder(folder)
  await ensureStorageDirectory(targetFolder)

  const originalExtension = path.extname(file.name || '').replace('.', '').toLowerCase()
  const generatedExtension = originalExtension || getExtensionFromContentType(file.type) || 'bin'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${generatedExtension}`
  const storedPath = `${targetFolder}/${fileName}`
  const absolutePath = resolveStoredAbsolutePath(storedPath)
  const buffer = Buffer.from(await file.arrayBuffer())

  await fs.writeFile(absolutePath, buffer)

  return {
    path: storedPath,
    fileName,
    url: buildStorageUrl(storedPath),
  }
}

export const deleteStoredFile = async (storedPath: string) => {
  const absolutePath = resolveStoredAbsolutePath(storedPath)

  try {
    await fs.unlink(absolutePath)
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }
}

export const readStoredFile = async (segments: string[]) => {
  const normalized = segments
    .map((segment) => decodeURIComponent(segment))
    .join('/')

  const absolutePath = resolveStoredAbsolutePath(normalized)
  const content = await fs.readFile(absolutePath)
  const ext = path.extname(absolutePath).toLowerCase()

  return {
    content,
    absolutePath,
    contentType: MIME_TYPES[ext] || 'application/octet-stream',
    fileName: path.basename(absolutePath),
  }
}

export const saveRemoteImage = async (imageUrl: string, folder: string = 'products') => {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || ''
  const extension =
    getExtensionFromContentType(contentType) ||
    path.extname(new URL(imageUrl).pathname).replace('.', '').toLowerCase() ||
    'jpg'

  const targetFolder = sanitizeFolder(folder)
  await ensureStorageDirectory(targetFolder)

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const storedPath = `${targetFolder}/${fileName}`
  const absolutePath = resolveStoredAbsolutePath(storedPath)
  const buffer = Buffer.from(await response.arrayBuffer())

  await fs.writeFile(absolutePath, buffer)

  return {
    path: storedPath,
    fileName,
    url: buildStorageUrl(storedPath),
    contentType,
  }
}
