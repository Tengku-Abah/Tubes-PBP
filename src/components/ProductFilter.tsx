'use client'

import { useMemo, useState } from 'react'

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
  const [categoryExpanded, setCategoryExpanded] = useState(true)
  const [priceExpanded, setPriceExpanded] = useState(true)
  const [ratingExpanded, setRatingExpanded] = useState(true)

  const hasActiveFilter = useMemo(() => {
    return selectedCategory !== '' || priceSort !== '' || ratingSort !== ''
  }, [selectedCategory, priceSort, ratingSort])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== '') count++
    if (priceSort !== '') count++
    if (ratingSort !== '') count++
    return count
  }, [selectedCategory, priceSort, ratingSort])

  return (
    <aside className="w-full">
      <div className="sticky top-24 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M3 4h18v2.6L14.6 13a2 2 0 00-.6 1.4V21l-4-2.2v-4.4a2 2 0 00-.6-1.4L3 6.6V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Filter</h3>
              {activeFilterCount > 0 && (
                <p className="text-xs text-gray-600">{activeFilterCount} aktif</p>
              )}
            </div>
          </div>

          {hasActiveFilter && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold
                         text-blue-700 hover:bg-blue-100 transition-all duration-200 border border-blue-200"
              aria-label="Reset semua filter"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h5M20 20v-5h-5M20 9A8 8 0 006 6M4 15a8 8 0 0014 3" />
              </svg>
              Hapus filter
            </button>
          )}
        </div>

        {/* Body */}
        <div className="divide-y divide-gray-100">
          {/* Category Section */}
          <CollapsibleSection
            title="Kategori"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M7 7h.01M7 3h5a2 2 0 011.4.6l7 7a2 2 0 010 2.8l-7 7a2 2 0 01-2.8 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            isExpanded={categoryExpanded}
            onToggle={() => setCategoryExpanded(!categoryExpanded)}
          >
            <div className="space-y-2">
              <RadioRow
                name="Kategori"
                checked={selectedCategory === ''}
                onChange={() => setSelectedCategory('')}
                label="Semua Kategori"
              />
              {categories && categories.length > 0 ? categories.map((c) => (
                <RadioRow
                  key={c}
                  name="Kategori"
                  checked={selectedCategory === c}
                  onChange={() => setSelectedCategory(c)}
                  label={capitalize(c)}
                />
              )) : (
                <div className="text-xs text-gray-500 italic px-3 py-2">Tidak ada kategori</div>
              )}
            </div>
          </CollapsibleSection>

          {/* Price Section */}
          <CollapsibleSection
            title="Harga"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
            isExpanded={priceExpanded}
            onToggle={() => setPriceExpanded(!priceExpanded)}
          >
            <div className="space-y-2">
              <RadioRow
                name="Harga"
                checked={priceSort === ''}
                onChange={() => setPriceSort('')}
                label="Default"
              />
              <RadioRow
                name="Harga"
                checked={priceSort === 'low-to-high'}
                onChange={() => setPriceSort('low-to-high')}
                label="Rendah ke Tinggi"
              />
              <RadioRow
                name="Harga"
                checked={priceSort === 'high-to-low'}
                onChange={() => setPriceSort('high-to-low')}
                label="Tinggi ke Rendah"
              />
            </div>
          </CollapsibleSection>

          {/* Rating Section */}
          <CollapsibleSection
            title="Penilaian"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
            isExpanded={ratingExpanded}
            onToggle={() => setRatingExpanded(!ratingExpanded)}
          >
            <div className="space-y-2">
              <RadioRow
                name="Penilaian"
                checked={ratingSort === ''}
                onChange={() => setRatingSort('')}
                label="Default"
              />
              <RadioRowWithIcon
                name="Penilaian"
                checked={ratingSort === 'high-to-low'}
                onChange={() => setRatingSort('high-to-low')}
                label="Tertinggi"
                icon={
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                }
              />
              <RadioRow
                name="Penilaian"
                checked={ratingSort === 'low-to-high'}
                onChange={() => setRatingSort('low-to-high')}
                label="Terendah"
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Results Counter */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Showing Results</span>
            <span className="font-bold text-blue-700">{filteredCount} of {totalCount}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ───────── Helper Components ───────── */

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children
}: {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="text-blue-600">
            {icon}
          </div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-5 pb-4">
          {children}
        </div>
      )}
    </div>
  )
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
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer
                  transition-all duration-200 select-none hover:bg-gray-50
                  ${checked ? 'bg-blue-50' : ''}`}
    >
      <div className="relative flex items-center">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
          aria-checked={checked}
        />
        {/* Custom Radio Button */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${checked ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>
          {checked && (
            <div className="w-2 h-2 rounded-full bg-white"></div>
          )}
        </div>
      </div>
      <span className={`text-sm transition-colors ${checked ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  )
}

function RadioRowWithIcon({
  name,
  checked,
  onChange,
  label,
  icon
}: {
  name: string
  checked: boolean
  onChange: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <label
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer
                  transition-all duration-200 select-none hover:bg-gray-50
                  ${checked ? 'bg-blue-50' : ''}`}
    >
      <div className="relative flex items-center">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
          aria-checked={checked}
        />
        {/* Custom Radio Button */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${checked ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>
          {checked && (
            <div className="w-2 h-2 rounded-full bg-white"></div>
          )}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-between">
        <span className={`text-sm transition-colors ${checked ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
          {label}
        </span>
        {icon && (
          <div className="ml-2">
            {icon}
          </div>
        )}
      </div>
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
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   hover:border-gray-300 transition-all cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}
