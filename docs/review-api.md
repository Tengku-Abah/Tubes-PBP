# Review API Documentation

## Overview
Backend API untuk sistem ulasan (reviews) produk dengan fitur lengkap CRUD operations, statistik, dan manajemen admin.

## Endpoints

### 1. Public Review API (`/api/reviews`)

#### GET `/api/reviews`
Mengambil daftar ulasan dengan berbagai filter dan pagination.

**Query Parameters:**
- `productId` (optional): Filter berdasarkan ID produk
- `userId` (optional): Filter berdasarkan ID user
- `page` (optional): Halaman (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 10)
- `sortBy` (optional): Field untuk sorting (default: created_at)
- `sortOrder` (optional): asc atau desc (default: desc)
- `rating` (optional): Filter berdasarkan rating (1-5)
- `verified` (optional): Filter berdasarkan status verifikasi (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "userId": "uuid",
      "userName": "John Doe",
      "userAvatar": "https://...",
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
    "totalPages": 3
  },
  "stats": {
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
    "recentReviews": 5
  }
}
```

#### POST `/api/reviews`
Menambah ulasan baru (memerlukan authentication).

**Request Body:**
```json
{
  "productId": 1,
  "rating": 5,
  "comment": "Produk sangat bagus!",
  "userAvatar": "https://..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "id": 1,
    "productId": 1,
    "userId": "uuid",
    "userName": "John Doe",
    "userAvatar": "https://...",
    "rating": 5,
    "comment": "Produk sangat bagus!",
    "date": "2024-01-15",
    "verified": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT `/api/reviews`
Update ulasan yang sudah ada (hanya pemilik ulasan).

**Request Body:**
```json
{
  "id": 1,
  "rating": 4,
  "comment": "Updated comment"
}
```

#### DELETE `/api/reviews?id=1`
Hapus ulasan (pemilik ulasan atau admin).

### 2. Product Review Statistics (`/api/reviews/stats`)

#### GET `/api/reviews/stats?productId=1`
Mendapatkan statistik ulasan untuk produk tertentu.

**Query Parameters:**
- `productId` (required): ID produk
- `limit` (optional): Jumlah top reviews (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "productName": "iPhone 15 Pro",
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
    "recentReviews": 5,
    "topReviews": [
      {
        "id": 1,
        "userName": "John Doe",
        "userAvatar": "https://...",
        "rating": 5,
        "comment": "Excellent product!",
        "date": "2024-01-15",
        "verified": true
      }
    ]
  }
}
```

### 3. Admin Review Management (`/api/admin/reviews`)

#### GET `/api/admin/reviews`
Mengambil daftar ulasan untuk admin dengan filter lengkap.

**Query Parameters:**
- `action` (optional): "list" atau "analytics" (default: list)
- `page`, `limit`, `sortBy`, `sortOrder`: Pagination dan sorting
- `verified`, `rating`, `productId`, `userId`: Filter

#### GET `/api/admin/reviews?action=analytics`
Mendapatkan analitik ulasan lengkap untuk dashboard admin.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReviews": 150,
    "averageRating": 4.1,
    "verifiedReviews": 120,
    "pendingVerification": 30,
    "recentReviews": 15,
    "topRatedProducts": [
      {
        "productId": 1,
        "productName": "iPhone 15 Pro",
        "averageRating": 4.5,
        "reviewCount": 25
      }
    ],
    "ratingDistribution": {
      "5": 60,
      "4": 45,
      "3": 25,
      "2": 15,
      "1": 5
    },
    "monthlyStats": [
      {
        "month": "Jan 2024",
        "reviews": 15,
        "averageRating": 4.2
      }
    ]
  }
}
```

#### PUT `/api/admin/reviews`
Admin operations untuk ulasan.

**Request Body:**
```json
{
  "id": 1,
  "action": "verify", // atau "update"
  "verified": true,
  "comment": "Updated comment", // untuk action update
  "rating": 4 // untuk action update
}
```

#### DELETE `/api/admin/reviews?id=1`
Hapus ulasan (admin only).

## Authentication & Authorization

### Public Endpoints
- `GET /api/reviews` - Tidak memerlukan auth
- `GET /api/reviews/stats` - Tidak memerlukan auth

### User Authentication Required
- `POST /api/reviews` - Membuat ulasan baru
- `PUT /api/reviews` - Update ulasan sendiri
- `DELETE /api/reviews` - Hapus ulasan sendiri

### Admin Authentication Required
- Semua endpoint `/api/admin/reviews`

## Validation Rules

### Review Creation/Update
- `productId`: Required, harus ada di database
- `rating`: Required, integer 1-5
- `comment`: Required, minimum 10 karakter
- User hanya bisa review 1x per produk
- User hanya bisa update/delete ulasan sendiri

### Admin Operations
- Admin bisa verify/unverify ulasan
- Admin bisa update ulasan apapun
- Admin bisa delete ulasan apapun

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate review)
- `500`: Internal Server Error

## Database Schema

### Reviews Table
```sql
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id),
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Features

### ✅ Implemented Features
1. **CRUD Operations**: Create, Read, Update, Delete reviews
2. **Authentication**: User dan admin authentication
3. **Authorization**: Role-based access control
4. **Validation**: Input validation dan business rules
5. **Pagination**: Efficient data loading
6. **Filtering**: Multiple filter options
7. **Sorting**: Flexible sorting options
8. **Statistics**: Comprehensive review analytics
9. **Admin Management**: Full admin control panel
10. **Product Integration**: Auto-update product ratings
11. **Duplicate Prevention**: One review per user per product
12. **Verification System**: Admin can verify reviews

### 🔧 Technical Features
- TypeScript interfaces untuk type safety
- Error handling yang comprehensive
- Database helper functions
- Automatic product rating updates
- Pagination support
- Real-time statistics
- Admin analytics dashboard
