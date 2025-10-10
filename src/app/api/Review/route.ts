import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse } from '../../../lib/supabase';

// Interface untuk Review response
interface ReviewResponse {
  id: number;
  productId: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

// Dummy data untuk ulasan
const dummyReviews: ReviewResponse[] = [
  {
    id: 1,
    productId: 1,
    userName: "Ahmad Rizki",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Produk sangat bagus, sesuai dengan deskripsi. Pengiriman cepat dan packaging rapi. Recommended!",
    date: "2024-01-15",
    verified: true
  },
  {
    id: 2,
    productId: 1,
    userName: "Siti Nurhaliza",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "Kualitas produk sangat memuaskan. Harga sesuai dengan kualitas yang diberikan. Akan beli lagi di sini.",
    date: "2024-01-12",
    verified: true
  },
  {
    id: 3,
    productId: 1,
    userName: "Budi Santoso",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Pelayanan customer service sangat responsif. Produk original dan berkualitas tinggi. Terima kasih!",
    date: "2024-01-10",
    verified: false
  },
  {
    id: 4,
    productId: 1,
    userName: "Dewi Kartika",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "Produk sesuai ekspektasi. Pengiriman tepat waktu dan kondisi produk sangat baik.",
    date: "2024-01-08",
    verified: true
  },
  {
    id: 5,
    productId: 1,
    userName: "Rizki Pratama",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Sangat puas dengan pembelian ini. Kualitas produk excellent dan harga kompetitif.",
    date: "2024-01-05",
    verified: true
  },
  {
    id: 6,
    productId: 2,
    userName: "Maya Sari",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Samsung Galaxy S24 Ultra sangat memuaskan! Kamera 200MP menghasilkan foto yang luar biasa.",
    date: "2024-01-14",
    verified: true
  },
  {
    id: 7,
    productId: 2,
    userName: "Andi Wijaya",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "S Pen sangat berguna untuk produktivitas. Layar AMOLED 2X sangat jernih dan responsif.",
    date: "2024-01-11",
    verified: true
  },
  {
    id: 8,
    productId: 3,
    userName: "Sarah Putri",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "MacBook Pro M3 sangat powerful! Performa editing video sangat smooth dan baterai tahan lama.",
    date: "2024-01-13",
    verified: true
  },
  {
    id: 9,
    productId: 3,
    userName: "David Kurniawan",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Layar Liquid Retina XDR sangat menakjubkan! Warna sangat akurat untuk design work.",
    date: "2024-01-09",
    verified: true
  },
  {
    id: 10,
    productId: 4,
    userName: "Lisa Maharani",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "Dell XPS 13 sangat ringan dan portable. Keyboard sangat nyaman untuk mengetik.",
    date: "2024-01-07",
    verified: true
  },
  {
    id: 11,
    productId: 5,
    userName: "Ryan Aditya",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "AirPods Pro 2 noise cancellation-nya luar biasa! Kualitas suara sangat jernih.",
    date: "2024-01-06",
    verified: true
  },
  {
    id: 12,
    productId: 5,
    userName: "Nina Sari",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "Baterai tahan lama dan charging case sangat praktis. Perfect untuk daily use.",
    date: "2024-01-04",
    verified: true
  },
  {
    id: 13,
    productId: 6,
    userName: "Fajar Nugroho",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Sony WH-1000XM5 adalah headphone terbaik yang pernah saya gunakan. Noise cancellation sempurna!",
    date: "2024-01-03",
    verified: true
  },
  {
    id: 14,
    productId: 7,
    userName: "Putri Ayu",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "iPad Pro 12.9 dengan Apple Pencil sangat sempurna untuk digital art. Layar sangat responsif!",
    date: "2024-01-02",
    verified: true
  },
  {
    id: 15,
    productId: 8,
    userName: "Hendra Pratama",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "Samsung Galaxy Tab S9 sangat bagus untuk multitasking. S Pen sangat presisi untuk note taking.",
    date: "2024-01-01",
    verified: true
  }
];

// GET endpoint untuk mengambil ulasan berdasarkan productId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get reviews from database
    const { data: reviews, error } = await dbHelpers.getReviews({
      productId: productId ? parseInt(productId) : undefined,
      page,
      limit
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Transform database reviews to expected format
    const transformedReviews = reviews?.map(review => ({
      id: review.id,
      productId: review.product_id,
      userName: review.user_name,
      userAvatar: review.user_avatar,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      verified: review.verified
    })) || [];

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = transformedReviews.slice(startIndex, endIndex);

    // Hitung statistik rating
    const ratingStats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    transformedReviews.forEach(review => {
      ratingStats[review.rating as keyof typeof ratingStats]++;
    });

    const totalReviews = transformedReviews.length;
    const averageRating = totalReviews > 0
      ? transformedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    return NextResponse.json({
      success: true,
      data: paginatedReviews,
      pagination: {
        page,
        limit,
        total: transformedReviews.length,
        totalPages: Math.ceil(transformedReviews.length / limit)
      },
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution: ratingStats
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint untuk menambah ulasan baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userName, userAvatar, rating, comment } = body;

    // Validasi input
    if (!productId || !userName || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Buat review baru di database
    const { data: newReview, error } = await dbHelpers.addReview({
      product_id: parseInt(productId),
      user_name: userName,
      user_avatar: userAvatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: parseInt(rating),
      comment,
      verified: false
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to add review' },
        { status: 500 }
      );
    }

    // Transform to expected format
    const transformedReview = {
      id: newReview.id,
      productId: newReview.product_id,
      userName: newReview.user_name,
      userAvatar: newReview.user_avatar,
      rating: newReview.rating,
      comment: newReview.comment,
      date: newReview.date,
      verified: newReview.verified
    };

    return NextResponse.json({
      success: true,
      message: 'Review added successfully',
      data: transformedReview
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
