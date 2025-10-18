"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Star, Package } from "lucide-react";
import PopupAlert from "../../components/PopupAlert";
import { usePopupAlert } from "../../hooks/usePopupAlert";
import { getAuthHeaders } from "../../lib/auth";

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { alertState, showSuccess, showError, showWarning, hideAlert } = usePopupAlert();

  // Get params from URL: orderId, orderItemId, productId
  // Example URL: /Review?orderId=123&orderItemId=456&productId=789
  const orderId = searchParams.get("orderId");
  const orderItemId = searchParams.get("orderItemId");

  // Derive product params so changes in query immediately reflect in UI
  const productIdParam = searchParams.get("productId") || "";
  const productNameParam = searchParams.get("productName") || "Produk";
  const productPriceParam = Number(searchParams.get("productPrice") || 0);
  const productImageParam = searchParams.get("productImage");
  const categoryParam = searchParams.get("category") ?? searchParams.get("variant") ?? "—";

  // Product state sourced from URL params and kept in sync on navigation
  const defaultImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400";
  const [product, setProduct] = useState({
    id: productIdParam,
    name: productNameParam,
    image: productImageParam || defaultImage,
    price: productPriceParam,
    category: "",
  });

  // Synchronize product state whenever specific URL params change
  useEffect(() => {
    setProduct(prev => ({
      ...prev,
      id: productIdParam,
      name: productNameParam,
      image: productImageParam || prev.image || defaultImage,
      price: productPriceParam,
      category: prev.category,
    }));
  }, [productIdParam, productNameParam, productPriceParam, productImageParam, categoryParam]);

  // Fetch product details (image/name/price) when productId changes if image not provided
  useEffect(() => {
    if (!productIdParam) return;
    let cancelled = false;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product?id=${productIdParam}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json?.success && json.data) {
          const img = json.data.image;
          const name = json.data.name;
          const price = json.data.price;
          const category = json.data.category;
          setProduct(prev => ({
            ...prev,
            image: img || prev.image,
            name: typeof name === 'string' ? name : prev.name,
            price: typeof price === 'number' ? price : prev.price,
            category: typeof category === 'string' && category.trim().length > 0 ? category : prev.category,
          }));
        }
      } catch (_) {
        // ignore
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [productIdParam]);

  const wordCount = review.trim().split(/\s+/).filter((word) => word.length > 0).length;
  const isValidReview = wordCount >= 5 && rating > 0;

  const handleSubmit = async () => {
    if (!isValidReview) {
      if (rating === 0) {
        showWarning("Silakan berikan rating untuk produk ini");
        return;
      }
      if (wordCount < 5) {
        showWarning("Ulasan minimal 5 kata. Saat ini: " + wordCount + " kata");
        return;
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          productId: Number(product.id),
          orderId: orderId ? Number(orderId) : undefined,
          orderItemId: orderItemId ? Number(orderItemId) : undefined,
          rating,
          comment: review.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(
          "Ulasan berhasil dikirim! Terima kasih atas feedback Anda.",
          "Berhasil!",
          () => {
            router.back();
          }
        );
      } else {
        // Handle different error cases
        if (response.status === 401) {
          showError("Anda harus login terlebih dahulu untuk memberikan ulasan.", "Login Diperlukan");
        } else if (response.status === 409) {
          showWarning("Anda sudah memberikan ulasan untuk produk ini sebelumnya.");
        } else {
          showError(data.message || "Gagal mengirim ulasan. Silakan coba lagi.");
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      showError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - consistent with view-order page */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 text-white">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tulis Ulasan Produk</h1>
              <p className="text-blue-100 text-sm mt-1">Bagikan pengalaman Anda dengan produk ini</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Section 1: Product Summary Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Produk yang Diulas
          </h2>

          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-blue-700 font-bold text-lg mb-1">
                {formatPrice(product.price)}
              </p>
              <p className="text-sm text-gray-600">
                Kategori: <span className="font-medium text-gray-800">{product.category || '—'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Rating */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Penilaian Anda
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Berikan rating untuk produk ini (1-5 bintang)
          </p>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={`${star} bintang`}
              >
                <Star
                  className={`w-10 h-10 transition-colors ${star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 fill-gray-300"
                    }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="mt-3 text-sm font-medium text-gray-700">
              Rating Anda: {rating} dari 5 bintang
              {rating === 5 && " ⭐ Sempurna!"}
              {rating === 4 && " 👍 Sangat Bagus!"}
              {rating === 3 && " 👌 Bagus"}
              {rating === 2 && " 😐 Cukup"}
              {rating === 1 && " 😔 Kurang"}
            </p>
          )}
        </div>

        {/* Section 3: Review Text */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Ulasan Anda
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Ceritakan pengalaman Anda dengan produk ini (minimal 5 kata)
          </p>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Contoh: Produk ini sangat bagus dan sesuai dengan deskripsi. Kualitas material sangat premium dan pengiriman cepat. Saya sangat merekomendasikan produk ini!"
            className="w-full min-h-[200px] px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
            maxLength={500}
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <span
<<<<<<< HEAD
                className={`text-sm font-medium ${wordCount >= 10 ? "text-green-600" : "text-orange-600"
=======
                className={`text-sm font-medium ${wordCount >= 5 ? "text-green-600" : "text-orange-600"
>>>>>>> 4871d41 (local: Review page fixes + auth headers + category sync)
                  }`}
              >
                {wordCount} kata
              </span>
              {wordCount < 5 && (
                <span className="text-xs text-gray-500">
                  (minimal 5 kata)
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {review.length}/500 karakter
            </span>
          </div>

          {/* Word count indicator */}
          {review.length > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
<<<<<<< HEAD
                  className={`h-full transition-all duration-300 ${wordCount >= 10 ? "bg-green-500" : "bg-orange-500"
                    }`}
                  style={{ width: `${Math.min((wordCount / 10) * 100, 100)}%` }}
=======
                  className={`h-full transition-all duration-300 ${wordCount >= 5 ? "bg-green-500" : "bg-orange-500"
                    }`}
                  style={{ width: `${Math.min((wordCount / 5) * 100, 100)}%` }}
>>>>>>> 4871d41 (local: Review page fixes + auth headers + category sync)
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Mengirim..." : "Kirim Ulasan"}
            </button>
          </div>
        </div>
      </div>

      {/* PopupAlert for verification feedback */}
      <PopupAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
      />
    </div>
  );
}