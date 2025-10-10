# Review API Documentation

## 📋 Overview

Review API adalah sistem backend untuk mengelola ulasan produk dengan fitur CRUD lengkap, statistik, dan manajemen admin. API ini dibangun dengan Next.js 14 App Router dan menggunakan Supabase sebagai database.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase project
- Database dengan tabel `reviews` yang sudah dibuat

### Installation
```bash
# Clone repository
git clone <repository-url>
cd final-pbp

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Run development server
npm run dev
```

### Database Setup
```sql
-- Pastikan tabel reviews sudah ada dengan struktur yang benar
SELECT * FROM reviews LIMIT 1;
```

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reviews` | Get reviews dengan filter dan pagination |
| `POST` | `/api/reviews` | Create review baru |
| `PUT` | `/api/reviews` | Update review |
| `DELETE` | `/api/reviews` | Delete review |
| `GET` | `/api/reviews/stats` | Get review statistics |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/reviews` | Get semua reviews (admin) |
| `PUT` | `/api/admin/reviews` | Update review (admin) |

## 🔧 Usage Examples

### 1. Get Reviews
```javascript
// Get reviews untuk produk tertentu
const response = await fetch('/api/reviews?productId=1&page=1&limit=10');
const data = await response.json();
console.log(data.data.reviews);
```

### 2. Create Review
```javascript
// Create review baru
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
const result = await newReview.json();
```

### 3. Update Review
```javascript
// Update review
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
```

### 4. Get Statistics
```javascript
// Get statistics untuk produk
const stats = await fetch('/api/reviews/stats?productId=1');
const statsData = await stats.json();
console.log(statsData.data.averageRating);
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description"
}
```

## 🔐 Authentication

### User Authentication
- Menggunakan session cookie
- User harus login untuk create/update/delete reviews
- User hanya bisa mengelola review mereka sendiri

### Admin Authentication
- Menggunakan Bearer token
- Admin bisa mengelola semua reviews
- Admin bisa verify/unverify reviews

## 📝 Data Models

### Review Object
```typescript
interface Review {
  id: number;
  productId: number;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1-5
  comment: string;
  date: string; // YYYY-MM-DD
  verified: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Admin Review Object
```typescript
interface AdminReview extends Review {
  productName: string;
  userEmail: string;
}
```

## 🛠️ Development

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── reviews/
│   │   │   ├── route.ts          # Main review endpoints
│   │   │   └── stats/
│   │   │       └── route.ts      # Statistics endpoint
│   │   └── admin/
│   │       └── reviews/
│   │           └── route.ts      # Admin review endpoints
│   └── lib/
│       └── supabase.ts          # Database helpers
├── docs/
│   ├── review-api-spec.md       # API specification
│   ├── review-api-openapi.yaml  # OpenAPI spec
│   └── review-api-postman.json   # Postman collection
└── migrations/
    └── fix_reviews_table.sql    # Database migration
```

### Database Schema
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

## 📈 Performance

### Pagination
- Default limit: 10 items per page
- Maximum limit: 100 items per page
- Efficient database queries dengan proper indexing

### Caching
- Response caching untuk statistics
- Database query optimization
- Proper error handling

## 🔒 Security

### Input Validation
- Rating: 1-5 integer validation
- Comment: 10-500 character limit
- Product ID: Valid product existence check
- User authentication: Session validation

### Authorization
- User can only manage their own reviews
- Admin can manage all reviews
- Proper error messages without sensitive data

## 🐛 Error Handling

### Common Error Codes
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - User not authenticated
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Duplicate resource
- `500`: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human readable error message"
}
```

## 📋 TODO

### Completed ✅
- [x] CRUD operations untuk reviews
- [x] Admin management endpoints
- [x] Statistics endpoint
- [x] Pagination support
- [x] Authentication dan authorization
- [x] Input validation
- [x] Error handling
- [x] API documentation
- [x] Postman collection
- [x] OpenAPI specification

### Future Enhancements 🚀
- [ ] Rate limiting implementation
- [ ] Review moderation system
- [ ] Email notifications untuk review updates
- [ ] Review analytics dashboard
- [ ] Bulk operations untuk admin
- [ ] Review export functionality
- [ ] Advanced filtering options
- [ ] Review sentiment analysis

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

Jika ada pertanyaan atau masalah dengan API, silakan:
1. Check documentation terlebih dahulu
2. Search existing issues
3. Create new issue dengan detail yang jelas
4. Contact: support@example.com

---

**Happy Coding! 🚀**
