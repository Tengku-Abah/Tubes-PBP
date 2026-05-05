const DEFAULT_AVATAR_URL = '/default-avatar.svg'

export const STORAGE_ROUTE_PREFIX = '/api/storage'

export const normalizeStoredFilePath = (value?: string | null) => {
  if (!value) {
    return ''
  }

  let normalized = String(value).trim()

  if (!normalized) {
    return ''
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  normalized = normalized.split('?')[0]
  normalized = normalized.replace(/\\/g, '/')
  normalized = normalized.replace(/^\/+/, '')
  normalized = normalized.replace(/^product-images\/+/i, '')
  normalized = normalized.replace(/^public\/+/i, '')
  normalized = normalized.replace(/^uploads\/+/i, '')
  normalized = normalized.replace(/^api\/storage\/+/i, '')

  return normalized
}

export const buildStorageUrl = (value?: string | null) => {
  const normalized = normalizeStoredFilePath(value)

  if (!normalized) {
    return ''
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  const encodedPath = normalized
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${STORAGE_ROUTE_PREFIX}/${encodedPath}`
}

export const resolveStoredAssetUrl = (value?: string | null, fallbackUrl: string = DEFAULT_AVATAR_URL) => {
  if (!value) {
    return fallbackUrl
  }

  const trimmed = String(value).trim()

  if (!trimmed) {
    return fallbackUrl
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith(STORAGE_ROUTE_PREFIX) || trimmed.startsWith('/')) {
    return trimmed
  }

  return buildStorageUrl(trimmed) || fallbackUrl
}

export const getDefaultAvatarUrl = () => DEFAULT_AVATAR_URL
