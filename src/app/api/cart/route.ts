import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

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
    
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price,
          description,
          image,
          category,
          stock,
          rating,
          reviews_count
        )
      `)
      .eq('user_id', userId);

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

    // Cek apakah item sudah ada di cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update quantity jika item sudah ada
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select();

      if (error) {
        console.error('Update cart error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to update cart item' },
          { status: 500 }
        );
      }
    } else {
      // Tambah item baru ke cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity: quantity
        })
        .select();

      if (error) {
        console.error('Insert cart error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to add item to cart' },
          { status: 500 }
        );
      }
    }

    // Return updated cart items
    const { data: cartData } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price,
          description,
          image,
          category,
          stock,
          rating,
          reviews_count
        )
      `)
      .eq('user_id', userId);

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

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Delete cart item error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to remove cart item' },
          { status: 500 }
        );
      }
    } else {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) {
        console.error('Update cart item error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to update cart item' },
          { status: 500 }
        );
      }
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

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

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
