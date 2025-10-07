'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

interface Product {
  id: number
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
  rating: number
  reviews: number
}

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isWishlist, setIsWishlist] = useState(false)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)

  const stockLabel = useMemo(() => {
    if (product.stock === 0) return 'Habis'
    if (product.stock <= 5) return `Sisa ${product.stock}`
    if (product.stock <= 10) return `Terbatas (${product.stock})`
    return `${product.stock} tersedia`
  }, [product.stock])

  const stockTone = useMemo(() => {
    if (product.stock === 0) return 'text-red-600 bg-red-50 ring-red-100'
    if (product.stock <= 5) return 'text-amber-700 bg-amber-50 ring-amber-100'
    if (product.stock <= 10) return 'text-yellow-700 bg-yellow-50 ring-yellow-100'
    return 'text-blue-700 bg-blue-50 ring-blue-100' // mengubah ke biru
  }, [product.stock])

  const ratingStars = Math.round(product.rating * 2) / 2

  const fallbackImage =
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&auto=format&fit=crop&q=60'

  // Always allow viewing product detail, regardless of stock
  const canClick = true

  return (
    <Link
      href={`/Detail?id=${product.id}`}
      className="block"
    > 
    <div
      className={`group relative [perspective:1200px] h-full ${className ?? ''}`}
    >
      {/* Gradient ring wrapper with blue tones */}
      <div className="rounded-2xl p-[1.5px] h-full">
        <div
          className="
            relative rounded-[1rem] bg-white shadow-sm
            transition-all duration-300 ease-out
            hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02]
            will-change-transform
            h-full flex flex-col
            cursor-pointer
          "
          style={{
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Top image section - Fixed height */}
          <div className="relative overflow-hidden rounded-t-[1rem] h-56 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 ease-out">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100" />
            )}

            <img
              src={imageError ? fallbackImage : product.image}
              alt={`${product.name} – ${product.category}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`
                w-full h-56 object-cover transition-transform duration-500
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                group-hover:scale-[1.06]
              `}
            />

            {/* Vignette + top blue gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-blue-900/10" />
            
            {/* Kategori */}
            <div className="absolute top-2 right-2">
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                {product.category}
              </span>
            </div>
          </div>

          {/* Content - Flexible height */}
          <div className="p-4 flex flex-col flex-1">
            {/* Title */}
            <h3 className="line-clamp-2 text-base font-semibold leading-tight text-gray-900">
              {product.name}
            </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium">{product.rating?.toFixed(1) ?? '0.0'}</span>
            <span className="text-gray-500 text-xs">
              ({product.reviews ? product.reviews.toLocaleString() : '0'} Reviews)
            </span>
          </div>

          {/* Harga + Aksi */}
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-[15px] font-semibold text-gray-900">
              {formatPrice(product.price)}
            </span>
            <span
              className="px-3 py-1.5 text-sm rounded-md font-medium bg-blue-600 text-white"
            >
              Lihat Detail
            </span>
          </div>
          </div>
        </div>
      </div>

      {/* Subtle hover glow */}
      <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500/0 via-blue-400/0 to-blue-300/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />
    </div>
    </Link>
  )
}