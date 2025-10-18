'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'

interface Product {
  id: number
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
  rating: number
  reviews: number
}

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isWishlist, setIsWishlist] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()

  // Check login status
  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = () => {
    try {
      // Check sessionStorage first
      const sessionUser = sessionStorage.getItem('user')
      if (sessionUser) {
        const userData = JSON.parse(sessionUser)
        setUser(userData)
        setIsLoggedIn(true)
        return
      }

      // Check localStorage for "Remember Me" logins (updated to match new system)
      const rememberedUser = localStorage.getItem('user')
      const rememberMe = localStorage.getItem('rememberMe')
      
      if (rememberedUser && rememberMe === 'true') {
        try {
          const parsedUser = JSON.parse(rememberedUser)
          const loginTime = localStorage.getItem('loginTime')
          const now = Date.now()

          // Check if login is still valid (within 30 days)
          if (loginTime && (now - parseInt(loginTime)) < 2592000000) {
            // Restore session
            sessionStorage.setItem('user', JSON.stringify(parsedUser))
            sessionStorage.setItem('loginTime', now.toString())
            
            // Set role-specific cookies for middleware
            const cookieOptions = 'max-age=2592000' // 30 days
            
            if (parsedUser.role === 'admin') {
              document.cookie = `admin-auth-token=${encodeURIComponent(JSON.stringify(parsedUser))}; path=/; ${cookieOptions}`
              document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            } else {
              document.cookie = `user-auth-token=${encodeURIComponent(JSON.stringify(parsedUser))}; path=/; ${cookieOptions}`
              document.cookie = 'admin-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
            
            // Keep general auth-token for backward compatibility
            document.cookie = `auth-token=${encodeURIComponent(JSON.stringify(parsedUser))}; path=/; ${cookieOptions}`
            
            setUser(parsedUser)
            setIsLoggedIn(true)
            return
          } else {
            // Login expired, clear localStorage
            localStorage.removeItem('user')
            localStorage.removeItem('rememberMe')
            localStorage.removeItem('loginTime')
          }
        } catch (error) {
          console.error('Error parsing remembered user data:', error)
          localStorage.removeItem('user')
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('loginTime')
        }
      }

      setUser(null)
      setIsLoggedIn(false)
    } catch (error) {
      console.error('Error checking login status:', error)
      setUser(null)
      setIsLoggedIn(false)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to detail page
    e.stopPropagation()

    // Check if user is logged in
    if (!isLoggedIn) {
      showToast('Anda harus login terlebih dahulu untuk menambahkan produk ke keranjang', 'error')
      setTimeout(() => {
        router.push('/Login')
      }, 2000)
      return
    }

    // Check stock
    if (product.stock === 0) {
      showToast('Produk ini sedang habis stok', 'error')
      return
    }

    setAddingToCart(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || ''
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        showToast('Produk berhasil ditambahkan ke keranjang!', 'success')
        // Trigger cart count update in header if needed
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        showToast(data.message || 'Gagal menambahkan ke keranjang', 'error')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      showToast('Gagal menambahkan ke keranjang', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)

  const stockLabel = useMemo(() => {
    if (product.stock === 0) return 'Habis'
    if (product.stock <= 5) return `Sisa ${product.stock}`
    if (product.stock <= 10) return `Terbatas (${product.stock})`
    return `${product.stock} tersedia`
  }, [product.stock])

  const stockTone = useMemo(() => {
    if (product.stock === 0) return 'text-red-600 bg-red-50 ring-red-100'
    if (product.stock <= 5) return 'text-amber-700 bg-amber-50 ring-amber-100'
    if (product.stock <= 10) return 'text-yellow-700 bg-yellow-50 ring-yellow-100'
    return 'text-primary-700 bg-primary-50 ring-primary-100' // mengubah ke biru
  }, [product.stock])

  // Rating sudah dihitung dari database dan tersedia di product.rating
  // Tidak perlu fetch lagi karena sudah di-update oleh updateProductRating() saat review berubah
  const displayRating = (product.rating) || 0

  const fallbackImage =
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&auto=format&fit=crop&q=60'

  // Always allow viewing product detail, regardless of stock
  const canClick = true

  return (
    <>
      {ToastComponent}
      <Link href={`/Detail?id=${product.id}`} className="block group">
        <div className="relative bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden rounded-md border border-slate-100">
          {/* Product Image Section */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary-600 border-t-transparent"></div>
              </div>
            )}
            
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-300">
                  <svg className="mx-auto h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Gambar Tidak Tersedia</p>
                </div>
              </div>
            ) : (
              <img
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}

            {/* Stock Badge - Minimal Design */}
            {product.stock <= 5 && product.stock > 0 && (
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${stockTone} backdrop-blur-sm`}>
                  {stockLabel}
                </span>
              </div>
            )}

            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-white text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg">
                  Stock Habis
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4">

            {/* Product Title */}
            <h3 className="text-base font-bold text-gray-900 line-clamp-1">
              {product.name}
            </h3>
            {/* Product Description - Compact */}
            <p className="text-sm text-gray-700 line-clamp-1 mb-1">
              {product.description}
            </p>

            {/* Rating and Price - Aligned */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mb-4">
              <span className="text-xl font-bold text-blue-700 tracking-tight">
                {formatPrice(product.price)}
              </span>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-bold text-gray-900">
                  {displayRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Add to Cart Button - Clean & Modern */}
            {isLoggedIn ? (
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className={`w-full py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${
                  product.stock > 0
                    ? 'bg-transparent text-gray-700 hover:bg-primary-700 hover:text-white active:scale-[0.98] border border-slate-150 hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Menambahkan...</span>
                  </span>
                ) : product.stock > 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Masukkan Keranjang</span>
                  </span>
                ) : (
                  'Out of Stock'
                )}
              </button>
            ) : (
              <button 
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 text-sm font-bold bg-gray-50 text-slate-700 rounded-lg hover:bg-primary-700 hover:text-white active:scale-[0.98] shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Add to Cart</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </Link>
    </>
  )
}