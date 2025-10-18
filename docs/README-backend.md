# Backend — Daftar File yang Dikerjakan

Dokumen ini merangkum file backend (API routes, helper, autentikasi, middleware) yang dikerjakan/dirawat dalam proyek ini.

## API Routes
- `src/app/api/admin/reviews/route.ts`
  - Pengelolaan ulasan oleh admin: `GET` (list + analytics) dan `PUT` (verifikasi/perbarui ulasan).
  - Menggunakan `requireApiAdmin()` untuk validasi admin.
  - `export const dynamic = 'force-dynamic'` karena membaca header/konteks request.

- `src/app/api/reviews/route.ts`
  - Endpoint ulasan publik, dipanggil dari frontend (`POST /api/reviews`) untuk membuat ulasan.
  - Bisa menyediakan `GET` list ulasan per produk/pengguna (jika diimplementasikan).

- `src/app/api/reviews/stats/route.ts`
  - Statistik ulasan per produk: total ulasan, rata-rata rating, distribusi rating, review teratas.
  - `dynamic = 'force-dynamic'`.

- `src/app/api/orders/route.ts`
  - Manajemen pesanan: `GET` daftar/spesifik dan `PUT` untuk update status.
  - Membaca `request.headers` (mis. `Authorization`, `x-user-role`) untuk akses admin.
  - `dynamic = 'force-dynamic'`.

- `src/app/api/product/route.ts`
  - Detail produk: `GET` berdasarkan `id` (dipakai oleh halaman Detail/Review).

- `src/app/api/financial/route.ts`
  - Laporan keuangan: `GET` berbagai periode (bulanan/kuartal/semester/all).
  - `dynamic = 'force-dynamic'`.

- `src/app/api/cart/route.ts`
  - Operasi keranjang (GET/POST/dll) bila tersedia.

- `src/app/api/upload/route.ts` dan `src/app/api/upload-url/route.ts`
  - Upload berkas dan pembuatan URL publik.

- `src/app/api/user/route.ts`
  - Manajemen pengguna (register/login/cek admin, util terkait).

## Libraries & Auth
- `src/lib/supabase.ts`
  - Helper database: `dbHelpers`, tipe `ApiResponse`, gateway ke Supabase.
- `src/lib/supabaseClient.ts`
  - Inisialisasi klien Supabase untuk akses dari frontend/backend.
- `src/lib/api-auth.ts`
  - Util autentikasi API: `requireApiAdmin`, `getCookieUser`.
- `src/lib/jwt-auth.ts`
  - Util JWT (sign/verify) bila diperlukan.
- `src/lib/storage.ts`
  - Util pengelolaan storage (bucket/public URL) bila digunakan oleh API.

## Middleware
- `middleware.ts` (root) dan/atau `src/middleware.ts`
  - Middleware Next.js untuk kontrol akses/redirect global (jika diaktifkan).

## Pembagian Pekerjaan Backend (2 Tim — dibagi secara adil)
Untuk memudahkan pengerjaan dan QA, berikut pembagian 2 kelompok dengan beban dan kompleksitas yang seimbang.

**Tim A**
- API: `src/app/api/admin/reviews/route.ts`
- API: `src/app/api/reviews/route.ts`
- API: `src/app/api/reviews/stats/route.ts`
- API: `src/app/api/user/route.ts`
- API: `src/app/api/upload/route.ts`
- Lib: `src/lib/api-auth.ts`
- Lib: `src/lib/jwt-auth.ts`
- Middleware: `middleware.ts` (root) atau `src/middleware.ts`

Fokus: autentikasi & otorisasi admin/user, lifecycle ulasan (publik/admin), statistik ulasan, proses upload yang menyertakan validasi akses.

**Tim B**
- API: `src/app/api/orders/route.ts`
- API: `src/app/api/product/route.ts`
- API: `src/app/api/financial/route.ts`
- API: `src/app/api/cart/route.ts`
- API: `src/app/api/upload-url/route.ts`
- Lib: `src/lib/supabase.ts`
- Lib: `src/lib/supabaseClient.ts`
- Lib: `src/lib/storage.ts`

Fokus: data transaksi (pesanan, keranjang, finansial), detail produk, util Supabase & storage, serta endpoint pembuatan URL upload.

> Catatan pembagian:
> - Masing-masing tim mendapat 5 endpoint API + 3 library/middleware terkait.
> - Kompleksitas distribusi dibuat seimbang: Tim A mendalami auth/admin + ulasan, Tim B menangani transaksi/produk + storage.
> - Jika diperlukan rotasi, tim dapat saling review PR untuk menjaga kualitas dan konsistensi.

## Catatan
- Banyak route menggunakan `dynamic = 'force-dynamic'` karena membaca `request.headers`/`request.url`, sehingga tidak diprerender statis.
- Pastikan client mengirim header auth yang benar (`Authorization: Bearer <token>`, `x-user-role: admin`) untuk endpoint admin.

Terakhir diperbarui: 18-10-2025