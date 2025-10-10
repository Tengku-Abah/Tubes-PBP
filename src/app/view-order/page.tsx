'use client';

import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, CreditCard, Truck, CheckCircle, Clock, ArrowLeft, ShoppingBag } from 'lucide-react';
import { supabase, dbHelpers } from '../../lib/supabase';
import { getCurrentUser, requireAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import PopupAlert from '../../components/PopupAlert';
import { usePopupAlert } from '../../hooks/usePopupAlert';

// Define types
interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  order_number: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function OrderView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { alertState, showError, showSuccess, hideAlert } = usePopupAlert();

  // Check authentication on component mount
  useEffect(() => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  }, [router]);

  // Load orders from database
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get orders with order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        showError('Gagal memuat data pesanan');
        return;
      }

      setOrders(ordersData || []);
      if (ordersData && ordersData.length > 0) {
        setSelectedOrder(ordersData[0]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Terjadi kesalahan saat memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions - Sesuai dengan format Admin
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'delivered':
        return 'Delivered';
      case 'shipped':
        return 'Shipped';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTotalItems = (order: Order) => {
    return order.order_items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <PopupAlert 
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Package className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Daftar Pesanan</h1>
          </div>
          <p className="text-blue-100 text-lg">Kelola dan pantau semua pesanan Anda</p>
          {user && (
            <p className="text-blue-200 text-sm mt-2">Selamat datang, {user.name}</p>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">Belum Ada Pesanan</h3>
            <p className="text-gray-500 mb-6">Anda belum memiliki pesanan apapun</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Mulai Berbelanja
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Semua Pesanan ({orders.length})</h2>
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-xl shadow-md p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 ${
                    selectedOrder?.id === order.id ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-blue-900 text-lg">{order.order_number}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">{getTotalItems(order)} item</p>
                    <p className="font-bold text-blue-700">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Detail */}
            {selectedOrder && (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-blue-100">
                    <div>
                      <h2 className="text-3xl font-bold text-blue-900 mb-2">Detail Pesanan</h2>
                      <p className="text-blue-600 text-lg font-semibold">{selectedOrder.order_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-6 bg-blue-50 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 mb-4 text-xl flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Informasi Pelanggan
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-200 rounded-full p-2">
                          <Package className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Nama Pelanggan</p>
                          <p className="font-semibold text-gray-900">{user?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-200 rounded-full p-2">
                          <MapPin className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Alamat Pengiriman</p>
                          <p className="font-semibold text-gray-900">{selectedOrder.shipping_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-200 rounded-full p-2">
                          <Calendar className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                          <p className="font-semibold text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                    <div className="mb-6 bg-gray-50 rounded-xl p-6">
                      <h3 className="font-bold text-blue-900 mb-4 text-xl flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Produk yang Dipesan
                      </h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedOrder.order_items.map((item, index) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.product_name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-700">{formatCurrency(item.price)}</p>
                              <p className="text-sm text-gray-600">per item</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Total: {getTotalItems(selectedOrder)} item • {selectedOrder.order_items.length} produk unik
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment & Shipping */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-5 h-5 text-blue-700" />
                        <h3 className="font-bold text-blue-900">Pembayaran</h3>
                      </div>
                      <p className="text-gray-700">{selectedOrder.payment_method}</p>
                      {selectedOrder.payment_status && (
                        <p className="text-sm text-gray-600 mt-1">Status: {selectedOrder.payment_status}</p>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-5 h-5 text-blue-700" />
                        <h3 className="font-bold text-blue-900">Status Pengiriman</h3>
                      </div>
                      <p className="text-gray-700">{getStatusText(selectedOrder.status)}</p>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
                    <h3 className="font-bold mb-4 text-xl">Ringkasan Pesanan</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                        <span>Jumlah Item</span>
                        <span className="font-bold">{getTotalItems(selectedOrder)} item</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                        <span>Subtotal</span>
                        <span className="font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                        <span>Ongkos Kirim</span>
                        <span className="font-bold">Termasuk</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-xl">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={() => showSuccess('Fitur lacak pesanan akan segera tersedia')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      Lacak Pesanan
                    </button>
                    <button 
                      onClick={() => showSuccess('Fitur cetak invoice akan segera tersedia')}
                      className="flex-1 bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-6 rounded-xl border-2 border-blue-600 transition-all"
                    >
                      Cetak Invoice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}