'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Phone, Eye, EyeOff, ShoppingCart, Check, X, XCircle, UserPlus } from 'lucide-react'

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
  if (score === 3) return { label: 'Kuat', color: 'bg-gray-500', textColor: 'text-primary-600' }
  if (score === 4) return { label: 'Kuat', color: 'bg-gray-500', textColor: 'text-primary-600' }
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
          toast.success('🎉 Registrasi berhasil! Selamat bergabung di OctaMart.')
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden py-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 right-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

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
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
            </div>
          </div>
          <h1 className="text-3xl md:text-3xl font-bold text-gray-900 mb-2">
            Bergabung Bersama Kami! 🎉
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Buat akun untuk mulai berbelanja
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 backdrop-blur-sm bg-white/95">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <input
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border-2 ${
                    errors.namaLengkap 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                  } rounded-xl focus:ring-2 focus:outline-none transition-all bg-white text-sm`}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              {errors.namaLengkap && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.namaLengkap}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border-2 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
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

            {/* Nomor Telepon */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                <Phone className="w-4 h-4 text-indigo-600" />
                Nomor Telepon
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <input
                  type="tel"
                  name="noTelepon"
                  value={formData.noTelepon}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border-2 ${
                    errors.noTelepon 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                  } rounded-xl focus:ring-2 focus:outline-none transition-all bg-white text-sm`}
                  placeholder="08123456789"
                />
              </div>
              {errors.noTelepon && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.noTelepon}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border-2 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                  } rounded-xl focus:ring-2 focus:outline-none transition-all bg-white text-sm`}
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition rounded-lg hover:bg-indigo-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2.5 space-y-2">
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${strengthInfo.color}`}
                        style={{ width: `${Math.max((passwordStrength.score / 4) * 100, formData.password.length > 0 ? 10 : 0)}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-semibold ${strengthInfo.textColor} min-w-[80px] text-right`}>
                      {strengthInfo.label}
                    </span>
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-slate-400'}`}>
                      {passwordStrength.checks.uppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>1 huruf besar (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordStrength.checks.number ? 'text-green-600' : 'text-slate-400'}`}>
                      {passwordStrength.checks.number ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>1 angka (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordStrength.checks.special ? 'text-green-600' : 'text-slate-400'}`}>
                      {passwordStrength.checks.special ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>1 karakter khusus (!@#$%^&*)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-indigo-600 pt-0.5 border-t border-slate-200">
                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      </div>
                      <span className="font-medium">Panjang: {formData.password.length} karakter</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border-2 ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                  } rounded-xl focus:ring-2 focus:outline-none transition-all bg-white text-sm`}
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition rounded-lg hover:bg-indigo-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-blue-700 transform hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mendaftar...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-500 font-medium">SUDAH PUNYA AKUN?</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-700">
              Silakan masuk ke akun Anda{' '}
              <Link 
                href="/Login" 
                className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition inline-flex items-center gap-1"
              >
                Masuk di Sini
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
