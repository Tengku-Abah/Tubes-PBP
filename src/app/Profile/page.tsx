'use client';

import { User, Mail, Phone, MapPin, Edit2, Save, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, User as UserType } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

// Types
interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'pembeli';
  created_at: string;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ProfileSettings() {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tempProfile, setTempProfile] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const { showToast, ToastComponent } = useToast();

  const showSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const showError = (message: string) => {
    showToast(message, 'error');
  };

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Fetch user profile from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (userProfile) {
        setProfile(userProfile);
        setTempProfile({
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          address: userProfile.address || ''
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (!profile) return;
    
    setIsEditing(true);
    setTempProfile({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || ''
    });
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);

      // Validate required fields
      if (!tempProfile.name.trim()) {
        throw new Error('Nama tidak boleh kosong');
      }

      if (!tempProfile.email.trim()) {
        throw new Error('Email tidak boleh kosong');
      }

      // Update user profile in database
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          name: tempProfile.name.trim(),
          email: tempProfile.email.trim(),
          phone: tempProfile.phone.trim() || null,
          address: tempProfile.address.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) {
        throw new Error('Gagal memperbarui profil');
      }

      // Update local state
      setProfile(data);
      setIsEditing(false);
      showSuccess('Profil berhasil diperbarui');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memperbarui profil';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    
    setTempProfile({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || ''
    });
    setIsEditing(false);
    setError(null);
  };

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-blue-600">Memuat profil...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <span className="ml-2">{error}</span>
            </div>
            <div className="text-center mt-4">
              <button
                onClick={fetchUserProfile}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Pengaturan Profil</h1>
          <p className="text-blue-600">Kelola informasi pribadi Anda</p>
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
              <p className="text-blue-100 mt-1">
                Member sejak {new Date(profile.created_at).getFullYear()}
              </p>
              {profile.role === 'admin' && (
                <span className="inline-block mt-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
                  Administrator
                </span>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Nama */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-blue-900 mb-2">
                  <User size={18} className="mr-2 text-blue-600" />
                  Nama Lengkap
                  <span className="text-red-500 ml-1">*</span>
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
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Email */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-blue-900 mb-2">
                  <Mail size={18} className="mr-2 text-blue-600" />
                  Email
                  <span className="text-red-500 ml-1">*</span>
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
                  placeholder="Masukkan alamat email"
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
                  value={isEditing ? tempProfile.phone : (profile.phone || '')}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isEditing
                      ? 'border-blue-400 focus:border-blue-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                  placeholder="Masukkan nomor telepon"
                />
              </div>

              {/* Alamat */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-blue-900 mb-2">
                  <MapPin size={18} className="mr-2 text-blue-600" />
                  Alamat
                </label>
                <textarea
                  value={isEditing ? tempProfile.address : (profile.address || '')}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all resize-none ${
                    isEditing
                      ? 'border-blue-400 focus:border-blue-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                  placeholder="Masukkan alamat lengkap"
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
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Simpan
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Informasi Akun</h3>
              <p className="text-sm text-blue-600">
                Bergabung sejak {profile ? new Date(profile.created_at).getFullYear() : ''} • 
                {profile?.role === 'admin' ? ' Administrator' : ' Member'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Component */}
      {ToastComponent}
    </div>
  );
}