'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '../lib/logout'

interface UserProfileDropdownProps {
  user: any
}

export default function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Derive avatar URL from sessionStorage or user metadata
  const resolveAvatarUrl = () => {
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('user_avatar_url') : null
      const metaAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.avatar
      const directAvatar = user?.avatar_url || user?.avatar
      return stored || metaAvatar || directAvatar || null
    } catch {
      return null
    }
  }

  useEffect(() => {
    setAvatarUrl(resolveAvatarUrl())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Refresh avatar whenever dropdown toggles (helps pick up recent sessionStorage changes)
  useEffect(() => {
    if (isOpen) {
      setAvatarUrl(resolveAvatarUrl())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleProfileClick = () => {
    router.push('/Profile')
    setIsOpen(false)
  }

  const handleViewOrdersClick = () => {
    router.push('/view-order')
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  // Get user display information
  const displayName = user?.user_metadata?.full_name || user?.name || user?.email?.split('@')[0] || 'User'
  const userRole = user?.user_metadata?.role || user?.role || 'Customer'
  const userEmail = user?.email || ''
  const userId = user?.id || ''
  const userPhone = user?.phone || '+62 812-3456-7890'
  
  // Get location from address field and limit to 2 sentences
  const getLocationDisplay = (address: string) => {
    if (!address) return 'Jakarta, Indonesia'
    
    // Split by common sentence delimiters
    const sentences = address.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
    
    // Take first 2 sentences and join them
    const limitedSentences = sentences.slice(0, 2).map(sentence => sentence.trim())
    return limitedSentences.join('. ') + (limitedSentences.length > 0 && !limitedSentences[limitedSentences.length - 1].endsWith('.') ? '.' : '')
  }
  
  const userLocation = getLocationDisplay(user?.address || user?.location || '')
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '26 September 2025'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-yellow-400 shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
            }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
            <svg
              className="w-5 h-5 text-blue-900"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* User Info - Desktop only */}
        <div className="hidden lg:flex flex-col items-start text-left">
          <span className="text-sm font-semibold text-white">
            {displayName}
          </span>
          <span className="text-xs text-blue-200">
            {userRole}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header with Gradient Background */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  {displayName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-blue-100 truncate">
                    {userRole}
                  </p>
                  <span className="px-1.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section - Compact Card Style */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Informasi Akun
            </h4>
            <div className="space-y-1.5">
              {/* Email */}
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 truncate font-medium">{userEmail}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 truncate font-medium">{userPhone}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 font-medium line-clamp-1">{userLocation}</p>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 truncate font-medium">{joinDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Section - Compact Button Group */}
          <div className="p-3 bg-white">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              Menu Akun
            </h4>
            <div className="space-y-1">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="flex-1 text-left">Ubah Profil</span>
                <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={handleViewOrdersClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="flex-1 text-left">Pesanan Saya</span>
                <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 group mt-1.5 border border-red-200"
              >
                <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-red-50 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="flex-1 text-left">Keluar</span>
                <svg className="w-3.5 h-3.5 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
