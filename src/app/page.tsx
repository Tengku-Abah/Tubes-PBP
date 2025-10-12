'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ProductCard from '../components/cardproduk'
import ProductFilter from '../components/ProductFilter'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../components/Toast'
import { logout } from '../lib/logout'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, Settings, Menu, X, Zap, LogOut, Tags } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown'

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
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { showToast, ToastComponent } = useToast()
  const [cartCount, setCartCount] = useState(0)

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [priceSort, setPriceSort] = useState<string>('')
  const [minRating, setMinRating] = useState<number>(0)
  const [ratingSort, setRatingSort] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const productsPerPage = 20

  // Load categories from cache on component mount
  useEffect(() => {
    const cachedCategories = sessionStorage.getItem('cachedCategories')
    if (cachedCategories) {
      setCategories(JSON.parse(cachedCategories))
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    checkLoginStatus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback categories if none are loaded after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      if (categories.length === 0) {
        const fallbackCategories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books']
        setCategories(fallbackCategories)
        sessionStorage.setItem('cachedCategories', JSON.stringify(fallbackCategories))
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [categories.length])

  // Refetch products when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts()
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters when products or filter states change
  useEffect(() => {
    applyFilters()
  }, [products, selectedCategory, priceSort, minRating, ratingSort]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for storage changes (when user logs in from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        checkLoginStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cart count when user changes
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchCartCount()
    } else {
      setCartCount(0)
    }
  }, [isLoggedIn, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isLoggedIn && user?.id) {
        fetchCartCount()
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [isLoggedIn, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async (forceRefresh = false) => {
    // Check if products are cached in session storage
    const cachedProducts = sessionStorage.getItem('cachedProducts')
    const cacheTime = sessionStorage.getItem('productsCacheTime')
    const now = Date.now()

    // Use cache if it's less than 10 minutes old and no search term and not forcing refresh
    if (cachedProducts && cacheTime && (now - parseInt(cacheTime)) < 600000 && !searchTerm.trim() && !forceRefresh) {
      const parsedProducts = JSON.parse(cachedProducts)
      setProducts(parsedProducts)

      // Extract categories from cached data
      const categoryList = parsedProducts?.map((product: any) => product.category) || []
      const uniqueCategories = Array.from(new Set(categoryList.filter((cat: any) => cat && cat.trim() !== '')))
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories as string[])
      } else {
        setCategories(['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books'])
      }

      setLoading(false)
      return
    }

    try {
      // Show different loading states
      if (searchTerm.trim()) {
        setSearchLoading(true)
      } else {
        setLoading(true)
      }
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      // Add search filter if searchTerm exists
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        setProducts([])
      } else {
        setProducts(data || [])

        // Extract unique categories
        const categoryList = data?.map(product => product.category) || []
        const uniqueCategories = Array.from(new Set(categoryList.filter(cat => cat && cat.trim() !== '')))

        // Fallback categories if none found
        let finalCategories = uniqueCategories
        if (uniqueCategories.length === 0) {
          finalCategories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books']
        }

        // Force update categories even if empty
        if (uniqueCategories.length === 0 && (!data || data.length === 0)) {
          finalCategories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books']
        }

        setCategories(finalCategories)

        // Cache categories for faster loading
        sessionStorage.setItem('cachedCategories', JSON.stringify(finalCategories))

        // Cache products if no search term
        if (!searchTerm.trim()) {
          sessionStorage.setItem('cachedProducts', JSON.stringify(data || []))
          sessionStorage.setItem('productsCacheTime', now.toString())
        }
      }
    } catch (error) {
      setProducts([])
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const checkLoginStatus = (forceCartUpdate = false) => {
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
        const userChanged = !user || user.id !== parsedUser.id

        setUser(parsedUser)
        setIsLoggedIn(true)

        // Show welcome toast if user just logged in
        if (userChanged) {
          const loginTime = sessionStorage.getItem('loginTime')
          const now = Date.now()
          if (!loginTime || (now - parseInt(loginTime)) < 5000) { // Within 5 seconds
            showToast(`Selamat datang kembali, ${parsedUser.name}!`, 'success')
            sessionStorage.setItem('loginTime', now.toString())
          }
        }

        // Only fetch cart count if user changed or forced
        if (userChanged || forceCartUpdate) {
          fetchCartCount(parsedUser)
        }
      } catch (error) {
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

  const applyFilters = () => {
    let filtered = [...products]

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter(product => product.rating >= minRating)
    }

    // Sort by price
    if (priceSort === 'low-to-high') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (priceSort === 'high-to-low') {
      filtered.sort((a, b) => b.price - a.price)
    }

    // Sort by rating
    if (ratingSort === 'low-to-high') {
      filtered.sort((a, b) => a.rating - b.rating)
    } else if (ratingSort === 'high-to-low') {
      filtered.sort((a, b) => b.rating - a.rating)
    }

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const resetFilters = () => {
    setSelectedCategory('')
    setPriceSort('')
    setMinRating(0)
    setRatingSort('')
    setCurrentPage(1)
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of products
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {ToastComponent}
      
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-8 h-8 text-yellow-400" />
                <span className="font-bold text-lg text-white">ElektroShop</span>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari produk elektronik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-12 py-2.5 bg-blue-800 border border-blue-600 rounded-full text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white focus:bg-blue-700 transition-all"
                />
                {searchLoading && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Admin Panel - Desktop */}
              {isLoggedIn && user?.role === 'admin' && (
                <Link
                  href="/Admin"
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}

              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 px-3 md:px-4 py-2 text-blue-100 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
                <span className="hidden md:inline text-sm font-medium">Cart</span>
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

          {/* Search Bar - Mobile */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-blue-800 border border-blue-600 rounded-full text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-blue-700 transition-all"
                />
                {searchLoading && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <div className="w-full lg:w-72 lg:flex-shrink-0">
            <ProductFilter
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              priceSort={priceSort}
              setPriceSort={setPriceSort}
              ratingSort={ratingSort}
              setRatingSort={setRatingSort}
              filteredCount={filteredProducts.length}
              totalCount={products.length}
              onReset={resetFilters}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {/* Results Info */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold text-gray-900">{filteredProducts.length}</span> produk
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5">
              {currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-900 text-lg font-semibold mb-1">Produk tidak ditemukan</p>
                <p className="text-gray-500 text-sm">Coba ubah filter atau kata kunci pencarian Anda</p>
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = page === 1 || page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)

                      if (!showPage) {
                        if (page === 2 && currentPage > 4) {
                          return <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>
                        }
                        if (page === totalPages - 1 && currentPage < totalPages - 3) {
                          return <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>
                        }
                        return null
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-lg transition-all ${currentPage === page
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Page Info */}
                <p className="text-sm text-gray-600">
                  Halaman <span className="font-semibold text-gray-900">{currentPage}</span> dari <span className="font-semibold text-gray-900">{totalPages}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
