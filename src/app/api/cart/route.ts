import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse } from '../../../lib/supabase';

// Cart item interface for API response
interface CartItemResponse {
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

// Cart data now comes from Supabase database

// GET endpoint untuk mengambil semua cart items
export async function GET(request: NextRequest) {
  try {
    // Get user ID from request headers or query params
    const userId = request.headers.get('user-id') || request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 401 }
      );
    }

    const { data, error } = await dbHelpers.getCartItems(userId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch cart items' },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const transformedData = data?.map(item => ({
      id: item.id,
      product: {
        id: (item.products as any)?.id,
        name: (item.products as any)?.name,
        price: (item.products as any)?.price,
        description: (item.products as any)?.description,
        image: (item.products as any)?.image,
        category: (item.products as any)?.category,
        stock: (item.products as any)?.stock,
        rating: (item.products as any)?.rating,
        reviews: (item.products as any)?.reviews_count
      },
      quantity: item.quantity
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData,
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

    // Get user ID from request headers or query params
    const userId = request.headers.get('user-id') || request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 401 }
      );
    }

    // Add item to cart using helper function
    const { data, error } = await dbHelpers.addToCart(userId, productId, quantity);

    if (error) {
      console.error('Add to cart error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to add item to cart' },
        { status: 500 }
      );
    }

    // Return updated cart items
    const { data: cartData } = await dbHelpers.getCartItems(userId);

    const transformedData = cartData?.map(item => ({
      id: item.id,
      product: {
        id: (item.products as any)?.id,
        name: (item.products as any)?.name,
        price: (item.products as any)?.price,
        description: (item.products as any)?.description,
        image: (item.products as any)?.image,
        category: (item.products as any)?.category,
        stock: (item.products as any)?.stock,
        rating: (item.products as any)?.rating,
        reviews: (item.products as any)?.reviews_count
      },
      quantity: item.quantity
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData,
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

    const { data, error } = await dbHelpers.updateCartItemQuantity(itemId, quantity);

    if (error) {
      console.error('Update cart item error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update cart item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
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

    const { data, error } = await dbHelpers.removeFromCart(parseInt(itemId));

    if (error) {
      console.error('Delete cart item error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to remove cart item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
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
