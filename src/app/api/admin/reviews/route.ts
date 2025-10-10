import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse, supabase } from '../../../lib/supabase';
import { requireApiAdmin, getCookieUser } from '../../../lib/api-auth';

// Interface untuk Admin Review Management
interface AdminReviewResponse {
    id: number;
    productId: number;
    productName: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
}

// Interface untuk Review Analytics
interface ReviewAnalytics {
    totalReviews: number;
    averageRating: number;
    verifiedReviews: number;
    pendingVerification: number;
    recentReviews: number;
    topRatedProducts: Array<{
        productId: number;
        productName: string;
        averageRating: number;
        reviewCount: number;
    }>;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
    monthlyStats: Array<{
        month: string;
        reviews: number;
        averageRating: number;
    }>;
}

// GET endpoint untuk admin review management
export async function GET(request: NextRequest) {
    try {
        // Require admin authentication
        const user = requireApiAdmin(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'list';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const verified = searchParams.get('verified');
        const rating = searchParams.get('rating');
        const productId = searchParams.get('productId');
        const userId = searchParams.get('userId');

        switch (action) {
            case 'analytics':
                return await getReviewAnalytics(request);

            case 'list':
            default:
                return await getReviewList(request, {
                    page,
                    limit,
                    sortBy,
                    sortOrder: sortOrder as 'asc' | 'desc',
                    verified: verified ? verified === 'true' : undefined,
                    rating: rating ? parseInt(rating) : undefined,
                    productId: productId ? parseInt(productId) : undefined,
                    userId: userId || undefined
                });
        }

    } catch (error) {
        console.error('Admin review GET error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT endpoint untuk admin review management (verify, update, etc.)
export async function PUT(request: NextRequest) {
    try {
        // Require admin authentication
        const user = requireApiAdmin(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, action, verified, comment, rating } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Review ID is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'verify':
                return await verifyReview(parseInt(id), verified);

            case 'update':
                return await updateReview(parseInt(id), { comment, rating });

            default:
                return NextResponse.json(
                    { success: false, message: 'Invalid action' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Admin review PUT error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to get review list for admin
async function getReviewList(request: NextRequest, params: any) {
    const { page, limit, sortBy, sortOrder, verified, rating, productId, userId } = params;

    // Build query
    let query = supabase
        .from('reviews')
        .select(`
      *,
      products (
        id,
        name
      ),
      users (
        id,
        name,
        email
      )
    `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (verified !== undefined) {
        query = query.eq('verified', verified);
    }

    if (rating) {
        query = query.eq('rating', rating);
    }

    if (productId) {
        query = query.eq('product_id', productId);
    }

    if (userId) {
        query = query.eq('user_id', userId);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;
    query = query.range(startIndex, endIndex);

    const { data: reviews, error } = await query;

    if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }

    // Transform data
    const transformedReviews: AdminReviewResponse[] = reviews?.map(review => ({
        id: review.id,
        productId: review.product_id,
        productName: (review.products as any)?.name || 'Unknown Product',
        userId: review.user_id,
        userName: review.user_name,
        userEmail: (review.users as any)?.email || '',
        userAvatar: review.user_avatar,
        rating: review.rating,
        comment: review.comment,
        date: review.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        verified: review.verified,
        createdAt: review.created_at,
        updatedAt: review.updated_at
    })) || [];

    // Get total count for pagination
    const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

    const response: ApiResponse<AdminReviewResponse[]> = {
        success: true,
        data: transformedReviews,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    };

    return NextResponse.json(response);
}

// Helper function to get review analytics
async function getReviewAnalytics(request: NextRequest) {
    try {
        // Get all reviews with product and user info
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select(`
        *,
        products (
          id,
          name
        )
      `);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to fetch analytics data' },
                { status: 500 }
            );
        }

        if (!reviews || reviews.length === 0) {
            const emptyAnalytics: ReviewAnalytics = {
                totalReviews: 0,
                averageRating: 0,
                verifiedReviews: 0,
                pendingVerification: 0,
                recentReviews: 0,
                topRatedProducts: [],
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                monthlyStats: []
            };

            return NextResponse.json({
                success: true,
                data: emptyAnalytics
            });
        }

        // Calculate basic stats
        const totalReviews = reviews.length;
        const verifiedReviews = reviews.filter(r => r.verified).length;
        const pendingVerification = totalReviews - verifiedReviews;

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

        // Calculate top rated products
        const productStats = new Map();
        reviews.forEach(review => {
            const productId = review.product_id;
            const productName = (review.products as any)?.name || 'Unknown Product';

            if (!productStats.has(productId)) {
                productStats.set(productId, {
                    productId,
                    productName,
                    ratings: [],
                    reviewCount: 0
                });
            }

            const stats = productStats.get(productId);
            stats.ratings.push(review.rating);
            stats.reviewCount++;
        });

        const topRatedProducts = Array.from(productStats.values())
            .map(stats => ({
                productId: stats.productId,
                productName: stats.productName,
                averageRating: Math.round((stats.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / stats.ratings.length) * 10) / 10,
                reviewCount: stats.reviewCount
            }))
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 10);

        // Calculate monthly stats (last 12 months)
        const monthlyStats = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const monthReviews = reviews.filter(review => {
                const reviewDate = new Date(review.created_at);
                return reviewDate >= month && reviewDate < nextMonth;
            });

            const monthAverageRating = monthReviews.length > 0
                ? Math.round((monthReviews.reduce((sum, review) => sum + review.rating, 0) / monthReviews.length) * 10) / 10
                : 0;

            monthlyStats.push({
                month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                reviews: monthReviews.length,
                averageRating: monthAverageRating
            });
        }

        const analytics: ReviewAnalytics = {
            totalReviews,
            averageRating,
            verifiedReviews,
            pendingVerification,
            recentReviews,
            topRatedProducts,
            ratingDistribution,
            monthlyStats
        };

        return NextResponse.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to generate analytics' },
            { status: 500 }
        );
    }
}

// Helper function to verify/unverify review
async function verifyReview(reviewId: number, verified: boolean) {
    const { data, error } = await supabase
        .from('reviews')
        .update({ verified, updated_at: new Date().toISOString() })
        .eq('id', reviewId)
        .select()
        .single();

    if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update review verification' },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        message: `Review ${verified ? 'verified' : 'unverified'} successfully`,
        data: data
    });
}

// Helper function to update review (admin only)
async function updateReview(reviewId: number, updateData: { comment?: string; rating?: number }) {
    const updateFields: any = {
        updated_at: new Date().toISOString()
    };

    if (updateData.comment) updateFields.comment = updateData.comment.trim();
    if (updateData.rating) updateFields.rating = updateData.rating;

    const { data, error } = await supabase
        .from('reviews')
        .update(updateFields)
        .eq('id', reviewId)
        .select()
        .single();

    if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update review' },
            { status: 500 }
        );
    }

    // Update product rating if rating changed
    if (updateData.rating) {
        await updateProductRating(data.product_id);
    }

    return NextResponse.json({
        success: true,
        message: 'Review updated successfully',
        data: data
    });
}

// Helper function to update product rating and review count
async function updateProductRating(productId: number) {
    try {
        // Get all reviews for this product
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', productId);

        if (!reviews || reviews.length === 0) {
            // No reviews, set default values
            await supabase
                .from('products')
                .update({
                    rating: 0,
                    reviews_count: 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);
            return;
        }

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

        // Update product
        await supabase
            .from('products')
            .update({
                rating: averageRating,
                reviews_count: reviews.length,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId);

    } catch (error) {
        console.error('Error updating product rating:', error);
    }
}
