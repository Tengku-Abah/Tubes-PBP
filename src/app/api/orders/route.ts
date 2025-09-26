import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Interface untuk pesanan
interface Order {
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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('Fetching orders from database...');

    // Query builder untuk mengambil data dari database
    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        order_number,
        total_amount,
        status,
        shipping_address,
        payment_method,
        created_at,
        updated_at,
        users(name, email)
      `)
      .order('created_at', { ascending: false });

    // Filter berdasarkan status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter berdasarkan email customer
    if (customerEmail) {
      query = query.ilike('users.email', `%${customerEmail}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    // Transform data dari database ke format yang diharapkan frontend
    const transformedOrders = data?.map(order => ({
      id: order.id,
      customerName: (order.users as any)?.name || 'Unknown',
      customerEmail: (order.users as any)?.email || '',
      customerPhone: '', // Phone tidak tersedia di tabel users
      items: [], // TODO: Implement order items relationship
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

    console.log(`Retrieved ${transformedOrders.length} orders from database`);

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
      paymentMethod,
      notes
    } = body;

    // Validasi input
    if (!customerName || !customerEmail || !customerPhone || !items || !shippingAddress) {
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

    // Buat pesanan baru di database
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        user_id: 'a4bc7b55-bee9-4f13-8486-9cb8bb92be29', // TODO: Get from auth
        order_number: `ORD-${Date.now()}`,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: `${shippingAddress.street}, ${shippingAddress.city}`,
        payment_method: paymentMethod || 'cash_on_delivery',
        notes: notes
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
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
    const body = await request.json();
    const { id, status, paymentStatus, shippingDate, deliveryDate, notes } = body;

    // Validasi input
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('Updating order in database:', { id, status, paymentStatus });

    // Update data di database
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (paymentStatus) updateData.payment_status = paymentStatus;
    if (shippingDate) updateData.shipping_date = shippingDate;
    if (deliveryDate) updateData.delivery_date = deliveryDate;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        user_id,
        order_number,
        total_amount,
        status,
        shipping_address,
        payment_method,
        created_at,
        updated_at,
        users(name, email)
      `)
      .single();

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Transform data untuk response
    const transformedOrder = {
      id: data.id,
      customerName: (data.users as any)?.name || 'Unknown',
      customerEmail: (data.users as any)?.email || '',
      customerPhone: (data.users as any)?.phone || '',
      items: [], // TODO: Implement order items relationship
      totalAmount: data.total_amount,
      status: data.status,
      shippingAddress: {
        street: data.shipping_address || '',
        city: '',
        postalCode: '',
        province: ''
      },
      paymentMethod: data.payment_method,
      paymentStatus: 'pending', // TODO: Add payment_status field
      orderDate: data.created_at,
      shippingDate: null,
      deliveryDate: null,
      notes: null
    };

    console.log('Order updated successfully in database');

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: 'Order updated successfully in database'
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

    console.log('Deleting order from database:', id);

    // Hapus dari database
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Order deleted successfully from database');

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
