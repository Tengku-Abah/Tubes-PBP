'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ShoppingCart } from 'lucide-react'

// Simple toast function since react-hot-toast might not be installed
const toast = {
  success: (message: string) => alert(message),
  error: (message: string) => alert(message)
}


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()


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
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
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
        // Call login API
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
        })

        const data = await response.json()

        if (data.success) {
          // Store user data in sessionStorage
          sessionStorage.setItem('user', JSON.stringify(data.data.user))
          
          toast.success('Login berhasil! Selamat datang kembali.')
          
          // Redirect based on user role
          if (data.data.user.role === 'admin') {
            router.push('/Admin')
          } else {
            router.push('/')
          }
        } else {
          toast.error(data.message || 'Login gagal. Silakan coba lagi.')
        }
      } catch (error: any) {
        console.error('Login error:', error)
        toast.error('Login gagal. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    } else {
      setErrors(newErrors)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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