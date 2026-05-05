'use client';

import { useAutoLogout } from '@/hooks/useAutoLogout';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AutoLogoutWrapperProps {
  children: React.ReactNode;
}

export default function AutoLogoutWrapper({ children }: AutoLogoutWrapperProps) {
  const pathname = usePathname();
  const { resetTimer, clearTimer } = useAutoLogout({
    timeout: 5 * 60 * 1000, // 5 menit
    onLogout: () => {
    }
  });

  // Halaman yang tidak memerlukan auto-logout (halaman auth)
  const authPages = ['/Login', '/Register'];
  const isAuthPage = authPages.includes(pathname);

  useEffect(() => {
    if (isAuthPage) {
      // Clear timer jika di halaman auth
      clearTimer();
    } else {
      // Reset timer jika bukan halaman auth
      resetTimer();
    }
  }, [pathname, isAuthPage, resetTimer, clearTimer]);

  return <>{children}</>;
}
