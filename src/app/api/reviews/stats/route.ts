import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse, supabase } from '../../../lib/supabase';

// Interface untuk Product Review Statistics
interface ProductReviewStats {
    productId: number;
    productName: string;
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
    verifiedReviews: number;
    recentReviews: number;
    topReviews: Array<{
        id: number;
        userName: string;
        userAvatar: string;
        rating: number;
        comment: string;
        date: string;
        verified: boolean;
    }>;
}

// GET endpoint untuk mendapatkan statistik review per produk
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') || '5');

        if (!productId) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

        // Get product info
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', parseInt(productId))
            .single();

        if (productError || !product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Get all reviews for this product
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', parseInt(productId))
            .order('created_at', { ascending: false });

        if (reviewsError) {
            console.error('Database error:', reviewsError);
            return NextResponse.json(
                { success: false, message: 'Failed to fetch reviews' },
                { status: 500 }
            );
        }

        if (!reviews || reviews.length === 0) {
            const emptyStats: ProductReviewStats = {
                productId: parseInt(productId),
                productName: product.name,
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                verifiedReviews: 0,
                recentReviews: 0,
                topReviews: []
            };

            return NextResponse.json({
                success: true,
                data: emptyStats
            });
        }

        // Calculate statistics
        const totalReviews = reviews.length;
        const verifiedReviews = reviews.filter(r => r.verified).length;

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

        // Calculate rating distribution
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        });

        // Calculate recent reviews (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentReviews = reviews.filter(review =>
            new Date(review.created_at) > sevenDaysAgo
        ).length;

        // Get top reviews (highest rated, verified first)
        const topReviews = reviews
            .sort((a, b) => {
                // Sort by verified first, then by rating, then by date
                if (a.verified !== b.verified) {
                    return b.verified ? 1 : -1;
                }
                if (a.rating !== b.rating) {
                    return b.rating - a.rating;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, limit)
            .map(review => ({
                id: review.id,
                userName: review.user_name,
                userAvatar: review.user_avatar,
                rating: review.rating,
                comment: review.comment,
                date: review.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                verified: review.verified
            }));

        const stats: ProductReviewStats = {
            productId: parseInt(productId),
            productName: product.name,
            totalReviews,
            averageRating,
            ratingDistribution,
            verifiedReviews,
            recentReviews,
            topReviews
        };

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get product review stats error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
