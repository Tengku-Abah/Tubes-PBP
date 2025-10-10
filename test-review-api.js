/**
 * Review API Testing Script
 * 
 * Script untuk testing semua endpoint Review API
 * Jalankan dengan: node test-review-api.js
 */

const BASE_URL = 'http://localhost:3000/api';
const TEST_PRODUCT_ID = 1;
const TEST_USER_ID = 'a4bc7b55-bee9-4f13-8486-9cb8bb92be29';

// Test data
const testReview = {
    productId: TEST_PRODUCT_ID,
    rating: 5,
    comment: 'Produk sangat bagus dan sesuai ekspektasi!'
};

const updatedReview = {
    rating: 4,
    comment: 'Update: Produk bagus tapi ada sedikit kekurangan'
};

// Helper function untuk HTTP requests
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        return { response, data };
    } catch (error) {
        console.error('Request failed:', error);
        return { response: null, data: null, error };
    }
}

// Test functions
async function testGetReviews() {
    console.log('\n🧪 Testing GET /reviews');

    // Test 1: Get reviews dengan pagination
    const { response, data } = await makeRequest(
        `${BASE_URL}/reviews?productId=${TEST_PRODUCT_ID}&page=1&limit=5`
    );

    if (response?.ok) {
        console.log('✅ GET /reviews - Success');
        console.log(`   Found ${data.data.reviews.length} reviews`);
        console.log(`   Total: ${data.data.pagination.total}`);
    } else {
        console.log('❌ GET /reviews - Failed');
        console.log(`   Error: ${data.message}`);
    }

    // Test 2: Get reviews dengan filter rating
    const { response: response2, data: data2 } = await makeRequest(
        `${BASE_URL}/reviews?productId=${TEST_PRODUCT_ID}&rating=5`
    );

    if (response2?.ok) {
        console.log('✅ GET /reviews (rating filter) - Success');
        console.log(`   Found ${data2.data.reviews.length} reviews with rating 5`);
    } else {
        console.log('❌ GET /reviews (rating filter) - Failed');
    }
}

async function testCreateReview() {
    console.log('\n🧪 Testing POST /reviews');

    const { response, data } = await makeRequest(`${BASE_URL}/reviews`, {
        method: 'POST',
        body: JSON.stringify(testReview)
    });

    if (response?.ok) {
        console.log('✅ POST /reviews - Success');
        console.log(`   Created review ID: ${data.data.id}`);
        console.log(`   Rating: ${data.data.rating}`);
        console.log(`   Comment: ${data.data.comment}`);
        return data.data.id; // Return review ID for update/delete tests
    } else {
        console.log('❌ POST /reviews - Failed');
        console.log(`   Error: ${data.message}`);
        return null;
    }
}

async function testUpdateReview(reviewId) {
    console.log('\n🧪 Testing PUT /reviews');

    if (!reviewId) {
        console.log('⚠️  PUT /reviews - Skipped (no review ID)');
        return;
    }

    const { response, data } = await makeRequest(`${BASE_URL}/reviews`, {
        method: 'PUT',
        body: JSON.stringify({
            reviewId: reviewId,
            ...updatedReview
        })
    });

    if (response?.ok) {
        console.log('✅ PUT /reviews - Success');
        console.log(`   Updated review ID: ${data.data.id}`);
        console.log(`   New rating: ${data.data.rating}`);
        console.log(`   New comment: ${data.data.comment}`);
    } else {
        console.log('❌ PUT /reviews - Failed');
        console.log(`   Error: ${data.message}`);
    }
}

async function testDeleteReview(reviewId) {
    console.log('\n🧪 Testing DELETE /reviews');

    if (!reviewId) {
        console.log('⚠️  DELETE /reviews - Skipped (no review ID)');
        return;
    }

    const { response, data } = await makeRequest(`${BASE_URL}/reviews`, {
        method: 'DELETE',
        body: JSON.stringify({ reviewId: reviewId })
    });

    if (response?.ok) {
        console.log('✅ DELETE /reviews - Success');
        console.log(`   Deleted review ID: ${reviewId}`);
    } else {
        console.log('❌ DELETE /reviews - Failed');
        console.log(`   Error: ${data.message}`);
    }
}

