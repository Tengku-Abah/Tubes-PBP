'use client';

import React, { useState, useEffect } from 'react';

interface PopupAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  showConfirmButton?: boolean;
  confirmText?: string;
  onConfirm?: () => void;
  showCancelButton?: boolean;
  cancelText?: string;
  onCancel?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const PopupAlert: React.FC<PopupAlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showConfirmButton = true,
  confirmText = 'OK',
  onConfirm,
  showCancelButton = false,
  cancelText = 'Batal',
  onCancel,
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsEntering(true);
      // Small delay to trigger entrance animation
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    } else {
      setIsVisible(false);
      setIsEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        // When auto-closing a success/info alert, honor onConfirm for follow-up actions
        if (onConfirm) {
          handleConfirm();
        } else {
          handleClose();
        }
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, isOpen, autoCloseDelay, onConfirm]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsEntering(false);
      onClose();
    }, 400); // Wait for animation to complete
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-800',
          buttonColor: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-200',
          iconBg: 'bg-gradient-to-br from-emerald-100 to-green-100',
          headerGradient: 'bg-gradient-to-r from-emerald-500/10 to-green-500/10'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          buttonColor: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-200',
          iconBg: 'bg-gradient-to-br from-red-100 to-rose-100',
          headerGradient: 'bg-gradient-to-r from-red-500/10 to-rose-500/10'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          buttonColor: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-200',
          iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100',
          headerGradient: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
          borderColor: 'border-primary-200',
          textColor: 'text-primary-800',
          buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200',
          iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
          headerGradient: 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 ease-out ${
          isVisible ? 'scale-100 opacity-100 translate-y-0 rotate-0' : 'scale-95 opacity-0 translate-y-4 rotate-1'
        }`}
        style={{
          animationDelay: isEntering ? '100ms' : '0ms'
        }}
      >
        {/* Decorative gradient header */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${styles.headerGradient}`} />
        
        {/* Header */}
        <div className={`px-6 py-5 border-b ${styles.borderColor} ${styles.bgColor} rounded-t-2xl relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/20 rounded-full blur-xl" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full blur-lg" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center shadow-lg ring-1 ring-white/20`}>
                <span className="text-2xl drop-shadow-sm">{styles.icon}</span>
              </div>
              <h3 className={`text-xl font-bold ${styles.textColor} drop-shadow-sm`}>
                {title || (type === 'success' ? 'Berhasil!' : 
                          type === 'error' ? 'Error!' : 
                          type === 'warning' ? 'Peringatan!' : 'Informasi')}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-xl hover:bg-white/20 transition-all duration-200 ${styles.textColor} hover:scale-110 active:scale-95`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 bg-white">
          <p className={`text-base ${styles.textColor} leading-relaxed font-medium`}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50/80 to-gray-100/80 rounded-b-2xl border-t border-gray-100">
          <div className="flex justify-end space-x-3">
            {showCancelButton && (
              <button
                onClick={handleCancel}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                {cancelText}
              </button>
            )}
            {showConfirmButton && (
              <button
                onClick={handleConfirm}
                className={`px-6 py-3 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 hover:shadow-lg active:scale-95 ${styles.buttonColor}`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupAlert;
