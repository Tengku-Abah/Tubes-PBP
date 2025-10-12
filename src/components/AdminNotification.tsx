'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ShoppingCart, Clock, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingOrder {
    id: number;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    orderDate: string;
}

export default function AdminNotification() {
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    const [totalPendingCount, setTotalPendingCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const userData = sessionStorage.getItem('user');
            if (!userData) return;

            const user = JSON.parse(userData);
            if (user.role !== 'admin') return;

            // Ambil semua order pending untuk menghitung total
            const response = await fetch('/api/orders?limit=1000', {
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                    'X-User-Role': 'admin'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Filter hanya order pending (tidak termasuk processing)
                    const allPendingOrders = result.data.filter((order: any) =>
                        order.status === 'pending'
                    );

                    // Set total count
                    setTotalPendingCount(allPendingOrders.length);

                    // Ambil 5 order pending terbaru untuk ditampilkan
                    const latestPending = allPendingOrders
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 5)
                        .map((order: any) => ({
                            id: order.id,
                            orderNumber: order.order_number || `#${order.id}`,
                            customerName: order.customerName || 'Unknown',
                            totalAmount: order.totalAmount || 0,
                            orderDate: order.orderDate || order.created_at
                        }));

                    setPendingOrders(latestPending);
                }
            }
        } catch (error) {
            console.error('Error fetching pending orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewOrders = () => {
        setIsOpen(false);
        router.push('/Admin?menu=orders');
    };

    const handleOrderClick = (orderId: number) => {
        setIsOpen(false);
        router.push(`/Admin?menu=orders&orderId=${orderId}`);
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        fetchPendingOrders(); // Refresh data saat dropdown dibuka
                    }
                }}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="h-5 w-5" />
                {totalPendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {totalPendingCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">Order Pending</h3>
                                {totalPendingCount > 0 && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                        {totalPendingCount} pending
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p>Loading...</p>
                            </div>
                        ) : totalPendingCount === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>Tidak ada order pending</p>
                                <p className="text-sm">Semua order sudah diproses</p>
                            </div>
                        ) : (
                            <>
                                {pendingOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        onClick={() => handleOrderClick(order.id)}
                                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="font-medium text-gray-900">
                                                        {order.orderNumber}
                                                    </span>
                                                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-800">
                                                        pending
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    {order.customerName}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                    {formatCurrency(order.totalAmount)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(order.orderDate)}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                ))}

                                {totalPendingCount > 5 && (
                                    <div className="p-4 text-center text-gray-500 border-t border-gray-100">
                                        <p className="text-sm">
                                            Menampilkan 5 dari {totalPendingCount} order pending
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {totalPendingCount > 0 && (
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={handleViewOrders}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Kelola Semua Order
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
