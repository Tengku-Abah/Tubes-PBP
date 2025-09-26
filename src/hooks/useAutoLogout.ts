import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
        // Logout dari Supabase
        await supabase.auth.signOut();
        
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
