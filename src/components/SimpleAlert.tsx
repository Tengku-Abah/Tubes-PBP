'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface SimpleAlertProps {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    onClose: () => void
    duration?: number
}

export default function SimpleAlert({ type, title, message, onClose, duration = 5000 }: SimpleAlertProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-500" />
            case 'error':
                return <XCircle className="w-6 h-6 text-red-500" />
            case 'warning':
                return <AlertCircle className="w-6 h-6 text-yellow-500" />
            case 'info':
                return <AlertCircle className="w-6 h-6 text-blue-500" />
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
                    title: 'text-green-900',
                    button: 'bg-green-600 hover:bg-green-700'
                }
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    title: 'text-red-900',
                    button: 'bg-red-600 hover:bg-red-700'
                }
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    title: 'text-yellow-900',
                    button: 'bg-yellow-600 hover:bg-yellow-700'
                }
            case 'info':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    title: 'text-blue-900',
                    button: 'bg-blue-600 hover:bg-blue-700'
                }
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    title: 'text-gray-900',
                    button: 'bg-gray-600 hover:bg-gray-700'
                }
        }
    }

    const colors = getColors()

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Alert Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl border-2 max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
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
                            onClick={onClose}
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
                            onClick={onClose}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${colors.button}`}
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
export function useSimpleAlert() {
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
        <SimpleAlert
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
