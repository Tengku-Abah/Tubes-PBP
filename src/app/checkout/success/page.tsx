'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Consistent with Checkout Page */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
              >
                <svg className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold text-sm md:text-base">Kembali ke Beranda</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-blue-600"></div>
              <h1 className="hidden sm:block text-base md:text-lg font-bold text-white">Pesanan Berhasil</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Card */}
          <div className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Success Icon & Header */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100 p-8 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg mb-4 animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
                Pembayaran Berhasil! 🎉
              </h1>
              <p className="text-slate-600 text-base md:text-lg max-w-xl mx-auto">
                Terima kasih! Pesanan Anda telah berhasil dibuat dan sedang diproses.
              </p>
            </div>

            {/* Order Info */}
            <div className="p-8 space-y-6">
              {/* Info Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-medium">Konfirmasi Email</p>
                      <p className="text-sm text-slate-700 font-semibold">Segera Dikirim</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-purple-600 font-medium">Status Pesanan</p>
                      <p className="text-sm text-slate-700 font-semibold">Sedang Diproses</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Langkah Selanjutnya
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">Email konfirmasi akan dikirim ke inbox Anda dalam beberapa menit.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">Anda dapat melacak status pesanan di halaman &quot;Pesanan Saya&quot;.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">Pesanan akan diproses dan dikirim sesuai metode pengiriman yang dipilih.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link
                  href="/view-order"
                  className="flex-1 px-6 py-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 font-semibold text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Lihat Pesanan Saya
                  </div>
                </Link>
                <Link
                  href="/"
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-semibold text-center shadow-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Lanjut Belanja
                  </div>
                </Link>
              </div>

              {/* Help Text */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Butuh bantuan? Hubungi{' '}
                  <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium underline">
                    Customer Service
                  </Link>
                  {' '}kami.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
