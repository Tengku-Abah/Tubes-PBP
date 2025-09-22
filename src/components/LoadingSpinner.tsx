'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        
        {/* Loading Text */}
        <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
          Loading products...
        </p>
      </div>
    </div>
  )
}
