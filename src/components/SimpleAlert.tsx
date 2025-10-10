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
    const [isAnimating, setIsAnimating] = useState(false)
    const [isEntering, setIsEntering] = useState(true)

    useEffect(() => {
        // Trigger entrance animation
        const enterTimer = setTimeout(() => {
            setIsEntering(false)
        }, 50)

        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose()
            }, duration)

            return () => {
                clearTimeout(timer)
                clearTimeout(enterTimer)
            }
        }

        return () => clearTimeout(enterTimer)
    }, [duration, onClose])

    const handleClose = () => {
        setIsAnimating(true)
        setTimeout(() => {
            onClose()
        }, 350)
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-8 h-8 text-white drop-shadow-sm" />
            case 'error':
                return <XCircle className="w-8 h-8 text-white drop-shadow-sm" />
            case 'warning':
                return <AlertCircle className="w-8 h-8 text-white drop-shadow-sm" />
            case 'info':
                return <AlertCircle className="w-8 h-8 text-white drop-shadow-sm" />
            default:
                return <AlertCircle className="w-8 h-8 text-white drop-shadow-sm" />
        }
    }

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    gradient: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
                    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
                    text: 'text-gray-700',
                    title: 'text-gray-900',
                    button: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-emerald-500/25',
                    border: 'border-emerald-200/50'
                }
            case 'error':
                return {
                    gradient: 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600',
                    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
                    text: 'text-gray-700',
                    title: 'text-gray-900',
                    button: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-red-500/25',
                    border: 'border-red-200/50'
                }
            case 'warning':
                return {
                    gradient: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600',
                    iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
                    text: 'text-gray-700',
                    title: 'text-gray-900',
                    button: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg hover:shadow-amber-500/25',
                    border: 'border-amber-200/50'
                }
            case 'info':
                return {
                    gradient: 'bg-gradient-to-br from-blue-400 via-cyan-500 to-indigo-600',
                    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
                    text: 'text-gray-700',
                    title: 'text-gray-900',
                    button: 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-blue-500/25',
                    border: 'border-blue-200/50'
                }
            default:
                return {
                    gradient: 'bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600',
                    iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600',
                    text: 'text-gray-700',
                    title: 'text-gray-900',
                    button: 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 shadow-lg hover:shadow-gray-500/25',
                    border: 'border-gray-200/50'
                }
        }
    }

    const colors = getColors()

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-all duration-350 ease-out ${
                    isAnimating ? 'bg-opacity-0' : isEntering ? 'bg-opacity-0' : 'bg-opacity-60'
                }`}
                onClick={handleClose}
            />

            {/* Alert Modal */}
            <div className={`relative bg-white rounded-3xl shadow-2xl border ${colors.border} max-w-md w-full transform transition-all duration-350 ease-out ${
                isAnimating 
                    ? 'scale-90 opacity-0 translate-y-8 rotate-1' 
                    : isEntering
                    ? 'scale-95 opacity-0 -translate-y-4'
                    : 'scale-100 opacity-100 translate-y-0 rotate-0'
            } backdrop-blur-sm`}>
                
                {/* Decorative Header with Gradient */}
                <div className={`${colors.gradient} px-6 py-6 rounded-t-3xl relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white bg-opacity-10 rounded-full"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className={`${colors.iconBg} p-3 rounded-2xl shadow-lg`}>
                                {getIcon()}
                            </div>
                            <h3 className="text-xl font-bold text-white drop-shadow-sm">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 text-white hover:scale-110 active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 bg-gradient-to-b from-white to-gray-50">
                    <p className={`${colors.text} text-base leading-relaxed font-medium`}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-3xl border-t border-gray-100">
                    <div className="flex justify-end">
                        <button
                            onClick={handleClose}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-white transform hover:scale-105 active:scale-95 ${colors.button}`}
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
