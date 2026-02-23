import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Cek email lu buat link login (Magic Link).');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md brutal-border brutal-shadow p-8 bg-white">
        <h1 className="text-5xl font-bold mb-2 uppercase tracking-tighter">REHAT.</h1>
        <p className="text-lg font-mono mb-8 border-b-2 border-black pb-4">
          Antitesis LinkedIn. Tempat jujur soal nasib tanpa jaim profesional.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block font-bold mb-2 uppercase">Email Lu</label>
            <input
              id="email"
              className="w-full brutal-input"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            className="w-full brutal-btn brutal-shadow mt-4"
            disabled={loading}
          >
            {loading ? 'Nungguin...' : 'Masuk Tanpa Password'}
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