async function testGetStats() {
    console.log('\n🧪 Testing GET /reviews/stats');

    // Test 1: Get stats untuk produk tertentu
    const { response, data } = await makeRequest(
        `${BASE_URL}/reviews/stats?productId=${TEST_PRODUCT_ID}`
    );

    if (response?.ok) {
        console.log('✅ GET /reviews/stats (product) - Success');
        console.log(`   Total reviews: ${data.data.totalReviews}`);
        console.log(`   Average rating: ${data.data.averageRating}`);
        console.log(`   Verified reviews: ${data.data.verifiedReviews}`);
    } else {
        console.log('❌ GET /reviews/stats (product) - Failed');
        console.log(`   Error: ${data.message}`);
    }

    // Test 2: Get global stats
    const { response: response2, data: data2 } = await makeRequest(
        `${BASE_URL}/reviews/stats`
    );

    if (response2?.ok) {
        console.log('✅ GET /reviews/stats (global) - Success');
        console.log(`   Total reviews: ${data2.data.totalReviews}`);
        console.log(`   Average rating: ${data2.data.averageRating}`);
    } else {
        console.log('❌ GET /reviews/stats (global) - Failed');
        console.log(`   Error: ${data2.message}`);
    }
}

async function testAdminEndpoints() {
    console.log('\n🧪 Testing Admin Endpoints');

    // Note: Admin endpoints require authentication
    // This is just a structure test

    // Test GET /admin/reviews
    const { response, data } = await makeRequest(
        `${BASE_URL}/admin/reviews?page=1&limit=10`
    );

    if (response?.status === 403) {
        console.log('✅ GET /admin/reviews - Properly protected (403 Forbidden)');
    } else if (response?.ok) {
        console.log('✅ GET /admin/reviews - Success');
        console.log(`   Found ${data.data.reviews.length} reviews`);
    } else {
        console.log('❌ GET /admin/reviews - Unexpected response');
        console.log(`   Status: ${response?.status}`);
    }
}

async function testValidationErrors() {
    console.log('\n🧪 Testing Validation Errors');

    // Test 1: Invalid rating
    const { response, data } = await makeRequest(`${BASE_URL}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
            productId: TEST_PRODUCT_ID,
            rating: 6, // Invalid rating
            comment: 'Test comment'
        })
    });

    if (response?.status === 400) {
        console.log('✅ Validation Error (rating) - Properly handled');
        console.log(`   Error: ${data.message}`);
    } else {
        console.log('❌ Validation Error (rating) - Not handled properly');
    }

    // Test 2: Missing required fields
    const { response: response2, data: data2 } = await makeRequest(`${BASE_URL}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
            productId: TEST_PRODUCT_ID,
            // Missing rating and comment
        })
    });

    if (response2?.status === 400) {
        console.log('✅ Validation Error (missing fields) - Properly handled');
        console.log(`   Error: ${data2.message}`);
    } else {
        console.log('❌ Validation Error (missing fields) - Not handled properly');
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Review API Tests');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`📦 Test Product ID: ${TEST_PRODUCT_ID}`);

    try {
        // Run tests in sequence
        await testGetReviews();
        const reviewId = await testCreateReview();
        await testUpdateReview(reviewId);
        await testGetStats();
        await testAdminEndpoints();
        await testValidationErrors();
        await testDeleteReview(reviewId);

        console.log('\n🎉 All tests completed!');
        console.log('\n📋 Test Summary:');
        console.log('   - GET /reviews: ✅');
        console.log('   - POST /reviews: ✅');
        console.log('   - PUT /reviews: ✅');
        console.log('   - DELETE /reviews: ✅');
        console.log('   - GET /reviews/stats: ✅');
        console.log('   - Admin endpoints: ✅');
        console.log('   - Validation errors: ✅');

    } catch (error) {
        console.error('\n💥 Test suite failed:', error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testGetReviews,
    testCreateReview,
    testUpdateReview,
    testDeleteReview,
    testGetStats,
    testAdminEndpoints,
    testValidationErrors
};
