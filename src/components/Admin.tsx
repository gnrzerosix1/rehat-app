import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { renderContentWithEmbeds } from '../utils/embedParser';

export default function Admin({ session }: { session: any }) {
  const [userCount, setUserCount] = useState(0);
  const [adContent, setAdContent] = useState('');
  const [adLink, setAdLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [ads, setAds] = useState<any[]>([]);

  // Ganti dengan email lu yang jadi admin
  const ADMIN_EMAIL = 'mediakindo@gmail.com';
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchAds();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    setUserCount(count || 0);
  };

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetch ads admin:", error);
    } else if (data) {
      setAds(data);
    }
  };

  const handlePostAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adContent.trim()) return;

    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.from('sponsors').insert([
      { content: adContent, link: adLink, is_active: true }
    ]);

    if (error) {
      setMessage(`Error: ${error.message}. (Pastiin lu udah bikin table 'ads')`);
    } else {
      setMessage('Iklan berhasil ditayangkan di Beranda!');
      setAdContent('');
      setAdLink('');
      fetchAds();
    }
    setLoading(false);
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm('Yakin mau hapus iklan ini?')) return;
    
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) {
      alert(`Gagal hapus iklan: ${error.message}`);
      console.error("Delete ad error:", error);
    } else {
      fetchAds();
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 brutal-border brutal-shadow bg-red-500 text-white text-center">
        <h2 className="text-4xl font-bold uppercase mb-4">Akses Ditolak</h2>
        <p className="font-mono text-lg">Lu bukan admin. Ngapain ke sini?</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="p-6 brutal-border brutal-shadow bg-black text-white">
        <h2 className="text-3xl font-bold uppercase mb-2">Dashboard Admin</h2>
        <p className="font-mono text-gray-300">Selamat datang, Bos. Ini ruang kendali lu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats Card */}
        <div className="p-6 brutal-border bg-white">
          <h3 className="text-xl font-bold uppercase mb-4 border-b-2 border-black pb-2">Statistik</h3>
          <div className="flex justify-between items-center">
            <span className="font-mono">Total User Terdaftar:</span>
            <span className="text-4xl font-bold">{userCount}</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 font-mono">*User online real-time butuh upgrade Supabase Realtime.</p>
        </div>

        {/* Pasang Iklan */}
        <div className="p-6 brutal-border bg-[#f0f0f0]">
          <h3 className="text-xl font-bold uppercase mb-4 border-b-2 border-black pb-2">Pasang Iklan</h3>
          <form onSubmit={handlePostAd} className="flex flex-col gap-4">
            <div>
              <label className="block font-bold mb-1 uppercase text-sm">Teks Iklan:</label>
              <textarea
                className="w-full brutal-input min-h-[80px] resize-none text-sm"
                placeholder="Misal: Promo hosting murah meriah..."
                value={adContent}
                onChange={(e) => setAdContent(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-bold mb-1 uppercase text-sm">Link Iklan (Opsional):</label>
              <input
                className="w-full brutal-input text-sm"
                type="url"
                placeholder="https://..."
                value={adLink}
                onChange={(e) => setAdLink(e.target.value)}
              />
            </div>
            <button className="brutal-btn brutal-shadow text-sm" disabled={loading}>
              {loading ? 'Memproses...' : 'Tayangkan Iklan'}
            </button>
          </form>
          {message && <p className="mt-4 font-mono text-sm font-bold text-blue-600">{message}</p>}
        </div>
      </div>

      {/* Daftar Iklan Aktif */}
      <div className="p-6 brutal-border brutal-shadow bg-yellow-100 mt-8">
        <h3 className="text-2xl font-black uppercase mb-2 border-b-4 border-black pb-2">Daftar Iklan Aktif (Bisa Dihapus)</h3>
        <p className="font-mono text-sm mb-6 text-gray-700">
          *Kalau iklan lu udah masuk ke sini tapi nggak muncul di Beranda, itu berarti lu belum matiin RLS (Row Level Security) di Supabase. Cek chat AI buat cara matiinnya.
        </p>
        
        <div className="space-y-4">
          {ads.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-black text-center">
              <p className="font-mono font-bold text-gray-500">Belum ada iklan yang tayang.</p>
            </div>
          ) : (
            ads.map(ad => (
              <div key={ad.id} className="p-4 border-2 border-black bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full">
                  <span className="bg-black text-white text-xs font-bold px-2 py-1 uppercase mr-2 mb-2 inline-block">Sponsor</span>
                  <div className="mb-2">
                    {renderContentWithEmbeds(ad.content, "font-bold text-lg")}
                  </div>
                  {ad.link && <a href={ad.link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline font-mono mt-1 block">{ad.link}</a>}
                </div>
                <button 
                  onClick={() => handleDeleteAd(ad.id)}
                  className="bg-red-500 text-white px-4 py-2 font-black uppercase border-2 border-black hover:bg-red-600 brutal-shadow-sm whitespace-nowrap shrink-0"
                >
                  Hapus Iklan
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
