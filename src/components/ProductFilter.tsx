'use client'

import { useMemo } from 'react'

interface ProductFilterProps {
  categories: string[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  priceSort: string
  setPriceSort: (sort: string) => void
  ratingSort: string
  setRatingSort: (sort: string) => void
  filteredCount: number
  totalCount: number
  onReset: () => void
}

export default function ProductFilter({
  categories,
  selectedCategory,
  setSelectedCategory,
  priceSort,
  setPriceSort,
  ratingSort,
  setRatingSort,
  filteredCount,
  totalCount,
  onReset
}: ProductFilterProps) {
  const hasActiveFilter = useMemo(() => {
    return selectedCategory !== '' || priceSort !== '' || ratingSort !== ''
  }, [selectedCategory, priceSort, ratingSort])

  return (
    <aside className="w-full md:w-72 md:flex-shrink-0">
      <div className="sticky top-4 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M3 4h18v2.6L14.6 13a2 2 0 00-.6 1.4V21l-4-2.2v-4.4a2 2 0 00-.6-1.4L3 6.6V4z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">Filter Produk</h3>
          </div>

          <button
            onClick={onReset}
            disabled={!hasActiveFilter}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       text-blue-700 hover:text-blue-900 hover:bg-blue-50"
            aria-label="Reset semua filter"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M20 9A8 8 0 006 6M4 15a8 8 0 0014 3" />
            </svg>
            Reset
          </button>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Body */}
        <div className="px-5 py-4 space-y-6">
          {/* Category */}
          <fieldset>
            <legend className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M7 7h.01M7 3h5a2 2 0 011.4.6l7 7a2 2 0 010 2.8l-7 7a2 2 0 01-2.8 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Kategori
            </legend>

            <div className="space-y-1.5">
              <RadioRow
                name="category"
                checked={selectedCategory === ''}
                onChange={() => setSelectedCategory('')}
                label="Semua Kategori"
              />
              {categories && categories.length > 0 ? categories.map((c) => (
                <RadioRow
                  key={c}
                  name="category"
                  checked={selectedCategory === c}
                  onChange={() => setSelectedCategory(c)}
                  label={capitalize(c)}
                />
              )) : (
                <div className="text-sm text-gray-500 italic">Tidak ada kategori tersedia</div>
              )}
            </div>
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* Price sort */}
          <fieldset>
            <legend className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M12 8c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2M12 8V7m0 10v1" />
              </svg>
              Urutkan Harga
            </legend>

            <Select
              value={priceSort}
              onChange={(v) => setPriceSort(v)}
              options={[
                { value: '', label: 'Default' },
                { value: 'low-to-high', label: 'Murah → Mahal' },
                { value: 'high-to-low', label: 'Mahal → Murah' }
              ]}
              ariaLabel="Urutkan harga"
            />
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* Rating sort */}
          <fieldset>
            <legend className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M3 4h13M3 8h9M3 12h6m9-2l4 4-4 4" />
              </svg>
              Urutkan Rating
            </legend>

            <Select
              value={ratingSort}
              onChange={(v) => setRatingSort(v)}
              options={[
                { value: '', label: 'Default' },
                { value: 'low-to-high', label: 'Rendah → Tinggi' },
                { value: 'high-to-low', label: 'Tinggi → Rendah' }
              ]}
              ariaLabel="Urutkan rating"
            />
          </fieldset>
        </div>

        {/* Footer: count */}
        <div className="px-5 pb-5">
        </div>
      </div>
    </aside>
  )
}

/* ───────── helpers ───────── */

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function RadioRow({
  name,
  checked,
  onChange,
  label
}: {
  name: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label
      className={`group flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer
                  transition-colors select-none
                  ${checked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="shrink-0 mt-0.5 h-4 w-4 accent-blue-600"
        aria-checked={checked}
      />
      <span className="text-sm text-gray-800">{label}</span>
    </label>
  )
}

function Select({
  value,
  onChange,
  options,
  ariaLabel
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  ariaLabel: string
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500
                   hover:border-gray-300 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}
