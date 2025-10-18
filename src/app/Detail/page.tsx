'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Heart, Lock } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import PopupAlert from '../../components/PopupAlert'
import { usePopupAlert } from '../../hooks/usePopupAlert'
import UserProfileDropdown from '@/components/UserProfileDropdown'

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

interface Review {
  id: number
  userName: string
  userAvatar: string
  rating: number
  comment: string
  date: string
  verified: boolean
}


function ProductDetailPageContent() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })
  // Review form state
  const [newReviewRating, setNewReviewRating] = useState(0)
  const [newReviewComment, setNewReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('id')
  
  // Popup Alert
  const { alertState, showSuccess, showError, showWarning, showConfirm, hideAlert } = usePopupAlert()

  useEffect(() => {
    if (productId) {
      fetchProductDetail()
      fetchReviews()
    }
    checkLoginStatus()
  }, [productId])

  const checkLoginStatus = () => {
    // Check sessionStorage first, then localStorage for remembered login
    let userData = sessionStorage.getItem('user')

    if (!userData) {
      // Check localStorage for remembered login
      const rememberedUser = localStorage.getItem('user')
      const rememberMe = localStorage.getItem('rememberMe')

      if (rememberedUser && rememberMe === 'true') {
        try {
          const parsedUser = JSON.parse(rememberedUser)
          const loginTime = localStorage.getItem('loginTime')
          const now = Date.now()

          // Check if login is still valid (within 30 days)
          if (loginTime && (now - parseInt(loginTime)) < 2592000000) {
            // Restore session from localStorage
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
            userData = JSON.stringify(parsedUser)
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
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsLoggedIn(true)
        fetchCartCount(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        setIsLoggedIn(false)
        setUser(null)
        setCartCount(0)
      }
    } else {
      setIsLoggedIn(false)
      setUser(null)
      setCartCount(0)
    }
  }

  // Listen for storage changes (when user logs in from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        checkLoginStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isLoggedIn && user?.id) {
        fetchCartCount()
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [isLoggedIn, user])

  // Check login status when component becomes visible (user might have logged in)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLoginStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchProductDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/product?id=${productId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setProduct(data.data)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchCartCount = async (userData?: any) => {
    const currentUser = userData || user
    if (!currentUser?.id) {
      setCartCount(0)
      return
    }

    try {
      const response = await fetch(`/api/cart?user_id=${currentUser.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        const totalItems = data.data.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartCount(totalItems)
      } else {
        setCartCount(0)
      }
    } catch (error) {
      setCartCount(0)
    }
  }

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      // Fetch reviews dari API
      const response = await fetch(`/api/reviews?productId=${productId}&limit=100`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setReviews(data.data)
        
        // Use stats from API if available, otherwise calculate from data
        if (data.stats) {
          setReviewStats(data.stats)
          
          // Update product rating to match actual reviews
          if (product && data.stats.averageRating !== product.rating) {
            setProduct({
              ...product,
              rating: data.stats.averageRating,
              reviews: data.stats.totalReviews
            })
          }
        } else {
          // Calculate stats from reviews data
          const totalReviews = data.data.length
          if (totalReviews > 0) {
            const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            let totalRating = 0
            
            data.data.forEach((review: Review) => {
              ratingDistribution[review.rating as keyof typeof ratingDistribution]++
              totalRating += review.rating
            })
            
            // Calculate precise average rating without rounding
            const averageRating = parseFloat((totalRating / totalReviews).toFixed(2))
            // const averageRating = product.rating?.toFixed(1)
            
            setReviewStats({
              totalReviews,
              averageRating,
              ratingDistribution
            })
            
            // Update product rating to match actual reviews
            if (product && averageRating !== product.rating) {
              setProduct({
                ...product,
                rating: averageRating,
                reviews: totalReviews
              })
            }
          } else {
            setReviewStats({
              totalReviews: 0,
              averageRating: 0,
              ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            })
            
            // Update product with zero reviews
            if (product) {
              setProduct({
                ...product,
                rating: 0,
                reviews: 0
              })
            }
          }
        }
      } else {
        // No reviews found
        setReviews([])
        setReviewStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        })
        
        // Update product with zero reviews
        if (product) {
          setProduct({
            ...product,
            rating: 0,
            reviews: 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
      setReviewStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      })
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    // Cek apakah user sudah login
    if (!isLoggedIn) {
      showConfirm(
        'Anda harus masuk terlebih dahulu untuk menambahkan produk ke keranjang. Apakah Anda ingin masuk sekarang?',
        'Masuk Diperlukan',
        () => {
          router.push('/Login')
        },
        () => {
          // User memilih tidak login
        },
        'Masuk',
        'Nanti'
      )
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
          productId: product?.id,
          quantity: quantity
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        showSuccess('Produk berhasil ditambahkan ke keranjang!')
        fetchCartCount() // Update cart count
        // Trigger cart count update in other components
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        showError(data.message || 'Gagal menambahkan ke keranjang')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      showError('Gagal menambahkan ke keranjang')
    } finally {
      setAddingToCart(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatRating = (rating: number) => {
    return rating.toFixed(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Validate and submit review
  const validateReviewForm = () => {
    let valid = true
    setRatingError(null)
    setCommentError(null)

    if (newReviewRating < 1 || newReviewRating > 5) {
      setRatingError('Rating harus antara 1 dan 5')
      valid = false
    }

    const length = newReviewComment.trim().length
    if (length < 10) {
      setCommentError('Komentar minimal 10 karakter')
      valid = false
    }
    return valid
  }

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      showConfirm(
        'Anda harus masuk terlebih dahulu untuk menulis ulasan. Ingin masuk sekarang?',
        'Masuk Diperlukan',
        () => router.push('/Login'),
        () => {},
        'Login',
        'Nanti'
      )
      return
    }

    if (!validateReviewForm()) return

    setSubmittingReview(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product?.id,
          rating: newReviewRating,
          comment: newReviewComment,
          userAvatar: user?.avatar || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        showSuccess('Review berhasil dikirim!')
        setNewReviewRating(0)
        setNewReviewComment('')
        await fetchReviews()
      } else {
        if (response.status === 409) {
          showWarning(data.message || 'Anda sudah mereview produk ini')
        } else if (response.status === 401) {
          showConfirm(
            'Sesi login tidak valid. Silakan login untuk mengirim ulasan.',
            'Login Diperlukan',
            () => router.push('/Login'),
            () => {},
            'Masuk',
            'Nanti'
          )
        } else {
          showError(data.message || 'Gagal mengirim review')
        }
      }
    } catch (error) {
      console.error('Error submit review:', error)
      showError('Terjadi kesalahan jaringan saat mengirim review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  if (loading) {
    return <LoadingSpinner />
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Produk tidak ditemukan</h1>
          <Link 
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - match home theme */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button - Left */}
            <Link 
              href="/"
              className="flex items-center gap-2 text-white hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm">Kembali</span>
            </Link>
            
            {/* Right Actions - Cart & Profile */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 px-3 md:px-4 py-2 text-blue-100 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
                <span className="hidden md:inline text-sm font-medium">Keranjang</span>
              </Link>

              {/* User Profile / Login */}
              {isLoggedIn && user ? (
                <UserProfileDropdown user={user} />
              ) : (
                <Link
                  href="/Login"
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-blue-900 text-sm font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Masuk</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail - Clean Modern Layout */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
                  }}
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Product Name */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                {product.name}
              </h1>
              {/* Category & Stock (clean inline, no badges) */}
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                <span>
                  Kategori: <span className="font-medium text-gray-900">{product.category}</span>
                </span>
                <span className="text-gray-300">•</span>
                <span>
                  Stok: {" "}
                  <span
                    className={`font-medium ${
                      product.stock > 10
                        ? 'text-blue-600'
                        : product.stock > 0
                          ? 'text-gray-700'
                          : 'text-gray-400'
                    }`}
                  >
                    {product.stock > 0 ? product.stock : 'Habis'}
                  </span>
                </span>
              </div>
              
              {/* Price */}
              <div className="my-4 py-4 border-y border-gray-100">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-1">
                  {formatPrice(product.price)}
                </div>
                <div className="text-xs text-gray-500">Termasuk PPN</div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Deskripsi</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {product.description}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Jumlah</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-xl font-semibold text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Login Status */}
              {!isLoggedIn && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium text-sm">Harus Masuk</p>
                      <p className="text-gray-700 text-xs mt-0.5">Silakan masuk untuk menambahkan produk ke keranjang</p>
                    </div>
                  </div>
                </div>
              )}

              {isLoggedIn && user && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-900 font-medium text-sm">Hi, {user.name}!</p>
                      <p className="text-blue-700 text-xs mt-0.5">Anda dapat menambahkan produk ke keranjang</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  product.stock > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Menambahkan...</span>
                  </>
                ) : product.stock > 0 ? (
                  isLoggedIn ? (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>Masukkan Keranjang</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Masuk untuk Masukkan ke Keranjang</span>
                    </>
                  )
                ) : (
                  'Out of Stock'
                )}
              </button>

              {/* Product Features */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">Garansi Resmi</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">Pengiriman Cepat</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">100% Asli</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">Layanan Selalu Tersedia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section - Modern Design with Summary */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Penilaian Pelanggan</h2>
            <div className="text-sm text-gray-500">
              {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'penilaian' : 'penilaian'}
            </div>
          </div>

          {/* Rating Summary - Always Visible */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-100">
            {/* Overall Rating */}
            <div className="lg:col-span-1">
              <div className="text-center lg:text-left">
                <div className="text-5xl font-bold text-blue-700 mb-2">
                  {product.rating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center lg:justify-start mb-2">
                  {[...Array(5)].map((_, i) => {
                    const fillPercentage = Math.min(Math.max(product.rating - i, 0), 1) * 100;
                    return (
                      <div key={i} className="relative w-6 h-6">
                        {/* Background star (gray) */}
                        <svg
                          className="absolute inset-0 w-6 h-6 text-gray-300 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {/* Foreground star (yellow) with clip for partial fill */}
                        <svg
                          className="absolute inset-0 w-6 h-6 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                          style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
                <p className="text-gray-500 text-sm">
                  Berdasarkan {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'penilaian' : 'penilaian'}
                </p>
              </div>
          </div>
          
          {/* Rating Distribution */}
          <div className="lg:col-span-2 space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]
              const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 min-w-[60px]">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 min-w-[45px] text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Review Form: tampil setelah tombol diklik */}
        <div className="mt-2">
          {!showReviewForm ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 lg:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tulis Ulasan</h3>
                <p className="text-sm text-gray-500">Bagikan pengalaman Anda dengan produk ini.</p>
              </div>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    return showConfirm(
                      'Anda harus masuk terlebih dahulu untuk menulis ulasan. Ingin masuk sekarang?',
                      'Masuk Diperlukan',
                      () => router.push('/Login'),
                      () => {},
                      'Masuk',
                      'Nanti'
                    )
                  }
                  setShowReviewForm(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Tulis Ulasan
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 lg:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tulis Ulasan</h3>
                  <p className="text-sm text-gray-500">Bagikan pengalaman Anda dengan produk ini.</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isLoggedIn && (
                    <button
                      onClick={() =>
                        showConfirm(
                          'Anda harus masuk terlebih dahulu untuk menulis ulasan. Ingin masuk sekarang?',
                          'Masuk Diperlukan',
                          () => router.push('/Login'),
                          () => {},
                          'Masuk',
                          'Nanti'
                        )
                      }
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Masuk untuk memberikan ulasan</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Batal
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Rating input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Penilaian</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} bintang`}
                        onClick={() => setNewReviewRating(star)}
                        disabled={!isLoggedIn || submittingReview}
                        className={`p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isLoggedIn ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <svg
                          className={`w-7 h-7 ${newReviewRating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {ratingError && <p className="text-red-600 text-xs mt-1">{ratingError}</p>}
                </div>

                {/* Comment input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Komentar</label>
                  <textarea
                    value={newReviewComment}
                    onChange={(e) => {
                      setNewReviewComment(e.target.value)
                      if (e.target.value.trim().length >= 10) setCommentError(null)
                    }}
                    disabled={!isLoggedIn || submittingReview}
                    placeholder="Tulis pengalaman Anda (min. 10 karakter)"
                    className={`w-full min-h-[110px] rounded-lg border ${commentError ? 'border-red-300' : 'border-gray-200'} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{newReviewComment.trim().length} / 500</p>
                    {commentError && <p className="text-xs text-red-600">{commentError}</p>}
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !isLoggedIn}
                    className={`px-5 py-2.5 rounded-lg font-medium text-white ${submittingReview || !isLoggedIn ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} inline-flex items-center gap-2`}
                  >
                    {submittingReview ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <span>Kirim Ulasan</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Expandable Reviews List */}
          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Belum ada ulasan untuk produk ini</p>
              <p className="text-gray-400 text-sm mt-1">Berikan ulasan pertama untuk produk ini</p>
            </div>
          ) : (
            <>
              {/* Clickable section header to toggle all reviews */}
              <div 
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="flex items-center justify-between mb-6 cursor-pointer group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Ulasan Terbaru
                </h3>
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  <span>{showAllReviews ? 'Tampilkan lebih sedikit' : `Tampilkan ${reviews.length} Ulasan`}</span>
                  <svg 
                    className={`w-5 h-5 transition-transform duration-200 ${showAllReviews ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Reviews List with Animation */}
              <div className={`space-y-6 overflow-hidden transition-all duration-300 ${showAllReviews ? 'max-h-[10000px]' : 'max-h-[800px]'}`}>
                {displayedReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start gap-3">
                      <img
                        src={review.userAvatar}
                        alt={review.userName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{review.userName}</h4>
                            {review.verified && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300 fill-current'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{formatDate(review.date)}</p>
                        <p className="text-gray-700 leading-relaxed text-sm">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show More/Less Button - Alternative position */}
              {reviews.length > 3 && (
                <div className="text-center pt-6 mt-6 border-t border-gray-100">
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98] inline-flex items-center gap-2"
                  >
                    <span>{showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showAllReviews ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Popup Alert */}
      <PopupAlert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        showConfirmButton={alertState.showConfirmButton}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm}
        showCancelButton={alertState.showCancelButton}
        cancelText={alertState.cancelText}
        onCancel={alertState.onCancel}
        autoClose={alertState.autoClose}
        autoCloseDelay={alertState.autoCloseDelay}
      />
    </div>
  )
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductDetailPageContent />
    </Suspense>
  )
}
