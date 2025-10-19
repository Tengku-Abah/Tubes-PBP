'use client';

import React, { useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, Menu, X, Zap, LogOut, Tags } from 'lucide-react';
import { useAdminContext } from '../AdminContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { logout } from '../../../lib/logout';

export default function AdminSidebar() {
  const { sidebarOpen, setSidebarOpen, activeMenu, setActiveMenu } = useAdminContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/Admin' },
    { id: 'orders', icon: ShoppingCart, label: 'Pesanan', href: '/Admin?menu=orders' },
    { id: 'products', icon: Package, label: 'Produk', href: '/Admin?menu=products' },
    { id: 'categories', icon: Tags, label: 'Kategori', href: '/Admin?menu=categories' },
    { id: 'customers', icon: Users, label: 'Pelanggan', href: '/Admin?menu=customers' },
    { id: 'keuangan', icon: TrendingUp, label: 'Keuangan', href: '/Admin?menu=keuangan' }
  ];

  const handleMenuClick = (menuId: string, href: string) => {
    setActiveMenu(menuId);
    router.push(href);
  };

  // Sync activeMenu dengan URL saat component mount
  useEffect(() => {
    const menuParam = searchParams.get('menu');
    if (menuParam && menuParam !== activeMenu) {
      setActiveMenu(menuParam);
    } else if (!menuParam && activeMenu !== 'dashboard') {
      setActiveMenu('dashboard');
    }
  }, [searchParams, activeMenu, setActiveMenu]);

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col shadow-xl`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-blue-700">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-400" />
            <span className="font-bold text-lg">OctaMart</span>
          </div>
        )}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id, item.href)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeMenu === item.id 
                ? 'bg-blue-700 shadow-lg' 
                : 'hover:bg-blue-700/50'
            }`}
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon size={20} />
            {sidebarOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={() => logout()}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-red-600/20 hover:text-red-300 ${
            sidebarOpen ? 'text-blue-200' : 'justify-center'
          }`}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
        {sidebarOpen && (
          <div className="text-xs text-blue-200 text-center mt-2">
            Admin Panel v1.0
          </div>
        )}
      </div>
    </aside>
  );
}
