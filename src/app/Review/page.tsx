"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Star, Package } from "lucide-react";
import PopupAlert from "../../components/PopupAlert";
import { usePopupAlert } from "../../hooks/usePopupAlert";

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
  
  // TODO: Get actual product data from API based on productId
  // For now using placeholder data
  const product = {
    id: searchParams.get("productId") || "1",
    name: "Wireless Headphones XYZ Premium Edition",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    price: 299000,
    variant: "Black, Medium"
  };

  const wordCount = review.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isValidReview = wordCount >= 10 && rating > 0;

  const handleSubmit = async () => {
    if (!isValidReview) {
      if (rating === 0) {
        showWarning("Silakan berikan rating untuk produk ini");
        return;
      }
      if (wordCount < 10) {
        showWarning("Ulasan minimal 10 kata. Saat ini: " + wordCount + " kata");
        return;
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          orderId: orderId,
          orderItemId: orderItemId,
          rating,
          comment: review
        })
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
                Varian: <span className="font-medium text-gray-800">{product.variant}</span>
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
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
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
            Ceritakan pengalaman Anda dengan produk ini (minimal 10 kata)
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
                className={`text-sm font-medium ${
                  wordCount >= 10 ? "text-green-600" : "text-orange-600"
                }`}
              >
                {wordCount} kata
              </span>
              {wordCount < 10 && (
                <span className="text-xs text-gray-500">
                  (minimal 10 kata)
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
                  className={`h-full transition-all duration-300 ${
                    wordCount >= 10 ? "bg-green-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min((wordCount / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Action Buttons */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1 py-3 px-6 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kembali
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValidReview || submitting}
              className="flex-1 py-3 px-6 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 shadow-lg hover:shadow-xl"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Mengirim...
                </span>
              ) : (
                "Kirim Ulasan"
              )}
            </button>
          </div>

          {/* Validation hints */}
          {!isValidReview && (review.length > 0 || rating > 0) && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium mb-1">
                ⚠️ Lengkapi ulasan Anda:
              </p>
              <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
                {rating === 0 && <li>Berikan rating (bintang)</li>}
                {wordCount < 10 && (
                  <li>Tulis ulasan minimal 10 kata (saat ini: {wordCount} kata)</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Popup Alert */}
      <PopupAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
        showConfirmButton={alertState.showConfirmButton}
        confirmText={alertState.confirmText}
        showCancelButton={alertState.showCancelButton}
        cancelText={alertState.cancelText}
        onCancel={alertState.onCancel}
        autoClose={alertState.autoClose}
        autoCloseDelay={alertState.autoCloseDelay}
      />
    </div>
  );
}
