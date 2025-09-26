'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '../../components/LoadingSpinner'
import PopupAlert from '../../components/PopupAlert'
import { usePopupAlert } from '../../hooks/usePopupAlert'

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


export default function ProductDetailPage() {
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
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
    const userData = sessionStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Error parsing user data:', error)
        setIsLoggedIn(false)
      }
    } else {
      setIsLoggedIn(false)
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

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/Review?productId=${productId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setReviews(data.data)
        setReviewStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    // Cek apakah user sudah login
    if (!isLoggedIn) {
      showConfirm(
        'Anda harus login terlebih dahulu untuk menambahkan produk ke keranjang. Apakah Anda ingin login sekarang?',
        'Login Diperlukan',
        () => {
          router.push('/Login')
        },
        () => {
          // User memilih tidak login
        },
        'Login',
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

  const getRatingStats = () => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(review => {
      stats[review.rating as keyof typeof stats]++
    })
    return stats
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  if (loading) {
    return <LoadingSpinner />
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header dengan desain yang lebih menarik */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-3 text-slate-600 hover:text-slate-800 transition-all duration-300 group"
            >
              <div className="p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-medium">Kembali ke Beranda</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link
                href="/cart"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                Keranjang
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image dengan desain yang lebih menarik */}
            <div className="relative p-8">
              <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
                  }}
                />
              </div>
              
              {/* Category Badge dengan efek glassmorphism */}
              <div className="absolute top-6 left-6">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm">
                  {product.category}
                </span>
              </div>

              {/* Stock Badge dengan animasi */}
              <div className="absolute top-6 right-6">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm ${
                  product.stock > 10 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : product.stock > 0 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                }`}>
                  {product.stock > 0 ? `${product.stock} tersedia` : 'Habis'}
                </span>
              </div>

              {/* Floating action buttons */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Product Info dengan desain yang lebih menarik */}
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
                  {product.name}
                </h1>
                
                {/* Rating dengan desain yang lebih menarik */}
                <div className="flex items-center mb-6">
                  <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-full">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-3 text-slate-700 font-semibold">
                      {formatRating(product.rating)} ({product.reviews} ulasan)
                    </span>
                  </div>
                </div>

                {/* Price dengan desain yang lebih menarik */}
                <div className="mb-8">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    {formatPrice(product.price)}
                  </div>
                  <div className="text-sm text-slate-500">Harga sudah termasuk PPN</div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Deskripsi Produk</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Jumlah</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-xl font-semibold text-slate-800 min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Login Status Indicator */}
                {!isLoggedIn && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="text-yellow-600">⚠️</div>
                      <div>
                        <p className="text-yellow-800 font-medium">Login Diperlukan</p>
                        <p className="text-yellow-700 text-sm">Anda harus login untuk menambahkan produk ke keranjang</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Info */}
                {isLoggedIn && user && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="text-green-600">✅</div>
                      <div>
                        <p className="text-green-800 font-medium">Selamat datang, {user.name}!</p>
                        <p className="text-green-700 text-sm">Anda dapat menambahkan produk ke keranjang</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons dengan desain yang lebih menarik */}
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock === 0}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
                      product.stock > 0
                        ? isLoggedIn
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {addingToCart ? 'Menambahkan...' : 
                     product.stock > 0 ? 
                       (isLoggedIn ? '🛒 Tambah ke Keranjang' : '🔐 Login untuk Menambah ke Keranjang') : 
                       'Stok Habis'}
                  </button>
                  
                  <button className="px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-2xl font-semibold hover:bg-blue-50 transition-all duration-300 hover:scale-105">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Product Features */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Fitur Produk</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-600">Garansi Resmi</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-600">Pengiriman Cepat</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-600">Original</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-600">Customer Service 24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Ulasan Produk */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Ulasan Produk
              </h2>
              <div className="text-sm text-slate-500">
                {reviewStats.totalReviews} ulasan
              </div>
            </div>

            {/* Rating Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(reviewStats.averageRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-slate-600">Berdasarkan {reviewStats.totalReviews} ulasan</div>
              </div>

              {/* Rating Distribution */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribusi Rating</h3>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]
                  const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0
                  
                  return (
                    <div key={rating} className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1 w-8">
                        <span className="text-sm font-medium text-slate-600">{rating}</span>
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-600 w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Ulasan Terbaru</h3>
              
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-slate-500">Belum ada ulasan untuk produk ini</p>
                </div>
              ) : (
                <>
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-800">{review.userName}</h4>
                            {review.verified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                ✓ Terverifikasi
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-slate-500">{formatDate(review.date)}</span>
                          </div>
                          
                          <p className="text-slate-700 leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Show More/Less Button */}
                  {reviews.length > 3 && (
                    <div className="text-center pt-6">
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold"
                      >
                        {showAllReviews ? 'Tampilkan Lebih Sedikit' : `Lihat Semua ${reviews.length} Ulasan`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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
