import { NextRequest, NextResponse } from 'next/server';

import { dbHelpers, getStoredAssetUrl } from '../../../lib/supabase';
import { getApiUser, getCookieUser } from '../../../lib/api-auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const getRequestUser = (request: NextRequest) => getApiUser(request) || getCookieUser(request);

const resolveAvatarUrlForApi = (raw: string | null, _name: string) => {
  return getStoredAssetUrl(raw, '/default-avatar.svg');
};

const transformOrderForApi = (order: any) => {
  const user = order.users || {};
  const name = user?.name || 'Unknown';
  const avatarPath = user?.user_avatar || null;
  const avatarUrl = resolveAvatarUrlForApi(avatarPath, name);

  return {
    id: order.id,
    order_number: order.order_number,
    tracking_number: order.order_number,
    customerName: name,
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    userId: user?.id || order.user_id || undefined,
    userAvatar: avatarUrl,
    items: order.order_items || [],
    order_items: order.order_items || [],
    totalAmount: order.total_amount,
    status: order.status,
    shippingAddress: {
      street: order.shipping_address || '',
      city: user?.Kota || '',
      postalCode: user?.Kode_pose || '',
      province: user?.Provinsi || ''
    },
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status || 'pending',
    orderDate: order.created_at,
    shippingDate: order.shipping_date || null,
    deliveryDate: order.delivery_date || null,
    notes: order.notes || null
  };
};

// GET endpoint untuk mengambil semua pesanan
export async function GET(request: NextRequest) {
  try {
    const requestUser = getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const id = searchParams.get('id');

    if (id) {
      const { data } = await dbHelpers.getOrders({ limit: 1000, page: 1 });
      const order = (data || []).find((item: any) => String(item.id) === String(id));

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      if (requestUser && requestUser.role !== 'admin' && String(order.user_id) !== String(requestUser.id)) {
        return NextResponse.json(
          { success: false, message: 'Forbidden' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: transformOrderForApi(order),
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

    const transformedOrders = (data || []).map(transformOrderForApi);

    return NextResponse.json({
      success: true,
      data: transformedOrders,
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

    const sessionUser = getRequestUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (sessionUser.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admins cannot create orders' },
        { status: 403 }
      );
    }

    const requestedUserId = request.headers.get('user-id') || request.nextUrl.searchParams.get('user_id');
    const userId = sessionUser.id?.toString();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User session invalid' },
        { status: 401 }
      );
    }

    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Cannot create orders for another user' },
        { status: 403 }
      );
    }

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

    const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

    const stockItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const { error: stockError } = await dbHelpers.reduceMultipleProductsStock(stockItems);

    if (stockError) {
      console.error('Stock reduction error:', stockError);
      return NextResponse.json(
        { success: false, message: `Stock error: ${(stockError as any).message}` },
        { status: 400 }
      );
    }

    const { data: newOrder, error } = await dbHelpers.createOrder({
      user_id: String(userId),
      order_number: `ORD-${Date.now()}`,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postalCode}`,
      payment_method: paymentMethod || 'cash_on_delivery',
      notes: notes || undefined,
      payment_status: 'pending'
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
    const requestUser = getRequestUser(request);
    if (!requestUser || requestUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, paymentStatus, shippingDate, deliveryDate, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    const orderId = typeof id === 'string' ? parseInt(id, 10) : id;
    const { data: currentOrder } = await dbHelpers.getOrderById(orderId);

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (status === 'shipped') {
      if (currentOrder.status !== 'processing') {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot ship order with status '${currentOrder.status}'. Order must be in 'processing' status first.`
          },
          { status: 400 }
        );
      }

      if (!currentOrder.order_number) {
        return NextResponse.json(
          { success: false, message: 'Order number is missing. Cannot generate tracking number.' },
          { status: 500 }
        );
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.payment_status = paymentStatus;
    if (shippingDate) updateData.shipping_date = shippingDate;
    if (deliveryDate) updateData.delivery_date = deliveryDate;
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'shipped' && !shippingDate) updateData.shipping_date = new Date().toISOString();
    if (status === 'delivered' && !deliveryDate) updateData.delivery_date = new Date().toISOString();

    const { data, error } = await dbHelpers.updateOrder(orderId, updateData);

    if (error) {
      console.error('Database update error:', error);
      const errorMessage = typeof error === 'object' ? JSON.stringify(error) : String(error);
      return NextResponse.json(
        { success: false, message: `Database error: ${errorMessage}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    const refreshed = await query(
      `
        select
          o.*,
          u.id as user_ref_id,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          u.user_avatar as user_avatar,
          u."Provinsi" as "Provinsi",
          u."Kota" as "Kota",
          u."Kode_pose" as "Kode_pose"
        from orders o
        left join users u on u.id = o.user_id
        where o.id = $1
        limit 1
      `,
      [orderId]
    );

    const orderRow = refreshed.rows[0];
    const orderData = {
      ...data,
      users: orderRow ? {
        id: orderRow.user_ref_id,
        name: orderRow.user_name,
        email: orderRow.user_email,
        phone: orderRow.user_phone,
        user_avatar: orderRow.user_avatar,
        Provinsi: orderRow.Provinsi,
        Kota: orderRow.Kota,
        Kode_pose: orderRow.Kode_pose,
      } : null,
      order_items: []
    };

    return NextResponse.json({
      success: true,
      message: data.status === 'shipped'
        ? `Order shipped successfully. Tracking number: ${data.order_number}`
        : 'Order updated successfully',
      data: transformOrderForApi(orderData)
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
    const requestUser = getRequestUser(request);
    if (!requestUser || requestUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await dbHelpers.deleteOrder(parseInt(id, 10));

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
      data,
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
