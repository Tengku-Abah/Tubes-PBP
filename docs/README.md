# Review API Documentation Index

## 📚 Dokumentasi Lengkap

Berikut adalah semua file dokumentasi untuk Review API:

### 📋 Core Documentation
- **[review-api-readme.md](./review-api-readme.md)** - README utama dengan overview lengkap
- **[review-api-spec.md](./review-api-spec.md)** - Spesifikasi API detail dengan contoh
- **[review-api.md](./review-api.md)** - Dokumentasi teknis implementasi

### 🔧 API Specifications
- **[review-api-openapi.yaml](./review-api-openapi.yaml)** - OpenAPI/Swagger specification
- **[review-api-postman.json](./review-api-postman.json)** - Postman collection

### 🛠️ Development
- **[../migrations/fix_reviews_table.sql](../migrations/fix_reviews_table.sql)** - Database migration
- **[../src/lib/review-api-examples.ts](../src/lib/review-api-examples.ts)** - Contoh penggunaan API

### 📁 File Structure
```
docs/
├── review-api-readme.md       # 📖 Main documentation
├── review-api-spec.md         # 📋 Detailed API specification  
├── review-api.md              # 🔧 Technical implementation docs
├── review-api-openapi.yaml    # 🔌 OpenAPI/Swagger spec
└── review-api-postman.json    # 📋 Postman collection

src/
├── app/api/reviews/
│   ├── route.ts               # 🚀 Main API endpoints
│   └── stats/route.ts         # 📊 Statistics endpoint
├── app/api/admin/reviews/
│   └── route.ts               # 👑 Admin endpoints
└── lib/
    ├── supabase.ts            # 🗄️ Database helpers
    └── review-api-examples.ts # 💡 Usage examples

migrations/
└── fix_reviews_table.sql      # 🗃️ Database migration
```

## 🚀 Quick Start Guide

### 1. Baca Dokumentasi Utama
Mulai dengan **[review-api-readme.md](./review-api-readme.md)** untuk overview lengkap.

### 2. Implementasi API
Lihat **[review-api-spec.md](./review-api-spec.md)** untuk detail endpoint dan contoh penggunaan.

### 3. Development
- Setup database dengan **[migrations/fix_reviews_table.sql](../migrations/fix_reviews_table.sql)**
- Lihat **[review-api-examples.ts](../src/lib/review-api-examples.ts)** untuk contoh implementasi

## 📊 API Endpoints Summary

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reviews` | Get reviews dengan filter |
| `POST` | `/api/reviews` | Create review baru |
| `PUT` | `/api/reviews` | Update review |
| `DELETE` | `/api/reviews` | Delete review |
| `GET` | `/api/reviews/stats` | Get statistics |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/reviews` | Get semua reviews |
| `PUT` | `/api/admin/reviews` | Update review (admin) |

## 🔧 Development Commands

```bash
# Development
npm run dev

# Build
npm run build
npm run start

# Linting
npm run lint
```

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


## 🔐 Authentication

### User Authentication
- Session cookie based
- Required untuk create/update/delete operations
- User hanya bisa mengelola review mereka sendiri

### Admin Authentication
- Bearer token based
- Admin bisa mengelola semua reviews
- Admin bisa verify/unverify reviews

## 📈 Features

### ✅ Implemented
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

### 🚀 Future Enhancements
- [ ] Rate limiting
- [ ] Review moderation
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Advanced filtering
- [ ] Sentiment analysis

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: GitHub Issues
- 📖 Documentation: Lihat file di folder `docs/`

---

**Happy Coding! 🚀**
