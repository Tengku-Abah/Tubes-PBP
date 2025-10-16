import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabase as supabaseBrowserClient } from './supabaseClient'

// Optional service key for admin operations (server-side only)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Share the lightweight browser client for general use
export const supabase = supabaseBrowserClient

// Create admin Supabase client for bypassing RLS
export const supabaseAdmin = supabaseServiceKey
  ? createClient(SUPABASE_URL, supabaseServiceKey, {
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
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          product_name: string
          quantity: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          product_name: string
          quantity: number
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          product_name?: string
          quantity?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: number
          product_id: number | null
          user_id: string | null
          user_name: string
          user_avatar: string | null
          rating: number | null
          comment: string | null
          verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          product_id?: number | null
          user_id?: string | null
          user_name: string
          user_avatar?: string | null
          rating?: number | null
          comment?: string | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          product_id?: number | null
          user_id?: string | null
          user_name?: string
          user_avatar?: string | null
          rating?: number | null
          comment?: string | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          password: string
          name: string
          role: 'admin' | 'user'
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
          role?: 'admin' | 'user'
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
          role?: 'admin' | 'user'
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
export const supabaseTyped = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

// Type definitions for API responses
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

// Extended Product type for API responses (includes 'reviews' alias for 'reviews_count')
export interface ProductWithReviews extends Product {
  reviews?: number
}

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

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  stats?: any
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
  async getReviews(params?: {
    productId?: number;
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    rating?: number;
    verified?: boolean;
  }) {
    try {
      let query = supabase
        .from('reviews')
        .select('*');

      // Apply filters
      if (params?.productId) {
        query = query.eq('product_id', params.productId);
      }

      if (params?.userId) {
        query = query.eq('user_id', params.userId);
      }

      if (params?.rating) {
        query = query.eq('rating', params.rating);
      }

      if (params?.verified !== undefined) {
        query = query.eq('verified', params.verified);
      }

      // Apply sorting
      const sortBy = params?.sortBy || 'created_at';
      const sortOrder = params?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (params?.page && params?.limit) {
        const startIndex = (params.page - 1) * params.limit;
        const endIndex = startIndex + params.limit - 1;
        query = query.range(startIndex, endIndex);
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

  async updateReview(reviewId: number, updateData: ReviewUpdate) {
    try {
      return await supabase
        .from('reviews')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteReview(reviewId: number) {
    try {
      return await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async getReviewById(reviewId: number) {
    try {
      return await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async getUserReviewForProduct(userId: string, productId: number) {
    try {
      return await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
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

  async getAllUsers() {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateUser(userId: string, updateData: UserUpdate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteUser(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
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
  async getOrders(filters?: { status?: string; customerEmail?: string; limit?: number; page?: number }) {
    try {
      const buildQuery = (includeAvatar: boolean) => {
        const userFields = includeAvatar ? 'id,\n              name,\n              email,\n              user_avatar' : 'id,\n              name,\n              email';

        let q;
        if (filters?.customerEmail) {
          q = supabase
            .from('orders')
            .select(`
              *,
              users!inner (
                ${userFields}
              ),
              order_items (
                id,
                product_id,
                product_name,
                quantity,
                price
              )
            `)
            .eq('users.email', filters.customerEmail);
        } else {
          q = supabase
            .from('orders')
            .select(`
              *,
              users (
                ${userFields}
              ),
              order_items (
                id,
                product_id,
                product_name,
                quantity,
                price
              )
            `);
        }

        if (filters?.status) {
          q = q.eq('status', filters.status);
        }
        if (filters?.limit) {
          q = q.limit(filters.limit);
        }
        if (filters?.page && filters?.limit) {
          const offset = (filters.page - 1) * filters.limit;
          q = q.range(offset, offset + filters.limit - 1);
        }
        return q;
      };

      // First attempt: include avatar
      let query = buildQuery(true);
      let { data, error } = await query.order('created_at', { ascending: false });

      // Fallback: if column does not exist, retry without avatar
      const msg = error?.message || '';
      if (msg.includes('does not exist') && msg.includes('user_avatar')) {
        query = buildQuery(false);
        const retry = await query.order('created_at', { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      return { data, error: error?.message || null };
    } catch (error) {
      console.error('Get orders error:', error);
      return { data: null, error: (error as Error).message };
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
  }, items?: { productId: number; productName: string; quantity: number; price: number }[]) {
    try {
      // Create the order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return { data: null, error: orderError.message };
      }

      // If items are provided, create order items
      if (items && items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Order items creation error:', itemsError);
          // Rollback: delete the created order
          await supabase.from('orders').delete().eq('id', order.id);
          return { data: null, error: itemsError.message };
        }
      }

      return { data: order, error: null };
    } catch (error) {
      console.error('Create order error:', error);
      return { data: null, error: (error as Error).message };
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
      const client = supabaseAdmin || supabase;

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        return { data: null, error };
      }

      // Get public URL
      const { data: urlData } = client.storage
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
      const client = supabaseAdmin || supabase;

      const { error } = await client.storage
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
  },

  // Product stock management
  async updateProductStock(productId: number, quantityToReduce: number) {
    try {
      // First, get current stock
      const { data: product, error: getError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (getError || !product) {
        return { data: null, error: getError || new Error('Product not found') };
      }

      const newStock = product.stock - quantityToReduce;

      // Prevent negative stock
      if (newStock < 0) {
        return { data: null, error: new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantityToReduce}`) };
      }

      // Update the stock
      return await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)
        .select()
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  async reduceMultipleProductsStock(items: { productId: number; quantity: number }[]) {
    try {
      const results = [];

      for (const item of items) {
        const result = await this.updateProductStock(item.productId, item.quantity);
        if (result.error) {
          // If any product fails, we should ideally rollback previous updates
          // For now, we'll return the error
          return { data: null, error: result.error };
        }
        results.push(result.data);
      }

      return { data: results, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

