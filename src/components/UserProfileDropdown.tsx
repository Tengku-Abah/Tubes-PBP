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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-4 z-50">
          {/* User Info Header */}
          <div className="px-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar Besar"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {displayName}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {userRole}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  ID: #{userId.slice(0, 8)}-{userId.slice(-8)}
                </p>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="px-6 py-4 space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700">{userEmail}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-gray-700">{userPhone}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{userLocation}</span>
            </div>

            {/* Join Date */}
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700">{joinDate}</span>
            </div>
          </div>

          {/* Status */}
          <div className="px-6 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                Aktif
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-3 border-t border-gray-100 space-y-2">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Settings
            </button>

            <button
              onClick={handleViewOrdersClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              View Orders
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
