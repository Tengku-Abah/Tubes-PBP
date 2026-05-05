import { NextRequest, NextResponse } from 'next/server';

import { dbHelpers } from '@/lib/supabase';
import { getApiUser, getCookieUser } from '@/lib/api-auth';

const requireAdminUser = (request: NextRequest) => {
  const user = getApiUser(request) || getCookieUser(request);
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
};

export async function GET() {
  try {
    const { data, error } = await dbHelpers.getCategories();

    if (error) {
      console.error('Get categories error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Get categories error:', error);
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await dbHelpers.addCategory({ name: String(name).trim() });

    if (error || !data) {
      console.error('Create category error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Category created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
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
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: 'Category ID and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await dbHelpers.updateCategory(Number(id), { name: String(name).trim() });

    if (error) {
      console.error('Update category error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update category' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Update category error:', error);
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
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await dbHelpers.deleteCategory(Number(id));

    if (error) {
      console.error('Delete category error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete category' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
