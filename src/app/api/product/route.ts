import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse, Product } from '../../../lib/supabase';
import { requireApiAdmin, getCookieUser } from '../../../lib/api-auth';

// Product data now comes from Supabase database

// GET endpoint untuk mengambil semua produk atau detail produk berdasarkan ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Jika ada parameter id, kembalikan detail produk
    if (id) {
      const { data, error } = await dbHelpers.getProductById(parseInt(id));

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      if (data) {
        const response: ApiResponse<Product> = {
          success: true,
          data: {
            id: data.id,
            name: data.name,
            price: data.price,
            description: data.description,
            image: data.image,
            category: data.category,
            stock: data.stock,
            rating: data.rating,
            reviews_count: data.reviews_count,
            created_at: data.created_at,
            updated_at: data.updated_at
          }
        };
        return NextResponse.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          message: 'Product not found'
        };
        return NextResponse.json(response, { status: 404 });
      }
    }

    // Jika tidak ada id, kembalikan semua produk dengan filter
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error, count } = await dbHelpers.getProducts({
      category: category || undefined,
      search: search || undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      page,
      limit
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    const transformedData = data?.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image,
      category: product.category,
      stock: product.stock,
      rating: product.rating,
      reviews_count: product.reviews_count,
      created_at: product.created_at,
      updated_at: product.updated_at
    })) || [];

    const response: ApiResponse<Product[]> = {
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
