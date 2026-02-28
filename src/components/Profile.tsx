import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Profile({ session }: { session: any }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { user } = session;

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, bio, avatar_url, city`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setCity(data.city || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error: any) {
      console.error('Error loading user data!', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      const { user } = session;

      const updates = {
        id: user.id,
        username,
        bio,
        city,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      setMessage('Profil berhasil diupdate, ngab!');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setMessage('');

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar dulu.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      setMessage('Foto berhasil diupload! Jangan lupa klik Simpan Profil.');
    } catch (error: any) {
      setMessage(`Gagal upload: ${error.message}. Pastiin lu udah bikin storage bucket 'avatars' dan disetting public.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="p-8 brutal-border brutal-shadow bg-white">
        <h2 className="text-3xl font-bold uppercase mb-6 border-b-4 border-black pb-2">Identitas Lu</h2>
        
        <form onSubmit={updateProfile} className="flex flex-col gap-6">
          
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 brutal-border bg-[#f0f0f0]">
            <div className="w-24 h-24 brutal-border overflow-hidden bg-white shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-3xl">?</div>
              )}
            </div>
            <div className="flex-1 w-full">
              <label className="block font-bold mb-2 uppercase text-sm">Ganti Foto Profil</label>
              <input
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="w-full brutal-input bg-white text-sm"
              />
              {uploading && <p className="text-sm font-mono mt-2">Lagi upload...</p>}
            </div>
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase">Email (Gak bisa diganti)</label>
            <input
              className="w-full brutal-input bg-gray-200 text-gray-500 cursor-not-allowed"
              type="text"
              value={session.user.email}
              disabled
            />
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase">Username / Panggilan</label>
            <input
              className="w-full brutal-input"
              type="text"
              placeholder="Biar gak dipanggil Anonim terus"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase">Bio / Status Saat Ini</label>
            <textarea
              className="w-full brutal-input min-h-[100px] resize-none"
              placeholder="Misal: Lagi nyari loker IT, atau lagi rebahan aja."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase">Lokasi Kota</label>
            <input
              type="text"
              className="w-full brutal-input"
              placeholder="Misal: Semarang, Jakarta Selatan, dll"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1 font-mono">Biar gampang nyari temen nongkrong di kota yang sama.</p>
          </div>

          <button
            className="brutal-btn brutal-shadow mt-4"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 brutal-border bg-black text-white font-mono text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
