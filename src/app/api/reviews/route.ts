import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers, ApiResponse, supabase, supabaseAdmin } from '../../../lib/supabase';
import { getCookieUser, getApiUser } from '../../../lib/api-auth';

export const dynamic = 'force-dynamic';

// Normalisasi URL/path avatar menjadi public URL yang valid
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
const resolveAvatarUrlForApi = (raw: string | null | undefined, name: string): string => {
    if (!raw) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    }

    const val = String(raw);
    // Jika sudah berupa full URL
    if (/^https?:\/\//.test(val)) {
        // Perbaiki URL yang mengarah ke bucket yang tidak sesuai ("/public/avatars/")
        if (/\/storage\/v1\/object\/public\/avatars\//i.test(val)) {
            return val.replace(
                /\/storage\/v1\/object\/public\/avatars\//i,
                `/storage/v1/object/public/${STORAGE_BUCKET}/avatars/`
            );
        }
        return val;
    }

    // Jika berupa path relatif, asumsikan berada di bucket STORAGE_BUCKET
    // Contoh: 'avatars/filename.jpg' -> public URL pada bucket STORAGE_BUCKET
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(val);
    return data?.publicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};

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

        // Jika ada avatar yang kosong, ambil dari tabel users sekaligus (efisien)
        let usersMap: Record<string, { name?: string; user_avatar?: string | null }> = {};
        const missingAvatarUserIds = (reviews || [])
            .filter(r => (!r.user_avatar || String(r.user_avatar).trim() === '') && r.user_id)
            .map(r => r.user_id as string);

        const uniqueMissingIds = Array.from(new Set(missingAvatarUserIds));
        if (uniqueMissingIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, user_avatar')
                .in('id', uniqueMissingIds);
            if (usersData && usersData.length) {
                usersMap = usersData.reduce((acc: Record<string, any>, u: any) => {
                    acc[u.id] = { name: u.name, user_avatar: u.user_avatar };
                    return acc;
                }, {});
            }
        }

        // Transform database reviews ke format yang diharapkan, termasuk resolusi avatar
        const transformedReviews = (reviews || []).map(review => {
            const fallbackUser = usersMap[review.user_id as string] || {};
            const name = review.user_name || fallbackUser.name || 'Unknown';
            const rawAvatar = review.user_avatar || fallbackUser.user_avatar || null;
            const avatarUrl = resolveAvatarUrlForApi(rawAvatar, name);

            return {
                id: review.id,
                productId: review.product_id,
                userId: review.user_id,
                userName: name,
                userAvatar: avatarUrl,
                rating: review.rating,
                comment: review.comment,
                date: review.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                verified: review.verified,
                createdAt: review.created_at,
                updatedAt: review.updated_at
            } as ReviewResponse;
        });

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
        // Get authenticated user (prefer request headers for per-tab accuracy)
        let user = getApiUser(request) as any;
        if (!user) {
            user = getCookieUser(request);
        }
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Log user info for debugging
        console.log('Review API POST - User Info:', {
            id: user.id,
            email: user.email,
            role: user.role,
            roleType: typeof user.role
        });

        // Prevent admin from creating reviews (case-insensitive check)
        if (user.role && user.role.toLowerCase() === 'admin') {
            console.log('Admin user blocked from creating review');
            return NextResponse.json(
                { success: false, message: 'Admin cannot create reviews. Only customers can review products.' },
                { status: 403 }
            );
        }

        console.log('User allowed to create review');

        const body = await request.json();
        const { productId, orderId, orderItemId, rating, comment, userAvatar } = body;

        // Validasi input
        if (!productId || !rating || !comment) {
            return NextResponse.json(
                { success: false, message: 'Product ID, rating, and comment are required' },
                { status: 400 }
            );
        }

        // Validasi orderId dan orderItemId jika ada
        if (orderId && !orderItemId) {
            return NextResponse.json(
                { success: false, message: 'Order Item ID is required when Order ID is provided' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, message: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        if (String(comment).trim().length < 10) {
            return NextResponse.json(
                { success: false, message: 'Comment must be at least 10 characters long' },
                { status: 400 }
            );
        }

        // Check if user already reviewed this specific order item
        // User can review same product multiple times if it's from different orders
        if (orderId && orderItemId) {
            const { data: existingReview } = await supabase
                .from('reviews')
                .select('id')
                .eq('order_id', parseInt(orderId))
                .eq('order_item_id', parseInt(orderItemId))
                .eq('user_id', user.id)
                .single();

            if (existingReview) {
                return NextResponse.json(
                    { success: false, message: 'You have already reviewed this product from this order' },
                    { status: 409 }
                );
            }

            // Verify order belongs to user
            const { data: order } = await supabaseAdmin
                .from('orders')
                .select('id, user_id')
                .eq('id', parseInt(orderId))
                .eq('user_id', user.id)
                .single();

            if (!order) {
                return NextResponse.json(
                    { success: false, message: 'Order not found or access denied' },
                    { status: 404 }
                );
            }

            // Verify order item exists and belongs to the order
            const { data: orderItem } = await supabaseAdmin
                .from('order_items')
                .select('id, product_id, order_id')
                .eq('id', parseInt(orderItemId))
                .eq('order_id', parseInt(orderId))
                .eq('product_id', parseInt(productId))
                .single();

            if (!orderItem) {
                return NextResponse.json(
                    { success: false, message: 'Order item not found or does not match the product' },
                    { status: 404 }
                );
            }
        } else {
            // Fallback: Check if user already reviewed this product (old behavior)
            // This is for reviews not linked to specific orders
            const { data: existingReview } = await supabase
                .from('reviews')
                .select('id')
                .eq('product_id', parseInt(productId))
                .eq('user_id', user.id)
                .is('order_id', null)
                .is('order_item_id', null)
                .single();

            if (existingReview) {
                return NextResponse.json(
                    { success: false, message: 'You have already reviewed this product' },
                    { status: 409 }
                );
            }
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

        // Tentukan avatar yang akan disimpan: prioritas body.userAvatar -> users.user_avatar -> ui-avatars
        let avatarToPersist: string | null | undefined = userAvatar;
        let nameFromDb: string | undefined;
        if (!avatarToPersist) {
            const { data: userRow } = await supabase
                .from('users')
                .select('name, user_avatar')
                .eq('id', user.id)
                .single();
            avatarToPersist = userRow?.user_avatar || null;
            nameFromDb = userRow?.name || undefined;
        }

        const nameToPersist = (user?.name as string | undefined) || nameFromDb || 'User';

        const reviewData: any = {
            product_id: parseInt(productId),
            user_id: user.id,
            user_name: nameToPersist,
            user_avatar:
                avatarToPersist ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToPersist)}&background=random`,
            rating: parseInt(rating),
            comment: String(comment).trim(),
            verified: false,
        };

        // Add order context if provided
        if (orderId) {
            reviewData.order_id = parseInt(orderId);
        }
        if (orderItemId) {
            reviewData.order_item_id = parseInt(orderItemId);
        }

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

        // Transform ke format yang diharapkan, dengan URL avatar publik
        const transformedReview: ReviewResponse = {
            id: newReview.id,
            productId: newReview.product_id,
            userId: newReview.user_id,
            userName: newReview.user_name,
            userAvatar: resolveAvatarUrlForApi(newReview.user_avatar, newReview.user_name),
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
        // Get authenticated user (prefer headers)
        let user = getApiUser(request) as any;
        if (!user) {
            user = getCookieUser(request);
        }
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Prevent admin from updating reviews
        if (user.role === 'admin') {
            return NextResponse.json(
                { success: false, message: 'Admin cannot update reviews. Only review owners can edit their reviews.' },
                { status: 403 }
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

        // Transform ke format yang diharapkan, dengan URL avatar publik
        const transformedReview: ReviewResponse = {
            id: updatedReview.id,
            productId: updatedReview.product_id,
            userId: updatedReview.user_id,
            userName: updatedReview.user_name,
            userAvatar: resolveAvatarUrlForApi(updatedReview.user_avatar, updatedReview.user_name),
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
        let user = getApiUser(request) as any;
        if (!user) {
            user = getCookieUser(request);
        }
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Prevent admin from deleting reviews
        if (user.role === 'admin') {
            return NextResponse.json(
                { success: false, message: 'Admin cannot delete reviews. Only review owners can delete their reviews.' },
                { status: 403 }
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

        // Check if review exists and belongs to user
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

        // Check if user owns the review
        if (existingReview.user_id !== user.id) {
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
