'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Phone, Eye, EyeOff, ShoppingCart, Check, X } from 'lucide-react'

// Simple toast function since react-hot-toast might not be installed
const toast = {
  success: (message: string) => alert(message),
  error: (message: string) => alert(message)
}

// Password strength checker
const getPasswordStrength = (password: string) => {
  const checks = {
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    length: password.length >= 8
  }

  // Hitung score berdasarkan syarat yang dipenuhi
  let score = 0
  if (checks.uppercase) score++
  if (checks.number) score++
  if (checks.special) score++
  if (checks.length) score++

  return { score, checks }
}

const getStrengthLabel = (score: number, length: number) => {
  // Jika semua syarat terpenuhi (score === 4) DAN panjang >= 12, baru hijau
  if (score === 4 && length >= 12) {
    return { label: 'Sangat Kuat', color: 'bg-green-500', textColor: 'text-green-600' }
  }

  if (score === 0) return { label: 'Lemah', color: 'bg-red-500', textColor: 'text-red-600' }
  if (score === 1) return { label: 'Lemah', color: 'bg-red-500', textColor: 'text-red-600' }
  if (score === 2) return { label: 'Sedang', color: 'bg-yellow-500', textColor: 'text-yellow-600' }
  if (score === 3) return { label: 'Kuat', color: 'bg-blue-500', textColor: 'text-blue-600' }
  if (score === 4) return { label: 'Kuat', color: 'bg-blue-500', textColor: 'text-blue-600' }
  return { label: 'Sangat Kuat', color: 'bg-green-500', textColor: 'text-green-600' }
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    noTelepon: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthInfo = getStrengthLabel(passwordStrength.score, formData.password.length)

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
    const newErrors: { [key: string]: string } = {}

    if (!formData.namaLengkap.trim()) {
      newErrors.namaLengkap = 'Nama lengkap wajib diisi'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!formData.noTelepon.trim()) {
      newErrors.noTelepon = 'Nomor telepon wajib diisi'
    } else if (!/^[0-9]{10,13}$/.test(formData.noTelepon)) {
      newErrors.noTelepon = 'Nomor telepon harus 10-13 digit'
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter'
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password terlalu lemah. Gunakan minimal 1 huruf besar, 1 angka, 1 karakter khusus, dan 8 karakter'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length === 0) {
      setLoading(true)

      try {
        // Call registration API
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.namaLengkap,
            email: formData.email,
            phone: formData.noTelepon,
            password: formData.password,
            action: 'register'
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success('Registrasi berhasil! Selamat datang di UMKM Elektronik.')
          router.push('/Login')
        } else {
          toast.error(data.message || 'Registrasi gagal. Silakan coba lagi.')
        }
      } catch (error: any) {
        console.error('Registration error:', error)
        toast.error('Registrasi gagal. Silakan coba lagi.')
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
            Buat Akun
          </h1>
          <p className="text-blue-700 text-lg">
            Daftar untuk mulai berbelanja produk elektronik
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 ${errors.namaLengkap ? 'border-red-400' : 'border-blue-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-blue-50`}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              {errors.namaLengkap && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.namaLengkap}</p>
              )}
            </div>

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
                Nomor Telepon
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="tel"
                  name="noTelepon"
                  value={formData.noTelepon}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 ${errors.noTelepon ? 'border-red-400' : 'border-blue-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-blue-50`}
                  placeholder="08123456789"
                />
              </div>
              {errors.noTelepon && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.noTelepon}</p>
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
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${strengthInfo.color}`}
                        style={{ width: `${Math.max((passwordStrength.score / 4) * 100, formData.password.length > 0 ? 10 : 0)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${strengthInfo.textColor}`}>
                      {strengthInfo.label}
                    </span>
                  </div>

                  {/* Password Requirements */}
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className={`flex items-center gap-2 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.checks.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>1 huruf besar (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.checks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>1 angka (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.checks.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>1 karakter khusus (!@#$%^&*)</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <span className="text-sm font-medium">Panjang: {formData.password.length} karakter</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3.5 border-2 ${errors.confirmPassword ? 'border-red-400' : 'border-blue-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-blue-50`}
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-8 text-center border-t-2 border-blue-100 pt-6">
            <p className="text-blue-700">
              Sudah punya akun?{' '}
              <Link href="/Login" className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
