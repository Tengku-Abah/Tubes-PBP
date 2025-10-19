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
        return <AlertCircle className="w-6 h-6 text-primary-500" />
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
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          text: 'text-primary-800',
          title: 'text-primary-900',
          button: 'bg-primary-600 hover:bg-primary-700'
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
      document.cookie = 'admin-auth-token=; path=/Admin; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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
            document.cookie = `admin-auth-token=${JSON.stringify(userData)}; path=/Admin; ${cookieOptions}`
          } else {
            document.cookie = `user-auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`
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

    // Clear sessionStorage if no remembered login (preserve existing cookies)
    sessionStorage.removeItem('user')
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
            // Set admin-specific cookie (scoped to /Admin)
            document.cookie = `admin-auth-token=${JSON.stringify(userData)}; path=/Admin; ${cookieOptions}`
          } else {
            // Set user-specific cookie
            document.cookie = `user-auth-token=${JSON.stringify(userData)}; path=/; ${cookieOptions}`
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

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
        className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-700 hover:text-blue-900 hover:bg-white transition-all rounded-xl shadow-sm hover:shadow group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-semibold text-sm">Beranda</span>
      </Link>

      <div className="max-w-md w-full relative z-10">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
            </div>
          </div>
          <h1 className="text-3xl md:text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang Kembali! 👋
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 backdrop-blur-sm bg-white/95">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                <Mail className="w-4 h-4 text-blue-600" />
                Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border-2 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                  } rounded-xl focus:ring-2 focus:outline-none transition-all bg-white text-sm`}
                  placeholder="nama@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border-2 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                  } rounded-xl focus:ring-2 focus:outline-none transition-all bg-white text-sm`}
                  placeholder="Masukkan password Anda"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition rounded-lg hover:bg-blue-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition">
                  Ingat saya
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-500 font-medium">ATAU</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-700">
              Belum punya akun?{' '}
              <Link 
                href="/Register" 
                className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition inline-flex items-center gap-1"
              >
                Daftar Sekarang
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2025 OctaMart. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </div>
  )
}