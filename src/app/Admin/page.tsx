"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import PopupAlert from '../../components/PopupAlert';
import { usePopupAlert } from '../../hooks/usePopupAlert';

// Define types
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  description?: string;
  rating?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Order {
  id: number;
  customerName: string;
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  date: string;
}

interface ProductForm {
  name: string;
  price: string;
  stock: string;
  category: string;
  image: string;
  description: string;
}

// Simple icons as components
const Plus = (props: any) => <span {...props}>+</span>;
const Edit = (props: any) => <span {...props}>✏️</span>;
const Trash2 = (props: any) => <span {...props}>🗑️</span>;
const Search = (props: any) => <span {...props}>🔍</span>;
const Package = (props: any) => <span {...props}>📦</span>;
const ShoppingCart = (props: any) => <span {...props}>🛒</span>;
const TrendingUp = (props: any) => <span {...props}>📈</span>;
const DollarSign = (props: any) => <span {...props}>💰</span>;
const Eye = (props: any) => <span {...props}>👁️</span>;
const X = (props: any) => <span {...props}>❌</span>;
const Check = (props: any) => <span {...props}>✅</span>;

const AdminPanel = () => {
  // State untuk produk
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk orders
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Popup Alert
  const { alertState, showSuccess, showError, showWarning, showConfirm, hideAlert } = usePopupAlert();

  // Load data dari database
  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('Loading products from Supabase...');
      
      // Try to authenticate as admin first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@gmail.com',
        password: 'Admin08'
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Continue without auth for now
      } else {
        console.log('Authenticated as admin:', authData);
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Products loaded:', { data, error });

      if (error) {
        console.error('Error loading products:', error);
        showError(`Error loading products: ${error.message}`);
      } else {
        setProducts(data || []);
        console.log('Products set in state:', data?.length || 0, 'products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showError(`Error loading products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      // Mengambil data orders dari API route
      const response = await fetch('/api/orders');
      const result = await response.json();

      if (result.success) {
        // Transform data untuk kompatibilitas dengan UI yang ada
        const transformedOrders = result.data.map((order: any) => ({
          id: order.id,
          customerName: order.customerName,
          products: order.items || [], // Menggunakan items dari API
          total: order.totalAmount,
          status: order.status,
          date: new Date(order.orderDate).toLocaleDateString('id-ID')
        }));
        setOrders(transformedOrders);
      } else {
        console.error('Error loading orders:', result.message);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // State untuk UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | ''>('');
  const [selectedItem, setSelectedItem] = useState<Product | Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state untuk produk
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    price: '',
    stock: '',
    category: '',
    image: '',
    description: ''
  });

  // Fungsi untuk menghitung statistik
  const calculateStats = () => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalOrders = orders.length;
    const totalRevenue = orders.filter(order => order.status === 'completed').reduce((sum, order) => sum + order.total, 0);
    const lowStockProducts = products.filter(product => product.stock <= 10).length;
    
    return { totalProducts, totalStock, totalOrders, totalRevenue, lowStockProducts };
  };

  const stats = calculateStats();

  // Validasi form
  const validateForm = () => {
    console.log('Validating form:', productForm);
    
    if (!productForm.name.trim()) {
      showWarning('Nama produk harus diisi');
      return false;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      showWarning('Harga harus diisi dan lebih dari 0');
      return false;
    }
    if (!productForm.stock || parseInt(productForm.stock) < 0) {
      showWarning('Stok harus diisi dan tidak boleh negatif');
      return false;
    }
    if (!productForm.category) {
      showWarning('Kategori harus dipilih');
      return false;
    }
    
    console.log('Form validation passed');
    return true;
  };

  // CRUD Functions untuk produk
  const handleAddProduct = async () => {
    if (!validateForm()) return;
    
    try {
      // Try to authenticate as admin first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@gmail.com',
        password: 'Admin08'
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Continue without auth for now
      } else {
        console.log('Authenticated as admin:', authData);
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productForm.name.trim(),
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
          category: productForm.category,
          image: productForm.image || 'https://via.placeholder.com/100',
          description: productForm.description.trim() || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        showError('Gagal menambahkan produk');
      } else {
        setProducts([data, ...products]);
        resetForm();
        setShowModal(false);
        showSuccess('Produk berhasil ditambahkan');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showError('Gagal menambahkan produk');
    }
  };

  const handleEditProduct = async () => {
    if (!selectedItem || !('name' in selectedItem)) {
      showError('Item yang dipilih tidak valid');
      return;
    }
    if (!validateForm()) return;
    
    try {
      console.log('Updating product with ID:', selectedItem.id);
      console.log('Update data:', {
        name: productForm.name.trim(),
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        image: productForm.image,
        description: productForm.description.trim() || ''
      });

      // Try to authenticate as admin first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@gmail.com',
        password: 'Admin08'
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Continue without auth for now
      } else {
        console.log('Authenticated as admin:', authData);
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          name: productForm.name.trim(),
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
          category: productForm.category,
          image: productForm.image,
          description: productForm.description.trim() || ''
        })
        .eq('id', selectedItem.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Error updating product:', error);
        showError(`Gagal mengupdate produk: ${error.message}`);
      } else if (data && data.length > 0) {
        setProducts(products.map(product => 
          product.id === selectedItem.id ? data[0] : product
        ));
        resetForm();
        setShowModal(false);
        showSuccess('Produk berhasil diupdate');
      } else {
        console.error('No data returned from update');
        showError('Gagal mengupdate produk: Tidak ada data yang dikembalikan');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showError(`Gagal mengupdate produk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    showConfirm(
      'Apakah Anda yakin ingin menghapus produk ini?',
      'Konfirmasi Hapus',
      async () => {
        try {
          // Try to authenticate as admin first
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@gmail.com',
            password: 'Admin08'
          });

          if (authError) {
            console.error('Auth error:', authError);
            // Continue without auth for now
          } else {
            console.log('Authenticated as admin:', authData);
          }

          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('Error deleting product:', error);
            showError('Gagal menghapus produk');
          } else {
            setProducts(products.filter(product => product.id !== id));
            showSuccess('Produk berhasil dihapus');
          }
        } catch (error) {
          console.error('Error deleting product:', error);
          showError('Gagal menghapus produk');
        }
      }
    );
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
        showSuccess('Status order berhasil diupdate');
      } else {
        console.error('Error updating order status:', result.message);
        showError('Gagal mengupdate status order: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Gagal mengupdate status order');
    }
  };

  const openModal = (type: string, item: Product | Order | null = null) => {
    console.log('Opening modal:', { type, item });
    setModalType(type as 'add' | 'edit' | 'view');
    setShowModal(true);
    setIsDragOver(false);
    setUploadingImage(false);
    
    if (item && 'name' in item) {
      // It's a Product
      console.log('Setting product form for edit:', item);
      setSelectedItem(item);
      setProductForm({
        name: item.name || '',
        price: item.price?.toString() || '',
        stock: item.stock?.toString() || '',
        category: item.category || '',
        image: item.image || '',
        description: item.description || ''
      });
    } else if (item && 'customerName' in item) {
      // It's an Order
      console.log('Setting order for view:', item);
      setSelectedItem(item);
    } else {
      console.log('Setting empty form for add');
      setProductForm({ name: '', price: '', stock: '', category: '', image: '', description: '' });
    }
  };

  const resetForm = () => {
    setProductForm({ name: '', price: '', stock: '', category: '', image: '', description: '' });
    setSelectedItem(null);
    setIsDragOver(false);
    setUploadingImage(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  // Fungsi untuk handle upload gambar
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProductForm({...productForm, image: data.url});
        showSuccess('Gambar berhasil diupload!');
      } else {
        showError('Gagal mengupload gambar: ' + data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Gagal mengupload gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      showWarning('Silakan pilih file gambar yang valid');
    }
  };

  // Dashboard Component
  const Dashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Produk</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Stok</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalStock}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Order</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Produk Stok Rendah</h3>
          <div className="space-y-3">
            {products.filter(p => p.stock <= 10).map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                <span className="text-gray-800">{product.name}</span>
                <span className="text-red-600 font-semibold">Stok: {product.stock}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Terbaru</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-800">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Products Component
  const Products = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
        <button
          onClick={() => openModal('add')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari produk..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-12 w-12 rounded-lg object-cover" src={product.image} alt={product.name} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock <= 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal('edit', product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Orders Component
  const Orders = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Manajemen Order</h2>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.products.length > 0 
                      ? order.products.map((p: any) => `${p.productName || p.name} (${p.quantity})`).join(', ')
                      : 'No items'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal('view', order)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Selamat datang, Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { key: 'products', label: 'Produk', icon: Package },
              { key: 'orders', label: 'Order', icon: ShoppingCart },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === key
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="mr-2" size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-600">Loading...</div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'products' && <Products />}
              {activeTab === 'orders' && <Orders />}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {modalType === 'add' ? 'Tambah Produk' : 
                 modalType === 'edit' ? 'Edit Produk' : 'Detail Order'}
              </h3>
              <button 
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {(modalType === 'add' || modalType === 'edit') && (
              <div className="space-y-6">
                {/* Row 1: Nama Produk dan Harga */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Produk */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nama produk"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    />
                  </div>

                  {/* Harga */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      placeholder="Masukkan harga produk"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    />
                  </div>
                </div>

                {/* Row 2: Stok dan Kategori */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stok */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stok *
                    </label>
                    <input
                      type="number"
                      placeholder="Masukkan jumlah stok"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Audio">Audio</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Upload Gambar dan Deskripsi */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Upload Gambar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gambar Produk
                    </label>
                    
                    {/* Drag & Drop Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        isDragOver 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {productForm.image ? (
                        <div className="space-y-2">
                          <img 
                            src={productForm.image} 
                            alt="Preview" 
                            className="mx-auto h-20 w-20 object-cover rounded-lg"
                          />
                          <p className="text-xs text-gray-600">Gambar saat ini</p>
                          <button
                            type="button"
                            onClick={() => setProductForm({...productForm, image: ''})}
                            className="text-red-600 text-xs hover:text-red-800"
                          >
                            Hapus Gambar
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-3xl text-gray-400">📷</div>
                          <p className="text-xs text-gray-600">
                            Drag & drop atau klik untuk memilih
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 cursor-pointer"
                          >
                            {uploadingImage ? 'Mengupload...' : 'Pilih Gambar'}
                          </label>
                        </div>
                      )}
                    </div>

                    {/* URL Input sebagai alternatif */}
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Atau masukkan URL gambar:
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        value={productForm.image}
                        onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi Produk
                    </label>
                    <textarea
                      placeholder="Masukkan deskripsi produk (opsional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    />
                  </div>
                </div>
                {/* Tombol Aksi */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <button
                    onClick={modalType === 'add' ? handleAddProduct : handleEditProduct}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    {modalType === 'add' ? 'Tambah' : 'Update'}
                  </button>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowModal(false);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {modalType === 'view' && selectedItem && 'customerName' in selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Customer:</strong> {selectedItem.customerName}</p>
                    <p><strong>Total:</strong> {formatCurrency(selectedItem.total)}</p>
                  </div>
                  <div>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedItem.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        selectedItem.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        selectedItem.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        selectedItem.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </p>
                    <p><strong>Tanggal:</strong> {selectedItem.date}</p>
                  </div>
                </div>
                
                <div>
                  <strong>Produk:</strong>
                  {selectedItem.products && selectedItem.products.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {selectedItem.products.map((product: any, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>{product.productName || product.name} x {product.quantity}</span>
                          <span>{formatCurrency(product.price * product.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-gray-500">Tidak ada produk dalam order ini</p>
                  )}
                </div>
              </div>
            )}
            
            {modalType === 'view' && (!selectedItem || !('customerName' in selectedItem)) && (
              <div className="text-center py-8">
                <p className="text-gray-500">Tidak ada data order yang dipilih</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
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
  );
};

export default AdminPanel;