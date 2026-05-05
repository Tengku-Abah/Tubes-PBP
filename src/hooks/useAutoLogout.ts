import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseAutoLogoutOptions {
  timeout?: number; // dalam milidetik, default 5 menit
  onLogout?: () => void;
}

export const useAutoLogout = (options: UseAutoLogoutOptions = {}) => {
  const { timeout = 5 * 60 * 1000, onLogout } = options; // 5 menit default
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(async () => {
      try {
        // Clear sessionStorage untuk keamanan
        sessionStorage.clear();

        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('loginTime');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'admin-auth-token=; path=/Admin; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Panggil callback logout jika ada
        if (onLogout) {
          onLogout();
        }
        
        // Redirect ke halaman login
        router.push('/Login');
      } catch (error) {
        console.error('Error during auto logout:', error);
      }
    }, timeout);
  };

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    // Event listeners untuk aktivitas user
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Reset timer pada setiap aktivitas
    const handleActivity = () => {
      resetTimer();
    };

    // Tambahkan event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set timer awal
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimer();
    };
  }, [timeout]);

  return {
    resetTimer,
    clearTimer
  };
};
