'use client'
import { User, Mail, Phone, MapPin, Edit2, Save, ArrowLeft, Camera, Trash2, UserCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  Provinsi?: string;
  Kota?: string;
  Kode_pose?: string;
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
    address: '',
    Provinsi: '',
    Kota: '',
    Kode_pose: ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tempProfile, setTempProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    Provinsi: '',
    Kota: '',
    Kode_pose: ''
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push('/Login');
          return;
        }

        setUser(currentUser);

        // Fetch full user data from database including Provinsi, Kota, Kode_pose
        const { data: dbUser } = await supabase
          .from('users')
          .select('name, email, phone, address, "Provinsi", "Kota", "Kode_pose", user_avatar')
          .eq('id', currentUser.id)
          .single();

        const userProfile = {
          name: dbUser?.name || currentUser.name || '',
          email: dbUser?.email || currentUser.email || '',
          phone: dbUser?.phone || currentUser.phone || '',
          address: dbUser?.address || currentUser.address || '',
          Provinsi: dbUser?.Provinsi || '',
          Kota: dbUser?.Kota || '',
          Kode_pose: dbUser?.Kode_pose || ''
        };

        setProfile(userProfile);
        setTempProfile({
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          address: userProfile.address,
          Provinsi: userProfile.Provinsi,
          Kota: userProfile.Kota,
          Kode_pose: userProfile.Kode_pose
        });
        // Handle avatar URL from database
        const rawAvatar = (dbUser as any)?.user_avatar as string | null;
        if (rawAvatar) {
          // Jika sudah berupa URL penuh, langsung gunakan
          if (/^https?:\/\//.test(rawAvatar)) {
            setAvatarUrl(rawAvatar);
            sessionStorage.setItem('user_avatar_url', rawAvatar);
          } else {
            // Asumsikan path berada di bucket 'product-images'
            let path = rawAvatar;
            if (path.startsWith('product-images/')) {
              path = path.replace('product-images/', '');
            }
            const { data: urlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(path);
            if (urlData?.publicUrl) {
              setAvatarUrl(urlData.publicUrl);
              setAvatarPath(path);
              sessionStorage.setItem('user_avatar_url', urlData.publicUrl);
              sessionStorage.setItem('user_avatar_path', path);
            }
          }
        }
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
      address: profile.address,
      Provinsi: profile.Provinsi,
      Kota: profile.Kota,
      Kode_pose: profile.Kode_pose
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
          address: tempProfile.address,
          Provinsi: tempProfile.Provinsi,
          Kota: tempProfile.Kota,
          Kode_pose: tempProfile.Kode_pose
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        const updatedProfile = {
          name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone,
          address: tempProfile.address,
          Provinsi: tempProfile.Provinsi,
          Kota: tempProfile.Kota,
          Kode_pose: tempProfile.Kode_pose
        };
        setProfile(updatedProfile);

        // Update user data in sessionStorage
        const updatedUser = {
          ...user,
          name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone,
          address: tempProfile.address,
          Provinsi: tempProfile.Provinsi,
          Kota: tempProfile.Kota,
          Kode_pose: tempProfile.Kode_pose,
          avatar: avatarUrl || undefined
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

  const handleAvatarClick = () => {
    if (!isEditing || uploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      // 1) Minta signed upload URL dari server (pakai service role)
      const signRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'avatars', fileExt: file.name.split('.').pop() }),
      });
      const signText = await signRes.text();
      let signData: any = null;
      try { signData = JSON.parse(signText); } catch { /* non-JSON body */ }
      if (!signRes.ok || !signData || !signData.success || !signData.path || !signData.token) {
        // Fallback: coba unggah via server multipart/form-data jika pembuatan signed URL gagal
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('folder', 'avatars');
          const upRes = await fetch('/api/upload', { method: 'POST', body: form });
          const upData = await upRes.json().catch(() => ({}));
          if (!upRes.ok || !upData?.success || !upData?.path || !upData?.url) {
            alert('Gagal membuat URL unggah. ' + (signData?.error || signText || ''));
            return;
          }
          // Jika fallback berhasil, set avatar dan simpan path ke database
          setAvatarUrl(upData.url);
          setAvatarPath(upData.path);
          sessionStorage.setItem('user_avatar_url', upData.url);
          sessionStorage.setItem('user_avatar_path', upData.path);
          
          // Update user object in sessionStorage with avatar
          const currentUser = getCurrentUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, avatar_url: upData.url, avatar: upData.url };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatarUrl: upData.url } }));
          }
          
          try {
            if (currentUser?.id) {
              await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currentUser.id, user_avatar: upData.path })
              });
            }
          } catch (saveErr) {
            console.error('Save avatar path error:', saveErr);
          }
          return;
        } catch (fErr) {
          console.error('Fallback upload error:', fErr);
          alert('Gagal membuat URL unggah. ' + (signData?.error || signText || ''));
          return;
        }
      }

      // 2) Unggah langsung dari browser ke Supabase Storage memakai signed URL
      const BUCKET_NAME = 'product-images';
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .uploadToSignedUrl(signData.path, signData.token, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadErr) {
        alert('Gagal mengunggah foto. ' + (uploadErr.message || ''));
        return;
      }

      // 3) Ambil public URL dari path
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(signData.path);

      setAvatarUrl(urlData.publicUrl);
      setAvatarPath(signData.path);
      sessionStorage.setItem('user_avatar_url', urlData.publicUrl);
      sessionStorage.setItem('user_avatar_path', signData.path);
      
      // Update user object in sessionStorage with avatar
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar_url: urlData.publicUrl, avatar: urlData.publicUrl };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatarUrl: urlData.publicUrl } }));
      }
      
      // Simpan path ke database users.user_avatar
      try {
        if (currentUser?.id) {
          await fetch('/api/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser.id, user_avatar: signData.path })
          });
        }
      } catch (saveErr) {
        console.error('Save avatar path error:', saveErr);
      }
    } catch (err) {
      console.error('Upload avatar error:', err);
      alert('Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    if (!avatarPath) {
      setAvatarUrl(null);
      sessionStorage.removeItem('user_avatar_url');
      return;
    }
    setUploadingAvatar(true);
    try {
      const response = await fetch(`/api/upload?path=${encodeURIComponent(avatarPath)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert('Gagal menghapus foto. ' + (result?.error?.message || result?.error || ''));
        return;
      }
      setAvatarUrl(null);
      setAvatarPath(null);
      sessionStorage.removeItem('user_avatar_url');
      sessionStorage.removeItem('user_avatar_path');
      
      // Update user object in sessionStorage to remove avatar
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar_url: undefined, avatar: undefined };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatarUrl: null } }));
      }
      
      // Hapus path avatar di database
      try {
        if (currentUser?.id) {
          await fetch('/api/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser.id, user_avatar: null })
          });
        }
      } catch (saveErr) {
        console.error('Remove avatar path error:', saveErr);
      }
    } catch (err) {
      console.error('Delete avatar error:', err);
      alert('Gagal menghapus foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    setTempProfile({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      Provinsi: profile.Provinsi,
      Kota: profile.Kota,
      Kode_pose: profile.Kode_pose
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold">Memuat data profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Back Button & Title */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBackToHome}
                className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
              >
                <svg className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold text-sm md:text-base">Kembali</span>
              </button>
              <div className="hidden sm:block w-px h-6 bg-blue-600"></div>
              <h1 className="hidden sm:flex items-center gap-2 text-base md:text-lg font-bold text-white">
                <UserCircle className="w-5 h-5" />
                Pengaturan Profil
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-white rounded-full"></div>
            </div>
            <div className="relative">
              <div
                className="w-28 h-28 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg overflow-hidden relative cursor-pointer hover:ring-4 hover:ring-white/30 transition group"
                onClick={handleAvatarClick}
                title={isEditing ? 'Klik untuk mengganti foto' : undefined}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Foto Profil" className="w-full h-full object-cover" />
                ) : (
                  <User size={56} className="text-primary-600" />
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                    <div
                      className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
                      aria-label="Mengunggah foto"
                    />
                  </div>
                )}
                {/* Overlay hint on hover */}
                {isEditing && !uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                    <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
              {/* Hidden input untuk upload avatar */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarInputChange}
              />
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              <p className="text-blue-100 text-sm mt-1">Member sejak 2024</p>
              
              {/* Avatar Actions - Only show when editing */}
              {isEditing && avatarUrl && !uploadingAvatar && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvatarRemove();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus Foto
                </button>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Nama */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-gray-900 mb-1.5">
                  <User size={16} className="mr-2 text-primary-600" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={isEditing ? tempProfile.name : profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all ${isEditing
                      ? 'border-primary-400 focus:border-primary-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                />
              </div>

              {/* Email */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-gray-900 mb-1.5">
                  <Mail size={16} className="mr-2 text-primary-600" />
                  Email
                </label>
                <input
                  type="email"
                  value={isEditing ? tempProfile.email : profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all ${isEditing
                      ? 'border-primary-400 focus:border-primary-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                />
              </div>

              {/* No HP */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-gray-900 mb-1.5">
                  <Phone size={16} className="mr-2 text-primary-600" />
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={isEditing ? tempProfile.phone : profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all ${isEditing
                      ? 'border-primary-400 focus:border-primary-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                />
              </div>

              {/* Alamat */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-gray-900 mb-1.5">
                  <MapPin size={16} className="mr-2 text-primary-600" />
                  Alamat Lengkap
                </label>
                <textarea
                  value={isEditing ? tempProfile.address : profile.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all resize-none ${isEditing
                      ? 'border-primary-400 focus:border-primary-600 focus:outline-none bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan"
                />
              </div>

              {/* Grid for Provinsi, Kota, Kode Pos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Provinsi */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-900 mb-1.5">
                    <MapPin size={16} className="mr-2 text-primary-600" />
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={isEditing ? tempProfile.Provinsi : profile.Provinsi}
                    onChange={(e) => handleChange('Provinsi', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all ${isEditing
                        ? 'border-primary-400 focus:border-primary-600 focus:outline-none bg-white'
                        : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    placeholder="Jawa Tengah"
                  />
                </div>

                {/* Kota */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-900 mb-1.5">
                    <MapPin size={16} className="mr-2 text-primary-600" />
                    Kota/Kabupaten
                  </label>
                  <input
                    type="text"
                    value={isEditing ? tempProfile.Kota : profile.Kota}
                    onChange={(e) => handleChange('Kota', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all ${isEditing
                        ? 'border-primary-400 focus:border-primary-600 focus:outline-none bg-white'
                        : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    placeholder="Semarang"
                  />
                </div>

                {/* Kode Pos */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-900 mb-1.5">
                    <MapPin size={16} className="mr-2 text-primary-600" />
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={isEditing ? tempProfile.Kode_pose : profile.Kode_pose}
                    onChange={(e) => handleChange('Kode_pose', e.target.value)}
                    disabled={!isEditing}
                    maxLength={5}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all ${isEditing
                        ? 'border-primary-400 focus:border-primary-600 focus:outline-none bg-white'
                        : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    placeholder="50275"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between gap-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} />
                  Edit Profil
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={saving || uploadingAvatar}
                    className="px-6 bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploadingAvatar}
                    className="px-8 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {saving || uploadingAvatar ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-800 text-center">
            <span className="font-semibold">💡 Tips:</span> Pastikan informasi Anda selalu terkini untuk pengalaman yang lebih baik
          </p>
        </div>
      </div>
    </div>
  );
}
