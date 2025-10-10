'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ShoppingCart, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

// Simple Alert Component
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onClose: () => void
}

function SimpleAlert({ type, title, message, onClose }: AlertProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />
      case 'info':
        return <AlertCircle className="w-6 h-6 text-blue-500" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          title: 'text-green-900',
          button: 'bg-green-600 hover:bg-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          title: 'text-red-900',
          button: 'bg-red-600 hover:bg-red-700'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          title: 'text-yellow-900',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          title: 'text-blue-900',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          title: 'text-gray-900',
          button: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }

  const colors = getColors()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Alert Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border-2 max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
        {/* Header */}
        <div className={`${colors.bg} px-6 py-4 rounded-t-2xl border-b ${colors.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3 className={`text-lg font-bold ${colors.title}`}>
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors ${colors.text}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className={`${colors.text} text-sm leading-relaxed`}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className={`${colors.bg} px-6 py-3 rounded-b-2xl border-t ${colors.border}`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${colors.button}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  } | null>(null)
  const router = useRouter()

  // Clear any existing session on component mount
  useEffect(() => {
    // Check if user explicitly logged out
    const logoutFlag = sessionStorage.getItem('logout')
    if (logoutFlag === 'true') {
      // User explicitly logged out, clear everything and don't auto-redirect
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('loginTime')
      sessionStorage.removeItem('logout')
      localStorage.removeItem('user')
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('loginTime')
      // Clear all auth cookies
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'admin-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      return
    }

    // Check for remembered login only if not explicitly logged out
    const rememberedUser = localStorage.getItem('user')
    const rememberMe = localStorage.getItem('rememberMe')

    if (rememberedUser && rememberMe === 'true') {
      try {
        const userData = JSON.parse(rememberedUser)
        const loginTime = localStorage.getItem('loginTime')
        const now = Date.now()

        // Check if login is still valid (within 30 days)
        if (loginTime && (now - parseInt(loginTime)) < 2592000000) { // 30 days in milliseconds
          // Auto-login with remembered user
          sessionStorage.setItem('user', JSON.stringify(userData))
          sessionStorage.setItem('loginTime', now.toString())

          // Set role-specific cookies for middleware
          const cookieOptions = 'max-age=2592000' // 30 days
          
          if (userData.role === 'admin') {
            document.cookie = `admin-auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`
            document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          } else {
            document.cookie = `user-auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`
            document.cookie = 'admin-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }

          // Keep general auth-token for backward compatibility
          document.cookie = `auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`

          // Dispatch custom event to notify other components about login
          window.dispatchEvent(new CustomEvent('user-login', { detail: userData }))

          // Redirect based on role
          if (userData.role === 'admin') {
            router.replace('/Admin')
          } else {
            router.replace('/')
          }
          return
        } else {
          // Login expired, clear localStorage
          localStorage.removeItem('user')
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('loginTime')
        }
      } catch (error) {
        console.error('Error parsing remembered user data:', error)
        // Clear invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('loginTime')
      }
    }

    // Clear sessionStorage if no remembered login and clear all auth cookies
    sessionStorage.removeItem('user')
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'admin-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }, [router])

  // Function to show alert
  const displayAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertData({ type, title, message })
    setShowAlert(true)
  }

  // Function to hide alert
  const hideAlert = () => {
    setShowAlert(false)
    setAlertData(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    // Hide alert when user starts typing
    if (showAlert) {
      hideAlert()
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length === 0) {
      setLoading(true)

      try {
        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        // Call login API with timeout
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            action: 'login'
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          // Store user data in both sessionStorage and cookies for middleware
          const userData = data.data.user
          sessionStorage.setItem('user', JSON.stringify(userData))
          sessionStorage.setItem('loginTime', Date.now().toString())

          // Set role-specific cookies to prevent session conflicts
          const cookieOptions = rememberMe ? 'max-age=2592000' : 'max-age=86400' // 30 days or 24 hours
          
          if (userData.role === 'admin') {
            // Set admin-specific cookie
            document.cookie = `admin-auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`
            // Clear user cookie if exists
            document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          } else {
            // Set user-specific cookie
            document.cookie = `user-auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`
            // Clear admin cookie if exists
            document.cookie = 'admin-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }

          // Keep general auth-token for backward compatibility
          document.cookie = `auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`

          // Remember Me functionality
          if (rememberMe) {
            // Store in localStorage for persistent login (30 days)
            localStorage.setItem('user', JSON.stringify(userData))
            localStorage.setItem('rememberMe', 'true')
            localStorage.setItem('loginTime', Date.now().toString())
          } else {
            // Clear localStorage if not remembering
            localStorage.removeItem('user')
            localStorage.removeItem('rememberMe')
            localStorage.removeItem('loginTime')
          }

          // No alert for successful login - will show toast on dashboard

          // Dispatch custom event to notify other components about login
          window.dispatchEvent(new CustomEvent('user-login', { detail: userData }))

          // Use replace instead of push for better UX
          if (userData.role === 'admin') {
            router.replace('/Admin')
          } else {
            router.replace('/')
          }
        } else {
          displayAlert('error', 'Login Gagal', data.message || 'Silakan coba lagi.')
        }
      } catch (error: any) {
        console.error('Login error:', error)
        if (error.name === 'AbortError') {
          displayAlert('warning', 'Login Timeout', 'Silakan coba lagi.')
        } else {
          displayAlert('error', 'Login Gagal', 'Silakan coba lagi.')
        }
      } finally {
        setLoading(false)
      }
    } else {
      setErrors(newErrors)
      // No alert for validation errors - errors shown below fields
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {showAlert && alertData && (
        <SimpleAlert
          type={alertData.type}
          title={alertData.title}
          message={alertData.message}
          onClose={hideAlert}
        />
      )}
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-medium">Kembali ke Beranda</span>
      </Link>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl">
              <ShoppingCart className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            Selamat Datang
          </h1>
          <p className="text-blue-700 text-lg">
            Masuk untuk melanjutkan belanja Anda
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 ${errors.email ? 'border-red-400' : 'border-blue-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-blue-50`}
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3.5 border-2 ${errors.password ? 'border-red-400' : 'border-blue-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-blue-50`}
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-blue-50 border-blue-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-blue-700 font-medium">
                Ingat saya
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 text-center border-t-2 border-blue-100 pt-6">
            <p className="text-blue-700">
              Belum punya akun?{' '}
              <Link href="/Register" className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-blue-700">
            © 2025 UMKM Elektronik. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </div>
  )
}