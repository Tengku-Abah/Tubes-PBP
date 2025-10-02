'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { logout } from '../../../lib/logout';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AdminHeader({
  title = "Dashboard",
  subtitle = "Selamat datang kembali, Admin!"
}: AdminHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <AlertCircle className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
          </div>
          <button
            onClick={() => logout()}
            className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold hover:from-red-600 hover:to-red-800 transition-colors"
            title="Logout"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
