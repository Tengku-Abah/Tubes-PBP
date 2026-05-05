'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useCart from '../../hooks/useCart'
import { getCurrentUser, getAuthHeaders } from '../../lib/auth'
import PopupAlert from '../../components/PopupAlert'
import { usePopupAlert } from '../../hooks/usePopupAlert'
import { supabase } from '@/lib/supabaseClient'


export default function CheckoutPage() {
    const router = useRouter()
    const { cartItems, loading: cartLoading, subtotal, shipping, totalItem, total, refresh } = useCart()
    const { alertState, showError, showSuccess, hideAlert } = usePopupAlert()
    const [localSummary, setLocalSummary] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [shippingCharge, setShippingCharge] = useState()

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

            // Fetch address data from Supabase including Provinsi, Kota, Kode_pose
            const fetchUserAddressData = async () => {
                try {
                    const { data: dbUser } = await supabase
                        .from('users')
                        .select('address, "Provinsi", "Kota", "Kode_pose"')
                        .eq('id', user.id)
                        .single();

                    if (dbUser) {
                        // Only set if not null/undefined
                        if (dbUser.address) {
                            setAddress((prev: string) => prev || dbUser.address || '')
                        }
                        if (dbUser.Provinsi) {
                            setProvince((prev: string) => prev || dbUser.Provinsi || '')
                        }
                        if (dbUser.Kota) {
                            setCity((prev: string) => prev || dbUser.Kota || '')
                        }
                        if (dbUser.Kode_pose) {
                            setPostalCode((prev: string) => prev || dbUser.Kode_pose || '')
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user address data:', error);
                    // Jika error atau null, biarkan kosong (tidak set apapun)
                }
            };

            fetchUserAddressData();
        }
    }, [user])

    // Eligibility to proceed to payment
    const canProceedToPayment = Boolean(
        contactName && contactEmail && phoneNumber && address && city && postalCode && province &&
        ((cartItems && cartItems.length > 0) || (localSummary?.items?.length > 0))
    )

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-white">
                <div className="container mx-auto px-4 py-8">
                    {/* Back to Home Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-8"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-medium">Kembali ke Beranda</span>
                    </Link>

                    {/* Login Required */}
                    <div className="text-center py-16">
                        <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="h-12 w-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Login Diperlukan</h2>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            Anda harus login terlebih dahulu untuk melihat keranjang. Silakan login untuk melanjutkan belanja.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/Login"
                                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/Register"
                                className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                            >
                                Daftar
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
                showError(
                    'Checkout tidak diizinkan. Kembali ke cart dan coba lagi.',
                    'Checkout Tidak Diizinkan',
                    () => router.push('/cart')
                )
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
                showError(
                    'Cart kosong. Kembali ke cart untuk menambahkan item.',
                    'Keranjang Kosong',
                    () => router.push('/cart')
                )
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
                    street: address || '',
                    city: city || '',
                    postalCode: postalCode || '',
                    province: province || ''
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
                showError(
                    result.message || 'Server error',
                    'Gagal Memproses Pesanan'
                )
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

            // Show success message before redirect
            showSuccess(
                'Pesanan berhasil dibuat! Anda akan diarahkan ke halaman konfirmasi.',
                'Pesanan Berhasil',
                () => {
                    // navigate to success page (dummy payment flow)
                    router.push('/checkout/success')
                }
            )
        } catch (error) {
            console.error('placeOrder error', error)
            showError(
                'Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.',
                'Error Memproses Pesanan'
            )
        } finally {
            setLoading(false)
        }
    }

    const handlePlaceClick = async (e: React.FormEvent) => {
        e.preventDefault()
        // Minimal validation
        if (!contactName.trim() || !contactEmail.trim() || !address.trim()) {
            showError(
                'Harap isi nama, email dan alamat pengiriman',
                'Data Tidak Lengkap'
            )
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
        <div className="min-h-screen bg-gray-50">
            <PopupAlert
                isOpen={alertState.isOpen}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                showConfirmButton={alertState.showConfirmButton}
                confirmText={alertState.confirmText}
                onConfirm={alertState.onConfirm}
                showCancelButton={alertState.showCancelButton}
                cancelText={alertState.cancelText}
                onCancel={alertState.onCancel}
                autoClose={alertState.autoClose}
                autoCloseDelay={alertState.autoCloseDelay}
            />

            {/* Header - Same as Cart Page */}
            <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Back Button & Title */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/cart"
                                className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                            >
                                <svg className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="font-semibold text-sm md:text-base">Kembali</span>
                            </Link>
                            <div className="hidden sm:block w-px h-6 bg-blue-600"></div>
                            <h1 className="hidden sm:block text-base md:text-lg font-bold text-white">Checkout</h1>
                        </div>

                        {/* Right Actions - User Profile */}
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 md:py-8">
                {/* Checkout Info Banner */}
                {/* <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white rounded-full p-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    Proses Checkout
                                </p>
                                <p className="text-xs text-slate-600">
                                    {(cartItems && cartItems.length > 0) ? cartItems.length : (localSummary?.items?.length ?? 0)} item siap diproses
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-200">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="font-semibold text-slate-700">Pembayaran aman</span>
                        </div>
                    </div>
                </div> */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stepper */}
                    <div className="lg:col-span-3 mb-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between">
                                    {/* Step 1 */}
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= 1 ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>1</div>
                                        <div className="hidden md:block">
                                            <div className="text-xs text-slate-500">Step 1</div>
                                            <div className="font-semibold text-slate-800">Pengiriman</div>
                                        </div>
                                    </div>

                                    <div className={`flex-1 border-t-2 mx-4 transition-colors ${currentStep >= 2 ? 'border-primary-600' : 'border-slate-200'}`} />

                                    {/* Step 2 */}
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= 2 ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>2</div>
                                        <div className="hidden md:block">
                                            <div className="text-xs text-slate-500">Step 2</div>
                                            <div className="font-semibold text-slate-800">Pembayaran</div>
                                        </div>
                                    </div>

                                    <div className={`flex-1 border-t-2 mx-4 transition-colors ${currentStep >= 3 ? 'border-primary-600' : 'border-slate-200'}`} />

                                    {/* Step 3 */}
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= 3 ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>3</div>
                                        <div className="hidden md:block">
                                            <div className="text-xs text-slate-500">Step 3</div>
                                            <div className="font-semibold text-slate-800">Review</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Left: Form (2/3 width) */}
                    <form onSubmit={handlePlaceClick} className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Form Header */}
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-800">
                                    {currentStep === 1 ? 'Informasi Pengiriman' : currentStep === 2 ? 'Metode Pembayaran' : 'Review Pesanan'}
                                </h2>
                            </div>

                            {/* Form Content */}
                            <div className="p-6">
                                {/* Step 1: Shipping Form */}
                                {currentStep === 1 && (
                                    <>
                                        {/* Informasi Identitas */}
                                        <div className="mb-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600">Nama Lengkap</label>
                                                    <input value={contactName} onChange={e => setContactName(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600">Nomor Telepon</label>
                                                    <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-600">Email</label>
                                                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t-2 border-slate-200 my-6"></div>

                                        {/* Alamat Pengiriman */}
                                        <div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600">Alamat Lengkap</label>
                                                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"></textarea>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600">Provinsi</label>
                                                        <input value={province} onChange={e => setProvince(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600">Kota</label>
                                                        <input value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600">Kode Pos</label>
                                                        <input value={postalCode} onChange={e => setPostalCode(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600">Metode Pengiriman</label>
                                                        <div className="relative mt-1">
                                                            <select
                                                                value={shippingMethod}
                                                                onChange={e => setShippingMethod(e.target.value)}
                                                                className="block w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg bg-white text-slate-700 appearance-none cursor-pointer transition-all duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                                                            >
                                                                <option value="standard">Standard (3-5 hari)</option>
                                                                <option value="express">Express (1-2 hari)</option>
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Step 2: Payment Form */}
                                {currentStep === 2 && (
                                    <>
                                        {/* Info Banner */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-blue-900">Pilih Metode Pembayaran</p>
                                                    <p className="text-xs text-blue-700 mt-1">Kami mendukung COD, transfer bank, dan kartu kredit untuk kemudahan transaksi Anda.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metode Pembayaran */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Metode Pembayaran</label>
                                                <div className="relative">
                                                    <select
                                                        value={paymentMethod}
                                                        onChange={e => setPaymentMethod(e.target.value as 'cod' | 'bank' | 'credit-card')}
                                                        className="block w-full px-4 py-3 pr-10 border-2 border-slate-300 rounded-xl bg-white text-slate-700 appearance-none cursor-pointer transition-all duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm font-medium"
                                                    >
                                                        <option value="cod">Bayar di Tempat (COD)</option>
                                                        <option value="bank">Transfer Bank</option>
                                                        <option value="credit-card">Kartu Kredit</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Informasi Metode Pembayaran */}
                                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <h4 className="text-sm font-semibold text-slate-800">
                                                        {paymentMethod === 'cod' ? 'Informasi COD' : paymentMethod === 'bank' ? 'Informasi Transfer Bank' : 'Informasi Kartu Kredit'}
                                                    </h4>
                                                </div>
                                                <div className="text-sm text-slate-600 space-y-2">
                                                    {paymentMethod === 'cod' ? (
                                                        <ul className="space-y-2">
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Bayar langsung ke kurir saat pesanan diterima (COD).</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Kurir hanya menerima uang tunai, bukan transfer atau QRIS.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Pastikan alamat dan nomor telepon aktif untuk memudahkan pengantaran.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Siapkan uang pas untuk mempercepat proses pengantaran.</span>
                                                            </li>
                                                        </ul>
                                                    ) : paymentMethod === 'bank' ? (
                                                        <ul className="space-y-2">
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Transfer ke rekening resmi yang akan dikirim setelah order dibuat.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Sertakan nomor order pada berita transfer untuk mempercepat verifikasi.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Upload bukti transfer melalui halaman konfirmasi pembayaran.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Proses verifikasi biasanya memakan waktu 5–10 menit setelah transfer.</span>
                                                            </li>
                                                        </ul>
                                                    ) : (
                                                        <ul className="space-y-2">
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Pembayaran diproses secara aman melalui payment gateway terpercaya.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Data kartu tidak disimpan di server kami untuk keamanan Anda.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Pastikan saldo atau limit kartu mencukupi sebelum melakukan pembayaran.</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-primary-600 mt-0.5">•</span>
                                                                <span>Gunakan jaringan internet yang aman saat memasukkan data kartu.</span>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Catatan */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Catatan untuk Penjual (opsional)</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={e => setNotes(e.target.value)}
                                                    rows={4}
                                                    className="block w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-primary-400 shadow-sm resize-none"
                                                    placeholder="Contoh: Tolong kirim dalam kemasan gift, sertakan kartu ucapan, dll..."
                                                ></textarea>
                                                <p className="text-xs text-slate-500 mt-2">Tambahkan catatan khusus jika ada permintaan spesial untuk pesanan Anda.</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Step 3: Review Panel */}
                                {currentStep === 3 && (
                                    <>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="border rounded-xl p-4">
                                                <h3 className="font-medium text-slate-800 mb-2">Kontak</h3>
                                                <p className="text-sm text-slate-700">{contactName} • {contactEmail} • {phoneNumber}</p>
                                            </div>
                                            <div className="border rounded-xl p-4">
                                                <h3 className="font-medium text-slate-800 mb-2">Detail Pengiriman</h3>
                                                <p className="text-sm text-slate-700">{address}, {city}, {province} {postalCode}</p>
                                                <p className="text-sm text-slate-600 mt-1">Metode: {shippingMethod === 'express' ? 'Express (1-2 hari)' : 'Standard (3-5 hari)'}</p>
                                            </div>
                                            <div className="border rounded-xl p-4">
                                                <h3 className="font-medium text-slate-800 mb-2">Pembayaran</h3>
                                                <p className="text-sm text-slate-700">{paymentMethod === 'bank' ? 'Transfer Bank' : (paymentMethod === 'credit-card' ? 'Kartu Kredit' : 'Bayar di Tempat (COD)')}</p>
                                                {notes && <p className="text-sm text-slate-600 mt-1">Catatan: {notes}</p>}
                                            </div>
                                            <div className="border rounded-xl p-4">
                                                <h3 className="font-medium text-slate-800 mb-3">Produk</h3>
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
                                                        <span>Subtotal Pesanan</span>
                                                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.subtotal ?? subtotal)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>SubtotalPengiriman</span>
                                                        <span>
                                                            {(localSummary?.shipping ?? shipping) === 0 ? (
                                                                shippingMethod === 'express' ? (
                                                                    <div className="text-right">
                                                                        <div className="text-green-600 font-bold">Gratis</div>
                                                                        <div className="text-xs text-slate-400 line-through">+Rp 3.000</div>
                                                                    </div>
                                                                ) : (
                                                                    'Gratis'
                                                                )
                                                            ) : (
                                                                <div className="text-right">
                                                                    <div>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((localSummary?.shipping ?? shipping) + (shippingMethod === 'express' ? 3000 : 0))}</div>
                                                                    {shippingMethod === 'express' && (
                                                                        <div className="text-xs text-slate-400">+Rp 3.000 (Express)</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Pajak (11%)</span>
                                                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((localSummary?.subtotal ?? subtotal) * 0.11)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-800 font-semibold text-base pt-1">
                                                        <span>Total Pembayaran</span>
                                                        <span>
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                                                                (localSummary?.total ?? total) +
                                                                (shippingMethod === 'express' && (localSummary?.shipping ?? shipping) > 0 ? 3000 : 0)
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <input id="agree" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                                <label htmlFor="agree" className="text-sm text-slate-700">Saya mengkonfirmasi bahwa informasi di atas sudah benar.</label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Navigation Buttons */}
                                <div className="mt-6 flex items-center justify-between gap-3">
                                    <Link href="/cart" className="text-primary-600 hover:underline font-medium">Kembali ke keranjang</Link>
                                    <div className="flex gap-3">
                                        {/* Step 1: Shipping - Show "Go to Payment" */}
                                        {currentStep === 1 && (
                                            <button
                                                type="button"
                                                disabled={!canProceedToPayment}
                                                onClick={() => setCurrentStep(2)}
                                                className="px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                            >
                                                Lanjut ke Pembayaran
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
                                                    Kembali ke Pengiriman
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep(3)}
                                                    className="px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium"
                                                >
                                                    Lanjut ke Review
                                                </button>
                                            </>
                                        )}

                                        {/* Step 3: Review - Show "Back to Shipping" and "Place Order" */}
                                        {currentStep === 3 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep(2)}
                                                    className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                                                >
                                                    Kembali ke Pembayaran
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading || !agreed}
                                                    className="px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                                                >
                                                    {loading ? 'Memproses pesanan...' : 'Buat Pesanan'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Right: Order Summary (1/3 width) */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Ringkasan Pesanan
                                </h3>
                            </div>

                            {/* Items List */}
                            <div className="p-6">
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {(
                                        (cartItems && cartItems.length > 0)
                                            ? cartItems.map((c: any) => ({
                                                key: c.id,
                                                name: c.product?.name ?? 'Produk',
                                                qty: c.quantity ?? 1,
                                                price: typeof c.product?.price === 'number' ? c.product.price : 0
                                            }))
                                            : (localSummary?.items ?? []).map((it: any, idx: number) => ({
                                                key: idx,
                                                name: it.product?.name ?? it.productName ?? 'Produk',
                                                qty: it.quantity ?? 1,
                                                price: it.product?.price ?? it.price ?? 0
                                            }))
                                    ).map((row: any) => (
                                        <div key={row.key} className="flex items-start justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-slate-800">{row.name}</div>
                                                <div className="text-xs text-slate-500">Qty: {row.qty}</div>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.price * row.qty)}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary */}
                                <div className="border-t border-slate-200 mt-4 pt-4 space-y-3">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(localSummary?.subtotal ?? subtotal)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Pengiriman</span>
                                        <span className="font-medium">
                                            {(localSummary?.shipping ?? shipping) === 0 ? (
                                                shippingMethod === 'express' ? (
                                                    <div className="text-right">
                                                        <div className="text-green-600 font-bold">Gratis</div>
                                                        <div className="text-xs text-slate-400 line-through">+Rp 3.000</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-green-600 font-bold">Gratis</span>
                                                )
                                            ) : (
                                                <div className="text-right">
                                                    <div>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((localSummary?.shipping ?? shipping) + (shippingMethod === 'express' ? 3000 : 0))}</div>
                                                    {shippingMethod === 'express' && (
                                                        <div className="text-xs text-slate-400">+Rp 3.000 (Express)</div>
                                                    )}
                                                </div>
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-600 pb-3">
                                        <span>Pajak (11%)</span>
                                        <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((localSummary?.subtotal ?? subtotal) * 0.11)}</span>
                                    </div>

                                    {/* Total */}
                                    <div className="border-t-2 border-slate-200 pt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-bold text-slate-800">Total Pembayaran</span>
                                            <span className="text-2xl font-bold text-primary-700">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                                                    (localSummary?.total ?? total) +
                                                    (shippingMethod === 'express' && (localSummary?.shipping ?? shipping) > 0 ? 3000 : 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <svg className="w-4 h-4 text-slate-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Dengan melakukan pemesanan, Anda menyetujui Syarat & Ketentuan serta Kebijakan Privasi kami.
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
