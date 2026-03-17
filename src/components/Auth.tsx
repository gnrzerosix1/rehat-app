import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setMessage('');

    // Bikin email palsu di belakang layar biar Supabase seneng
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const fakeEmail = `${cleanUsername}@rehat.app`;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (error) {
        setMessage(`Gagal masuk: ${error.message}`);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
      });

      if (error) {
        setMessage(`Gagal daftar: ${error.message}`);
      } else if (data.user) {
        // Otomatis update username di profil
        await supabase.from('profiles').update({ username: username.trim() }).eq('id', data.user.id);
        setMessage('Berhasil daftar! Silakan masuk.');
        setIsLogin(true);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md brutal-border brutal-shadow p-8 bg-white">
        <h1 className="text-5xl font-bold mb-2 uppercase tracking-tighter">REHAT.</h1>
        <p className="text-lg font-mono mb-8 border-b-2 border-black pb-4">
          Tempat curhat lu yang lagi nganggur. Ruang aman buat ngobrol santai tanpa pusing lihat orang pamer kesuksesan.
        </p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block font-bold mb-2 uppercase">Username</label>
            <input
              id="username"
              className="w-full brutal-input"
              type="text"
              placeholder="nama_keren_lu"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-bold mb-2 uppercase">Password</label>
            <input
              id="password"
              className="w-full brutal-input"
              type="password"
              placeholder="Rahasia dong"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full brutal-btn brutal-shadow mt-4"
            disabled={loading}
          >
            {loading ? 'Nungguin...' : (isLogin ? 'Masuk' : 'Daftar Akun Baru')}
          </button>
        </form>

        <div className="mt-6 text-center font-mono text-sm">
          <button 
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            className="underline hover:bg-black hover:text-white px-2 py-1 transition-colors"
          >
            {isLogin ? 'Belum punya akun? Daftar sini' : 'Udah punya akun? Masuk aja'}
          </button>
        </div>

        {message && (
          <div className="mt-6 p-4 brutal-border bg-black text-white font-mono text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
