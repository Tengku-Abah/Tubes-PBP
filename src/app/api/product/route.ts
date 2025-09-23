import { NextRequest, NextResponse } from 'next/server';

// Dummy product data
const dummyProducts = [
  {
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
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 18999000,
    description: "Samsung Galaxy S24 Ultra dengan S Pen dan kamera 200MP",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
    category: "Smartphone",
    stock: 18,
    rating: 4.7,
    reviews: 892
  },
  {
    id: 3,
    name: "MacBook Pro M3",
    price: 24999000,
    description: "MacBook Pro 14-inch dengan chip M3 dan layar Liquid Retina XDR",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    category: "Laptop",
    stock: 12,
    rating: 4.9,
    reviews: 567
  },
  {
    id: 4,
    name: "Dell XPS 13",
    price: 18999000,
    description: "Dell XPS 13 dengan Intel Core i7 dan layar 13.4 inch",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500",
    category: "Laptop",
    stock: 8,
    rating: 4.6,
    reviews: 423
  },
  {
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
  {
    id: 6,
    name: "Sony WH-1000XM5",
    price: 4999000,
    description: "Sony WH-1000XM5 headphone dengan noise cancellation terbaik",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    category: "Audio",
    stock: 22,
    rating: 4.7,
    reviews: 1834
  },
  {
    id: 7,
    name: "iPad Pro 12.9",
    price: 17999000,
    description: "iPad Pro 12.9-inch dengan chip M2 dan Apple Pencil support",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500",
    category: "Tablet",
    stock: 15,
    rating: 4.8,
    reviews: 789
  },
  {
    id: 8,
    name: "Samsung Galaxy Tab S9",
    price: 12999000,
    description: "Samsung Galaxy Tab S9 dengan S Pen dan layar 11 inch",
    image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500",
    category: "Tablet",
    stock: 20,
    rating: 4.5,
    reviews: 456
  },
  {
    id: 9,
    name: "Apple Watch Series 9",
    price: 5999000,
    description: "Apple Watch Series 9 dengan chip S9 dan health monitoring",
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500",
    category: "Wearable",
    stock: 30,
    rating: 4.6,
    reviews: 1234
  },
  {
    id: 10,
    name: "Samsung Galaxy Watch 6",
    price: 3999000,
    description: "Samsung Galaxy Watch 6 dengan health tracking dan GPS",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    category: "Wearable",
    stock: 25,
    rating: 4.4,
    reviews: 678
  }
];

// GET endpoint untuk mengambil semua produk atau detail produk berdasarkan ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Jika ada parameter id, kembalikan detail produk
    if (id) {
      const product = dummyProducts.find(p => p.id === parseInt(id));
      if (product) {
        return NextResponse.json({
          success: true,
          data: product
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

    let filteredProducts = [...dummyProducts];

    // Filter berdasarkan kategori
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter berdasarkan pencarian
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter berdasarkan harga
    if (minPrice) {
      filteredProducts = filteredProducts.filter(product => 
        product.price >= parseInt(minPrice)
      );
    }

    if (maxPrice) {
      filteredProducts = filteredProducts.filter(product => 
        product.price <= parseInt(maxPrice)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
