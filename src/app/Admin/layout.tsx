'use client';

import React from 'react';
import AdminProtection from '../../components/AdminProtection';
import { AdminProvider } from './AdminContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}

export default function AdminLayout({
  children,
  sidebar,
  header
}: AdminLayoutProps) {
  return (
    <AdminProtection>
      <AdminProvider>
        <div className="flex h-screen bg-white">
          {/* Sidebar */}
          {sidebar}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {/* Header */}
            {header}

            {/* Content */}
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </AdminProvider>
    </AdminProtection>
  );
}
