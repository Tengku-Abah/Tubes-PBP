import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse, supabase } from '../../../lib/supabase';
import { getCookieUser } from '../../../lib/api-auth';

// Interface untuk Review response
interface ReviewResponse {
    id: number;
    productId: number;
    userId: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
}

// Interface untuk Review Statistics
interface ReviewStats {
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
}

// GET endpoint untuk mengambil ulasan
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const userId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const rating = searchParams.get('rating');
        const verified = searchParams.get('verified');

        // Build query parameters
        const queryParams: any = {
            productId: productId ? parseInt(productId) : undefined,
            userId: userId || undefined,
            page,
            limit,
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
            rating: rating ? parseInt(rating) : undefined,
            verified: verified ? verified === 'true' : undefined
        };

        // Get reviews from database
        const { data: reviews, error } = await dbHelpers.getReviews(queryParams);

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
            userId: review.user_id,
            userName: review.user_name,
            userAvatar: review.user_avatar,
            rating: review.rating,
            comment: review.comment,
            date: review.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            verified: review.verified,
            createdAt: review.created_at,
            updatedAt: review.updated_at
        })) || [];

        // Calculate statistics
        const stats = calculateReviewStats(transformedReviews);

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedReviews = transformedReviews.slice(startIndex, endIndex);

        const response: ApiResponse<ReviewResponse[]> = {
            success: true,
            data: paginatedReviews,
            stats: stats, // Include stats in response
            pagination: {
                page,
                limit,
                total: transformedReviews.length,
                totalPages: Math.ceil(transformedReviews.length / limit)
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Get reviews error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST endpoint untuk menambah ulasan baru
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = getCookieUser(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId, rating, comment, userAvatar } = body;

        // Validasi input
        if (!productId || !rating || !comment) {
            return NextResponse.json(
                { success: false, message: 'Product ID, rating, and comment are required' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, message: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        if (comment.trim().length < 10) {
            return NextResponse.json(
                { success: false, message: 'Comment must be at least 10 characters long' },
                { status: 400 }
            );
        }

        // Check if user already reviewed this product
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('product_id', parseInt(productId))
            .eq('user_id', user.id)
            .single();

        if (existingReview) {
            return NextResponse.json(
                { success: false, message: 'You have already reviewed this product' },
                { status: 409 }
            );
        }

        // Verify product exists
        const { data: product } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', parseInt(productId))
            .single();

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Create new review
        const reviewData = {
            product_id: parseInt(productId),
            user_id: user.id,
            user_name: user.name,
            user_avatar: userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
            rating: parseInt(rating),
            comment: comment.trim(),
            verified: false
        };

        const { data: newReview, error } = await dbHelpers.addReview(reviewData);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to add review' },
                { status: 500 }
            );
        }

        // Update product rating and review count
        await updateProductRating(parseInt(productId));

        // Transform to expected format
        const transformedReview: ReviewResponse = {
            id: newReview.id,
            productId: newReview.product_id,
            userId: newReview.user_id,
            userName: newReview.user_name,
            userAvatar: newReview.user_avatar,
            rating: newReview.rating,
            comment: newReview.comment,
            date: newReview.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            verified: newReview.verified,
            createdAt: newReview.created_at,
            updatedAt: newReview.updated_at
        };

        return NextResponse.json({
            success: true,
            message: 'Review added successfully',
            data: transformedReview
        }, { status: 201 });

    } catch (error) {
        console.error('Add review error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT endpoint untuk update ulasan
export async function PUT(request: NextRequest) {
    try {
        // Get authenticated user
        const user = getCookieUser(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, rating, comment } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Review ID is required' },
                { status: 400 }
            );
        }

        // Check if review exists and belongs to user
        const { data: existingReview, error: fetchError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', parseInt(id))
            .eq('user_id', user.id)
            .single();

        if (fetchError || !existingReview) {
            return NextResponse.json(
                { success: false, message: 'Review not found or access denied' },
                { status: 404 }
            );
        }

        // Validate input
        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json(
                { success: false, message: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        if (comment && comment.trim().length < 10) {
            return NextResponse.json(
                { success: false, message: 'Comment must be at least 10 characters long' },
                { status: 400 }
            );
        }

        // Update review
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (rating) updateData.rating = parseInt(rating);
        if (comment) updateData.comment = comment.trim();

        const { data: updatedReview, error } = await supabase
            .from('reviews')
            .update(updateData)
            .eq('id', parseInt(id))
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
        if (rating && rating !== existingReview.rating) {
            await updateProductRating(existingReview.product_id);
        }

        // Transform to expected format
        const transformedReview: ReviewResponse = {
            id: updatedReview.id,
            productId: updatedReview.product_id,
            userId: updatedReview.user_id,
            userName: updatedReview.user_name,
            userAvatar: updatedReview.user_avatar,
            rating: updatedReview.rating,
            comment: updatedReview.comment,
            date: updatedReview.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            verified: updatedReview.verified,
            createdAt: updatedReview.created_at,
            updatedAt: updatedReview.updated_at
        };

        return NextResponse.json({
            success: true,
            message: 'Review updated successfully',
            data: transformedReview
        });

    } catch (error) {
        console.error('Update review error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE endpoint untuk menghapus ulasan
export async function DELETE(request: NextRequest) {
    try {
        // Get authenticated user
        const user = getCookieUser(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Review ID is required' },
                { status: 400 }
            );
        }

        // Check if review exists and belongs to user (or user is admin)
        const { data: existingReview, error: fetchError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', parseInt(id))
            .single();

        if (fetchError || !existingReview) {
            return NextResponse.json(
                { success: false, message: 'Review not found' },
                { status: 404 }
            );
        }

        // Check if user owns the review or is admin
        if (existingReview.user_id !== user.id && user.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        // Delete review
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to delete review' },
                { status: 500 }
            );
        }

        // Update product rating after deletion
        await updateProductRating(existingReview.product_id);

        return NextResponse.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete review error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to calculate review statistics
function calculateReviewStats(reviews: ReviewResponse[]): ReviewStats {
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
        return {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            verifiedReviews: 0,
            recentReviews: 0
        };
    }

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    let verifiedCount = 0;
    let recentCount = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        totalRating += review.rating;

        if (review.verified) verifiedCount++;

        if (new Date(review.createdAt) > sevenDaysAgo) {
            recentCount++;
        }
    });

    return {
        totalReviews,
        averageRating: parseFloat((totalRating / totalReviews).toFixed(2)),
        ratingDistribution,
        verifiedReviews: verifiedCount,
        recentReviews: recentCount
    };
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

        // Calculate average rating - use precise calculation
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = parseFloat((totalRating / reviews.length).toFixed(2));

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
