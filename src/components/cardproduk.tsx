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

  const canClick = product.stock > 0

  return (
    <div
      className={`group relative [perspective:1200px] h-full ${className ?? ''}`}
    >
      {/* Gradient ring wrapper with blue tones */}
      <div className="rounded-2xl p-[1.5px] bg-gradient-to-br from-blue-500/40 via-blue-400/40 to-blue-300/40 h-full">
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

            {/* Category chip */}
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/90 px-2 py-1 text-[11px] font-medium text-blue-800 ring-1 ring-blue-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                {product.category}
              </span>
            </div>

            {/* Wishlist */}
            <button
              type="button"
              aria-label={isWishlist ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
              aria-pressed={isWishlist}
              onClick={() => setIsWishlist((v) => !v)}
              className="
                absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full
                bg-white/90 text-blue-700 ring-1 ring-blue-300 backdrop-blur
                transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                opacity-0 translate-y-[-6px] group-hover:opacity-100 group-hover:translate-y-0
              "
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 transition-all ${
                  isWishlist ? 'fill-red-500 text-red-500 scale-110' : 'fill-none text-blue-700'
                }`}
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.934 0-3.597 1.123-4.312 2.736-.715-1.613-2.378-2.736-4.313-2.736C5.1 3.75 3 5.765 3 8.25c0 6.22 8.25 9.75 8.25 9.75S21 14.47 21 8.25z"
                />
              </svg>
            </button>

            {/* Rating pill */}
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                <Stars score={ratingStars} />
                {product.rating.toFixed(1)} • {product.reviews}
              </span>
            </div>

            {/* Stock overlay bila habis */}
            {product.stock === 0 && (
              <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[2px]">
                <span className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow">
                  Habis Stok
                </span>
              </div>
            )}
          </div>

          {/* Content - Flexible height */}
          <div className="p-4 flex flex-col flex-1">
            {/* Title */}
            <h3 className="line-clamp-2 text-base font-semibold leading-tight text-blue-900">
              {product.name}
            </h3>

            {/* Description */}
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-blue-700 flex-1">
              {product.description}
            </p>

            {/* Stock chip */}
            <div className="mt-3 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${stockTone}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    product.stock === 0
                      ? 'bg-red-500'
                      : product.stock <= 5
                      ? 'bg-amber-500'
                      : product.stock <= 10
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                />
                {stockLabel}
              </span>
            </div>

            {/* Price & CTA - Fixed at bottom */}
            <div className="mt-4 flex flex-col gap-3 flex-shrink-0">
              {/* Price Section */}
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wide text-blue-500 mb-1">Harga</span>
                <span className="text-lg font-bold text-blue-900 break-all leading-tight min-h-[1.5rem]">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* CTA Button - Full width */}
              <Link
                href={canClick ? `/Detail?id=${product.id}` : '#'}
                aria-disabled={!canClick}
                className={`
                  relative inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                  transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                  w-full group-hover:scale-105
                  ${canClick
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] hover:shadow-lg'
                    : 'cursor-not-allowed bg-gray-200 text-gray-500'}
                `}
                onClick={(e) => {
                  if (!canClick) e.preventDefault()
                }}
              >
                {canClick ? (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 7m5-7v7m6-7v7" />
                    </svg>
                    Lihat Detail
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Habis
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle hover glow */}
      <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500/0 via-blue-400/0 to-blue-300/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />
    </div>
  )
}

/** Component kecil untuk bintang (mendukung setengah bintang) */
function Stars({ score }: { score: number }) {
  const full = Math.floor(score)
  const half = score % 1 !== 0
  const arr = [0, 1, 2, 3, 4]
  return (
    <span className="inline-flex items-center">
      {arr.map((i) => {
        if (i < full) {
          return (
            <svg key={`f-${i}`} className="h-3.5 w-3.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )
        }
        if (i === full && half) {
          return (
            <svg key={`h-${i}`} className="h-3.5 w-3.5 text-yellow-400" viewBox="0 0 24 24">
              <defs>
                <linearGradient id={`half-${i}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M12 17.27l-5.18 3.04 1.64-5.64L3 9.97l5.91-.51L12 4l3.09 5.46L21 9.97l-5.46 4.7 1.64 5.64z"
                fill={`url(#half-${i})`}
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          )
        }
        return (
          <svg key={`e-${i}`} className="h-3.5 w-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
    </span>
  )
}
