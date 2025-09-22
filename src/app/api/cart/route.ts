import { NextRequest, NextResponse } from 'next/server';

// Cart item interface
interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
    stock: number;
    rating: number;
    reviews: number;
  };
  quantity: number;
}

// Mock cart data
let cartItems: CartItem[] = [
  {
    id: 1,
    product: {
      id: 1,
      name: "iPhone 15 Pro",
      price: 15999000,
      description: "iPhone 15 Pro dengan chip A17 Pro dan kamera 48MP",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
      category: "Smartphone",
      stock: 25,
      rating: 4.8,
      reviews: 1247
    },
    quantity: 2
  },
  {
    id: 2,
    product: {
      id: 5,
      name: "AirPods Pro 2",
      price: 3999000,
      description: "AirPods Pro generasi kedua dengan Active Noise Cancellation",
      image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500",
      category: "Audio",
      stock: 45,
      rating: 4.8,
      reviews: 2156
    },
    quantity: 1
  }
];

// GET endpoint untuk mengambil semua cart items
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: cartItems,
      message: 'Cart items retrieved successfully'
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint untuk menambah item ke cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // Validasi input
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Cek apakah item sudah ada di cart
    const existingItem = cartItems.find(item => item.product.id === productId);
    
    if (existingItem) {
      // Update quantity jika item sudah ada
      existingItem.quantity += quantity;
    } else {
      // Tambah item baru ke cart
      // In a real app, you would fetch product data from product API
      const newItem: CartItem = {
        id: cartItems.length + 1,
        product: {
          id: productId,
          name: `Product ${productId}`,
          price: 1000000,
          description: `Description for product ${productId}`,
          image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500",
          category: "Other",
          stock: 10,
          rating: 4.0,
          reviews: 0
        },
        quantity: quantity
      };
      cartItems.push(newItem);
    }

    return NextResponse.json({
      success: true,
      data: cartItems,
      message: 'Item added to cart successfully'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint untuk update quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, quantity } = body;

    // Validasi input
    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'Item ID and quantity are required' },
        { status: 400 }
      );
    }

    const itemIndex = cartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Cart item not found' },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cartItems.splice(itemIndex, 1);
    } else {
      // Update quantity
      cartItems[itemIndex].quantity = quantity;
    }

    return NextResponse.json({
      success: true,
      data: cartItems,
      message: 'Cart updated successfully'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint untuk menghapus item dari cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'Item ID is required' },
        { status: 400 }
      );
    }

    const itemIndex = cartItems.findIndex(item => item.id === parseInt(itemId));
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Cart item not found' },
        { status: 404 }
      );
    }

    const deletedItem = cartItems.splice(itemIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: cartItems,
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
