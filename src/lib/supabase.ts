import { deleteStoredFile, saveUploadedFile } from './local-storage'
import {
  hasColumn,
  mapAppRoleToDbRole,
  mapDbRoleToAppRole,
  nowIso,
  query,
  toNumber,
  withTransaction,
} from './db'
import { resolveStoredAssetUrl } from './storage-path'

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
          description?: string
          image?: string
          category?: string
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
          quantity?: number
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
          payment_status?: string | null
          notes?: string | null
          shipping_date?: string | null
          delivery_date?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          order_number: string
          total_amount: number
          status?: string
          shipping_address?: string
          payment_method?: string
          payment_status?: string | null
          notes?: string | null
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
          payment_status?: string | null
          notes?: string | null
          shipping_date?: string | null
          delivery_date?: string | null
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
          order_id?: number | null
          order_item_id?: number | null
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
          order_id?: number | null
          order_item_id?: number | null
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
          order_id?: number | null
          order_item_id?: number | null
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
          phone?: string | null
          address?: string | null
          user_avatar?: string | null
          Provinsi?: string | null
          Kota?: string | null
          Kode_pose?: string | null
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
          phone?: string | null
          address?: string | null
          user_avatar?: string | null
          Provinsi?: string | null
          Kota?: string | null
          Kode_pose?: string | null
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
          phone?: string | null
          address?: string | null
          user_avatar?: string | null
          Provinsi?: string | null
          Kota?: string | null
          Kode_pose?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          slug?: string | null
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

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

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

export interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

type JoinedOrder = Order & {
  users?: Partial<User> | null
  order_items?: OrderItem[]
}

const mapProductRow = (row: any): Product => ({
  id: Number(row.id),
  name: row.name,
  price: toNumber(row.price),
  description: row.description || '',
  image: row.image || '',
  category: row.category || '',
  stock: Number(row.stock || 0),
  rating: toNumber(row.rating),
  reviews_count: Number(row.reviews_count || 0),
  created_at: row.created_at?.toISOString?.() || row.created_at,
  updated_at: row.updated_at?.toISOString?.() || row.updated_at,
})

const mapUserRow = (row: any): User => ({
  id: String(row.id),
  email: row.email,
  password: row.password,
  name: row.name,
  role: mapDbRoleToAppRole(row.role),
  phone: row.phone ?? null,
  address: row.address ?? null,
  user_avatar: row.user_avatar ?? null,
  Provinsi: row.Provinsi ?? row.provinsi ?? null,
  Kota: row.Kota ?? row.kota ?? null,
  Kode_pose: row.Kode_pose ?? row.kode_pose ?? null,
  is_active: row.is_active !== false,
  created_at: row.created_at?.toISOString?.() || row.created_at,
  updated_at: row.updated_at?.toISOString?.() || row.updated_at,
})

const mapReviewRow = (row: any): Review => ({
  id: Number(row.id),
  product_id: row.product_id == null ? null : Number(row.product_id),
  user_id: row.user_id == null ? null : String(row.user_id),
  user_name: row.user_name,
  user_avatar: row.user_avatar ?? null,
  rating: row.rating == null ? null : Number(row.rating),
  comment: row.comment ?? row.content ?? null,
  verified: row.verified ?? false,
  order_id: row.order_id == null ? null : Number(row.order_id),
  order_item_id: row.order_item_id == null ? null : Number(row.order_item_id),
  created_at: row.created_at?.toISOString?.() || row.created_at || null,
  updated_at: row.updated_at?.toISOString?.() || row.updated_at || null,
})

const mapCartRow = (row: any) => ({
  id: Number(row.id),
  user_id: String(row.user_id),
  product_id: Number(row.product_id),
  quantity: Number(row.quantity),
  created_at: row.created_at?.toISOString?.() || row.created_at,
  updated_at: row.updated_at?.toISOString?.() || row.updated_at,
  products: {
    id: Number(row.product_id),
    name: row.product_name,
    price: toNumber(row.product_price),
    description: row.product_description || '',
    image: row.product_image || '',
    category: row.product_category || '',
    stock: Number(row.product_stock || 0),
    rating: toNumber(row.product_rating),
    reviews_count: Number(row.product_reviews_count || 0),
  },
})

