'use client';

import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, CreditCard, Truck, ArrowLeft, ShoppingBag, X, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import PopupAlert from '../../components/PopupAlert';
import { usePopupAlert } from '../../hooks/usePopupAlert';

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
  tracking_number?: string;
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

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export default function OrderView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const router = useRouter();
  const { alertState, showError, showSuccess, showConfirm, hideAlert } = usePopupAlert();

  useEffect(() => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push('/Login');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/Login');
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const url = `/api/orders?customerEmail=${encodeURIComponent(user.email)}&limit=50&page=1`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();

      if (!json?.success) {
        console.error('Error loading orders via API:', json?.message);
        showError('Gagal memuat data pesanan');
        return;
      }

      const ordersData = (json.data || []) as any[];
      const mapped: Order[] = ordersData.map((o: any) => ({
        id: o.id,
        order_number: o.order_number || o.orderNumber || `ORD-${o.id}`,
        tracking_number: o.tracking_number || o.order_number || o.orderNumber,
        user_id: o.userId || user.id,
        total_amount: Number(o.totalAmount ?? 0),
        status: o.status,
        shipping_address: (o.shippingAddress && (o.shippingAddress.street || o.shippingAddress)) || '',
        payment_method: o.paymentMethod || 'cash_on_delivery',
        payment_status: o.paymentStatus || 'pending',
        created_at: o.orderDate || new Date().toISOString(),
        updated_at: o.orderDate || new Date().toISOString(),
        order_items: o.order_items || o.items || []
      }));

      setOrders(mapped);
      if (mapped.length > 0) {
        setSelectedOrder(mapped[0]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Terjadi kesalahan saat memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'Selesai';
      case 'shipped': return 'Dikirim';
      case 'processing': return 'Diproses';
      case 'pending': return 'Menunggu';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (order: Order) => {
    return order.order_items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === statusFilter);

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status.toLowerCase() === status).length;
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailPopup(true);
  };

  const handleCloseDetailPopup = () => {
    setShowDetailPopup(false);
  };

  const handleToggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleCancelOrder = async (order: Order) => {
    showConfirm(
      'Apakah Anda yakin ingin membatalkan pesanan ' + order.order_number + '? Tindakan ini tidak dapat dibatalkan.',
      'Batalkan Pesanan',
      async () => {
        setCancellingOrderId(order.id);
        try {
          // Use dedicated cancel API endpoint
          const response = await fetch('/api/orders/cancel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'user-id': user?.id || '',
            },
            body: JSON.stringify({
              orderId: order.id
            })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            showError(result.message || 'Gagal membatalkan pesanan');
            console.error('Error cancelling order:', result);
          } else {
            showSuccess('Pesanan berhasil dibatalkan');
            loadOrders(); // Reload orders to reflect the change
          }
        } catch (error) {
          console.error('Error cancelling order:', error);
          showError('Terjadi kesalahan saat membatalkan pesanan');
        } finally {
          setCancellingOrderId(null);
        }
      },
      () => {},
      'Ya, Batalkan',
      'Tidak'
    );
  };

  const handleGoToReview = (item: OrderItem, orderId: number) => {
    router.push('/Review?orderId=' + orderId + '&orderItemId=' + item.id + '&productId=' + item.product_id);
  };

  const statusTabs = [
    { value: 'all' as StatusFilter, label: 'Semua' },
    { value: 'pending' as StatusFilter, label: 'Menunggu' },
    { value: 'processing' as StatusFilter, label: 'Diproses' },
    { value: 'shipped' as StatusFilter, label: 'Dikirim' },
    { value: 'completed' as StatusFilter, label: 'Selesai' },
    { value: 'cancelled' as StatusFilter, label: 'Dibatalkan' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PopupAlert 
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
      />
      
      {/* Header - Sticky */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Back Button & Title */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
              >
                <svg className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold text-sm md:text-base">Kembali</span>
              </button>
              <div className="hidden sm:block w-px h-6 bg-blue-600"></div>
              <h1 className="hidden sm:block text-base md:text-lg font-bold text-white">Pesanan Saya</h1>
            </div>
            
            {/* Right Actions - User Info */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Belum Ada Pesanan</h3>
            <p className="text-gray-500 text-sm mb-6">Anda belum memiliki pesanan apapun</p>
            <button 
              onClick={() => router.push('/')} 
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm"
            >
              Mulai Berbelanja
            </button>
          </div>
        ) : (
          <>
            {/* Status Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-4">
              <div className="flex justify-around items-center gap-1.5">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={'px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ' + (
                      statusFilter === tab.value
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {tab.label}
                      <span className={'px-1.5 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center ' + (
                        statusFilter === tab.value 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {getStatusCount(tab.value)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Tidak Ada Pesanan</h3>
                <p className="text-gray-500 text-sm">Tidak ada pesanan dengan status ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-primary-300">
                    {/* Order Header */}
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-50 rounded-lg">
                              <Package className="w-4 h-4 text-primary-600" />
                            </div>
                            <p className="font-bold text-gray-900 text-base">{order.order_number}</p>
                            <span className={'px-2.5 py-1 rounded-lg text-xs font-semibold ' + getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="line-clamp-1">{order.shipping_address}</span>
                            </div>
                            {/* Tracking Number Badge - Only show for shipped orders */}
                            {(order.status.toLowerCase() === 'shipped' || order.status.toLowerCase() === 'delivered') && order.tracking_number && (
                              <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                                <Truck className="w-3.5 h-3.5 text-purple-600" />
                                <span className="font-semibold text-purple-700">Resi: {order.tracking_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <p className="font-bold text-primary-700 text-lg">{formatCurrency(order.total_amount)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="p-4 border-b border-slate-100">
                        <button
                          onClick={() => handleToggleExpand(order.id)}
                          className="w-full flex items-center justify-between text-left px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">
                              {getTotalItems(order)} item • {order.order_items.length} produk
                            </span>
                          </div>
                          {expandedOrderId === order.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>

                        {expandedOrderId === order.id && (
                          <div className="mt-3 space-y-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{item.product_name}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {formatCurrency(item.price)} × {item.quantity}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  <p className="font-bold text-primary-700 text-sm whitespace-nowrap">
                                    {formatCurrency(item.price * item.quantity)}
                                  </p>
                                  {(order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'shipped') && (
                                    <button
                                      onClick={() => handleGoToReview(item, order.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                                    >
                                      <Star className="w-3 h-3 fill-current" />
                                      Review
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="p-4 flex justify-end gap-2">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Detail
                      </button>
                      {order.status.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingOrderId === order.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:cursor-not-allowed"
                        >
                          <X className="w-3.5 h-3.5" />
                          {cancellingOrderId === order.id ? 'Proses...' : 'Batalkan'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Detail Popup Modal */}
        {showDetailPopup && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4 flex justify-between items-center border-b border-blue-700 z-10">
                <h2 className="text-lg font-bold">Detail Pesanan</h2>
                <button 
                  onClick={handleCloseDetailPopup} 
                  className="p-2 hover:bg-blue-800 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Order ID & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Package className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nomor Pesanan</p>
                      <p className="font-bold text-gray-900 text-base">{selectedOrder.order_number}</p>
                    </div>
                  </div>
                  <span className={'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ' + getStatusColor(selectedOrder.status)}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600" />
                    Informasi Pelanggan
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 rounded-lg p-1.5 mt-0.5">
                        <Package className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Nama Pelanggan</p>
                        <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 rounded-lg p-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Alamat Pengiriman</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedOrder.shipping_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 rounded-lg p-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Tanggal Pesanan</p>
                        <p className="font-semibold text-gray-900 text-sm">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-700" />
                      Produk Dipesan ({selectedOrder.order_items.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start p-3 bg-white rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{item.product_name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold text-primary-700 text-sm ml-3 whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment & Shipping Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-blue-700" />
                      <h3 className="font-bold text-gray-900 text-sm">Pembayaran</h3>
                    </div>
                    <p className="text-gray-700 text-sm">{selectedOrder.payment_method}</p>
                    {selectedOrder.payment_status && (
                      <p className="text-xs text-gray-600 mt-1">Status: {selectedOrder.payment_status}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-purple-700" />
                      <h3 className="font-bold text-gray-900 text-sm">Status Pengiriman</h3>
                    </div>
                    <p className="text-gray-700 text-sm">{getStatusText(selectedOrder.status)}</p>
                    {/* Tracking Number - Show for shipped/delivered orders */}
                    {(selectedOrder.status.toLowerCase() === 'shipped' || selectedOrder.status.toLowerCase() === 'delivered') && selectedOrder.tracking_number && (
                      <div className="mt-2 pt-2 border-t border-purple-200">
                        <p className="text-xs text-gray-600 mb-1">Nomor Resi</p>
                        <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                          <Package className="w-3.5 h-3.5 text-purple-600" />
                          <p className="font-bold text-purple-700 text-sm">{selectedOrder.tracking_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-primary-50 rounded-xl p-4">
                  <div className="flex justify-between items-center border-t-2 border-primary-200 pt-3">
                    <span className="font-bold text-gray-900 text-sm">Total Pembayaran</span>
                    <span className="font-bold text-primary-700 text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
