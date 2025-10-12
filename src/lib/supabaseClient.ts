import { createClient } from '@supabase/supabase-js'

// Browser-friendly Supabase client without the heavy db helper bundle
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables for client usage')
}

export const supabaseBrowserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Re-export with the conventional name so existing imports can stay concise
export { supabaseBrowserClient as supabase }

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabaseBrowserClient.from('products').select('count').limit(1)

    if (error) {
      console.warn('Supabase connection failed:', error.message)
      return { connected: false, error: error.message }
    }

    return { connected: true, error: null }
  } catch (error) {
    console.warn('Supabase connection test failed:', error)
    return { connected: false, error: 'Connection test failed' }
  }
}
