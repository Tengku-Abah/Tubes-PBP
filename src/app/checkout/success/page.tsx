'use client'

import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center py-16">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful</h1>
        <p className="text-slate-600 mb-6">Thank you! Your order has been placed and is being processed. You will receive a confirmation email shortly.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/orders" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Orders</Link>
          <Link href="/" className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}