const mapOrderRow = (row: any): Order => ({
  id: Number(row.id),
  user_id: row.user_id == null ? '' : String(row.user_id),
  order_number: row.order_number,
  total_amount: toNumber(row.total_amount),
  status: row.status || 'pending',
  shipping_address: row.shipping_address || '',
  payment_method: row.payment_method || 'cash_on_delivery',
  payment_status: row.payment_status ?? null,
  notes: row.notes ?? null,
  shipping_date: row.shipping_date?.toISOString?.() || row.shipping_date || null,
  delivery_date: row.delivery_date?.toISOString?.() || row.delivery_date || null,
  created_at: row.created_at?.toISOString?.() || row.created_at,
  updated_at: row.updated_at?.toISOString?.() || row.updated_at,
})

const mapOrderItemRow = (row: any): OrderItem => ({
  id: Number(row.id),
  order_id: Number(row.order_id),
  product_id: Number(row.product_id),
  product_name: row.product_name,
  quantity: Number(row.quantity),
  price: toNumber(row.price),
  created_at: row.created_at?.toISOString?.() || row.created_at,
  updated_at: row.updated_at?.toISOString?.() || row.updated_at,
})

const mapCategoryRow = (row: any): Category => ({
  id: Number(row.id),
  name: row.name,
  slug: row.slug ?? null,
  created_at: row.created_at?.toISOString?.() || row.created_at,
  updated_at: row.updated_at?.toISOString?.() || row.updated_at,
})

const buildUpdateClause = (payload: Record<string, any>, columnMap?: Record<string, string>) => {
  const keys = Object.keys(payload).filter((key) => payload[key] !== undefined)
  const values = keys.map((key) => payload[key])
  const assignments = keys.map((key, index) => {
    const columnName = columnMap?.[key] || key
    return `"${columnName}" = $${index + 1}`
  })

  return {
    keys,
    values,
    assignments,
  }
}

const getUserColumns = async () => {
  const candidates = ['id', 'email', 'password', 'name', 'role', 'phone', 'address', 'user_avatar', 'Provinsi', 'Kota', 'Kode_pose', 'is_active', 'created_at', 'updated_at']
  const available = await Promise.all(candidates.map(async (column) => ({ column, exists: await hasColumn('users', column) })))
  return available.filter((item) => item.exists).map((item) => item.column)
}

const getReviewColumns = async () => {
  const candidates = ['id', 'product_id', 'user_id', 'user_name', 'user_avatar', 'rating', 'comment', 'content', 'verified', 'order_id', 'order_item_id', 'created_at', 'updated_at']
  const available = await Promise.all(candidates.map(async (column) => ({ column, exists: await hasColumn('reviews', column) })))
  return available.filter((item) => item.exists).map((item) => item.column)
}

export const getStoredAssetUrl = (value?: string | null, fallback?: string) => {
  return resolveStoredAssetUrl(value, fallback)
}

