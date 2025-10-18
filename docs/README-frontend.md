# Frontend — Daftar File yang Dikerjakan

Dokumen ini merangkum file frontend (halaman, komponen, hooks, util) yang dikerjakan/dirawat dalam proyek ini, dan pembagiannya ke 2 tim secara adil.

## Halaman (App Router)
- `src/app/Review/page.tsx`
  - Halaman ulasan produk: rating, validasi minimal 5 kata, indikator progres kata, kirim `POST /api/reviews`.
  - Perubahan terbaru: dibungkus `<Suspense>` karena memakai `useSearchParams()`; redirect ke `/` setelah submit sukses.
- `src/app/Detail/page.tsx`
  - Detail produk berdasarkan `id` dari query; ulasan dan statistik.
- `src/app/page.tsx`
  - Beranda: daftar produk, pencarian, filter, pagination, caching kategori/produk.
- `src/app/Admin/page.tsx`, `src/app/Admin/@sidebar/page.tsx`, `src/app/Admin/@header/page.tsx`
  - Dashboard admin dan slot layout (sidebar/header).
- `src/app/Profile/page.tsx`
  - Profil pengguna.
- `src/app/checkout/page.tsx`
  - Checkout: ringkasan, pengiriman, pembayaran.
- `src/app/cart/page.tsx`
  - Keranjang.
- `src/app/(auth)/Login/page.tsx`, `src/app/(auth)/Register/page.tsx`
  - Autentikasi pengguna.
- `src/app/view-order/*`
  - Halaman melihat pesanan.

## Komponen
- `src/components/PopupAlert.tsx`, `src/components/Toast.tsx`, `src/components/LoadingSpinner.tsx`
- `src/components/ProductFilter.tsx`, `src/components/UserProfileDropdown.tsx`, `src/components/cardproduk.tsx`
- `src/components/Header.tsx`, `src/components/InlineAlert.tsx`, `src/components/ModernAlert.tsx`, `src/components/SimpleAlert.tsx`, `src/components/SupabaseStatus.tsx`

## Hooks
- `src/hooks/usePopupAlert.ts`, `src/hooks/useCart.ts`, `src/hooks/useAutoLogout.ts`

## Util & Konfigurasi
- `src/lib/auth.ts` (mis. `getAuthHeaders()`)
- `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`

## Pembagian Pekerjaan Frontend (2 Tim — dibagi secara adil)
Pembagian dibuat seimbang dari segi jumlah dan kompleksitas fitur.

**Tim A**
- Pages: `Review/page.tsx`, `Detail/page.tsx`, `checkout/page.tsx`, `cart/page.tsx`, `view-order/*`
- Components: `PopupAlert.tsx`, `Toast.tsx`, `LoadingSpinner.tsx`
- Hooks: `usePopupAlert.ts`, `useCart.ts`
- Util: pemakaian `auth.ts` untuk header auth di client

Fokus: alur pengguna (ulasan, detail, checkout, keranjang), notifikasi/alert, integrasi API dari sisi client.

**Tim B**
- Pages: `page.tsx` (Beranda), `Admin/page.tsx`, `Admin/@sidebar/page.tsx`, `Admin/@header/page.tsx`, `Profile/page.tsx`, `(auth)/Login`, `(auth)/Register`
- Components: `ProductFilter.tsx`, `UserProfileDropdown.tsx`, `cardproduk.tsx`, `Header.tsx`, `InlineAlert.tsx` (dan komponen pendukung)
- Hooks: `useAutoLogout.ts`

Fokus: halaman administratif dan beranda, navigasi & UX global, komponen katalog/produk, proteksi/admin.

> Catatan pembagian:
> - Masing-masing tim memegang 5–6 halaman relevan + 3–5 komponen/hooks.
> - Kompleksitas dibagi: Tim A mendalami alur transaksi/ulasan, Tim B menangani admin & beranda.
> - Review lintas tim disarankan untuk menjaga konsistensi gaya dan aksesibilitas.

## Catatan Implementasi
- Halaman yang memakai `useSearchParams()` perlu dibungkus `<Suspense>` untuk mencegah CSR bailout saat build.
- Setelah submit ulasan sukses di `/Review`, halaman diarahkan ke beranda (`/`).

Terakhir diperbarui: 18-10-2025