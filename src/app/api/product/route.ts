import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse, ProductWithReviews, getStoredAssetUrl } from '../../../lib/supabase';
import { getApiUser, getCookieUser } from '../../../lib/api-auth';

const normalizeProductForApi = (product: any): ProductWithReviews => ({
  id: product.id,
  name: product.name,
  price: product.price,
  description: product.description,
  image: getStoredAssetUrl(product.image, ''),
  category: product.category,
  stock: product.stock,
  rating: product.rating || 0,
  reviews: product.reviews_count || 0,
  reviews_count: product.reviews_count || 0,
  created_at: product.created_at,
  updated_at: product.updated_at
});

const requireAdminUser = (request: NextRequest) => {
  const user = getApiUser(request) || getCookieUser(request);
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
};

// GET endpoint untuk mengambil semua produk atau detail produk berdasarkan ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data, error } = await dbHelpers.getProductById(parseInt(id, 10));

      if (error || !data) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      const response: ApiResponse<ProductWithReviews> = {
        success: true,
        data: normalizeProductForApi(data)
      };
      return NextResponse.json(response);
    }

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const { data, error, count } = await dbHelpers.getProducts({
      category: category || undefined,
      search: search || undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
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

    const response: ApiResponse<ProductWithReviews[]> = {
      success: true,
      data: (data || []).map(normalizeProductForApi),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdminUser(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, price, stock, category, image, description } = body;

    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, message: 'Name, price, and stock are required' },
        { status: 400 }
      );
    }

    const { data, error } = await dbHelpers.createProduct({
      name: String(name).trim(),
      price: Number(price),
      stock: Number(stock),
      category: category ? String(category).trim() : '',
      image: image ? String(image).trim() : '',
      description: description ? String(description).trim() : ''
    });

    if (error || !data) {
      console.error('Create product error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: normalizeProductForApi(data),
      message: 'Product created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!requireAdminUser(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, price, stock, category, image, description, rating, reviews_count } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await dbHelpers.updateProduct(Number(id), {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(price !== undefined && { price: Number(price) }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(category !== undefined && { category: String(category).trim() }),
      ...(image !== undefined && { image: String(image).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(rating !== undefined && { rating: Number(rating) }),
      ...(reviews_count !== undefined && { reviews_count: Number(reviews_count) }),
    });

    if (error) {
      console.error('Update product error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update product' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: normalizeProductForApi(data),
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!requireAdminUser(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await dbHelpers.deleteProduct(Number(id));

    if (error) {
      console.error('Delete product error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete product' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: normalizeProductForApi(data),
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