export const dbHelpers = {
  async getProducts(filters?: ProductFilters) {
    try {
      const conditions: string[] = []
      const values: unknown[] = []

      if (filters?.category) {
        values.push(filters.category)
        conditions.push(`category = $${values.length}`)
      }

      if (filters?.search) {
        values.push(`%${filters.search}%`)
        const index = values.length
        conditions.push(`(name ILIKE $${index} OR description ILIKE $${index} OR category ILIKE $${index})`)
      }

      if (filters?.minPrice !== undefined) {
        values.push(filters.minPrice)
        conditions.push(`price >= $${values.length}`)
      }

      if (filters?.maxPrice !== undefined) {
        values.push(filters.maxPrice)
        conditions.push(`price <= $${values.length}`)
      }

      const whereClause = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''
      const countResult = await query<{ count: string }>(`select count(*)::text as count from products ${whereClause}`, values)
      const totalCount = Number(countResult.rows[0]?.count || 0)

      const page = filters?.page || 1
      const limit = filters?.limit || 10
      const offset = (page - 1) * limit

      const pagedValues = [...values, limit, offset]
      const rows = await query(
        `
          select *
          from products
          ${whereClause}
          order by created_at desc
          limit $${pagedValues.length - 1}
          offset $${pagedValues.length}
        `,
        pagedValues
      )

      return {
        data: rows.rows.map(mapProductRow),
        error: null,
        count: totalCount,
      }
    } catch (error) {
      return { data: null, error, count: 0 }
    }
  },

  async getProductById(id: number) {
    try {
      const result = await query(`select * from products where id = $1 limit 1`, [id])
      return { data: result.rows[0] ? mapProductRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createProduct(productData: ProductInsert) {
    try {
      const result = await query(
        `
          insert into products (name, price, description, image, category, stock, rating, reviews_count, created_at, updated_at)
          values ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, now()), coalesce($10, now()))
          returning *
        `,
        [
          productData.name,
          productData.price,
          productData.description || '',
          productData.image || '',
          productData.category || '',
          productData.stock,
          productData.rating ?? 0,
          productData.reviews_count ?? 0,
          productData.created_at || null,
          productData.updated_at || null,
        ]
      )

      return { data: mapProductRow(result.rows[0]), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateProduct(id: number, productData: ProductUpdate) {
    try {
      const payload = {
        ...(productData.name !== undefined && { name: productData.name }),
        ...(productData.price !== undefined && { price: productData.price }),
        ...(productData.description !== undefined && { description: productData.description }),
        ...(productData.image !== undefined && { image: productData.image }),
        ...(productData.category !== undefined && { category: productData.category }),
        ...(productData.stock !== undefined && { stock: productData.stock }),
        ...(productData.rating !== undefined && { rating: productData.rating }),
        ...(productData.reviews_count !== undefined && { reviews_count: productData.reviews_count }),
        updated_at: productData.updated_at || nowIso(),
      }

      const { values, assignments } = buildUpdateClause(payload)
      const result = await query(
        `update products set ${assignments.join(', ')} where id = $${values.length + 1} returning *`,
        [...values, id]
      )

      return { data: result.rows[0] ? mapProductRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteProduct(id: number) {
    try {
      const result = await query(`delete from products where id = $1 returning *`, [id])
      return { data: result.rows[0] ? mapProductRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getReviews(params?: {
    productId?: number
    userId?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    rating?: number
    verified?: boolean
  }) {
    try {
      const conditions: string[] = []
      const values: unknown[] = []

      if (params?.productId) {
        values.push(params.productId)
        conditions.push(`product_id = $${values.length}`)
      }

      if (params?.userId) {
        values.push(params.userId)
        conditions.push(`user_id = $${values.length}`)
      }

      if (params?.rating) {
        values.push(params.rating)
        conditions.push(`rating = $${values.length}`)
      }

      if (params?.verified !== undefined) {
        values.push(params.verified)
        conditions.push(`verified = $${values.length}`)
      }

      const allowedSortColumns = new Set(['created_at', 'updated_at', 'rating', 'id'])
      const sortBy = allowedSortColumns.has(params?.sortBy || '') ? params?.sortBy : 'created_at'
      const sortOrder = params?.sortOrder === 'asc' ? 'asc' : 'desc'
      const whereClause = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''

      const page = params?.page || 1
      const limit = params?.limit || 10
      const offset = (page - 1) * limit

      const result = await query(
        `
          select *
          from reviews
          ${whereClause}
          order by ${sortBy} ${sortOrder}
          limit $${values.length + 1}
          offset $${values.length + 2}
        `,
        [...values, limit, offset]
      )

      return { data: result.rows.map(mapReviewRow), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async addReview(review: ReviewInsert) {
    try {
      const reviewColumns = await getReviewColumns()
      const payload: Record<string, unknown> = {
        product_id: review.product_id ?? null,
        user_id: review.user_id ?? null,
        user_name: review.user_name,
        user_avatar: review.user_avatar ?? null,
        rating: review.rating ?? null,
        verified: review.verified ?? false,
        created_at: review.created_at || nowIso(),
        updated_at: review.updated_at || nowIso(),
      }

      if (reviewColumns.includes('comment')) {
        payload.comment = review.comment ?? null
      } else if (reviewColumns.includes('content')) {
        payload.content = review.comment ?? null
      }

      if (reviewColumns.includes('order_id') && review.order_id !== undefined) {
        payload.order_id = review.order_id
      }

      if (reviewColumns.includes('order_item_id') && review.order_item_id !== undefined) {
        payload.order_item_id = review.order_item_id
      }

      const columns = Object.keys(payload)
      const placeholders = columns.map((_, index) => `$${index + 1}`)
      const values = columns.map((column) => payload[column])

      const result = await query(
        `insert into reviews (${columns.map((column) => `"${column}"`).join(', ')}) values (${placeholders.join(', ')}) returning *`,
        values
      )

      return { data: result.rows[0] ? mapReviewRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateReview(reviewId: number, updateData: ReviewUpdate) {
    try {
      const reviewColumns = await getReviewColumns()
      const payload: Record<string, unknown> = {
        ...(updateData.product_id !== undefined && { product_id: updateData.product_id }),
        ...(updateData.user_id !== undefined && { user_id: updateData.user_id }),
        ...(updateData.user_name !== undefined && { user_name: updateData.user_name }),
        ...(updateData.user_avatar !== undefined && { user_avatar: updateData.user_avatar }),
        ...(updateData.rating !== undefined && { rating: updateData.rating }),
        ...(updateData.verified !== undefined && { verified: updateData.verified }),
        updated_at: updateData.updated_at || nowIso(),
      }

      if (reviewColumns.includes('comment') && updateData.comment !== undefined) {
        payload.comment = updateData.comment
      }

      if (reviewColumns.includes('content') && updateData.comment !== undefined) {
        payload.content = updateData.comment
      }

      if (reviewColumns.includes('order_id') && updateData.order_id !== undefined) {
        payload.order_id = updateData.order_id
      }

      if (reviewColumns.includes('order_item_id') && updateData.order_item_id !== undefined) {
        payload.order_item_id = updateData.order_item_id
      }

      const { values, assignments } = buildUpdateClause(payload)
      const result = await query(
        `update reviews set ${assignments.join(', ')} where id = $${values.length + 1} returning *`,
        [...values, reviewId]
      )

      return { data: result.rows[0] ? mapReviewRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteReview(reviewId: number) {
    try {
      const result = await query(`delete from reviews where id = $1 returning *`, [reviewId])
      return { data: result.rows[0] ? mapReviewRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getReviewById(reviewId: number) {
    try {
      const result = await query(`select * from reviews where id = $1 limit 1`, [reviewId])
      return { data: result.rows[0] ? mapReviewRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getUserReviewForProduct(userId: string, productId: number) {
    try {
      const reviewColumns = await getReviewColumns()
      const extraConditions =
        reviewColumns.includes('order_id') && reviewColumns.includes('order_item_id')
          ? 'and order_id is null and order_item_id is null'
          : ''

      const result = await query(
        `
          select *
          from reviews
          where user_id = $1
            and product_id = $2
            ${extraConditions}
          limit 1
        `,
        [userId, productId]
      )

      return { data: result.rows[0] ? mapReviewRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async registerUser(userData: UserInsert) {
    try {
      const userColumns = await getUserColumns()
      const payload: Record<string, unknown> = {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: mapAppRoleToDbRole(userData.role),
        is_active: userData.is_active ?? true,
        created_at: userData.created_at || nowIso(),
        updated_at: userData.updated_at || nowIso(),
      }

      if (userColumns.includes('phone')) payload.phone = userData.phone ?? null
      if (userColumns.includes('address')) payload.address = userData.address ?? null
      if (userColumns.includes('user_avatar')) payload.user_avatar = userData.user_avatar ?? null
      if (userColumns.includes('Provinsi')) payload.Provinsi = userData.Provinsi ?? null
      if (userColumns.includes('Kota')) payload.Kota = userData.Kota ?? null
      if (userColumns.includes('Kode_pose')) payload.Kode_pose = userData.Kode_pose ?? null
      if (userData.id) payload.id = userData.id

      const columns = Object.keys(payload)
      const placeholders = columns.map((_, index) => `$${index + 1}`)
      const values = columns.map((column) => payload[column])

      const result = await query(
        `insert into users (${columns.map((column) => `"${column}"`).join(', ')}) values (${placeholders.join(', ')}) returning *`,
        values
      )

      return { data: mapUserRow(result.rows[0]), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getUserByEmail(email: string) {
    try {
      const result = await query(`select * from users where lower(email) = lower($1) limit 1`, [email])
      return { data: result.rows[0] ? mapUserRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getUserById(userId: string) {
    try {
      const result = await query(`select * from users where id = $1 limit 1`, [userId])
      return { data: result.rows[0] ? mapUserRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getAllUsers() {
    try {
      const result = await query(`select * from users order by created_at desc`)
      return { data: result.rows.map(mapUserRow), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateUser(userId: string, updateData: UserUpdate) {
    try {
      const userColumns = await getUserColumns()
      const payload: Record<string, unknown> = {
        ...(updateData.email !== undefined && { email: updateData.email }),
        ...(updateData.password !== undefined && { password: updateData.password }),
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.role !== undefined && { role: mapAppRoleToDbRole(updateData.role) }),
        ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
        updated_at: updateData.updated_at || nowIso(),
      }

      if (userColumns.includes('phone') && updateData.phone !== undefined) payload.phone = updateData.phone
      if (userColumns.includes('address') && updateData.address !== undefined) payload.address = updateData.address
      if (userColumns.includes('user_avatar') && updateData.user_avatar !== undefined) payload.user_avatar = updateData.user_avatar
      if (userColumns.includes('Provinsi') && updateData.Provinsi !== undefined) payload.Provinsi = updateData.Provinsi
      if (userColumns.includes('Kota') && updateData.Kota !== undefined) payload.Kota = updateData.Kota
      if (userColumns.includes('Kode_pose') && updateData.Kode_pose !== undefined) payload.Kode_pose = updateData.Kode_pose

      const columnMap: Record<string, string> = {
        Provinsi: 'Provinsi',
        Kota: 'Kota',
        Kode_pose: 'Kode_pose',
      }

      const { values, assignments } = buildUpdateClause(payload, columnMap)
      const result = await query(
        `update users set ${assignments.join(', ')} where id = $${values.length + 1} returning *`,
        [...values, userId]
      )

      return { data: result.rows[0] ? mapUserRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteUser(userId: string) {
    try {
      const result = await query(`delete from users where id = $1 returning *`, [userId])
      return { data: result.rows[0] ? mapUserRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getCartItems(userId: string) {
    try {
      const result = await query(
        `
          select
            ci.*,
            p.id as product_id,
            p.name as product_name,
            p.price as product_price,
            p.description as product_description,
            p.image as product_image,
            p.category as product_category,
            p.stock as product_stock,
            p.rating as product_rating,
            p.reviews_count as product_reviews_count
          from cart_items ci
          join products p on p.id = ci.product_id
          where ci.user_id = $1
          order by ci.created_at desc
        `,
        [userId]
      )

      return { data: result.rows.map(mapCartRow), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async addToCart(userId: string, productId: number, quantity: number) {
    try {
      const existing = await query(`select * from cart_items where user_id = $1 and product_id = $2 limit 1`, [userId, productId])

      if (existing.rows[0]) {
        const result = await query(
          `
            update cart_items
            set quantity = quantity + $1,
                updated_at = now()
            where id = $2
            returning *
          `,
          [quantity, existing.rows[0].id]
        )
        return { data: result.rows[0], error: null }
      }

      const result = await query(
        `
          insert into cart_items (user_id, product_id, quantity, created_at, updated_at)
          values ($1, $2, $3, now(), now())
          returning *
        `,
        [userId, productId, quantity]
      )

      return { data: result.rows[0], error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateCartItemQuantity(itemId: number, quantity: number) {
    try {
      if (quantity <= 0) {
        const deleted = await query(`delete from cart_items where id = $1 returning *`, [itemId])
        return { data: deleted.rows[0] || null, error: null }
      }

      const result = await query(
        `
          update cart_items
          set quantity = $1,
              updated_at = now()
          where id = $2
          returning *
        `,
        [quantity, itemId]
      )

      return { data: result.rows[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async removeFromCart(itemId: number) {
    try {
      const result = await query(`delete from cart_items where id = $1 returning *`, [itemId])
      return { data: result.rows[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getOrders(filters?: { status?: string; customerEmail?: string; limit?: number; page?: number }) {
    try {
      const conditions: string[] = []
      const values: unknown[] = []

      if (filters?.status) {
        values.push(filters.status)
        conditions.push(`o.status = $${values.length}`)
      }

      if (filters?.customerEmail) {
        values.push(filters.customerEmail)
        conditions.push(`lower(u.email) = lower($${values.length})`)
      }

      const whereClause = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''
      const page = filters?.page || 1
      const limit = filters?.limit || 50
      const offset = (page - 1) * limit

      const result = await query(
        `
          select
            o.*,
            u.id as user_ref_id,
            u.email as user_email,
            u.name as user_name,
            u.role as user_role,
            u.phone as user_phone,
            u.address as user_address,
            ${await hasColumn('users', 'user_avatar') ? 'u.user_avatar as user_avatar,' : 'null as user_avatar,'}
            ${await hasColumn('users', 'Provinsi') ? 'u."Provinsi" as "Provinsi",' : 'null as "Provinsi",'}
            ${await hasColumn('users', 'Kota') ? 'u."Kota" as "Kota",' : 'null as "Kota",'}
            ${await hasColumn('users', 'Kode_pose') ? 'u."Kode_pose" as "Kode_pose"' : 'null as "Kode_pose"'}
          from orders o
          left join users u on u.id = o.user_id
          ${whereClause}
          order by o.created_at desc
          limit $${values.length + 1}
          offset $${values.length + 2}
        `,
        [...values, limit, offset]
      )

      const orders = result.rows.map((row) => {
        const order = mapOrderRow(row) as JoinedOrder
        order.users = row.user_ref_id
          ? {
              id: String(row.user_ref_id),
              email: row.user_email,
              name: row.user_name,
              role: mapDbRoleToAppRole(row.user_role),
              phone: row.user_phone ?? null,
              address: row.user_address ?? null,
              user_avatar: row.user_avatar ?? null,
              Provinsi: row.Provinsi ?? null,
              Kota: row.Kota ?? null,
              Kode_pose: row.Kode_pose ?? null,
              is_active: true,
              created_at: '',
              updated_at: '',
              password: '',
            }
          : null
        return order
      })

      if (orders.length === 0) {
        return { data: [], error: null }
      }

      const orderIds = orders.map((order) => order.id)
      const itemsResult = await query(`select * from order_items where order_id = any($1::bigint[]) order by created_at asc`, [orderIds])
      const itemsByOrderId = new Map<number, OrderItem[]>()

      for (const row of itemsResult.rows) {
        const item = mapOrderItemRow(row)
        const current = itemsByOrderId.get(item.order_id) || []
        current.push(item)
        itemsByOrderId.set(item.order_id, current)
      }

      for (const order of orders) {
        order.order_items = itemsByOrderId.get(order.id) || []
      }

      return { data: orders, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message || error }
    }
  },

  async getOrderById(orderId: number) {
    try {
      const result = await query(`select * from orders where id = $1 limit 1`, [orderId])
      return { data: result.rows[0] ? mapOrderRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createOrder(
    orderData: {
      user_id: string
      order_number: string
      total_amount: number
      status: string
      shipping_address: string
      payment_method: string
      notes?: string
      payment_status?: string
    },
    items?: { productId: number; productName: string; quantity: number; price: number }[]
  ) {
    try {
      const paymentStatusExists = await hasColumn('orders', 'payment_status')
      const notesExists = await hasColumn('orders', 'notes')

      const insertColumns = ['user_id', 'order_number', 'total_amount', 'status', 'shipping_address', 'payment_method', 'created_at', 'updated_at']
      const insertValues: unknown[] = [
        orderData.user_id,
        orderData.order_number,
        orderData.total_amount,
        orderData.status,
        orderData.shipping_address,
        orderData.payment_method,
        nowIso(),
        nowIso(),
      ]

      if (paymentStatusExists) {
        insertColumns.push('payment_status')
        insertValues.push(orderData.payment_status || 'pending')
      }

      if (notesExists) {
        insertColumns.push('notes')
        insertValues.push(orderData.notes || null)
      }

      const placeholders = insertValues.map((_, index) => `$${index + 1}`)

      const createdOrder = await withTransaction(async (client) => {
        const orderResult = await query(
          `insert into orders (${insertColumns.map((column) => `"${column}"`).join(', ')}) values (${placeholders.join(', ')}) returning *`,
          insertValues,
          client
        )

        const order = mapOrderRow(orderResult.rows[0])

        if (items && items.length > 0) {
          for (const item of items) {
            await query(
              `
                insert into order_items (order_id, product_id, product_name, quantity, price, created_at, updated_at)
                values ($1, $2, $3, $4, $5, now(), now())
              `,
              [order.id, item.productId, item.productName, item.quantity, item.price],
              client
            )
          }
        }

        return order
      })

      return { data: createdOrder, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message || error }
    }
  },

  async updateOrder(orderId: number, updateData: {
    status?: string
    payment_status?: string
    shipping_date?: string
    delivery_date?: string
    notes?: string | null
  }) {
    try {
      const orderColumns = {
        payment_status: await hasColumn('orders', 'payment_status'),
        shipping_date: await hasColumn('orders', 'shipping_date'),
        delivery_date: await hasColumn('orders', 'delivery_date'),
        notes: await hasColumn('orders', 'notes'),
      }

      const payload: Record<string, unknown> = {
        ...(updateData.status !== undefined && { status: updateData.status }),
        updated_at: nowIso(),
      }

      if (orderColumns.payment_status && updateData.payment_status !== undefined) {
        payload.payment_status = updateData.payment_status
      }

      if (orderColumns.shipping_date && updateData.shipping_date !== undefined) {
        payload.shipping_date = updateData.shipping_date
      }

      if (orderColumns.delivery_date && updateData.delivery_date !== undefined) {
        payload.delivery_date = updateData.delivery_date
      }

      if (orderColumns.notes && updateData.notes !== undefined) {
        payload.notes = updateData.notes
      }

      const { values, assignments } = buildUpdateClause(payload)
      const result = await query(
        `update orders set ${assignments.join(', ')} where id = $${values.length + 1} returning *`,
        [...values, orderId]
      )

      return { data: result.rows[0] ? mapOrderRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteOrder(orderId: number) {
    try {
      const result = await query(`delete from orders where id = $1 returning *`, [orderId])
      return { data: result.rows[0] ? mapOrderRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async uploadFile(file: File, folder: string = 'products') {
    try {
      const stored = await saveUploadedFile(file, folder)
      return {
        data: stored,
        error: null,
      }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteFile(filePath: string) {
    try {
      await deleteStoredFile(filePath)
      return { data: { success: true }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getCategories() {
    try {
      const result = await query(`select * from categories order by name asc`)
      return { data: result.rows.map(mapCategoryRow), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async addCategory(categoryData: CategoryInsert) {
    try {
      const result = await query(
        `
          insert into categories (name, created_at, updated_at)
          values ($1, coalesce($2, now()), coalesce($3, now()))
          returning *
        `,
        [categoryData.name, categoryData.created_at || null, categoryData.updated_at || null]
      )

      return { data: mapCategoryRow(result.rows[0]), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateCategory(id: number, categoryData: CategoryUpdate) {
    try {
      const payload = {
        ...(categoryData.name !== undefined && { name: categoryData.name }),
        updated_at: categoryData.updated_at || nowIso(),
      }

      const { values, assignments } = buildUpdateClause(payload)
      const result = await query(
        `update categories set ${assignments.join(', ')} where id = $${values.length + 1} returning *`,
        [...values, id]
      )

      return { data: result.rows[0] ? mapCategoryRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteCategory(id: number) {
    try {
      const result = await query(`delete from categories where id = $1 returning *`, [id])
      return { data: result.rows[0] ? mapCategoryRow(result.rows[0]) : null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateProductStock(productId: number, quantityToReduce: number) {
    try {
      return await withTransaction(async (client) => {
        const productResult = await query(`select stock from products where id = $1 limit 1`, [productId], client)
        const product = productResult.rows[0]

        if (!product) {
          return { data: null, error: new Error('Product not found') }
        }

        const currentStock = Number(product.stock || 0)
        const newStock = currentStock - quantityToReduce

        if (newStock < 0) {
          return {
            data: null,
            error: new Error(`Stok tidak mencukupi. Tersedia: ${currentStock} unit, Diminta: ${quantityToReduce} unit`),
          }
        }

        const updateResult = await query(
          `
            update products
            set stock = $1,
                updated_at = now()
            where id = $2
            returning *
          `,
          [newStock, productId],
          client
        )

        return { data: updateResult.rows[0] ? mapProductRow(updateResult.rows[0]) : null, error: null }
      })
    } catch (error) {
      return { data: null, error }
    }
  },

  async reduceMultipleProductsStock(items: { productId: number; quantity: number }[]) {
    try {
      const results = []

      for (const item of items) {
        const result = await this.updateProductStock(item.productId, item.quantity)
        if (result.error) {
          return { data: null, error: result.error }
        }
        results.push(result.data)
      }

      return { data: results, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}
