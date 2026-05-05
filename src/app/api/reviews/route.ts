import { NextRequest, NextResponse } from 'next/server';

import { ApiResponse, dbHelpers, getStoredAssetUrl } from '../../../lib/supabase';
import { getCookieUser, getApiUser } from '../../../lib/api-auth';
import { hasColumn, query, toNumber } from '@/lib/db';

export const dynamic = 'force-dynamic';

const getRequestUser = (request: NextRequest) => getApiUser(request) || getCookieUser(request);

const resolveAvatarUrlForApi = (raw: string | null | undefined, _name: string): string => {
    return getStoredAssetUrl(raw, '/default-avatar.svg');
};

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
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const rating = searchParams.get('rating');
        const verified = searchParams.get('verified');

        const queryParams: any = {
            productId: productId ? parseInt(productId, 10) : undefined,
            userId: userId || undefined,
            page,
            limit,
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
            rating: rating ? parseInt(rating, 10) : undefined,
            verified: verified ? verified === 'true' : undefined
        };

        const { data: reviews, error } = await dbHelpers.getReviews(queryParams);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to fetch reviews' },
                { status: 500 }
            );
        }

        let usersMap: Record<string, { name?: string; user_avatar?: string | null }> = {};
        const missingAvatarUserIds = (reviews || [])
            .filter(r => (!r.user_avatar || String(r.user_avatar).trim() === '') && r.user_id)
            .map(r => r.user_id as string);

        const uniqueMissingIds = Array.from(new Set(missingAvatarUserIds));
        if (uniqueMissingIds.length > 0) {
            const { rows } = await query(
                `select id, name, user_avatar from users where id = any($1::uuid[])`,
                [uniqueMissingIds]
            );
            usersMap = rows.reduce((acc: Record<string, any>, user: any) => {
                acc[String(user.id)] = { name: user.name, user_avatar: user.user_avatar };
                return acc;
            }, {});
        }

        const transformedReviews = (reviews || []).map(review => {
            const fallbackUser = usersMap[String(review.user_id)] || {};
            const name = review.user_name || fallbackUser.name || 'Unknown';
            const rawAvatar = review.user_avatar || fallbackUser.user_avatar || null;
            const avatarUrl = resolveAvatarUrlForApi(rawAvatar, name);

            return {
                id: review.id,
                productId: Number(review.product_id),
                userId: String(review.user_id),
                userName: name,
                userAvatar: avatarUrl,
                rating: Number(review.rating || 0),
                comment: review.comment || '',
                date: review.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                verified: Boolean(review.verified),
                createdAt: review.created_at || new Date().toISOString(),
                updatedAt: review.updated_at || new Date().toISOString()
            } as ReviewResponse;
        });

        const stats = calculateReviewStats(transformedReviews);

        const response: ApiResponse<ReviewResponse[]> = {
            success: true,
            data: transformedReviews,
            stats,
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
        const user = getRequestUser(request) as any;
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        if (user.role && user.role.toLowerCase() === 'admin') {
            return NextResponse.json(
                { success: false, message: 'Admin cannot create reviews. Only customers can review products.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { productId, orderId, orderItemId, rating, comment, userAvatar } = body;

        if (!productId || !rating || !comment) {
            return NextResponse.json(
                { success: false, message: 'Product ID, rating, and comment are required' },
                { status: 400 }
            );
        }

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

        const reviewsHaveOrderColumns = await hasColumn('reviews', 'order_id') && await hasColumn('reviews', 'order_item_id');

        if (orderId && orderItemId && reviewsHaveOrderColumns) {
            const existingReview = await query(
                `
                  select id
                  from reviews
                  where order_id = $1
                    and order_item_id = $2
                    and user_id = $3
                  limit 1
                `,
                [parseInt(orderId, 10), parseInt(orderItemId, 10), user.id]
            );

            if (existingReview.rows[0]) {
                return NextResponse.json(
                    { success: false, message: 'You have already reviewed this product from this order' },
                    { status: 409 }
                );
            }

            const order = await query(
                `select id, user_id from orders where id = $1 and user_id = $2 limit 1`,
                [parseInt(orderId, 10), user.id]
            );

            if (!order.rows[0]) {
                return NextResponse.json(
                    { success: false, message: 'Order not found or access denied' },
                    { status: 404 }
                );
            }

            const orderItem = await query(
                `
                  select id, product_id, order_id
                  from order_items
                  where id = $1
                    and order_id = $2
                    and product_id = $3
                  limit 1
                `,
                [parseInt(orderItemId, 10), parseInt(orderId, 10), parseInt(productId, 10)]
            );

            if (!orderItem.rows[0]) {
                return NextResponse.json(
                    { success: false, message: 'Order item not found or does not match the product' },
                    { status: 404 }
                );
            }
        } else {
            const { data: existingReview } = await dbHelpers.getUserReviewForProduct(user.id, parseInt(productId, 10));
            if (existingReview) {
                return NextResponse.json(
                    { success: false, message: 'You have already reviewed this product' },
                    { status: 409 }
                );
            }
        }

        const { data: product } = await dbHelpers.getProductById(parseInt(productId, 10));
        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        let avatarToPersist: string | null | undefined = userAvatar;
        let nameFromDb: string | undefined;
        if (!avatarToPersist) {
            const { data: userRow } = await dbHelpers.getUserById(String(user.id));
            avatarToPersist = userRow?.user_avatar || null;
            nameFromDb = userRow?.name || undefined;
        }

        const nameToPersist = (user?.name as string | undefined) || nameFromDb || 'User';

        const reviewData: any = {
            product_id: parseInt(productId, 10),
            user_id: String(user.id),
            user_name: nameToPersist,
            user_avatar: avatarToPersist || null,
            rating: parseInt(rating, 10),
            comment: String(comment).trim(),
            verified: false,
        };

        if (reviewsHaveOrderColumns && orderId) {
            reviewData.order_id = parseInt(orderId, 10);
        }
        if (reviewsHaveOrderColumns && orderItemId) {
            reviewData.order_item_id = parseInt(orderItemId, 10);
        }

        const { data: newReview, error } = await dbHelpers.addReview(reviewData);

        if (error || !newReview) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to add review' },
                { status: 500 }
            );
        }

        await updateProductRating(parseInt(productId, 10));

        const transformedReview: ReviewResponse = {
            id: newReview.id,
            productId: Number(newReview.product_id),
            userId: String(newReview.user_id),
            userName: newReview.user_name,
            userAvatar: resolveAvatarUrlForApi(newReview.user_avatar, newReview.user_name),
            rating: Number(newReview.rating || 0),
            comment: newReview.comment || '',
            date: newReview.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            verified: Boolean(newReview.verified),
            createdAt: newReview.created_at || new Date().toISOString(),
            updatedAt: newReview.updated_at || new Date().toISOString()
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
        const user = getRequestUser(request) as any;
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

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

        const { data: existingReview } = await dbHelpers.getReviewById(parseInt(id, 10));

        if (!existingReview || String(existingReview.user_id) !== String(user.id)) {
            return NextResponse.json(
                { success: false, message: 'Review not found or access denied' },
                { status: 404 }
            );
        }

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

        const { data: updatedReview, error } = await dbHelpers.updateReview(parseInt(id, 10), {
            ...(rating !== undefined && { rating: parseInt(rating, 10) }),
            ...(comment !== undefined && { comment: String(comment).trim() })
        });

        if (error || !updatedReview) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to update review' },
                { status: 500 }
            );
        }

        if (rating && Number(rating) !== existingReview.rating) {
            await updateProductRating(Number(existingReview.product_id));
        }

        const transformedReview: ReviewResponse = {
            id: updatedReview.id,
            productId: Number(updatedReview.product_id),
            userId: String(updatedReview.user_id),
            userName: updatedReview.user_name,
            userAvatar: resolveAvatarUrlForApi(updatedReview.user_avatar, updatedReview.user_name),
            rating: Number(updatedReview.rating || 0),
            comment: updatedReview.comment || '',
            date: updatedReview.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            verified: Boolean(updatedReview.verified),
            createdAt: updatedReview.created_at || new Date().toISOString(),
            updatedAt: updatedReview.updated_at || new Date().toISOString()
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
        const user = getRequestUser(request) as any;
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

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

        const { data: existingReview } = await dbHelpers.getReviewById(parseInt(id, 10));

        if (!existingReview) {
            return NextResponse.json(
                { success: false, message: 'Review not found' },
                { status: 404 }
            );
        }

        if (String(existingReview.user_id) !== String(user.id)) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        const { error } = await dbHelpers.deleteReview(parseInt(id, 10));

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to delete review' },
                { status: 500 }
            );
        }

        await updateProductRating(Number(existingReview.product_id));

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

async function updateProductRating(productId: number) {
    try {
        const { rows: reviews } = await query(
            `select rating from reviews where product_id = $1 and rating is not null`,
            [productId]
        );

        if (!reviews || reviews.length === 0) {
            await query(
                `
                  update products
                  set rating = 0,
                      reviews_count = 0,
                      updated_at = now()
                  where id = $1
                `,
                [productId]
            );
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + toNumber(review.rating), 0);
        const averageRating = parseFloat((totalRating / reviews.length).toFixed(2));

        await query(
            `
              update products
              set rating = $1,
                  reviews_count = $2,
                  updated_at = now()
              where id = $3
            `,
            [averageRating, reviews.length, productId]
        );

    } catch (error) {
        console.error('Error updating product rating:', error);
    }
}
