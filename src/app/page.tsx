'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/cardproduk'
import ProductFilter from '../components/ProductFilter'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../components/Toast'
import { logout } from '../lib/logout'
import Link from 'next/link'

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

  const fetchProducts = async () => {
    // Check if products are cached in session storage
    const cachedProducts = sessionStorage.getItem('cachedProducts')
    const cacheTime = sessionStorage.getItem('productsCacheTime')
    const now = Date.now()

    // Use cache if it's less than 10 minutes old and no search term
    if (cachedProducts && cacheTime && (now - parseInt(cacheTime)) < 600000 && !searchTerm.trim()) {
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
            document.cookie = `auth-token=${JSON.stringify(parsedUser)}; path=/; max-age=2592000`
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      {ToastComponent}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-slate-800">
              Welcome to UMKM Store
            </h1>
            {isLoggedIn && user && (
              <div className="text-right">
                <p className="text-slate-600">Selamat datang, <span className="font-semibold text-blue-600">{user.name}</span>!</p>
                <p className="text-sm text-slate-500">{user.role === 'admin' ? 'Admin' : 'Customer'}</p>
              </div>
            )}
          </div>

          {/* Search and Action Buttons Row */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Cart and Login Buttons */}
            <div className="flex gap-3">
              <Link
                href="/cart"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                Cart ({cartCount})
              </Link>

              {isLoggedIn ? (
                <div className="flex gap-3">
                  {user?.role === 'admin' && (
                    <Link
                      href="/Admin"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/Login"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6">
          {/* Filter Sidebar */}
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

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">Tidak ada produk yang ditemukan</p>
                <p className="text-slate-400 text-sm mt-2">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Sebelumnya
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = page === 1 || page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)

                      if (!showPage) {
                        // Show ellipsis for gaps
                        if (page === 2 && currentPage > 4) {
                          return <span key={`ellipsis-${page}`} className="px-2 text-gray-500">...</span>
                        }
                        if (page === totalPages - 1 && currentPage < totalPages - 3) {
                          return <span key={`ellipsis-${page}`} className="px-2 text-gray-500">...</span>
                        }
                        return null
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Page Info */}
            {filteredProducts.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} dari {filteredProducts.length} produk
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
