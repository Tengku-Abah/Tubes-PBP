import { useState } from 'react';

interface PopupAlertState {
  isOpen: boolean;
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

export const usePopupAlert = () => {
  const [alertState, setAlertState] = useState<PopupAlertState>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showAlert = (config: Omit<PopupAlertState, 'isOpen'>) => {
    setAlertState({
      ...config,
      isOpen: true
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const showSuccess = (message: string, title?: string, onConfirm?: () => void) => {
    showAlert({
      message,
      title,
      type: 'success',
      onConfirm,
      autoClose: true,
      autoCloseDelay: 2000
    });
  };

  const showError = (message: string, title?: string, onConfirm?: () => void) => {
    showAlert({
      message,
      title,
      type: 'error',
      onConfirm
    });
  };

  const showWarning = (message: string, title?: string, onConfirm?: () => void) => {
    showAlert({
      message,
      title,
      type: 'warning',
      onConfirm
    });
  };

  const showInfo = (message: string, title?: string, onConfirm?: () => void) => {
    showAlert({
      message,
      title,
      type: 'info',
      onConfirm,
      autoClose: true,
      autoCloseDelay: 3000
    });
  };

  const showConfirm = (
    message: string, 
    title?: string, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    showAlert({
      message,
      title,
      type: 'warning',
      showConfirmButton: true,
      showCancelButton: true,
      confirmText: confirmText || 'Ya',
      cancelText: cancelText || 'Tidak',
      onConfirm,
      onCancel
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};
