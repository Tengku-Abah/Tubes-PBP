# UMKM Store - Platform E-commerce

Platform e-commerce modern yang dibangun dengan Next.js 14, menampilkan manajemen produk, autentikasi pengguna, dan fungsionalitas keranjang belanja.

## 🚀 Fitur

- **Katalog Produk**: Jelajahi dan cari berbagai produk
- **Autentikasi Pengguna**: Sistem login dan registrasi dengan peran admin/pengguna
- **Keranjang Belanja**: Tambah, hapus, dan kelola item keranjang
- **Panel Admin**: Dashboard admin untuk mengelola produk dan pengguna
- **Desain Responsif**: Interface yang ramah mobile
- **UI Modern**: Desain bersih dan profesional dengan Tailwind CSS

## 📋 Persyaratan

Sebelum menjalankan proyek ini, pastikan Anda telah menginstal:

- **Node.js** (versi 18.0 atau lebih tinggi)
- **npm** atau **yarn** package manager

## 🛠️ Instalasi & Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd projek-bpb
```

### 2. Install Dependencies
```bash
npm install
# atau
yarn install
```

### 3. Install Dependencies Tambahan
```bash
npm install bcryptjs @types/bcryptjs
# atau
yarn add bcryptjs @types/bcryptjs
```

## 🏃‍♂️ Menjalankan Aplikasi

### Mode Development
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya.

### Build Production
```bash
npm run build
npm start
# atau
yarn build
yarn start
```

## 🔑 Kredensial Demo

### Akun Admin
- **Email**: `admin@gmail.com`
- **Password**: `admin2123`

### Akun Pengguna Biasa
- **Email**: `user@gmail.com`
- **Password**: `password123`

## 📁 Struktur Proyek

```
projek-bpb/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── Login/
│   │   │   └── Register/
│   │   ├── Admin/
│   │   ├── api/
│   │   │   ├── product/
│   │   │   ├── user/
│   │   │   └── cart/
│   │   ├── cart/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   └── lib/
├── public/
├── package.json
└── README.md
```

## 🎯 Rute yang Tersedia

- **Home**: `/` - Katalog produk dan pencarian
- **Login**: `/Login` - Autentikasi pengguna
- **Register**: `/Register` - Registrasi pengguna
- **Cart**: `/cart` - Manajemen keranjang belanja
- **Admin**: `/admin` - Dashboard admin (hanya admin)

## 🔧 API Endpoints

### Produk
- `GET /api/product` - Ambil semua produk
- `GET /api/product?search=keyword` - Cari produk
- `GET /api/product?category=category` - Filter berdasarkan kategori

### Pengguna
- `POST /api/user` - Login pengguna
- `GET /api/user` - Ambil semua pengguna (hanya admin)
- `PUT /api/user` - Update pengguna
- `DELETE /api/user` - Hapus pengguna

### Keranjang
- `GET /api/cart` - Ambil item keranjang
- `POST /api/cart` - Tambah item ke keranjang
- `PUT /api/cart` - Update jumlah item keranjang
- `DELETE /api/cart` - Hapus item dari keranjang

## 🎨 Teknologi yang Digunakan

- **Next.js 14** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **bcryptjs** - Password hashing
- **REST API** - Backend endpoints

## 🚀 Deployment

### Deploy di Vercel
1. Push kode Anda ke GitHub
2. Hubungkan repository Anda ke Vercel
3. Deploy otomatis

### Deploy di Platform Lain
```bash
npm run build
npm start
```

## 📝 Catatan Development

- Proyek menggunakan Next.js App Router
- API routes berada di `src/app/api/`
- Komponen berada di `src/components/`
- Semua styling menggunakan Tailwind CSS classes
- Data mock digunakan untuk tujuan demonstrasi

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch
3. Lakukan perubahan Anda
4. Submit pull request

## 📄 Lisensi

Proyek ini dilisensikan di bawah MIT License.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
