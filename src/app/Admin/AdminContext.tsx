'use client';

import React, { createContext, useContext, useState } from 'react';

interface AdminContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <AdminContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      activeMenu,
      setActiveMenu
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}
