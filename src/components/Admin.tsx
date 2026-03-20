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
  
  const [welcomeText, setWelcomeText] = useState('');
  const [welcomeTextLoading, setWelcomeTextLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [reports, setReports] = useState<any[]>([]);

  // Ganti dengan email lu yang jadi admin
  const ADMIN_EMAIL = 'mediakindo@gmail.com';
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchAds();
      fetchReports();
    }
  }, [isAdmin]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(username),
        reported:profiles!reported_user_id(username, last_ip),
        posts(content),
        comments(content)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) setReports(data);
    else console.error('Error fetching reports:', error);
  };

  const handleResolveReport = async (reportId: string) => {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    fetchReports();
  };

  const handleDeleteContent = async (report: any) => {
    if (!window.confirm('Yakin mau hapus konten ini?')) return;
    if (report.post_id) {
      await supabase.from('posts').delete().eq('id', report.post_id);
    }
    if (report.comment_id) {
      await supabase.from('comments').delete().eq('id', report.comment_id);
    }
    handleResolveReport(report.id);
    alert('Konten berhasil dihapus.');
  };

  const handleBanUser = async (report: any) => {
    if (!window.confirm('Yakin mau BANNED akun ini dan IP-nya?')) return;

    // 1. Dapatkan IP terakhir user
    const { data: profile } = await supabase.from('profiles').select('last_ip').eq('id', report.reported_user_id).single();

    if (profile && profile.last_ip) {
      // 2. Masukkan ke banned_ips
      await supabase.from('banned_ips').insert([{
        ip_address: profile.last_ip,
        reason: `Banned via report ${report.id} - ${report.reason}`
      }]);
    }

    // 3. Banned akunnya
    await supabase.from('profiles').update({ is_banned: true }).eq('id', report.reported_user_id);

    // 4. Hapus semua postingan & komentar user ini (opsional, tapi bagus buat bersih-bersih)
    await supabase.from('posts').delete().eq('user_id', report.reported_user_id);
    await supabase.from('comments').delete().eq('user_id', report.reported_user_id);

    handleResolveReport(report.id);
    alert('Akun dan IP berhasil dibanned! Semua kontennya udah dihapus.');
  };

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
      const regularAds = data.filter(ad => ad.link !== '_WELCOME_TEXT_');
      setAds(regularAds);
      
      const welcomeAd = data.find(ad => ad.link === '_WELCOME_TEXT_');
      if (welcomeAd) {
        setWelcomeText(welcomeAd.content);
      } else {
        setWelcomeText('Tempat curhat lu yang lagi nganggur. Ruang aman buat ngobrol santai tanpa pusing lihat orang pamer kesuksesan.');
      }
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

  const handleSaveWelcomeText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!welcomeText.trim()) return;

    setWelcomeTextLoading(true);
    setWelcomeMessage('');
    
    const { data: existing } = await supabase
      .from('sponsors')
      .select('id')
      .eq('link', '_WELCOME_TEXT_')
      .single();

    if (existing) {
      const { error } = await supabase
        .from('sponsors')
        .update({ content: welcomeText })
        .eq('id', existing.id);
      if (error) setWelcomeMessage(`Error: ${error.message}`);
      else setWelcomeMessage('Teks sambutan berhasil diupdate!');
    } else {
      const { error } = await supabase
        .from('sponsors')
        .insert([{ content: welcomeText, link: '_WELCOME_TEXT_', is_active: true }]);
      if (error) setWelcomeMessage(`Error: ${error.message}`);
      else setWelcomeMessage('Teks sambutan berhasil disimpan!');
    }
    setWelcomeTextLoading(false);
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
        {/* Laporan Masuk */}
        <div className="p-6 brutal-border bg-orange-100 md:col-span-2">
          <h3 className="text-xl font-bold uppercase mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
            Laporan Masuk 
            {reports.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">{reports.length}</span>
            )}
          </h3>
          
          {reports.length === 0 ? (
            <p className="font-mono text-gray-600">Belum ada laporan. Aman terkendali bos.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {reports.map(report => (
                <div key={report.id} className="p-4 bg-white brutal-border brutal-shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold uppercase">
                        <span className="text-red-600">Pelapor:</span> {report.reporter?.username || 'Anonim'}
                      </p>
                      <p className="text-sm font-bold uppercase">
                        <span className="text-red-600">Terlapor:</span> {report.reported?.username || 'Anonim'} (IP: {report.reported?.last_ip || 'Tidak diketahui'})
                      </p>
                      <p className="text-sm font-mono mt-2 bg-gray-100 p-2">
                        <span className="font-bold">Alasan:</span> {report.reason}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="mt-2 border-l-4 border-orange-500 pl-3 py-1">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Konten yang dilaporkan:</p>
                    <p className="text-sm font-mono break-words">
                      {report.post_id ? report.posts?.content : report.comment_id ? report.comments?.content : 'Konten tidak ditemukan'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-gray-200">
                    <button 
                      onClick={() => handleDeleteContent(report)}
                      className="px-3 py-1 bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 transition-colors"
                    >
                      Hapus Konten
                    </button>
                    <button 
                      onClick={() => handleBanUser(report)}
                      className="px-3 py-1 bg-black text-white font-bold text-xs uppercase hover:bg-gray-800 transition-colors"
                    >
                      Banned Akun & IP
                    </button>
                    <button 
                      onClick={() => handleResolveReport(report.id)}
                      className="px-3 py-1 bg-gray-200 text-black font-bold text-xs uppercase hover:bg-gray-300 transition-colors ml-auto"
                    >
                      Abaikan / Selesai
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="p-6 brutal-border bg-white">
          <h3 className="text-xl font-bold uppercase mb-4 border-b-2 border-black pb-2">Statistik</h3>
          <div className="flex justify-between items-center">
            <span className="font-mono">Total User Terdaftar:</span>
            <span className="text-4xl font-bold">{userCount}</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 font-mono">*User online real-time butuh upgrade Supabase Realtime.</p>
        </div>

        {/* Edit Welcome Text */}
        <div className="p-6 brutal-border bg-[#e0f7fa]">
          <h3 className="text-xl font-bold uppercase mb-4 border-b-2 border-black pb-2">Edit Teks Halaman Depan</h3>
          <form onSubmit={handleSaveWelcomeText} className="flex flex-col gap-4">
            <div>
              <label className="block font-bold mb-1 uppercase text-sm">Teks Sambutan:</label>
              <textarea
                className="w-full brutal-input min-h-[80px] resize-none text-sm"
                placeholder="Tempat curhat lu yang lagi nganggur..."
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                required
              />
            </div>
            <button className="brutal-btn brutal-shadow text-sm bg-blue-500 text-white hover:bg-blue-600" disabled={welcomeTextLoading}>
              {welcomeTextLoading ? 'Menyimpan...' : 'Simpan Teks'}
            </button>
          </form>
          {welcomeMessage && <p className="mt-4 font-mono text-sm font-bold text-blue-600">{welcomeMessage}</p>}
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
