import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (akan digunakan nanti ketika connect ke database)
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          price: number
          description: string
          image: string
          category: string
          stock: number
          rating: number
          reviews: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          description: string
          image: string
          category: string
          stock: number
          rating?: number
          reviews?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          description?: string
          image?: string
          category?: string
          stock?: number
          rating?: number
          reviews?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: number
          product_id: number
          user_name: string
          user_avatar: string
          rating: number
          comment: string
          date: string
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          product_id: number
          user_name: string
          user_avatar: string
          rating: number
          comment: string
          date?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          user_name?: string
          user_avatar?: string
          rating?: number
          comment?: string
          date?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          password: string
          name: string
          role: 'admin' | 'pembeli'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          name: string
          role?: 'admin' | 'pembeli'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          name?: string
          role?: 'admin' | 'pembeli'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Typed Supabase client
export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper functions untuk database operations (akan digunakan nanti)
export const dbHelpers = {
  // Products
  async getProducts() {
    // Untuk sekarang return dummy data
    // Nanti akan diganti dengan: return await supabase.from('products').select('*')
    return { data: [], error: null }
  },

  async getProductById(id: number) {
    // Untuk sekarang return dummy data
    // Nanti akan diganti dengan: return await supabase.from('products').select('*').eq('id', id).single()
    return { data: null, error: null }
  },

  // Reviews
  async getReviews(productId?: number) {
    // Untuk sekarang return dummy data
    // Nanti akan diganti dengan query ke database
    return { data: [], error: null }
  },

  async addReview(review: Database['public']['Tables']['reviews']['Insert']) {
    // Untuk sekarang return dummy data
    // Nanti akan diganti dengan: return await supabase.from('reviews').insert(review)
    return { data: null, error: null }
  },

  // Users
  async registerUser(userData: Database['public']['Tables']['users']['Insert']) {
    try {
      // Untuk sekarang return dummy data
      // Nanti akan diganti dengan: return await supabase.from('users').insert(userData)
      return { data: userData, error: null }
    } catch (error) {
      return { data: null, error: error }
    }
  },

  async getUserByEmail(email: string) {
    try {
      // Untuk sekarang return dummy data
      // Nanti akan diganti dengan: return await supabase.from('users').select('*').eq('email', email).single()
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: error }
    }
  }
}

// Connection status checker
export const checkSupabaseConnection = async () => {
  try {
    // Test connection dengan query sederhana
    const { data, error } = await supabase.from('products').select('count').limit(1)
    
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
