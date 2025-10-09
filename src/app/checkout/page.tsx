 'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useCart from '../../hooks/useCart'
import { getCurrentUser, getAuthHeaders } from '../../lib/auth'


export default function CheckoutPage() {
    const router = useRouter()
    const { cartItems, loading: cartLoading, subtotal, shipping, totalItem, total, refresh } = useCart()
    const [localSummary, setLocalSummary] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        checkLoginStatus()
        // if sessionStorage has a checkout summary (from cart page), load it immediately
        try {
            const raw = sessionStorage.getItem('checkout_summary')
            if (raw) setLocalSummary(JSON.parse(raw))
        } catch (_) {
            setLocalSummary(null)
        }
    }, [])

    const checkLoginStatus = () => {
        try {
            const userData = sessionStorage.getItem('user')
            if (userData) {
                const parsedUser = JSON.parse(userData)
                setUser(parsedUser)
                setIsLoggedIn(true)
            } else {
                setIsLoggedIn(false)
                setUser(null)
            }
        } catch (error) {
            console.error('Error checking login status:', error)
            setIsLoggedIn(false)
            setUser(null)
        }
    }

    useEffect(() => {
        // When user is logged-in and initialLoading flag is true, refresh server cart to reconcile
        if (isLoggedIn) {
            refresh().finally(() => setInitialLoading(false))
        } else {
            setInitialLoading(false)
        }
    }, [isLoggedIn, refresh])

    // Local form state for the checkout form (must be declared unconditionally)
    const [contactName, setContactName] = useState(user?.name ?? '')
    const [contactEmail, setContactEmail] = useState(user?.email ?? '')
    const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? '')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [postalCode, setPostalCode] = useState('')
    const [province, setProvince] = useState('')
    const [shippingMethod, setShippingMethod] = useState('standard')
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'credit-card'>('cod')
    const [notes, setNotes] = useState('')
    const [currentStep, setCurrentStep] = useState<number>(1)
    const [agreed, setAgreed] = useState(false)

    // When user data arrives, prefill contact fields once (but keep them editable)
    useEffect(() => {
        if (user) {
            setContactName((prev: string) => prev || user.name || '')
            setContactEmail((prev: string) => prev || user.email || '')
            setPhoneNumber((prev: string) => prev || user.phone || '')
        }
    }, [user])

    // Eligibility to proceed to payment
    const canProceedToPayment = Boolean(
    contactName && contactEmail && phoneNumber && address && city && postalCode && province &&
        ((cartItems && cartItems.length > 0) || (localSummary?.items?.length > 0))
    )

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
                <div className="container mx-auto px-4 py-8">
                    {/* Back to Home Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-8"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    {/* Login Required */}
                    <div className="text-center py-16">
                        <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="h-12 w-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Login Required</h2>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            You need to be logged in to view your cart. Please login to continue shopping.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/Login"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/Register"
                                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const placeOrder = async () => {
        setLoading(true)
        try {
            // Basic guard: ensure checkout was allowed and user is present
            const allowed = sessionStorage.getItem('checkout_allowed') === '1'
            const currentUser = getCurrentUser()
            if (!allowed || !currentUser) {
                alert('Checkout not allowed. Please return to cart and try again.')
                router.push('/cart')
                return
            }

            // Prepare minimal payload: items (id, qty) and totals computed server-side
            // Build items: prefer authoritative cartItems; fallback to localSummary.items
            const itemsFromCart = cartItems.map((it: any) => ({
                productId: it.product.id,
                productName: it.product.name,
                quantity: it.quantity,
                price: it.product.price
            }))

            const itemsFromSummary = (localSummary?.items ?? []).map((it: any) => {
                const productId = it.productId ?? it.product?.id ?? it.product_id ?? it.id
                const name = it.product?.name ?? it.name ?? 'Item'
                const qty = it.quantity ?? 1
                const price = typeof it.price === 'number' ? it.price : (it.product?.price ?? 0)
                return { productId, productName: name, quantity: qty, price: price }
            })

            const finalItems = itemsFromCart.length > 0 ? itemsFromCart : itemsFromSummary

            if (finalItems.length === 0) {
                alert('Cart kosong. Kembali ke cart untuk menambahkan item.')
                router.push('/cart')
                return
            }

            const clientSummary = localSummary ?? {
                subtotal,
                shipping,
                tax: subtotal * 0.11,
                total
            }

            const payload = {
                customerName: contactName,
                customerEmail: contactEmail,
                customerPhone: phoneNumber,
                items: finalItems,
                shippingAddress: {
                    street: address,
                    city,
                    postalCode,
                    province
                },
                paymentMethod: paymentMethod === 'bank' ? 'bank_transfer' : (paymentMethod === 'credit-card' ? 'credit_card' : 'cash_on_delivery'),
                notes: notes || undefined,
                client_summary: clientSummary
            }

            const authHeaders = getAuthHeaders() || {}
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            Object.keys(authHeaders).forEach(k => {
                const v = (authHeaders as any)[k]
                if (v !== undefined && v !== null) headers[k] = String(v)
            })

            const resp = await fetch('/api/orders', { method: 'POST', headers, body: JSON.stringify(payload) })
            const result = await resp.json()

            if (!resp.ok || !result.success) {
                console.error('Order creation failed', result)
                alert('Failed to place order: ' + (result.message || 'Server error'))
                return
            }

            // Delete only the checked-out items from cart
            const cartItemIds = (localSummary?.items ?? [])
                .map((it: any) => it.cartItemId)
                .filter((id: any) => id !== undefined && id !== null)

            if (cartItemIds.length > 0) {
                try {
                    // Delete each cart item
                    await Promise.all(
                        cartItemIds.map((itemId: number) =>
                            fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' })
                        )
                    )
                } catch (deleteError) {
                    console.error('Error deleting cart items:', deleteError)
                    // Continue anyway - order was successful
                }
            }

            // Clear client-side checkout flags to avoid reuse
            sessionStorage.removeItem('checkout_allowed')
            sessionStorage.removeItem('checkout_summary')

            // navigate to success page (dummy payment flow)
            router.push('/checkout/success')
        } catch (error) {
            console.error('placeOrder error', error)
            alert('Something went wrong placing the order')
        } finally {
            setLoading(false)
        }
    }

    const handlePlaceClick = async (e: React.FormEvent) => {
        e.preventDefault()
        // Minimal validation
        if (!contactName.trim() || !contactEmail.trim() || !address.trim()) {
            alert('Please fill name, email and shipping address')
            return
        }

        // Attach minimal client summary (ensure it's present)
        if (!localSummary) {
            // derive from cartItems
            const derived = {
                items: cartItems.map(it => ({ 
                    productId: it.product.id, 
                    productName: it.product.name,
                    quantity: it.quantity,
                    price: it.product.price,
                    itemTotal: it.quantity * it.product.price
                })),
                subtotal,
                shipping,
                tax: subtotal * 0.11,
                total,
                totalItems: cartItems.reduce((s, it) => s + it.quantity, 0)
            }
            setLocalSummary(derived)
            sessionStorage.setItem('checkout_summary', JSON.stringify(derived))
        }

        // Mark review step as active
        setCurrentStep(3)
        // Let placeOrder handle server side
        await placeOrder()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stepper */}
                    <div className="lg:col-span-3 mb-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>1</div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">Step 1</div>
                                                        <div className="font-medium">Shipping</div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 border-t border-slate-200 mx-3" />

                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>2</div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">Step 2</div>
                                                        <div className="font-medium">Payment</div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 border-t border-slate-200 mx-3" />

                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>3</div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">Step 3</div>
                                                        <div className="font-medium">Review</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Left: Form (2/3 width) */}
                    <form onSubmit={handlePlaceClick} className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                        {/* Step 1: Shipping Form */}
                        {currentStep === 1 && (
                            <>
                                <h2 className="text-xl font-semibold mb-4">Contact & Shipping</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Full name</label>
                                        <input value={contactName} onChange={e => setContactName(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Email</label>
                                        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Phone</label>
                                        <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Province</label>
                                        <input value={province} onChange={e => setProvince(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-600">Address</label>
                                    <input value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">City</label>
                                        <input value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Postal Code</label>
                                        <input value={postalCode} onChange={e => setPostalCode(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Shipping Method</label>
                                        <select value={shippingMethod} onChange={e => setShippingMethod(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="standard">Standard (3-5 days)</option>
                                            <option value="express">Express (1-2 days)</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 2: Payment Form */}
                        {currentStep === 2 && (
                            <>
                                <h2 className="text-xl font-semibold mb-4">Payment</h2>
                                <p className="text-sm text-slate-600 mb-4">We currently support payment on delivery and bank transfer (placeholder). Implement real payment gateway later.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Payment Method</label>
                                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'cod' | 'bank' | 'credit-card')} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="cod">Cash on Delivery</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="credit-card">Credit Card</option>
                                        </select>
                                        <div className="mt-3 text-sm text-slate-600 bg-slate-50 border rounded-lg p-3">
                                            {paymentMethod === 'cod' ? (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Bayar langsung ke kurir saat pesanan diterima (COD).</li>
                                                    <li>Kurir hanya menerima uang tunai, bukan transfer atau QRIS.</li>
                                                    <li>Pastikan alamat dan nomor telepon aktif untuk memudahkan pengantaran.</li>
                                                    <li>Siapkan uang pas untuk mempercepat proses pengantaran.</li>
                                                    <li>Pesanan tidak dapat dibuka sebelum pembayaran dilakukan.</li>                                                </ul>
                                            ) : paymentMethod === 'bank' ? (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Transfer ke rekening resmi yang akan dikirim setelah order dibuat.</li>
                                                    <li>Sertakan nomor order pada berita transfer untuk mempercepat verifikasi.</li>
                                                    <li>Upload bukti transfer melalui halaman konfirmasi pembayaran.</li>
                                                    <li>Pesanan akan diproses setelah pembayaran terverifikasi oleh sistem.</li>
                                                    <li>Proses verifikasi biasanya memakan waktu 5–10 menit setelah transfer.</li>                                                </ul>
                                            ) : (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Pembayaran diproses secara aman melalui payment gateway terpercaya.</li>
                                                    <li>Data kartu tidak disimpan di server kami untuk keamanan Anda.</li>
                                                    <li>Pastikan saldo atau limit kartu mencukupi sebelum melakukan pembayaran.</li>
                                                    <li>Pesanan akan langsung diproses setelah transaksi berhasil.</li>
                                                    <li>Gunakan jaringan internet yang aman saat memasukkan data kartu.</li>                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600">Notes (optional)</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add any special instructions..."></textarea>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 3: Review Panel */}
                        {currentStep === 3 && (
                            <>
                            <h2 className="text-xl font-semibold mb-4">Review Order</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="border rounded-xl p-4">
                                    <h3 className="font-medium text-slate-800 mb-2">Contact</h3>
                                    <p className="text-sm text-slate-700">{contactName} • {contactEmail} • {phoneNumber}</p>
                                </div>
                                <div className="border rounded-xl p-4">
                                    <h3 className="font-medium text-slate-800 mb-2">Shipping Address</h3>
                                    <p className="text-sm text-slate-700">{address}, {city}, {province} {postalCode}</p>
                                    <p className="text-sm text-slate-600 mt-1">Method: {shippingMethod === 'express' ? 'Express (1-2 days)' : 'Standard (3-5 days)'}</p>
                                </div>
                                <div className="border rounded-xl p-4">
                                    <h3 className="font-medium text-slate-800 mb-2">Payment</h3>
                                    <p className="text-sm text-slate-700">{paymentMethod === 'bank' ? 'Bank Transfer' : (paymentMethod === 'credit-card' ? 'Credit Card' : 'Cash on Delivery')}</p>
                                    {notes && <p className="text-sm text-slate-600 mt-1">Notes: {notes}</p>}
                                </div>
                                <div className="border rounded-xl p-4">
                                    <h3 className="font-medium text-slate-800 mb-3">Items</h3>
                                    <div className="space-y-2">
                                        {(
                                            (cartItems && cartItems.length > 0)
                                                ? cartItems.map((c: any) => ({
                                                    key: c.id,
                                                    name: c.product?.name ?? 'Item',
                                                    qty: c.quantity ?? 1,
                                                    price: Number((c.product as any)?.price ?? 0)
                                                }))
                                                : (localSummary?.items ?? []).map((it: any, idx: number) => ({
                                                    key: idx,
                                                    name: it.product?.name ?? it.productName ?? 'Item',
                                                    qty: it.quantity ?? 1,
                                                    price: Number(it.product?.price ?? it.price ?? 0)
                                                }))
                                        ).map((row: any) => (
                                            <div key={row.key} className="flex items-center justify-between text-sm">
                                                <div className="text-slate-700">{row.name} <span className="text-slate-500">× {row.qty}</span></div>
                                                <div className="font-medium text-slate-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.price * row.qty)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t mt-3 pt-3 space-y-1 text-sm">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Subtotal</span>
                                            <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.subtotal ?? subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Shipping</span>
                                            <span>{(localSummary?.shipping ?? shipping) === 0 ? 'Free' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.shipping ?? shipping)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Tax (11%)</span>
                                            <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((localSummary?.subtotal ?? subtotal) * 0.11)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-800 font-semibold text-base pt-1">
                                            <span>Total</span>
                                            <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.total ?? total)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input id="agree" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="agree" className="text-sm text-slate-700">I confirm the information above is correct.</label>
                                </div>
                            </div>
                            </>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex items-center justify-between gap-3">
                            <Link href="/cart" className="text-blue-600 hover:underline font-medium">Back to cart</Link>
                            <div className="flex gap-3">
                                {/* Step 1: Shipping - Show "Go to Payment" */}
                                {currentStep === 1 && (
                                    <button
                                        type="button"
                                        disabled={!canProceedToPayment}
                                        onClick={() => setCurrentStep(2)}
                                        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        Go to Payment
                                    </button>
                                )}

                                {/* Step 2: Payment - Show "Back to Shipping" and "Go to Review" */}
                                {currentStep === 2 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(1)}
                                            className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                                        >
                                            Back to Shipping
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(3)}
                                            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                                        >
                                            Go to Review
                                        </button>
                                    </>
                                )}

                                {/* Step 3: Review - Show "Place Order" */}
                                {currentStep === 3 && (
                                    <button 
                                        type="submit" 
                                        disabled={loading || !agreed} 
                                        className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                                    >
                                        {loading ? 'Placing order...' : 'Place Order'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Right: Order Summary (1/3 width) */}
                    <aside className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

                        <div className="space-y-3">
                            {(
                                (cartItems && cartItems.length > 0)
                                    ? cartItems.map((c: any) => ({
                                        key: c.id,
                                        name: c.product?.name ?? 'Item',
                                        qty: c.quantity ?? 1,
                                        price: typeof c.product?.price === 'number' ? c.product.price : 0
                                    }))
                                    : (localSummary?.items ?? []).map((it: any, idx: number) => ({
                                        key: idx,
                                        name: it.product?.name ?? it.productName ?? 'Item',
                                        qty: it.quantity ?? 1,
                                        price: it.product?.price ?? it.price ?? 0
                                    }))
                            ).map((row: any) => (
                                <div key={row.key} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">{row.name}</div>
                                        <div className="text-xs text-slate-500">Qty: {row.qty}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.price * row.qty)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-slate-200 mt-4 pt-4 space-y-3">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.subtotal ?? subtotal)}</span>
                            </div>

                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Shipping</span>
                                <span className="font-medium">{(localSummary?.shipping ?? shipping) === 0 ? 'Free' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.shipping ?? shipping)}</span>
                            </div>

                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Tax (11%)</span>
                                <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((localSummary?.subtotal ?? subtotal) * 0.11)}</span>
                            </div>

                            <div className="flex justify-between text-lg font-semibold mt-2">
                                <span>Total</span>
                                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.total ?? total)}</span>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-slate-500">By placing your order you agree to our Terms of Service and Privacy Policy.</div>
                    </aside>
                </div>
            </div>
        </div>
    )
}