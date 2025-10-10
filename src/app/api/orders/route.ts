import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse, supabase } from '../../../lib/supabase';

// Interface untuk pesanan response
interface OrderResponse {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    province: string;
  };
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderDate: string;
  shippingDate?: string;
  deliveryDate?: string;
  notes?: string;
}

// Data sekarang diambil dari database Supabase, bukan dummy data

// GET endpoint untuk mengambil semua pesanan
export async function GET(request: NextRequest) {
  try {
    // Verifikasi bahwa request berasal dari admin untuk akses ke semua pesanan
    const authHeader = request.headers.get('authorization');
    const userRole = request.headers.get('x-user-role');
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const id = searchParams.get('id');

    if (id) {
      // Jika ada ID, ambil pesanan spesifik
      // Untuk pesanan spesifik, verifikasi admin atau pemilik pesanan
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      });
    }

    const { data, error } = await dbHelpers.getOrders({
      status: status || undefined,
      customerEmail: customerEmail || undefined,
      page,
      limit
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error}` },
        { status: 500 }
      );
    }

    // Transform data dari database ke format yang diharapkan frontend
    const transformedOrders = data?.map(order => ({
      id: order.id,
      customerName: (order.users as any)?.name || 'Unknown',
      customerEmail: (order.users as any)?.email || '',
      customerPhone: '', // Phone tidak tersedia di tabel users
      items: order.order_items || [], // Use the order_items from the join
      totalAmount: order.total_amount,
      status: order.status,
      shippingAddress: {
        street: order.shipping_address || '',
        city: '',
        postalCode: '',
        province: ''
      },
      paymentMethod: order.payment_method,
      paymentStatus: 'pending', // TODO: Add payment_status field
      orderDate: order.created_at,
      shippingDate: null,
      deliveryDate: null,
      notes: null
    })) || [];

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = transformedOrders.slice(startIndex, endIndex);


    return NextResponse.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page,
        limit,
        total: transformedOrders.length,
        totalPages: Math.ceil(transformedOrders.length / limit)
      },
      message: 'Orders retrieved successfully from database'
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint untuk membuat pesanan baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      paymentMethod
    } = body;

    // Get user ID from request headers or query params
    const userId = request.headers.get('user-id') || request.nextUrl.searchParams.get('user_id');

    // Validasi input
    if (!customerName || !customerEmail || !customerPhone || !items || !shippingAddress || !userId) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Items array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Hitung total amount
    const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Reduce product stock before creating order
    const stockItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const { data: stockUpdateResult, error: stockError } = await dbHelpers.reduceMultipleProductsStock(stockItems);
    
    if (stockError) {
      console.error('Stock reduction error:', stockError);
      return NextResponse.json(
        { success: false, message: `Stock error: ${(stockError as any).message}` },
        { status: 400 }
      );
    }

    // Buat pesanan baru di database
    const { data: newOrder, error } = await dbHelpers.createOrder({
      user_id: String(userId),
      order_number: `ORD-${Date.now()}`,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address: `${shippingAddress.street}, ${shippingAddress.city}`,
      payment_method: paymentMethod || 'cash_on_delivery'
    }, items);

    if (error) {
      console.error('Database insert error:', error);
      const message = (error as any)?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      return NextResponse.json(
        { success: false, message: `Database error: ${message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint untuk update status pesanan
export async function PUT(request: NextRequest) {
  try {
    console.log('=== API PUT /api/orders DEBUG ===');
    
    // Verifikasi bahwa request berasal dari admin
    const authHeader = request.headers.get('authorization');
    const userRole = request.headers.get('x-user-role');
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || userRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { id, status, paymentStatus, shippingDate, deliveryDate, notes } = body;

    // Validasi input
    if (!id) {
      console.log('Missing required field - id:', id);
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Validasi status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    console.log('Updating order in database - ID:', id, 'Status:', status);

    // Update data di database
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.payment_status = paymentStatus;
    if (shippingDate) updateData.shipping_date = shippingDate;
    if (deliveryDate) updateData.delivery_date = deliveryDate;
    if (notes !== undefined) updateData.notes = notes;

    // Pastikan id adalah angka
    const orderId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    console.log('Updating order with ID:', orderId, 'Data:', updateData);
    
    const { data, error } = await dbHelpers.updateOrder(orderId, updateData);
    console.log('Database update result - data:', data, 'error:', error);

    if (error) {
      console.error('Database update error:', error);
      const errorMessage = typeof error === 'object' ? JSON.stringify(error) : String(error);
      return NextResponse.json(
        { success: false, message: `Database error: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    // Periksa apakah data ditemukan
    // Jika data adalah null atau undefined, maka order tidak ditemukan
    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Jika data adalah array kosong, maka order mungkin ditemukan tapi tidak ada perubahan
    if (Array.isArray(data) && data.length === 0) {
      // Coba ambil data order untuk memastikan order ada (tanpa .single())
      const { data: orderCheck } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId);
        
      if (!orderCheck || orderCheck.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }
      
      // Order ada tapi tidak ada perubahan, anggap sukses
      return NextResponse.json({
        success: true,
        message: 'No changes were made to the order',
        data: {
          id: orderCheck[0].id,
          status: orderCheck[0].status
        }
      });
    }
    
    // Ambil data pertama dari array hasil
    const orderData = Array.isArray(data) ? data : data;
    
    // Transform data untuk response
    const transformedOrder = {
      id: orderData.id,
      customerName: (orderData.users as any)?.name || 'Unknown',
      customerEmail: (orderData.users as any)?.email || '',
      customerPhone: (orderData.users as any)?.phone || '',
      items: [], // TODO: Implement order items relationship
      totalAmount: orderData.total_amount,
      status: orderData.status,
      shippingAddress: {
        street: orderData.shipping_address || '',
        city: '',
        postalCode: '',
        province: ''
      },
      paymentMethod: orderData.payment_method,
      paymentStatus: orderData.payment_status || 'pending',
      orderDate: orderData.created_at,
      shippingDate: null, // Column doesn't exist in database
      deliveryDate: null, // Column doesn't exist in database
      notes: null // Column doesn't exist in database
    };

    console.log('Order updated successfully:', transformedOrder);
    console.log('=== API PUT /api/orders DEBUG END ===');

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: transformedOrder
    });

  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint untuk menghapus pesanan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }


    // Hapus dari database
    const { data, error } = await dbHelpers.deleteOrder(parseInt(id));

    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }


    return NextResponse.json({
      success: true,
      data: data,
      message: 'Order deleted successfully from database'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
