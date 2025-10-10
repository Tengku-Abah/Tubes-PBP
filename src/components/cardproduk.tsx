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
              document.cookie = `admin-auth-token=${JSON.stringify(parsedUser)}; path=/; ${cookieOptions}`
              document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            } else {
              document.cookie = `user-auth-token=${JSON.stringify(parsedUser)}; path=/; ${cookieOptions}`
              document.cookie = 'admin-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
            
            // Keep general auth-token for backward compatibility
            document.cookie = `auth-token=${JSON.stringify(parsedUser)}; path=/; ${cookieOptions}`
            
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
    return 'text-blue-700 bg-blue-50 ring-blue-100' // mengubah ke biru
  }, [product.stock])

  const ratingStars = Math.round(product.rating * 2) / 2

  const fallbackImage =
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&auto=format&fit=crop&q=60'

  // Always allow viewing product detail, regardless of stock
  const canClick = true

  return (
    <>
      {ToastComponent}
      <div className={`group relative ${className}`}>
      {/* Main Card */}
      <div className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        
        {/* Product Image Section */}
        <Link href={`/Detail?id=${product.id}`}>
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">Gambar tidak tersedia</p>
                </div>
              </div>
            ) : (
              <img
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}

            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsWishlist(!isWishlist)
              }}
              className="absolute top-2 left-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white hover:scale-110 transition-all duration-200"
            >
              <svg
                className={`w-4 h-4 transition-colors duration-200 ${
                  isWishlist ? 'text-red-500 fill-current' : 'text-gray-600'
                }`}
                fill={isWishlist ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Kategori */}
            <div className="absolute top-2 right-2">
              <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-full shadow-md">
                {product.category}
              </span>
            </div>
          </div>
        </Link>

        {/* Content Section */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          {/* Product Info */}
          <div className="flex-1 mb-3 sm:mb-4">
            {/* Title */}
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
              {product.name}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2 sm:mb-3">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {product.rating?.toFixed(1) ?? '0.0'}
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                ({product.reviews ? product.reviews.toLocaleString() : '0'} Reviews)
              </span>
            </div>
          </div>

          {/* Price and Stock */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base sm:text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${stockTone}`}>
                {stockLabel}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {isLoggedIn && (
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className={`w-full sm:flex-1 py-2.5 sm:py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 min-h-[44px] sm:min-h-0 ${
                  product.stock > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {addingToCart ? 'Loading...' : 
                 product.stock > 0 ? 'Add Cart' : 'Habis'}
              </button>
            )}
            <Link href={`/Detail?id=${product.id}`} className="w-full sm:flex-1">
              <button className="w-full py-2.5 sm:py-2 px-3 text-xs sm:text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 active:scale-95 min-h-[44px] sm:min-h-0">
                Lihat Detail
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}