'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    onClose: () => void
    duration?: number
}

export default function ModernAlert({ type, title, message, onClose, duration = 5000 }: AlertProps) {
    const [isVisible, setIsVisible] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [duration])

    const handleClose = () => {
        setIsAnimating(true)
        setTimeout(() => {
            setIsVisible(false)
            onClose()
        }, 300)
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-500" />
            case 'error':
                return <XCircle className="w-6 h-6 text-red-500" />
            case 'warning':
                return <AlertCircle className="w-6 h-6 text-yellow-500" />
            case 'info':
                return <AlertCircle className="w-6 h-6 text-primary-500" />
            default:
                return <AlertCircle className="w-6 h-6 text-gray-500" />
        }
    }

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    title: 'text-green-900'
                }
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    title: 'text-red-900'
                }
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    title: 'text-yellow-900'
                }
            case 'info':
                return {
                    bg: 'bg-primary-50',
                    border: 'border-primary-200',
                    text: 'text-primary-800',
                    title: 'text-primary-900'
                }
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    title: 'text-gray-900'
                }
        }
    }

    const colors = getColors()

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'
                    }`}
                onClick={handleClose}
            />

            {/* Alert Modal */}
            <div
                className={`relative bg-white rounded-2xl shadow-2xl border-2 ${colors.border} max-w-md w-full transform transition-all duration-300 ${isAnimating
                        ? 'scale-95 opacity-0 translate-y-4'
                        : 'scale-100 opacity-100 translate-y-0'
                    }`}
            >
                {/* Header */}
                <div className={`${colors.bg} px-6 py-4 rounded-t-2xl border-b ${colors.border}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {getIcon()}
                            <h3 className={`text-lg font-bold ${colors.title}`}>
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className={`p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors ${colors.text}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <p className={`${colors.text} text-sm leading-relaxed`}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className={`${colors.bg} px-6 py-3 rounded-b-2xl border-t ${colors.border}`}>
                    <div className="flex justify-end">
                        <button
                            onClick={handleClose}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${type === 'success'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : type === 'error'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : type === 'warning'
                                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                                }`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Hook untuk menggunakan alert
export function useAlert() {
    const [alert, setAlert] = useState<{
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
    } | null>(null)

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        setAlert({ type, title, message })
    }

    const hideAlert = () => {
        setAlert(null)
    }

    const AlertComponent = alert ? (
        <ModernAlert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={hideAlert}
        />
    ) : null

    return {
        showAlert,
        hideAlert,
        AlertComponent
    }
}
