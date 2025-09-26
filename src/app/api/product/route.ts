import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Product data now comes from Supabase database

// GET endpoint untuk mengambil semua produk atau detail produk berdasarkan ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Jika ada parameter id, kembalikan detail produk
    if (id) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      if (data) {
        return NextResponse.json({
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
            reviews: data.reviews_count
          }
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }
    }

    // Jika tidak ada id, kembalikan semua produk dengan filter
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter berdasarkan kategori
    if (category) {
      query = query.eq('category', category);
    }

    // Filter berdasarkan pencarian
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filter berdasarkan harga
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    query = query.range(startIndex, endIndex - 1);

    const { data, error, count } = await query;

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
      reviews: product.reviews_count
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
