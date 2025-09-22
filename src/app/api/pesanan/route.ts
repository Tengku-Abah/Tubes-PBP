import { NextRequest, NextResponse } from 'next/server';

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

// Dummy data pesanan
let orders: Order[] = [
  {
    id: 1,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '081234567890',
    items: [
      {
        productId: 1,
        productName: 'iPhone 15 Pro',
        quantity: 1,
        price: 15999000
      },
      {
        productId: 5,
        productName: 'AirPods Pro 2',
        quantity: 1,
        price: 3999000
      }
    ],
    totalAmount: 19999000,
    status: 'delivered',
    shippingAddress: {
      street: 'Jl. Sudirman No. 123',
      city: 'Jakarta',
      postalCode: '12190',
      province: 'DKI Jakarta'
    },
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    orderDate: '2024-01-15T10:30:00Z',
    shippingDate: '2024-01-16T09:00:00Z',
    deliveryDate: '2024-01-18T14:30:00Z',
    notes: 'Please deliver after 2 PM'
  },
  {
    id: 2,
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '081234567891',
    items: [
      {
        productId: 3,
        productName: 'MacBook Pro M3',
        quantity: 1,
        price: 24999000
      }
    ],
    totalAmount: 24999000,
    status: 'shipped',
    shippingAddress: {
      street: 'Jl. Thamrin No. 456',
      city: 'Jakarta',
      postalCode: '10350',
      province: 'DKI Jakarta'
    },
    paymentMethod: 'bank_transfer',
    paymentStatus: 'paid',
    orderDate: '2024-01-14T15:45:00Z',
    shippingDate: '2024-01-17T08:00:00Z'
  },
  {
    id: 3,
    customerName: 'Bob Johnson',
    customerEmail: 'bob@example.com',
    customerPhone: '081234567892',
    items: [
      {
        productId: 2,
        productName: 'Samsung Galaxy S24 Ultra',
        quantity: 2,
        price: 18999000
      }
    ],
    totalAmount: 37998000,
    status: 'processing',
    shippingAddress: {
      street: 'Jl. Gatot Subroto No. 789',
      city: 'Bandung',
      postalCode: '40112',
      province: 'Jawa Barat'
    },
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'pending',
    orderDate: '2024-01-13T11:20:00Z'
  },
  {
    id: 4,
    customerName: 'Alice Brown',
    customerEmail: 'alice@example.com',
    customerPhone: '081234567893',
    items: [
      {
        productId: 6,
        productName: 'Sony WH-1000XM5',
        quantity: 1,
        price: 4999000
      }
    ],
    totalAmount: 4999000,
    status: 'pending',
    shippingAddress: {
      street: 'Jl. Malioboro No. 321',
      city: 'Yogyakarta',
      postalCode: '55111',
      province: 'DI Yogyakarta'
    },
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    orderDate: '2024-01-12T16:15:00Z'
  },
  {
    id: 5,
    customerName: 'Charlie Wilson',
    customerEmail: 'charlie@example.com',
    customerPhone: '081234567894',
    items: [
      {
        productId: 7,
        productName: 'iPad Pro 12.9',
        quantity: 1,
        price: 17999000
      }
    ],
    totalAmount: 17999000,
    status: 'cancelled',
    shippingAddress: {
      street: 'Jl. Diponegoro No. 654',
      city: 'Surabaya',
      postalCode: '60241',
      province: 'Jawa Timur'
    },
    paymentMethod: 'bank_transfer',
    paymentStatus: 'refunded',
    orderDate: '2024-01-11T09:30:00Z',
    notes: 'Customer requested cancellation'
  }
];

// GET endpoint untuk mengambil semua pesanan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredOrders = [...orders];

    // Filter berdasarkan status
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // Filter berdasarkan email customer
    if (customerEmail) {
      filteredOrders = filteredOrders.filter(order => 
        order.customerEmail.toLowerCase().includes(customerEmail.toLowerCase())
      );
    }

    // Sort berdasarkan tanggal terbaru
    filteredOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      },
      message: 'Orders retrieved successfully'
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

    // Buat pesanan baru
    const newOrder: Order = {
      id: orders.length + 1,
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      status: 'pending',
      shippingAddress,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      paymentStatus: 'pending',
      orderDate: new Date().toISOString(),
      notes
    };

    orders.push(newOrder);

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

    const orderIndex = orders.findIndex(order => order.id === parseInt(id));
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Update pesanan
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(shippingDate && { shippingDate }),
      ...(deliveryDate && { deliveryDate }),
      ...(notes !== undefined && { notes })
    };

    return NextResponse.json({
      success: true,
      data: orders[orderIndex],
      message: 'Order updated successfully'
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

    const orderIndex = orders.findIndex(order => order.id === parseInt(id));
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    const deletedOrder = orders.splice(orderIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedOrder,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
