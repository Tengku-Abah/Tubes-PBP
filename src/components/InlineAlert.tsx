'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface InlineAlertProps {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    show: boolean
    onClose?: () => void
    duration?: number
}

export default function InlineAlert({ type, message, show, onClose, duration = 5000 }: InlineAlertProps) {
    const [isVisible, setIsVisible] = useState(show)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        setIsVisible(show)
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                handleClose()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [show, duration])

    const handleClose = () => {
        if (onClose) {
            setIsAnimating(true)
            setTimeout(() => {
                setIsVisible(false)
                onClose()
            }, 300)
        }
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />
            case 'info':
                return <AlertCircle className="w-5 h-5 text-blue-500" />
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />
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
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800'
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

    if (!isVisible) return null

    return (
        <div
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${colors.bg} ${colors.border} transform transition-all duration-300 ${isAnimating
                    ? 'opacity-0 scale-95 translate-y-2'
                    : 'opacity-100 scale-100 translate-y-0'
                }`}
        >
            {getIcon()}
            <p className={`flex-1 text-sm font-medium ${colors.text}`}>
                {message}
            </p>
            {onClose && (
                <button
                    onClick={handleClose}
                    className={`p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors ${colors.text}`}
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
