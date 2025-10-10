# Review API Specification

## Overview
API untuk mengelola ulasan produk dengan fitur CRUD lengkap, statistik, dan manajemen admin.

## Base URL
```
https://your-domain.com/api
```

## Authentication
Semua endpoint memerlukan authentication melalui session cookie atau header Authorization.

## Endpoints

### 1. Get Reviews
**GET** `/reviews`

Mengambil daftar ulasan dengan berbagai filter dan pagination.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | number | No | Filter berdasarkan ID produk |
| `userId` | string | No | Filter berdasarkan ID user |
| `page` | number | No | Halaman (default: 1) |
| `limit` | number | No | Jumlah item per halaman (default: 10, max: 100) |
| `sortBy` | string | No | Field untuk sorting (default: 'created_at') |
| `sortOrder` | string | No | Urutan sorting: 'asc' atau 'desc' (default: 'desc') |
| `rating` | number | No | Filter berdasarkan rating (1-5) |
| `verified` | boolean | No | Filter berdasarkan status verifikasi |

#### Example Request
```http
GET /api/reviews?productId=1&page=1&limit=10&sortBy=created_at&sortOrder=desc
```

#### Response
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "productId": 1,
        "userId": "a4bc7b55-bee9-4f13-8486-9cb8bb92be29",
        "userName": "John Doe",
        "userAvatar": "https://example.com/avatar.jpg",
        "rating": 5,
        "comment": "Produk sangat bagus!",
        "date": "2024-01-15",
        "verified": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Invalid parameters",
  "message": "Page must be a positive number"
}
```

---

### 2. Create Review
**POST** `/reviews`

Membuat ulasan baru untuk produk.

#### Request Body
```json
{
  "productId": 1,
  "rating": 5,
  "comment": "Produk sangat bagus dan sesuai ekspektasi!"
}
```

#### Validation Rules
- `productId`: Required, must be valid product ID
- `rating`: Required, integer between 1-5
- `comment`: Required, string 10-500 characters
- User must be authenticated
- User can only review each product once

#### Response
```json
{
  "success": true,
  "message": "Review berhasil ditambahkan",
  "data": {
    "id": 1,
    "productId": 1,
    "userId": "a4bc7b55-bee9-4f13-8486-9cb8bb92be29",
    "userName": "John Doe",
    "userAvatar": "https://ui-avatars.com/api/?name=John+Doe&background=random",
    "rating": 5,
    "comment": "Produk sangat bagus dan sesuai ekspektasi!",
    "date": "2024-01-15",
    "verified": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Responses
```json
// 400 - Validation Error
{
  "success": false,
  "error": "Validation Error",
  "message": "Rating harus antara 1-5"
}

// 401 - Unauthorized
{
  "success": false,
  "error": "Unauthorized",
  "message": "User tidak terautentikasi"
}

// 409 - Conflict
{
  "success": false,
  "error": "Conflict",
  "message": "User sudah memberikan review untuk produk ini"
}
```

---

### 3. Update Review
**PUT** `/reviews`

Memperbarui ulasan yang sudah ada.

#### Request Body
```json
{
  "reviewId": 1,
  "rating": 4,
  "comment": "Update: Produk bagus tapi ada sedikit kekurangan"
}
```

#### Validation Rules
- `reviewId`: Required, must be valid review ID
- `rating`: Optional, integer between 1-5
- `comment`: Optional, string 10-500 characters
- User must be authenticated
- User can only update their own reviews

#### Response
```json
{
  "success": true,
  "message": "Review berhasil diperbarui",
  "data": {
    "id": 1,
    "productId": 1,
    "userId": "a4bc7b55-bee9-4f13-8486-9cb8bb92be29",
    "userName": "John Doe",
    "userAvatar": "https://ui-avatars.com/api/?name=John+Doe&background=random",
    "rating": 4,
    "comment": "Update: Produk bagus tapi ada sedikit kekurangan",
    "date": "2024-01-15",
    "verified": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

#### Error Responses
```json
// 403 - Forbidden
{
  "success": false,
  "error": "Forbidden",
  "message": "User tidak memiliki akses untuk mengupdate review ini"
}

// 404 - Not Found
{
  "success": false,
  "error": "Not Found",
  "message": "Review tidak ditemukan"
}
```

---

### 4. Delete Review
**DELETE** `/reviews`

Menghapus ulasan.

#### Request Body
```json
{
  "reviewId": 1
}
```

#### Validation Rules
- `reviewId`: Required, must be valid review ID
- User must be authenticated
- User can only delete their own reviews

#### Response
```json
{
  "success": true,
  "message": "Review berhasil dihapus"
}
```

#### Error Responses
```json
// 403 - Forbidden
{
  "success": false,
  "error": "Forbidden",
  "message": "User tidak memiliki akses untuk menghapus review ini"
}

// 404 - Not Found
{
  "success": false,
  "error": "Not Found",
  "message": "Review tidak ditemukan"
}
```

---

## Admin Endpoints

### 5. Get All Reviews (Admin)
**GET** `/admin/reviews`

Mengambil semua ulasan dengan informasi lengkap untuk admin.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Halaman (default: 1) |
| `limit` | number | No | Jumlah item per halaman (default: 20, max: 100) |
| `sortBy` | string | No | Field untuk sorting (default: 'created_at') |
| `sortOrder` | string | No | Urutan sorting: 'asc' atau 'desc' (default: 'desc') |
| `verified` | boolean | No | Filter berdasarkan status verifikasi |
| `rating` | number | No | Filter berdasarkan rating |

#### Example Request
```http
GET /api/admin/reviews?page=1&limit=20&verified=false
```

#### Response
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Laptop Gaming ASUS",
        "userId": "a4bc7b55-bee9-4f13-8486-9cb8bb92be29",
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "userAvatar": "https://example.com/avatar.jpg",
        "rating": 5,
        "comment": "Produk sangat bagus!",
        "date": "2024-01-15",
        "verified": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Error Response
```json
// 403 - Forbidden
{
  "success": false,
  "error": "Forbidden",
  "message": "Akses admin diperlukan"
}
```

---

### 6. Update Review (Admin)
**PUT** `/admin/reviews`

Admin dapat memperbarui ulasan apapun.

#### Request Body
```json
{
  "reviewId": 1,
  "rating": 4,
  "comment": "Review diperbarui oleh admin",
  "verified": true
}
```

#### Validation Rules
- `reviewId`: Required, must be valid review ID
- `rating`: Optional, integer between 1-5
- `comment`: Optional, string 10-500 characters
- `verified`: Optional, boolean
- Admin must be authenticated

#### Response
```json
{
  "success": true,
  "message": "Review berhasil diperbarui oleh admin",
  "data": {
    "id": 1,
    "productId": 1,
    "productName": "Laptop Gaming ASUS",
    "userId": "a4bc7b55-bee9-4f13-8486-9cb8bb92be29",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "userAvatar": "https://example.com/avatar.jpg",
    "rating": 4,
    "comment": "Review diperbarui oleh admin",
    "date": "2024-01-15",
    "verified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## Statistics Endpoint

### 8. Get Review Statistics
**GET** `/reviews/stats`

Mengambil statistik ulasan untuk produk atau keseluruhan.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | number | No | Statistik untuk produk tertentu |

#### Example Request
```http
GET /api/reviews/stats?productId=1
```

#### Response
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "totalReviews": 25,
    "averageRating": 4.2,
    "ratingDistribution": {
      "5": 10,
      "4": 8,
      "3": 4,
      "2": 2,
      "1": 1
    },
    "verifiedReviews": 20,
    "unverifiedReviews": 5,
    "recentReviews": [
      {
        "id": 1,
        "userName": "John Doe",
        "userAvatar": "https://example.com/avatar.jpg",
        "rating": 5,
        "comment": "Produk sangat bagus!",
        "date": "2024-01-15",
        "verified": true
      }
    ]
  }
}
```

#### Global Statistics (tanpa productId)
```json
{
  "success": true,
  "data": {
    "totalReviews": 1250,
    "averageRating": 4.1,
    "ratingDistribution": {
      "5": 500,
      "4": 400,
      "3": 200,
      "2": 100,
      "1": 50
    },
    "verifiedReviews": 1000,
    "unverifiedReviews": 250,
    "topRatedProducts": [
      {
        "productId": 1,
        "productName": "Laptop Gaming ASUS",
        "averageRating": 4.8,
        "totalReviews": 50
      }
    ]
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - User not authenticated |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource not found |
| `409` | Conflict - Duplicate resource |
| `422` | Unprocessable Entity - Validation error |
| `500` | Internal Server Error - Server error |

## Rate Limiting

- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 200 requests per minute per user
- **Admin endpoints**: 500 requests per minute per admin

## Data Models

### Review Object
```typescript
interface Review {
  id: number;
  productId: number;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string; // YYYY-MM-DD format
  verified: boolean;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}
```

### Admin Review Object
```typescript
interface AdminReview extends Review {
  productName: string;
  userEmail: string;
}
```

### Review Statistics Object
```typescript
interface ReviewStats {
  productId?: number;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: string]: number; // "1" to "5"
  };
  verifiedReviews: number;
  unverifiedReviews: number;
  recentReviews: Review[];
  topRatedProducts?: Array<{
    productId: number;
    productName: string;
    averageRating: number;
    totalReviews: number;
  }>;
}
```

### Pagination Object
```typescript
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

## Examples

### JavaScript/TypeScript Client
```typescript
// Get reviews for a product
const response = await fetch('/api/reviews?productId=1&page=1&limit=10');
const data = await response.json();

// Create a new review
const newReview = await fetch('/api/reviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: 1,
    rating: 5,
    comment: 'Produk sangat bagus!'
  })
});

// Update a review
const updatedReview = await fetch('/api/reviews', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reviewId: 1,
    rating: 4,
    comment: 'Update: Produk bagus tapi ada sedikit kekurangan'
  })
});

// Delete a review
const deletedReview = await fetch('/api/reviews', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reviewId: 1
  })
});

// Get review statistics
const stats = await fetch('/api/reviews/stats?productId=1');
const statsData = await stats.json();
```

### cURL Examples
```bash
# Get reviews
curl -X GET "https://your-domain.com/api/reviews?productId=1&page=1&limit=10"

# Create review
curl -X POST "https://your-domain.com/api/reviews" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "rating": 5, "comment": "Produk sangat bagus!"}'

# Update review
curl -X PUT "https://your-domain.com/api/reviews" \
  -H "Content-Type: application/json" \
  -d '{"reviewId": 1, "rating": 4, "comment": "Update review"}'

# Delete review
curl -X DELETE "https://your-domain.com/api/reviews" \
  -H "Content-Type: application/json" \
  -d '{"reviewId": 1}'

# Get statistics
curl -X GET "https://your-domain.com/api/reviews/stats?productId=1"
```

## Changelog

### Version 1.0.0
- Initial release
- CRUD operations for reviews
- Admin management endpoints
- Statistics endpoint
- Pagination support
- Authentication and authorization
- Rate limiting
