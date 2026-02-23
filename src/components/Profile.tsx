import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Profile({ session }: { session: any }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { user } = session;

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, bio`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="p-8 brutal-border brutal-shadow bg-white">
        <h2 className="text-3xl font-bold uppercase mb-6 border-b-4 border-black pb-2">Identitas Lu</h2>
        
        <form onSubmit={updateProfile} className="flex flex-col gap-6">
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
