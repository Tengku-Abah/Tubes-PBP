'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateSubtotal, calculateShipping, calculateTotal } from '../../lib/cartUtils'
import { getCurrentUser } from '../../lib/auth'

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
      alert('Please select at least one item to checkout')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          {/* Back to Home Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </Link>

          {/* Login Required */}
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Login Required</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              You need to be logged in to view your cart. Please login to continue shopping.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/Login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/Register"
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          {/* Back to Home Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </Link>

          {/* Empty Cart */}
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Your cart is empty</h1>
            <p className="text-slate-600 mb-8">Looks like you haven&apos;t added any items to your cart yet.</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Home Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Shopping Cart</h1>
          <p className="text-slate-600">
            {cartItems.length} item(s) in your cart • {selectedItems.size} selected
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Cart Items</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                    onChange={toggleAllSelection}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Select All
                  </label>
                </div>
              </div>

              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                      selectedItems.has(item.id) 
                        ? 'border-blue-300 bg-blue-50/30' 
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500'
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-slate-800 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {item.product.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          {item.product.category}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(item.product.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                                }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-sm text-slate-600">
                            {(item.product.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 flex items-center justify-center transition-colors border border-blue-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-12 text-center font-semibold text-slate-800 text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 flex items-center justify-center transition-colors border border-blue-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-800">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatPrice(item.product.price)} each
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium">{subtotal > 1000000 ? 'Free' : formatPrice(shipping)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Tax (11%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-800">Total</span>
                    <span className="text-lg font-semibold text-slate-800">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || selectedItems.size === 0}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Proceed to Checkout (${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''})`}
              </button>

              <Link
                href="/"
                className="block w-full mt-3 text-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
