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
    const [isVisible, setIsVisible] = useState(false)
    const [isEntering, setIsEntering] = useState(false)

    useEffect(() => {
        // Trigger entrance animation
        const enterTimer = setTimeout(() => {
            setIsVisible(true)
            setIsEntering(true)
        }, 50)

        const timer = setTimeout(() => {
            handleClose()
        }, duration)

        return () => {
            clearTimeout(enterTimer)
            clearTimeout(timer)
        }
    }, [duration])

    const handleClose = () => {
        setIsEntering(false)
        setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 500) // Wait for animation to complete
        }, 100)
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'error':
                return <X className="w-5 h-5 text-red-500" />
            case 'info':
                return <CheckCircle className="w-5 h-5 text-primary-500" />
            default:
                return <CheckCircle className="w-5 h-5 text-gray-500" />
        }
    }

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-800',
                    iconBg: 'bg-gradient-to-br from-emerald-100 to-green-100',
                    shadow: 'shadow-xl shadow-emerald-200/50'
                }
            case 'error':
                return {
                    bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    iconBg: 'bg-gradient-to-br from-red-100 to-rose-100',
                    shadow: 'shadow-xl shadow-red-200/50'
                }
            case 'info':
                return {
                    bg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
                    border: 'border-primary-200',
                    text: 'text-primary-800',
                    iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
                    shadow: 'shadow-xl shadow-blue-200/50'
                }
            default:
                return {
                    bg: 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    iconBg: 'bg-gradient-to-br from-gray-100 to-slate-100',
                    shadow: 'shadow-xl shadow-gray-200/50'
                }
        }
    }

    const colors = getColors()

    return (
        <div
            className={`fixed top-4 right-4 z-[1000] flex items-center space-x-3 p-5 rounded-2xl border-2 ${colors.bg} ${colors.border} ${colors.shadow} backdrop-blur-sm transform transition-all duration-500 ease-out ${isVisible && isEntering
                ? 'translate-x-0 opacity-100 scale-100 rotate-0'
                : 'translate-x-full opacity-0 scale-95 rotate-1'
                }`}
            style={{
                animationDelay: isEntering ? '100ms' : '0ms'
            }}
        >
            <div className={`p-2 rounded-xl ${colors.iconBg} shadow-sm`}>
                {getIcon()}
            </div>
            <div className="flex-1">
                <p className={`text-sm font-semibold ${colors.text} leading-relaxed`}>
                    {message}
                </p>
            </div>
            <button
                onClick={handleClose}
                className={`p-2 rounded-xl hover:bg-white hover:bg-opacity-30 active:scale-95 transition-all duration-200 ${colors.text} hover:shadow-sm`}
            >
                <X className="w-4 h-4" />
            </button>
            
            {/* Decorative elements */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white bg-opacity-40 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white bg-opacity-30 rounded-full"></div>
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
