'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Interface untuk data
interface Stats {
  totalProducts: number
  totalUsers: number
  totalOrders: number
  totalRevenue: number
}


interface Order {
  id: number
  customerName: string
  items: Array<{
    productName: string
    quantity: number
    price: number
  }>
  totalAmount: number
  status: string
  orderDate: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch products
        const productsResponse = await fetch('/api/product')
        const productsData = await productsResponse.json()
        
        // Fetch users
        const usersResponse = await fetch('/api/user', {
          headers: {
            'Authorization': 'Bearer dummy-jwt-token-1' // Admin token
          }
        })
        const usersData = await usersResponse.json()
        
        // Fetch orders
        const ordersResponse = await fetch('/api/pesanan')
        const ordersData = await ordersResponse.json()
        
        if (productsData.success && usersData.success && ordersData.success) {
          // Calculate stats
          const totalProducts = productsData.data.length
          const totalUsers = usersData.data.length
          const totalOrders = ordersData.data.length
          const totalRevenue = ordersData.data.reduce((sum: number, order: any) => 
            order.status === 'delivered' ? sum + order.totalAmount : sum, 0
          )
          
          setStats({
            totalProducts,
            totalUsers,
            totalOrders,
            totalRevenue
          })
          
          // Set recent orders (last 5)
          setRecentOrders(ordersData.data.slice(0, 5))
          
          // Set recent users (last 5)
          setRecentUsers(usersData.data.slice(0, 5))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Selesai'
      case 'pending':
        return 'Menunggu'
      case 'shipped':
        return 'Dikirim'
      case 'processing':
        return 'Diproses'
      case 'cancelled':
        return 'Dibatalkan'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard Admin</h1>
            <p className="text-slate-600">Kelola toko UMKM Anda</p>
          </div>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Kembali ke Toko</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'products', label: 'Produk', icon: '📦' },
              { id: 'users', label: 'Pengguna', icon: '👥' },
              { id: 'orders', label: 'Pesanan', icon: '🛒' },
              { id: 'settings', label: 'Pengaturan', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Total Produk</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalProducts}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Total Pengguna</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Total Pesanan</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalOrders}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🛒</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Total Pendapatan</p>
                        <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.totalRevenue)}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-800">Pesanan Terbaru</h2>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">ID</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Pelanggan</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Produk</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Jumlah</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-slate-100">
                            <td className="py-3 px-4 text-slate-800">#{order.id}</td>
                            <td className="py-3 px-4 text-slate-800">{order.customerName}</td>
                            <td className="py-3 px-4 text-slate-800">
                              {order.items.map(item => item.productName).join(', ')}
                            </td>
                            <td className="py-3 px-4 text-slate-800">{formatPrice(order.totalAmount)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{formatDate(order.orderDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-800">Pengguna Terbaru</h2>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</button>
                  </div>
                  
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">{user.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Bergabung: {formatDate(user.createdAt)}</p>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Other Tabs Content */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Manajemen Produk</h2>
              <button
                onClick={() => alert('Fitur tambah produk akan segera hadir!')}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2"
                disabled
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Produk
              </button>
            </div>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-slate-600 mb-4">Total {stats.totalProducts} produk tersedia</p>
              <p className="text-slate-500 text-sm">Klik "Tambah Produk" untuk menambah produk baru</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Manajemen Pengguna</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-slate-600">Fitur manajemen pengguna akan segera hadir</p>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Manajemen Pesanan</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-slate-600">Fitur manajemen pesanan akan segera hadir</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Pengaturan</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <p className="text-slate-600">Fitur pengaturan akan segera hadir</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}