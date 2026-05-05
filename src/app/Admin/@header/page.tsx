'use client';

import React, { useState, useEffect } from 'react';
import { Bell, User, ChevronDown, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import AdminNotification from '../../../components/AdminNotification';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AdminHeader({
  title = "Dashboard",
  subtitle = "Selamat datang kembali, Admin!"
}: AdminHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Get user data from session
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        setUserData(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <AdminNotification />

          {/* Profile Section */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {userData?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">
                  {userData?.role || 'Administrator'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="p-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {userData?.name || 'Admin User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {userData?.role || 'Administrator'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: #{userData?.id || '001'}
                      </p>
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-800">
                          {userData?.email || 'admin@elektroshop.com'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Telepon</p>
                        <p className="text-sm font-medium text-gray-800">
                          {userData?.phone || '+62 812-3456-7890'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Lokasi</p>
                        <p className="text-sm font-medium text-gray-800">
                          Jakarta, Indonesia
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Bergabung</p>
                        <p className="text-sm font-medium text-gray-800">
                          {userData?.created_at ? formatDate(userData.created_at) : '1 Januari 2024'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
