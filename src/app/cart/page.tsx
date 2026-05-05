'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateSubtotal, calculateShipping, calculateTotal } from '../../lib/cartUtils'
import { getCurrentUser } from '../../lib/auth'
import PopupAlert from '../../components/PopupAlert'
import { usePopupAlert } from '../../hooks/usePopupAlert'
import UserProfileDropdown from '@/components/UserProfileDropdown'

// Cart item interface
interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
    stock: number;
    rating: number;
    reviews: number;
  };
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { alertState, showError, showWarning, showSuccess, hideAlert } = usePopupAlert()

  // Check login status
  useEffect(() => {
    checkLoginStatus()
    
    // Listen for storage changes (when user logs in from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === null) {
        checkLoginStatus()
      }
    }
    
    // Listen for custom login events
    const handleLoginEvent = () => {
      checkLoginStatus()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('user-login', handleLoginEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('user-login', handleLoginEvent)
    }
  }, [])

  // Fetch cart items when user is logged in
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchCartItems()
    } else {
      setCartItems([])
      setInitialLoading(false)
    }
  }, [isLoggedIn, user])

  const checkLoginStatus = () => {
    try {
      const currentUser = getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking login status:', error)
      setIsLoggedIn(false)
      setUser(null)
    }
  }

  const fetchCartItems = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/cart?user_id=${user.id}`)
      const data = await response.json()

      if (data.success) {
        setCartItems(data.data)
        // Auto-select all items by default
        const allIds = new Set<number>(data.data.map((item: CartItem) => item.id))
        setSelectedItems(allIds)
      }
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh cart items after update
        fetchCartItems()
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const removeItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        // Remove from selected items if it was selected
        const newSelected = new Set(selectedItems)
        newSelected.delete(itemId)
        setSelectedItems(newSelected)
        // Refresh cart items after deletion
        fetchCartItems()
      }
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  // Toggle individual item selection
  const toggleItemSelection = (itemId: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  // Toggle all items selection
  const toggleAllSelection = () => {
    if (selectedItems.size === cartItems.length) {
      // Deselect all
      setSelectedItems(new Set())
    } else {
      // Select all
      const allIds = new Set(cartItems.map(item => item.id))
      setSelectedItems(allIds)
    }
  }

  // Filter selected cart items
  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id))

  // use shared cartUtils functions (they accept items/subtotal/totalItems as needed)

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      showError('Please select at least one item to checkout', 'Checkout')
      return
    }

    setLoading(true)
    try {
      const subtotal = calculateSubtotal(selectedCartItems)
      const totalItems = selectedCartItems.reduce((s, it) => s + it.quantity, 0)
      const shipping = subtotal > 1000000 ? 0 : calculateShipping(subtotal, totalItems)
      const { total, tax } = calculateTotal(subtotal, shipping)

      const checkoutSummary = {
        items: selectedCartItems.map(it => ({
          cartItemId: it.id, // Add cart item ID to track which items to delete later
          productId: it.product.id,
          productName: it.product.name,
          quantity: it.quantity,
          price: it.product.price,
          product: {
            id: it.product.id,
            name: it.product.name,
            price: it.product.price,
            description: it.product.description,
            image: it.product.image,
            category: it.product.category,
            stock: it.product.stock,
            rating: it.product.rating,
            reviews: it.product.reviews
          }
        })),
        subtotal,
        shipping,
        tax,
        total,
        totalItems,
        timestamp: Date.now(),
      }

      // Minimal flags and summary for checkout page
      sessionStorage.setItem('checkout_allowed', '1')
      sessionStorage.setItem('checkout_summary', JSON.stringify(checkoutSummary))

      // Notify same-tab listeners
      window.dispatchEvent(new Event('checkout-started'))

      // Client-side navigation to checkout
      router.push('/checkout')
    } catch (error) {
      console.error('Error preparing checkout:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // compute aggregate values for render - only for selected items
  const subtotal = calculateSubtotal(selectedCartItems)
  const totalQuantity = selectedCartItems.reduce((s, it) => s + it.quantity, 0)
  const shipping = subtotal > 1000000 ? 0 : calculateShipping(subtotal, totalQuantity)
  const { total, tax } = calculateTotal(subtotal, shipping)

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PopupAlert
          isOpen={alertState.isOpen}
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onClose={hideAlert}
        />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Back Button & Title */}
              <div className="flex items-center gap-3">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                >
                  <svg className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium text-sm md:text-base">Kembali</span>
                </Link>
                <div className="hidden sm:block w-px h-6 bg-blue-600"></div>
                <h1 className="hidden sm:block text-base md:text-lg font-bold text-white">Keranjang</h1>
              </div>
              
              {/* Right Actions - Login Button */}
              <div className="flex items-center gap-2 md:gap-4">
                <Link
                  href="/Login"
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-blue-900 text-sm font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Masuk</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Login Required */}
          <div className="max-w-md mx-auto text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Login Diperlukan</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Anda harus login terlebih dahulu untuk melihat keranjang belanja. Silakan login untuk melanjutkan.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/Login"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Masuk Sekarang
                </Link>
                <Link
                  href="/Register"
                  className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-all font-semibold active:scale-[0.98]"
                >
                  Daftar Akun Baru
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PopupAlert
          isOpen={alertState.isOpen}
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onClose={hideAlert}
        />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Back Button & Title */}
              <div className="flex items-center gap-3">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                >
                  <svg className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium text-sm md:text-base">Kembali</span>
                </Link>
                <div className="hidden sm:block w-px h-6 bg-blue-600"></div>
                <h1 className="hidden sm:block text-base md:text-lg font-bold text-white">Shopping Cart</h1>
              </div>
              
              {/* Right Actions - User Profile */}
              <div className="flex items-center gap-2 md:gap-4">
                {user && <UserProfileDropdown user={user} />}
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Empty Cart */}
          <div className="max-w-md mx-auto text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="mx-auto h-24 w-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <svg className="h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-3">Keranjang Kosong</h1>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Belum ada produk di keranjang Anda. Yuk mulai berbelanja dan temukan produk favorit!
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Mulai Berbelanja
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PopupAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Back Button & Title */}
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
              >
                <svg className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold text-sm md:text-base">Kembali</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-blue-600"></div>
              <h1 className="hidden sm:block text-base md:text-lg font-bold text-white">Keranjang Belanja</h1>
            </div>
            
            {/* Right Actions - User Profile */}
            <div className="flex items-center gap-2 md:gap-4">
              {user && <UserProfileDropdown user={user} />}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Cart Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {cartItems.length} Produk di Keranjang
                </p>
                <p className="text-xs text-slate-600">
                  {selectedItems.size} item terpilih untuk checkout
                </p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <div className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-200">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-slate-700">Belanja aman & terpercaya</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with Select All */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Produk di Keranjang</h2>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="select-all"
                        checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                        onChange={toggleAllSelection}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-slate-100 rounded-md peer-checked:border-white peer-checked:bg-slate-100 transition-all duration-200 flex items-center justify-center group-hover:border-white relative">
                        {/* Checkmark Icon - More Visible */}
                        <svg 
                          className="w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform duration-200" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          strokeWidth={4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-50 group-hover:text-white transition-color">
                      Pilih Semua
                    </span>
                  </label>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-slate-200">
                {cartItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 transition-all duration-200 ${
                      selectedItems.has(item.id) 
                        ? 'bg-blue-50/40 hover:bg-blue-50/60' 
                        : 'bg-white hover:bg-slate-50/60 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      {/* Custom Checkbox with Visible Checkmark */}
                      <div className="flex-shrink-0">
                        <label className="relative cursor-pointer group block">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="peer sr-only"
                          />
                          <div className="w-5 h-5 border-2 border-slate-400 rounded-md peer-checked:border-primary-600 peer-checked:bg-primary-600 transition-all duration-200 flex items-center justify-center group-hover:border-primary-500 group-hover:shadow-sm relative">
                            {/* Checkmark Icon - More Visible */}
                            <svg 
                              className="w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform duration-200" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              strokeWidth={4}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </label>
                      </div>

                      {/* Product Image - Compact */}
                      <div className="flex-shrink-0">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500'
                            }}
                          />
                        </div>
                      </div>

                      {/* Product Info & Controls - Compact */}
                      <div className="flex-1 min-w-0">
                        {/* Top Row: Product Details, Quantity Controls, Delete Button */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          {/* Left: Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
                              {item.product.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                {item.product.category}
                              </span>
                            </div>
                            {/* Harga Per Item - Subtle */}
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs text-slate-500 font-medium">harga satuan: {formatPrice(item.product.price)}</span>
                            </div>
                          </div>

                          {/* Right: Quantity Controls & Delete Button */}
                          <div className="flex justify-between items-center gap-5">
                            {/* Quantity Controls */}
                            <div className="flex-shrink-0">
                              <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-slate-300 shadow-sm">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-7 h-7 rounded-md bg-slate-50 hover:bg-primary-600 hover:text-white text-slate-700 flex items-center justify-center transition-all duration-200 active:scale-95 font-bold"
                                  aria-label="Kurangi jumlah"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-8 text-center font-bold text-slate-800 text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-7 h-7 rounded-md bg-slate-50 hover:bg-primary-600 hover:text-white text-slate-700 flex items-center justify-center transition-all duration-200 active:scale-95 font-bold"
                                  aria-label="Tambah jumlah"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 flex-shrink-0 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all duration-200 border border-red-200 hover:border-red-500 active:scale-95"
                              aria-label="Hapus produk"
                              title="Hapus dari keranjang"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Bottom Row: Total Price Only */}
                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Total Harga</span>
                            <span className="text-base md:text-lg font-bold text-primary-700">
                              {formatPrice(item.product.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Ringkasan Pesanan
                </h2>
              </div>

              {/* Summary Details */}
              <div className="p-6 space-y-4">
                {/* Item Count */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Item Terpilih</span>
                    <span className="text-lg font-bold text-primary-700">{selectedItems.size} produk</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Pengiriman</span>
                    <span className="font-semibold text-slate-800">
                      {subtotal > 1000000 ? (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Gratis
                        </span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3">
                    <span className="text-sm text-slate-600">Pajak (11%)</span>
                    <span className="font-semibold text-slate-800">{formatPrice(tax)}</span>
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-slate-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-slate-800">Total Pembayaran</span>
                      <span className="text-2xl font-bold text-primary-700">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Free Shipping Info */}
                {subtotal < 1000000 && subtotal > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Gratis Ongkir!</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Belanja {formatPrice(1000000 - subtotal)} lagi untuk gratis ongkir
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading || selectedItems.size === 0}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3.5 px-4 rounded-lg font-bold hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Lanjut ke Pembayaran</span>
                    </>
                  )}
                </button>

                <Link
                  href="/"
                  className="block w-full text-center py-3 px-4 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold rounded-lg transition-all duration-200 active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Lanjutkan Belanja
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
