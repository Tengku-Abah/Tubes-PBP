export const checkSupabaseConnection = async () => {
  try {
    const response = await fetch('/api/product?limit=1', { cache: 'no-store' })
    const result = await response.json()

    if (!response.ok || !result?.success) {
      return { connected: false, error: result?.message || 'Backend connection failed' }
    }

    return { connected: true, error: null }
  } catch (error) {
    console.warn('Backend connection test failed:', error)
    return { connected: false, error: 'Connection test failed' }
  }
}
