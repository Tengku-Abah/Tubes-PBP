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

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';

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
      case 'delivered': return 'bg-green-100 text-green-800';
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
      case 'delivered': return 'Terkirim';
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
    { value: 'delivered' as StatusFilter, label: 'Terkirim' },
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
    <div className="min-h-screen bg-gray-50 p-6">
      <PopupAlert 
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Package className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Daftar Pesanan</h1>
          </div>
          <p className="text-blue-100 text-lg">Kelola dan pantau semua pesanan Anda</p>
          {user && <p className="text-blue-200 text-sm mt-2">Selamat datang, {user.name}</p>}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">Belum Ada Pesanan</h3>
            <p className="text-gray-500 mb-6">Anda belum memiliki pesanan apapun</p>
            <button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all">
              Mulai Berbelanja
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-3 mb-6 overflow-x-auto border border-gray-100">
              <div className="flex gap-2 min-w-max">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={'px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap transform hover:scale-105 ' + (
                      statusFilter === tab.value
                        ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg scale-105'
                        : 'text-gray-700 bg-gray-50 hover:bg-gray-100 shadow-sm'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {tab.label}
                      <span className={'px-2 py-0.5 rounded-full text-xs font-bold ' + (
                        statusFilter === tab.value 
                          ? 'bg-white/20 text-white' 
                          : 'bg-blue-100 text-blue-700'
                      )}>
                        {getStatusCount(tab.value)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Tidak Ada Pesanan</h3>
                <p className="text-gray-500">Tidak ada pesanan dengan status ini</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-5 pb-5 border-b-2 border-gray-100">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <p className="font-bold text-gray-900 text-xl">{order.order_number}</p>
                        </div>
                        <div className="space-y-2 ml-1">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{formatDate(order.created_at)}</span>
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium line-clamp-1">{order.shipping_address}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-start sm:items-end gap-3">
                        <span className={'px-4 py-2 rounded-xl text-sm font-bold shadow-sm ' + getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </span>
                        <p className="font-bold text-blue-700 text-2xl">{formatCurrency(order.total_amount)}</p>
                      </div>
                    </div>

                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => handleToggleExpand(order.id)}
                          className="w-full flex items-center justify-between text-left px-5 py-3.5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all border border-gray-200 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <ShoppingBag className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block">
                                Daftar Produk
                              </span>
                              <span className="text-sm text-gray-600">
                                {getTotalItems(order)} item • {order.order_items.length} produk
                              </span>
                            </div>
                          </div>
                          <div className={`p-2 rounded-lg transition-all ${expandedOrderId === order.id ? 'bg-blue-100' : 'bg-white'}`}>
                            {expandedOrderId === order.id ? (
                              <ChevronUp className="w-5 h-5 text-blue-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </button>

                        {expandedOrderId === order.id && (
                          <div className="mt-3 space-y-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900 text-base">{item.product_name}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {formatCurrency(item.price)} × {item.quantity} = <span className="font-semibold text-blue-600">{formatCurrency(item.price * item.quantity)}</span>
                                  </p>
                                </div>
                                {(order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered') && (
                                  <button
                                    onClick={() => handleGoToReview(item, order.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] ml-3"
                                  >
                                    <Star className="w-4 h-4 fill-current" />
                                    Review
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        <Package className="w-4 h-4" />
                        Detail
                      </button>
                      {order.status.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingOrderId === order.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          {cancellingOrderId === order.id ? 'Membatalkan...' : 'Batalkan'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showDetailPopup && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl flex justify-between items-center shadow-lg">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Detail Pesanan</h2>
                  <p className="text-blue-100">{selectedOrder.order_number}</p>
                </div>
                <button 
                  onClick={handleCloseDetailPopup} 
                  className="p-2.5 hover:bg-blue-700 rounded-xl transition-all hover:rotate-90 duration-300 bg-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 flex justify-center">
                  <span className={'px-4 py-2 rounded-full text-sm font-medium ' + getStatusColor(selectedOrder.status)}>
                    Status: {getStatusText(selectedOrder.status)}
                  </span>
                </div>

                <div className="mb-6 bg-blue-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Informasi Pelanggan
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-200 rounded-full p-2">
                        <Package className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Nama Pelanggan</p>
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-200 rounded-full p-2">
                        <MapPin className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Alamat Pengiriman</p>
                        <p className="font-semibold text-gray-900">{selectedOrder.shipping_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-200 rounded-full p-2">
                        <Calendar className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Tanggal Pesanan</p>
                        <p className="font-semibold text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="mb-6 bg-gray-50 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-gray-700" />
                      Produk yang Dipesan
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-700">{formatCurrency(item.price)}</p>
                            <p className="text-xs text-gray-600">per item</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-blue-700" />
                      <h3 className="font-bold text-gray-900">Pembayaran</h3>
                    </div>
                    <p className="text-gray-700">{selectedOrder.payment_method}</p>
                    {selectedOrder.payment_status && (
                      <p className="text-sm text-gray-600 mt-1">Status: {selectedOrder.payment_status}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="w-5 h-5 text-blue-700" />
                      <h3 className="font-bold text-gray-900">Status Pengiriman</h3>
                    </div>
                    <p className="text-gray-700">{getStatusText(selectedOrder.status)}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-blue-200 pt-3">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-blue-700 text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
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
