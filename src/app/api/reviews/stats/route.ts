import { NextRequest, NextResponse } from 'next/server';

import { getStoredAssetUrl } from '@/lib/supabase';
import { query, toNumber } from '@/lib/db';

export const dynamic = 'force-dynamic';

const resolveAvatarUrlForApi = (raw: string | null | undefined) => {
    return getStoredAssetUrl(raw, '/default-avatar.svg');
};

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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') || '5', 10);

        if (!productId) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

        const productResult = await query(
            `select id, name from products where id = $1 limit 1`,
            [parseInt(productId, 10)]
        );

        const product = productResult.rows[0];
        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        const reviewsResult = await query(
            `
              select *
              from reviews
              where product_id = $1
              order by created_at desc
            `,
            [parseInt(productId, 10)]
        );

        const reviews = reviewsResult.rows;

        if (!reviews || reviews.length === 0) {
            const emptyStats: ProductReviewStats = {
                productId: parseInt(productId, 10),
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

        const totalReviews = reviews.length;
        const verifiedReviews = reviews.filter(r => r.verified).length;
        const totalRating = reviews.reduce((sum, review) => sum + toNumber(review.rating), 0);
        const averageRating = parseFloat((totalRating / totalReviews).toFixed(2));

        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            ratingDistribution[toNumber(review.rating) as keyof typeof ratingDistribution]++;
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentReviews = reviews.filter(review =>
            new Date(review.created_at) > sevenDaysAgo
        ).length;

        const topReviews = reviews
            .sort((a, b) => {
                if (a.verified !== b.verified) {
                    return b.verified ? 1 : -1;
                }
                if (a.rating !== b.rating) {
                    return toNumber(b.rating) - toNumber(a.rating);
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, limit)
            .map(review => ({
                id: Number(review.id),
                userName: review.user_name,
                userAvatar: resolveAvatarUrlForApi(review.user_avatar),
                rating: toNumber(review.rating),
                comment: review.comment || review.content || '',
                date: review.created_at?.toISOString?.().split('T')[0] || new Date().toISOString().split('T')[0],
                verified: Boolean(review.verified)
            }));

        const stats: ProductReviewStats = {
            productId: parseInt(productId, 10),
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
