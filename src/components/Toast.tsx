'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ToastProps {
    message: string
    type: 'success' | 'error' | 'info'
    duration?: number
    onClose: () => void
}

export default function Toast({ message, type, duration = 4000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose()
        }, duration)

        return () => clearTimeout(timer)
    }, [duration])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'error':
                return <X className="w-5 h-5 text-red-500" />
            case 'info':
                return <CheckCircle className="w-5 h-5 text-blue-500" />
            default:
                return <CheckCircle className="w-5 h-5 text-gray-500" />
        }
    }

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800'
                }
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800'
                }
            case 'info':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800'
                }
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800'
                }
        }
    }

    const colors = getColors()

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center space-x-3 p-4 rounded-lg border-2 ${colors.bg} ${colors.border} shadow-lg transform transition-all duration-300 ${isVisible
                ? 'translate-x-0 opacity-100'
                : 'translate-x-full opacity-0'
                }`}
        >
            {getIcon()}
            <p className={`text-sm font-medium ${colors.text}`}>
                {message}
            </p>
            <button
                onClick={handleClose}
                className={`p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors ${colors.text}`}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

// Hook untuk menggunakan toast
export function useToast() {
    const [toast, setToast] = useState<{
        message: string
        type: 'success' | 'error' | 'info'
    } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type })
    }

    const hideToast = () => {
        setToast(null)
    }

    const ToastComponent = toast ? (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
        />
    ) : null

    return {
        showToast,
        hideToast,
        ToastComponent
    }
}
