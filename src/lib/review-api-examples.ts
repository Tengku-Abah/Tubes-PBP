// Contoh penggunaan Review API untuk testing

// 1. Mendapatkan ulasan untuk produk tertentu
async function getProductReviews(productId: number) {
    const response = await fetch(`/api/reviews?productId=${productId}&limit=10`);
    const data = await response.json();
    console.log('Product Reviews:', data);
    return data;
}

// 2. Menambah ulasan baru (memerlukan login)
async function addReview(productId: number, rating: number, comment: string) {
    const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Auth headers akan ditambahkan otomatis oleh browser
        },
        body: JSON.stringify({
            productId,
            rating,
            comment
        })
    });
    const data = await response.json();
    console.log('Add Review Result:', data);
    return data;
}

// 3. Update ulasan sendiri
async function updateReview(reviewId: number, rating: number, comment: string) {
    const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: reviewId,
            rating,
            comment
        })
    });
    const data = await response.json();
    console.log('Update Review Result:', data);
    return data;
}

// 4. Hapus ulasan sendiri
async function deleteReview(reviewId: number) {
    const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    console.log('Delete Review Result:', data);
    return data;
}

// 5. Mendapatkan statistik ulasan produk
async function getProductReviewStats(productId: number) {
    const response = await fetch(`/api/reviews/stats?productId=${productId}`);
    const data = await response.json();
    console.log('Product Review Stats:', data);
    return data;
}

// 6. Admin: Mendapatkan daftar ulasan untuk management
async function getAdminReviews(page = 1, limit = 20) {
    const response = await fetch(`/api/admin/reviews?page=${page}&limit=${limit}`);
    const data = await response.json();
    console.log('Admin Reviews:', data);
    return data;
}

// 7. Admin: Mendapatkan analitik ulasan
async function getReviewAnalytics() {
    const response = await fetch('/api/admin/reviews?action=analytics');
    const data = await response.json();
    console.log('Review Analytics:', data);
    return data;
}

// 8. Admin: Verify ulasan
async function verifyReview(reviewId: number, verified: boolean) {
    const response = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: reviewId,
            action: 'verify',
            verified
        })
    });
    const data = await response.json();
    console.log('Verify Review Result:', data);
    return data;
}

// 9. Admin: Update ulasan (admin override)
async function adminUpdateReview(reviewId: number, comment: string, rating: number) {
    const response = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: reviewId,
            action: 'update',
            comment,
            rating
        })
    });
    const data = await response.json();
    console.log('Admin Update Review Result:', data);
    return data;
}

// Contoh penggunaan dalam React component
export function useReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReviews = async (productId: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProductReviews(productId);
            if (data.success) {
                setReviews(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    };

    const submitReview = async (productId: number, rating: number, comment: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await addReview(productId, rating, comment);
            if (data.success) {
                // Refresh reviews after successful submission
                await fetchReviews(productId);
                return data;
            } else {
                setError(data.message);
                return null;
            }
        } catch (err) {
            setError('Failed to submit review');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        reviews,
        loading,
        error,
        fetchReviews,
        submitReview
    };
}

// Contoh penggunaan dalam Admin component
export function useAdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchAdminReviews = async (filters = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`/api/admin/reviews?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setReviews(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch admin reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const data = await getReviewAnalytics();
            if (data.success) {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    const verifyReview = async (reviewId: number, verified: boolean) => {
        try {
            const data = await verifyReview(reviewId, verified);
            if (data.success) {
                // Refresh reviews after verification
                await fetchAdminReviews();
            }
            return data;
        } catch (error) {
            console.error('Failed to verify review:', error);
            return null;
        }
    };

    return {
        reviews,
        analytics,
        loading,
        fetchAdminReviews,
        fetchAnalytics,
        verifyReview
    };
}

// Export semua fungsi untuk testing
export {
    getProductReviews,
    addReview,
    updateReview,
    deleteReview,
    getProductReviewStats,
    getAdminReviews,
    getReviewAnalytics,
    verifyReview,
    adminUpdateReview
};
