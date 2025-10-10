'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import PopupAlert from '../../components/PopupAlert';
import { usePopupAlert } from '../../hooks/usePopupAlert';
import { useToast } from '../../components/Toast';
import { requireAdmin, getAuthHeaders } from '../../lib/auth';
import { logout } from '../../lib/logout';
import AdminProtection from '../../components/AdminProtection';
import { useAdminContext } from './AdminContext';
import { DollarSign, X, ShoppingCart, Package, Users, TrendingUp, CheckCircle, Clock, ArrowUpRight, ArrowDownRight, Activity, ShoppingBag, Pencil, Trash, Eye, Tags } from 'lucide-react';

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

interface Category {
  id: number;
  name: string;
}

// Simple icons as components
const Plus = (props: any) => <span {...props}>+</span>;
const Edit = (props: any) => <span {...props}>✏️</span>;
const Trash2 = (props: any) => <span {...props}>🗑️</span>;
const Search = (props: any) => <span {...props}>🔍</span>;
const Check = (props: any) => <span {...props}>✅</span>;

const AdminPanel = () => {
  // State untuk dashboard
  const [selectedStat, setSelectedStat] = useState('Pesanan Baru');

  // State untuk produk
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk kategori
  const [categories, setCategories] = useState<Category[]>([]);

  // State untuk orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const pendingOrders = orders.filter(order => order.status === 'pending');

  // State untuk customers
  const [customers, setCustomers] = useState<any[]>([]);

  // State untuk UI - menggunakan Context
  const { activeMenu, setActiveMenu } = useAdminContext();

  // Sync activeMenu dengan URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const menuParam = urlParams.get('menu');
    if (menuParam && menuParam !== activeMenu) {
      setActiveMenu(menuParam);
    }
  }, [activeMenu, setActiveMenu]);

  // Popup Alert
  const { alertState, showSuccess, showError, showWarning, showConfirm, hideAlert } = usePopupAlert();
  const { showToast, ToastComponent } = useToast();

  // Load data dari database
  useEffect(() => {
    loadProducts();
    loadOrders();
    loadCustomers();
    loadCategories();

    // Show welcome toast for admin
    let userData = sessionStorage.getItem('user');

    if (!userData) {
      // Check localStorage for remembered login
      const rememberedUser = localStorage.getItem('user');
      const rememberMe = localStorage.getItem('rememberMe');

      if (rememberedUser && rememberMe === 'true') {
        try {
          const parsedUser = JSON.parse(rememberedUser);
          const loginTime = localStorage.getItem('loginTime');
          const now = Date.now();

          // Check if login is still valid (within 30 days)
          if (loginTime && (now - parseInt(loginTime)) < 2592000000) {
            // Restore session from localStorage
            sessionStorage.setItem('user', JSON.stringify(parsedUser));
            sessionStorage.setItem('loginTime', now.toString());
            document.cookie = `auth-token=${JSON.stringify(parsedUser)}; path=/; max-age=2592000`;
            userData = JSON.stringify(parsedUser);
          } else {
            // Login expired, clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('loginTime');
          }
        } catch (error) {
          console.error('Error parsing remembered user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('loginTime');
        }
      }
    }

    const loginTime = sessionStorage.getItem('loginTime');
    const now = Date.now();

    if (userData && (!loginTime || (now - parseInt(loginTime)) < 5000)) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'admin') {
          showToast(`Selamat datang, Admin ${parsedUser.name}!`, 'success');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to prevent infinite fetches

  const loadProducts = async () => {
    try {

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        return;
      }

      // Transform data to match expected format
      const transformedProducts = data?.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image: product.image,
        description: product.description,
        rating: product.rating || 0,
        reviews_count: product.reviews_count || 0,
        created_at: product.created_at,
        updated_at: product.updated_at
      })) || [];

      setProducts(transformedProducts);

    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to empty array on error
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Tambahkan state untuk mencegah multiple fetch
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  
  const loadOrders = async () => {
    // Cek apakah sedang loading, jika ya, jangan fetch lagi
    if (isLoadingOrders) return;
    
    // Verifikasi user adalah admin sebelum memuat data
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      console.error('Sesi login tidak ditemukan');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      console.error('Akses admin diperlukan');
      return;
    }
    
    try {
      setIsLoadingOrders(true);
      const response = await fetch('/api/orders', {
        // Tambahkan cache: 'no-store' untuk mencegah caching yang mungkin menyebabkan fetch berulang
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${user.id}`,
          'X-User-Role': 'admin'
        }
      });
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
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'pembeli');

      if (error) {
        console.error('Error loading customers:', error);
        setCustomers([]);
        return;
      }

      // Transform data untuk memastikan field names yang konsisten
      const transformedCustomers = (data || []).map(customer => ({
        id: customer.id,
        name: customer.name || customer.nama_lengkap || customer.full_name || 'N/A',
        email: customer.email,
        phone: customer.phone || customer.no_telepon || customer.phone_number || 'N/A',
        status: customer.status || 'active', // Default status jika tidak ada
        created_at: customer.created_at,
        last_login_at: customer.last_login_at || customer.last_login || customer.updated_at,
        role: customer.role
      }));

      console.log('Loaded customers:', transformedCustomers.length, 'customers');
      setCustomers(transformedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
        return;
      }

      // Transform data to match expected format
      const transformedCategories = (data || []).map(category => ({
        id: category.id,
        name: category.name
      }));

      console.log('Loaded categories:', transformedCategories.length, 'categories');
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  // State untuk UI
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'add-category' | 'edit-category' | 'update-stock' | ''>('');
  const [selectedItem, setSelectedItem] = useState<Product | Order | Category | null>(null);
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

  // Form state untuk kategori
  const [categoryForm, setCategoryForm] = useState({
    name: '',
  });

  // Form state untuk stok
  const [stockForm, setStockForm] = useState({ stock: '' });

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

  // Stats untuk dashboard
  const dashboardStats = [
    {
      title: 'Pesanan Baru',
      value: orders.filter(order => order.status === 'pending').length.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Produk',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'bg-blue-600'
    },
    {
      title: 'Total Produk Terjual',
      value: '10',
      icon: ShoppingBag,
      color: 'bg-blue-700'
    },
    {
      title: 'Total Pendapatan',
      value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'bg-blue-800'
    }
  ];


  // Validasi form
  const validateForm = () => {

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

    return true;
  };

  // CRUD Functions untuk produk
  const handleAddProduct = async () => {
    if (!validateForm()) return;

    try {
      // Secure authentication check
      const user = requireAdmin();

      // Use secure headers for API calls
      const authHeaders = getAuthHeaders();

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
        showError(`Gagal menambahkan produk: ${error.message}`);
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
      // Secure authentication check
      const user = requireAdmin();

      // Use secure headers for API calls
      const authHeaders = getAuthHeaders();

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
          // Secure authentication check
          const user = requireAdmin();

          // Use secure headers for API calls
          const authHeaders = getAuthHeaders();

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
      console.log('=== ORDER STATUS UPDATE DEBUG ===');
      console.log('Order ID:', orderId);
      console.log('New Status:', newStatus);
      console.log('Current orders state:', orders);
      
      setUpdatingStatus(orderId);

      // Validasi status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        console.log('Invalid status:', newStatus);
        showError('Status tidak valid');
        return;
      }

      // Pastikan user adalah admin sebelum melakukan update
      const userData = sessionStorage.getItem('user');
      if (!userData) {
        console.log('No user data found in session');
        showError('Sesi login tidak ditemukan');
        return;
      }

      const user = JSON.parse(userData);
      console.log('User data:', user);
      
      if (user.role !== 'admin') {
        console.log('User is not admin:', user.role);
        showError('Anda tidak memiliki akses admin');
        return;
      }

      const requestBody = {
        id: orderId,
        status: newStatus
      };
      
      console.log('Request body:', requestBody);

      // Tambahkan header Authorization untuk memastikan request dari admin
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${user.id}`,
          'X-User-Role': 'admin'
        },
        cache: 'no-store',
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('API Response result:', result);

      if (result.success) {
        console.log('Update successful, updating local state...');
        
        // Update state dengan data terbaru dari server
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(order =>
            order.id === orderId
              ? { ...order, status: newStatus }
              : order
          );
          console.log('Updated orders state:', updatedOrders);
          return updatedOrders;
        });
        
        // Reload data untuk memastikan sinkronisasi dengan database
        console.log('Reloading orders from database...');
        setTimeout(async () => {
          try {
            await loadOrders();
            console.log('Orders reloaded successfully');
          } catch (error) {
            console.error('Error reloading orders:', error);
          }
        }, 100); // Reduced timeout for faster refresh
        
        showSuccess('Status order berhasil diupdate');
      } else {
        console.error('Error updating order status:', result.message);
        showError('Gagal mengupdate status order: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Gagal mengupdate status order: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUpdatingStatus(null);
      console.log('=== ORDER STATUS UPDATE DEBUG END ===');
    }
  };

  // Fungsi untuk memperbarui stok produk
  const handleUpdateStock = async () => {
    if (!selectedItem || !('id' in selectedItem)) return;

    const { error } = await supabase
      .from('products')
      .update({ stock: parseInt(stockForm.stock, 10) })
      .eq('id', selectedItem.id);

    if (error) {
      console.error('Gagal memperbarui stok:', error.message);
      return;
    }
    // Perbarui state lokal
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedItem.id ? { ...p, stock: parseInt(stockForm.stock, 10) } : p
      )
    );

    setShowModal(false);
  };

  // CRUD Functions untuk kategori
  // Add kategori
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      showError('Nama kategori tidak boleh kosong');
      return;
    }

    try {
      const user = requireAdmin();
      const authHeaders = getAuthHeaders();

      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: categoryForm.name.trim() }])
        .select();

      if (error) {
        console.error('Error adding category:', error);
        showError(`Gagal menambahkan kategori: ${error.message}`);
      } else if (data && data.length > 0) {
        // Transform data to match expected format
        const newCategory = {
          id: data[0].id,
          name: data[0].name
        };
        setCategories((prev) => [...prev, newCategory]);
        resetFormCategory();
        setShowModal(false);
        showSuccess('Kategori berhasil ditambahkan');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      showError('Gagal menambahkan kategori');
    }
  };

  // Edit kategori
  const handleEditCategory = async () => {
    if (!selectedItem || !('name' in selectedItem)) {
      showError('Kategori yang dipilih tidak valid');
      return;
    }

    if (!categoryForm.name.trim()) {
      showError('Nama kategori tidak boleh kosong');
      return;
    }

    try {
      // Secure authentication check
      const user = requireAdmin();

      // Use secure headers for API calls
      const authHeaders = getAuthHeaders();

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryForm.name.trim(),
        })
        .eq('id', selectedItem.id)
        .select();

      if (error) {
        console.error('Error updating category:', error);
        showError(`Gagal mengupdate kategori: ${error.message}`);
      } else if (data && data.length > 0) {
        // Transform data to match expected format
        const updatedCategory = {
          id: data[0].id,
          name: data[0].name
        };
        setCategories(categories.map(cat =>
          cat.id === selectedItem.id ? updatedCategory : cat
        ));
        resetFormCategory();
        setShowModal(false);
        showSuccess('Kategori berhasil diupdate');
      } else {
        console.error('No data returned from update');
        showError('Gagal mengupdate kategori: Tidak ada data yang dikembalikan');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showError(
        `Gagal mengupdate kategori: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };


  // Delete kategori (belum ada database kategori)
  const handleDeleteCategory = async (id: number) => {
    showConfirm(
      'Apakah Anda yakin ingin menghapus kategori ini?',
      'Konfirmasi Hapus',
      async () => {
        try {
          // Pastikan hanya admin yang bisa hapus
          const user = requireAdmin();

          // Gunakan header autentikasi aman
          const authHeaders = getAuthHeaders();

          // Hapus data kategori di Supabase
          const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('Error deleting category:', error);
            showError('Gagal menghapus kategori');
          } else {
            // Update state kategori di sisi frontend
            setCategories(categories.filter(category => category.id !== id));
            showSuccess('Kategori berhasil dihapus');
          }
        } catch (error) {
          console.error('Error deleting category:', error);
          showError('Gagal menghapus kategori');
        }
      }
    );
  };


  const openModal = (
    type: string,
    item: Product | Order | Category | null = null
  ) => {
    setModalType(type as 'add' | 'edit' | 'view' | 'add-category' | 'edit-category' | 'update-stock');
    setShowModal(true);
    setIsDragOver(false);
    setUploadingImage(false);

    if (type === 'update-stock' && item && 'stock' in item) {
      setSelectedItem(item);
      setStockForm({ stock: item.stock?.toString() || '' });
    } else if (item && 'name' in item && 'price' in item) {
      // It's a Product
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
      setSelectedItem(item);
    } else if ((type === 'edit-category' || type === 'add-category') && item && 'productCount' in item) {
      // Kategori
      setSelectedItem(item);
      setCategoryForm({ name: item.name });
    } else {
      setSelectedItem(null);
      setProductForm({ name: '', price: '', stock: '', category: '', image: '', description: '' });
      setCategoryForm({ name: '' });
      setStockForm({ stock: '' });
    }
  };


  const resetForm = () => {
    setProductForm({ name: '', price: '', stock: '', category: '', image: '', description: '' });
    setSelectedItem(null);
    setIsDragOver(false);
    setUploadingImage(false);
  };

  const resetFormCategory = () => {
    setCategoryForm({ name: '' });
    setSelectedItem(null);
    setIsDragOver(false);
    setUploadingImage(false);
  };


  const filteredProducts = products.filter(product => {
    if (!searchTerm.trim()) {
      return true;
    }

    const searchLower = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.id.toString().includes(searchTerm);
  });



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
        setProductForm({ ...productForm, image: data.url });
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




  // Orders Component
  const Orders = () => {
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'>('all');

    // Hitung jumlah order per status
    const countByStatus = {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    // Filter orders sesuai tab
    const filteredOrders =
      selectedStatus === 'all'
        ? orders
        : orders.filter(o => o.status === selectedStatus);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Order</h2>

        {/* === Tabs Filter Section === */}
        <div className="flex items-center gap-6 border-b border-gray-200 pb-2">
          {[
            { key: 'all', label: 'All Orders', color: 'bg-orange-500' },
            { key: 'pending', label: 'Pending', color: 'bg-yellow-400' },
            { key: 'processing', label: 'Processing', color: 'bg-blue-400' },
            { key: 'shipped', label: 'Shipped', color: 'bg-purple-400' },
            { key: 'delivered', label: 'Delivered', color: 'bg-green-400' },
            { key: 'completed', label: 'Completed', color: 'bg-green-600' },
            { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key as any)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors relative pb-2
              ${selectedStatus === tab.key
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              {tab.label}
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full ${selectedStatus === tab.key
                    ? `${tab.color} text-white`
                    : 'bg-gray-200 text-gray-700'
                  }`}
              >
                {countByStatus[tab.key as keyof typeof countByStatus]}
              </span>
              {selectedStatus === tab.key && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* === Orders Table === */}
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
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.products && order.products.length > 0
                        ? order.products.map((p: any) => `${p.product_name || p.productName || p.name || 'Unknown Product'} (${p.quantity})`).join(', ')
                        : 'No items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                          } ${updatingStatus === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        <Eye size={16} className="text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      Tidak ada pesanan untuk status ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Categories Component
  const Categories = () => {
    // Calculate product count for each category
    const categoriesWithCount = categories.map(category => ({
      ...category,
      productCount: products.filter(product => product.category === category.name).length
    }));

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Daftar Kategori
          </h2>
          <button
            onClick={() => openModal('add-category')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Tambah Kategori
          </button>
        </div>

        {/* Tabel Kategori */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoriesWithCount.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{category.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{category.productCount}</td>
                    <td className="px-6 py-4 text-sm font-medium flex gap-3">
                      <button
                        onClick={() => openModal('edit-category', category)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil size={16} className="text-gray-600" />
                      </button>
                      <button
                        // function for deleting category
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {categoriesWithCount.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      Tidak ada kategori ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  // Customers Component
  const Customers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Manajemen Pelanggan</h2>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bergabung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir Aktif</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{customer.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {customer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString('id-ID') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.last_login_at ? new Date(customer.last_login_at).toLocaleDateString('id-ID') : 'Belum pernah login'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


  // Financial Report Component
  const Analytics = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [financialData, setFinancialData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Load financial data from API
    const loadFinancialData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          period: selectedPeriod,
          year: selectedYear.toString(),
          month: selectedMonth.toString(),
          quarter: selectedQuarter.toString(),
          semester: selectedSemester.toString()
        });

        const response = await fetch(`/api/financial?${params}`);
        const result = await response.json();

        if (result.success) {
          setFinancialData(result.data);
        } else {
          console.error('Error loading financial data:', result.message);
          showError('Gagal memuat data laporan keuangan');
        }
      } catch (error) {
        console.error('Error loading financial data:', error);
        showError('Gagal memuat data laporan keuangan');
      } finally {
        setLoading(false);
      }
    };

    // Load data when period changes
    useEffect(() => {
      loadFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter, selectedSemester]);

    // Use API data or fallback to local calculation
    const productSales = financialData?.productPerformance || [];
    const financialTotalRevenue = financialData?.summary?.totalRevenue || 0;
    const totalUnitsSold = financialData?.summary?.totalUnitsSold || 0;
    const totalOrders = financialData?.summary?.totalOrders || 0;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold mb-1">Laporan Keuangan</h1>
                    <p className="text-green-100 text-sm">Analisis pendapatan dan performa bisnis</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                  <p className="text-green-100 text-xs font-medium mb-1">Periode Laporan</p>
                  <p className="text-lg font-semibold text-white">
                    {selectedPeriod === 'all' && 'Semua Data'}
                    {selectedPeriod === 'month' && `${new Date(0, selectedMonth).toLocaleString('id-ID', { month: 'long' })} ${selectedYear}`}
                    {selectedPeriod === 'quarter' && `Q${selectedQuarter} ${selectedYear}`}
                    {selectedPeriod === 'semester' && `Semester ${selectedSemester} ${selectedYear}`}
                    {selectedPeriod === 'year' && selectedYear.toString()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-medium">
                      {financialData?.debug?.ordersFound || 0} orders ditemukan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Pilih Periode Laporan</h3>
            <div className="flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Memuat data...</span>
                </div>
              )}
              <button
                onClick={loadFinancialData}
                disabled={loading}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Refresh Data
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Periode</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Semua Data</option>
                <option value="month">Bulanan</option>
                <option value="quarter">Kuartal</option>
                <option value="semester">Semester</option>
                <option value="year">Tahunan</option>
              </select>
            </div>

            {/* Month Selection */}
            {selectedPeriod === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quarter Selection */}
            {selectedPeriod === 'quarter' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kuartal</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value={1}>Q1 (Jan-Mar)</option>
                  <option value={2}>Q2 (Apr-Jun)</option>
                  <option value={3}>Q3 (Jul-Sep)</option>
                  <option value={4}>Q4 (Okt-Des)</option>
                </select>
              </div>
            )}

            {/* Semester Selection */}
            {selectedPeriod === 'semester' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value={1}>Semester 1 (Jan-Jun)</option>
                  <option value={2}>Semester 2 (Jul-Des)</option>
                </select>
              </div>
            )}

            {/* Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        {!loading && financialData && financialData.debug.ordersFound === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-100 rounded-lg">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-yellow-800 mb-1">Tidak Ada Data</h3>
                <p className="text-yellow-700 text-sm">
                  Tidak ditemukan pesanan untuk periode{' '}
                  {selectedPeriod === 'all' && 'Semua Data'}
                  {selectedPeriod === 'month' && `${new Date(0, selectedMonth).toLocaleString('id-ID', { month: 'long' })} ${selectedYear}`}
                  {selectedPeriod === 'quarter' && `Q${selectedQuarter} ${selectedYear}`}
                  {selectedPeriod === 'semester' && `Semester ${selectedSemester} ${selectedYear}`}
                  {selectedPeriod === 'year' && selectedYear.toString()}.
                  Coba pilih periode lain atau pastikan ada data pesanan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
                </div>
                <div>
                  <div className="w-20 h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="w-24 h-6 bg-gray-200 rounded mb-1"></div>
                  <div className="w-16 h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-green-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-600">+15.2%</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Pendapatan</p>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{formatCurrency(financialTotalRevenue)}</h3>
                <p className="text-gray-400 text-xs">Periode terpilih</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                  <ArrowUpRight className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">+8.7%</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Unit Terjual</p>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{totalUnitsSold.toLocaleString('id-ID')}</h3>
                <p className="text-gray-400 text-xs">Unit produk</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-purple-50 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
                  <ArrowUpRight className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">+12.3%</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Transaksi</p>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{totalOrders.toLocaleString('id-ID')}</h3>
                <p className="text-gray-400 text-xs">Pesanan</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Charts */}
        {!loading && financialData && financialData.debug.ordersFound > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Top 10 Produk Berdasarkan Pendapatan</h3>
                  <p className="text-gray-500 text-sm">Produk dengan revenue tertinggi</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="space-y-4">
                {productSales
                  .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
                  .slice(0, 10)
                  .map((product: any, index: number) => {
                    const sortedProducts = productSales.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue).slice(0, 10);
                    const maxRevenue = Math.max(...sortedProducts.map((p: any) => p.totalRevenue));
                    const percentage = maxRevenue > 0 ? (product.totalRevenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={product.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate flex-1">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.totalRevenue)}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              ({financialTotalRevenue > 0 ? ((product.totalRevenue / financialTotalRevenue) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Units Sold Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Top 10 Produk Berdasarkan Unit Terjual</h3>
                  <p className="text-gray-500 text-sm">Produk dengan penjualan tertinggi</p>
                </div>
                <div className="p-2.5 bg-green-50 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="space-y-4">
                {productSales
                  .sort((a: any, b: any) => b.totalSold - a.totalSold)
                  .slice(0, 10)
                  .map((product: any, index: number) => {
                    const sortedProducts = productSales.sort((a: any, b: any) => b.totalSold - a.totalSold).slice(0, 10);
                    const maxUnits = Math.max(...sortedProducts.map((p: any) => p.totalSold));
                    const percentage = maxUnits > 0 ? (product.totalSold / maxUnits) * 100 : 0;

                    return (
                      <div key={product.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate flex-1">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900">{product.totalSold.toLocaleString('id-ID')}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">unit</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Product Table */}
        {!loading && financialData && financialData.debug.ordersFound > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Detail Laporan Produk</h3>
                  <p className="text-gray-500 text-sm">Data lengkap penjualan setiap produk</p>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Satuan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Terjual</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pendapatan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Transaksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {productSales
                    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
                    .map((product: any, index: number) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <img className="h-10 w-10 rounded-lg object-cover" src={product.image} alt={product.name} />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">ID: #{product.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                            {product.totalSold.toLocaleString('id-ID')} unit
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                            {product.ordersCount} transaksi
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Settings Component
  const Settings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Pengaturan sistem akan segera tersedia.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {activeMenu === 'dashboard' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Dashboard Admin</h1>
                  <p className="text-blue-100 text-lg">Selamat datang di panel administrasi ElektroShop</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium mb-1">Last Updated</p>
                  <p className="text-2xl font-bold text-white">{new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat) => (
              <div
                key={stat.title}
                onClick={() => setSelectedStat(stat.title)}
                className={`cursor-pointer group rounded-2xl p-6 shadow-lg border transition-all duration-300
                ${selectedStat === stat.title
                    ? 'bg-blue-600 text-white shadow-xl scale-[1.02]'
                    : 'bg-white border-gray-100 hover:shadow-xl hover:-translate-y-1'}
              `}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-4 rounded-2xl ${selectedStat === stat.title ? 'bg-white/30' : stat.color} shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-2 ${selectedStat === stat.title ? 'text-blue-100' : 'text-gray-600'}`}>
                    {stat.title}
                  </p>
                  <h3 className={`text-3xl font-bold ${selectedStat === stat.title ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            {selectedStat === 'Pesanan Baru' && (
              <>
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Pesanan Terbaru</h3>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {pendingOrders.length > 0 ? (
                      pendingOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-sm">
                              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{order.customerName}</h4>
                              <p className="text-sm text-gray-500">{order.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                              }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada pesanan tertunda</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedStat === 'Total Produk' && (
              <>
                {/* Stock Monitoring */}
                <div className="bg-white rounded-2xl"> {/* Removed redundant p-6 shadow-lg border-gray-100 as it's the parent */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Monitoring Stok</h3>
                      <p className="text-gray-600 text-sm">Status stok produk</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Stock Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <h4 className="font-semibold text-gray-900">Stok Habis</h4>
                      </div>
                      <p className="text-2xl font-bold text-red-700 mb-1">
                        {products.filter(product => product.stock === 0).length}
                      </p>
                      <p className="text-xs text-red-600">Produk perlu restock</p>
                    </div>

                    <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <h4 className="font-semibold text-gray-900">Stok Rendah</h4>
                      </div>
                      <p className="text-2xl font-bold text-yellow-700 mb-1">
                        {products.filter(product => product.stock > 0 && product.stock <= 10).length}
                      </p>
                      <p className="text-xs text-yellow-600">≤ 10 unit</p>
                    </div>

                    <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h4 className="font-semibold text-gray-900">Stok Normal</h4>
                      </div>
                      <p className="text-2xl font-bold text-green-700 mb-1">
                        {products.filter(product => product.stock > 10).length}
                      </p>
                      <p className="text-xs text-green-600">{'>'} 10 unit</p>
                    </div>
                  </div>

                  {/* Low Stock Products */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Produk dengan Stok Rendah</h4>
                    <div className="space-y-3">
                      {products.filter(product => product.stock <= 10).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <img className="w-10 h-10 rounded-lg object-cover" src={product.image} alt={product.name} />
                            <div>
                              <h5 className="font-medium text-gray-900">{product.name}</h5>
                              <p className="text-sm text-gray-500">{product.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p
                                className={`font-bold ${product.stock === 0 ? 'text-red-600' : 'text-yellow-600'
                                  }`}
                              >
                                {product.stock} unit
                              </p>
                              <p className="text-xs text-gray-500">
                                {product.stock === 0 ? 'Habis' : 'Rendah'}
                              </p>
                            </div>

                            {/* Ikon Pensil */}
                            <button
                              onClick={() => openModal('update-stock', product)}
                              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Edit produk"
                            >
                              <Pencil className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {products.filter(product => product.stock <= 10).length === 0 && (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-gray-500">Semua produk memiliki stok yang cukup</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedStat === 'Total Pendapatan' && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Pendapatan</h3>
                <p className="text-gray-700 mb-2">Total pendapatan: <strong>{`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}</strong></p>
                <p className="text-gray-500 text-sm">Pendapatan dihitung dari semua pesanan yang sudah selesai.</p>
              </>
            )}

            {selectedStat === 'Total Produk Terjual' && (
              <>
                {/* Top Products */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Produk Terlaris</h3>
                      <p className="text-gray-600 text-sm">5 produk terbaik</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product) => {
                      // const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#4A90E2', '#7B68EE']; // Unused, can be removed if not needed

                      return (
                        <div key={product.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                          <div className="flex items-center gap-4">
                            <img
                              className="w-16 h-16 rounded-xl object-cover shadow-lg"
                              src={product.image}
                              alt={product.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                              }}
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-500">{product.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(product.price)}</p>
                            <p className="text-sm text-gray-500">Stok: {product.stock}</p>
                          </div>
                        </div>
                      );
                    })}
                    {products.length === 0 && (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada produk</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeMenu === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
            <button
              onClick={() => openModal('add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Tambah Produk
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
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
                            <div className="text-sm text-gray-500">ID: #{product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal('edit', product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeMenu === 'orders' && <Orders />}
      {activeMenu === 'customers' && <Customers />}
      {activeMenu === 'keuangan' && <Analytics />}
      {activeMenu === 'settings' && <Settings />}
      {activeMenu === 'categories' && <Categories />}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {modalType === 'add' && 'Tambah Produk'}
                {modalType === 'edit' && 'Edit Produk'}
                {modalType === 'view' && 'Detail Order'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {modalType === 'view' && selectedItem && 'customerName' in selectedItem && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="text-sm text-gray-900">{selectedItem.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total</label>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedItem.total)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedItem.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Produk</label>
                  <div className="space-y-2">
                    {selectedItem.products.map((product: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm text-gray-900">{product.name}</span>
                        <span className="text-sm text-gray-900">x{product.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {(modalType === 'add' || modalType === 'edit') && (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stok</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gambar</label>
                  <div
                    className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {productForm.image ? (
                      <div className="space-y-2">
                        <img src={productForm.image} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-lg" />
                        <p className="text-sm text-gray-600">Gambar berhasil diupload</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-gray-400">
                          <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">Drag and drop gambar atau klik untuk upload</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          Pilih Gambar
                        </label>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="mt-2 text-sm text-blue-600">Mengupload gambar...</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={modalType === 'add' ? handleAddProduct : handleEditProduct}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {modalType === 'add' ? 'Tambah' : 'Update'}
                  </button>
                </div>
              </form>
            )}

            {showModal && modalType === 'update-stock' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Perbarui Stok Produk</h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {selectedItem && 'name' in selectedItem && (
                    <p className="mb-3 text-gray-600">
                      <span className="font-medium">Produk:</span> {selectedItem.name}
                    </p>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium">Jumlah Stok</label>
                      <input
                        type="number"
                        className="w-full border rounded-lg px-3 py-2"
                        value={stockForm.stock}
                        onChange={(e) => setStockForm({ stock: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleUpdateStock}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showModal && modalType === 'add-category' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Tambah Kategori</h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium">Nama Kategori</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showModal && modalType === 'edit-category' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Edit Kategori</h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium">Nama Kategori</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleEditCategory}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Popup Alert */}
      <PopupAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
      />

      {/* Toast */}
      {ToastComponent}
    </div>
  );
};

export default AdminPanel;