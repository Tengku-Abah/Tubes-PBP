import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create Supabase client with fallback
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create admin Supabase client for bypassing RLS
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : supabase

// Database types
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
          reviews_count: number
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
          reviews_count?: number
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
          reviews_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: number
          user_id: string
          product_id: number
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          product_id: number
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          product_id?: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          user_id: string
          order_number: string
          total_amount: number
          status: string
          shipping_address: string
          payment_method: string
          payment_status?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          order_number: string
          total_amount: number
          status: string
          shipping_address: string
          payment_method: string
          payment_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          order_number?: string
          total_amount?: number
          status?: string
          shipping_address?: string
          payment_method?: string
          payment_status?: string
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
          phone?: string
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
          phone?: string
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
          phone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
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

// Type definitions for API responses
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type CartItemInsert = Database['public']['Tables']['cart_items']['Insert']
export type CartItemUpdate = Database['public']['Tables']['cart_items']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Product filters type
export interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

// Helper functions untuk database operations
export const dbHelpers = {
  // Products
  async getProducts(filters?: ProductFilters) {
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      // Pagination
      if (filters?.page && filters?.limit) {
        const startIndex = (filters.page - 1) * filters.limit;
        const endIndex = startIndex + filters.limit;
        query = query.range(startIndex, endIndex - 1);
      }

      return await query;
    } catch (error) {
      return { data: null, error, count: 0 };
    }
  },

  async getProductById(id: number) {
    try {
      return await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  // Reviews
  async getReviews(productId?: number) {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      return await query;
    } catch (error) {
      return { data: null, error };
    }
  },

  async addReview(review: ReviewInsert) {
    try {
      return await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  // Users
  async registerUser(userData: UserInsert) {
    try {
      return await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async getUserByEmail(email: string) {
    try {
      return await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  // Cart operations
  async getCartItems(userId: string) {
    try {
      return await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image,
            stock
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    } catch (error) {
      return { data: null, error };
    }
  },

  async addToCart(userId: string, productId: number, quantity: number) {
    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update quantity
        return await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
          .select()
          .single();
      } else {
        // Add new item
        return await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id: productId,
            quantity
          })
          .select()
          .single();
      }
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateCartItemQuantity(itemId: number, quantity: number) {
    try {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
      } else {
        // Update quantity
        return await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId)
          .select()
          .single();
      }
    } catch (error) {
      return { data: null, error };
    }
  },

  async removeFromCart(itemId: number) {
    try {
      return await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
    } catch (error) {
      return { data: null, error };
    }
  },

  // Orders operations
  async getOrders(filters?: {
    status?: string;
    customerEmail?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          user_id,
          order_number,
          total_amount,
          status,
          shipping_address,
          payment_method,
          created_at,
          updated_at,
          users(name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.customerEmail) {
        query = query.ilike('users.email', `%${filters.customerEmail}%`);
      }

      // Pagination
      if (filters?.page && filters?.limit) {
        const startIndex = (filters.page - 1) * filters.limit;
        const endIndex = startIndex + filters.limit;
        query = query.range(startIndex, endIndex - 1);
      }

      return await query;
    } catch (error) {
      return { data: null, error };
    }
  },

  async createOrder(orderData: {
    user_id: string;
    order_number: string;
    total_amount: number;
    status: string;
    shipping_address: string;
    payment_method: string;
    notes?: string;
  }) {
    try {
      return await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateOrder(orderId: number, updateData: {
    status?: string;
    payment_status?: string;
  }) {
    try {
      // Pastikan orderId adalah angka
      if (typeof orderId !== 'number') {
        orderId = parseInt(String(orderId), 10);
        if (isNaN(orderId)) {
          throw new Error('Invalid order ID');
        }
      }

      // Filter out fields that don't exist in the database
      const dataToUpdate = {
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.payment_status && { payment_status: updateData.payment_status }),
        updated_at: new Date().toISOString()
      };

      // Log untuk debugging
      console.log('NEW updateOrder - Input parameters:', { orderId, updateData });
      console.log('NEW updateOrder - Filtered data to update:', dataToUpdate);
      console.log('NEW updateOrder - Data to update keys:', Object.keys(dataToUpdate));
      console.log('NEW updateOrder - Data to update values:', Object.values(dataToUpdate));

      // Pertama, cek apakah order ada (tanpa .single())
      const { data: existingOrders, error: checkError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId);

      console.log('NEW updateOrder - Existing order check:', { existingOrders, checkError });

      if (checkError) {
        console.log('NEW updateOrder - Error checking order:', checkError);
        return { data: null, error: checkError };
      }

      if (!existingOrders || existingOrders.length === 0) {
        console.log('NEW updateOrder - Order not found:', orderId);
        return { data: null, error: new Error(`Order with ID ${orderId} not found`) };
      }

      console.log('NEW updateOrder - Using supabaseAdmin:', !!supabaseServiceKey);
      console.log('NEW updateOrder - Service key exists:', supabaseServiceKey ? 'YES' : 'NO');

      // Lakukan update tanpa .single() - bypass RLS untuk admin operations
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('orders')
        .update(dataToUpdate)
        .eq('id', orderId)
        .select('*');

      // Log hasil untuk debugging
      console.log('NEW updateOrder - Update result:', { data: updatedData, error: updateError });

      if (updateError) {
        console.log('NEW updateOrder - Update error:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData || updatedData.length === 0) {
        console.log('NEW updateOrder - No rows updated');
        return { data: null, error: new Error('No rows were updated') };
      }

      console.log('NEW updateOrder - Success, returning:', updatedData[0]);
      // Return the first (and should be only) updated record
      return { data: updatedData[0], error: null };
    } catch (error) {
      console.error('NEW updateOrder - catch error:', error);
      return { data: null, error };
    }
  },

  async deleteOrder(orderId: number) {
    try {
      return await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  // Storage operations
  async uploadFile(file: File, folder: string = 'products') {
    try {
      const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Convert file to buffer
      const fileBuffer = await file.arrayBuffer();

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        return { data: null, error };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        data: {
          url: urlData.publicUrl,
          path: filePath,
          fileName: fileName
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteFile(filePath: string) {
    try {
      const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      return { data: error ? null : { success: true }, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Categories operations
  async getCategories() {
    try {
      return await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
    } catch (error) {
      return { data: null, error };
    }
  },

  async addCategory(categoryData: CategoryInsert) {
    try {
      return await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateCategory(id: number, categoryData: CategoryUpdate) {
    try {
      return await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteCategory(id: number) {
    try {
      return await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
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
