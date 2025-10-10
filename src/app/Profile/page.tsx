'use client'
import { User, Mail, Phone, MapPin, Edit2, Save, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ProfileSettings() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(true); // Set to true by default
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [tempProfile, setTempProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push('/Login');
          return;
        }

        setUser(currentUser);
        const userProfile = {
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          address: currentUser.address || ''
        };
        
        setProfile(userProfile);
        setTempProfile({
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          address: userProfile.address
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/Login');
      }
    };

    loadUserData();
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
    setTempProfile({ 
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone,
          address: tempProfile.address
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        const updatedProfile = {
          name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone,
          address: tempProfile.address
        };
        setProfile(updatedProfile);
        
        // Update user data in sessionStorage
        const updatedUser = { 
          ...user, 
          name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone,
          address: tempProfile.address
        };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Keep in edit mode, don't set isEditing to false
        alert('Profil berhasil diperbarui!');
      } else {
        alert('Gagal memperbarui profil: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Terjadi kesalahan saat memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempProfile({ 
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address
    });
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setTempProfile({ ...tempProfile, [field]: value });
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Memuat data profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 py-8 px-4">
      {/* Back Button - Positioned at screen edge */}
      <button
        onClick={handleBackToHome}
        className="fixed top-8 left-4 z-10 flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-white/50 rounded-lg transition-all duration-200 group shadow-sm"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="font-medium">Kembali ke Beranda</span>
      </button>

      <div className="max-w-3xl mx-auto">
        {/* Page Title - Centered */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Pengaturan Profil</h1>
          <p className="text-sm text-blue-600">Kelola informasi pribadi Anda</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-white rounded-full"></div>
            </div>
            <div className="relative">
              <div className="w-32 h-32 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <User size={64} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
              <p className="text-blue-100 mt-1">Member sejak 2024</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Nama */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-blue-900 mb-2">
                  <User size={18} className="mr-2 text-blue-600" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={isEditing ? tempProfile.name : profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isEditing
                      ? 'border-blue-400 focus:border-blue-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                />
              </div>

              {/* Email */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-blue-900 mb-2">
                  <Mail size={18} className="mr-2 text-blue-600" />
                  Email
                </label>
                <input
                  type="email"
                  value={isEditing ? tempProfile.email : profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isEditing
                      ? 'border-blue-400 focus:border-blue-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                />
              </div>

              {/* No HP */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-blue-900 mb-2">
                  <Phone size={18} className="mr-2 text-blue-600" />
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={isEditing ? tempProfile.phone : profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isEditing
                      ? 'border-blue-400 focus:border-blue-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                />
              </div>

              {/* Alamat */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-blue-900 mb-2">
                  <MapPin size={18} className="mr-2 text-blue-600" />
                  Alamat
                </label>
                <textarea
                  value={isEditing ? tempProfile.address : profile.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all resize-none ${
                    isEditing
                      ? 'border-blue-400 focus:border-blue-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Edit2 size={20} />
                  Edit Profil
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Simpan
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                  >
                    Batal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 text-center">
            <span className="font-semibold">💡 Tips:</span> Pastikan informasi Anda selalu terkini untuk pengalaman yang lebih baik
          </p>
        </div>
      </div>
    </div>
  );
}