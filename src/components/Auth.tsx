import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth({ onCustomLogin }: { onCustomLogin?: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'username' | 'email'>('username');
  const [isLogin, setIsLogin] = useState(true);
  
  // State for Username mode
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State for Email mode
  const [email, setEmail] = useState('');
  
  const [message, setMessage] = useState('');
  const [welcomeText, setWelcomeText] = useState('Tempat curhat lu yang lagi nganggur. Ruang aman buat ngobrol santai tanpa pusing lihat orang pamer kesuksesan.');
  
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);

  useEffect(() => {
    const fetchWelcomeText = async () => {
      const { data } = await supabase
        .from('sponsors')
        .select('content')
        .eq('link', '_WELCOME_TEXT_')
        .single();
      if (data && data.content) {
        setWelcomeText(data.content);
      }
    };
    fetchWelcomeText();
  }, []);

  // Fungsi buat bikin UUID acak (karena kita gak pake Supabase Auth lagi buat bot)
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleUsernameAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setMessage('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (isLogin) {
      // LOGIN JALUR BELAKANG (Bypass Supabase Auth)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password', password)
        .single();
        
      if (error || !profile) {
        setMessage('Gagal masuk: Username atau password salah bos!');
      } else {
        // Bikin sesi palsu
        const customSession = {
          user: {
            id: profile.id,
            email: `${cleanUsername}@rehat.app`,
            user_metadata: { username: profile.username }
          }
        };
        localStorage.setItem('rehat_custom_session', JSON.stringify(customSession));
        if (onCustomLogin) onCustomLogin(customSession);
      }
    } else {
      // DAFTAR JALUR BELAKANG (Bypass Supabase Auth)
      // Cek dulu username udah ada belum
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .single();

      if (existingUser) {
        setMessage('Gagal daftar: Username udah dipake orang lain!');
        setLoading(false);
        return;
      }

      const newId = generateUUID();
      
      const { error } = await supabase.from('profiles').insert([
        { 
          id: newId, 
          username: cleanUsername, 
          password: password,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`
        }
      ]);

      if (error) {
        setMessage(`Gagal daftar: ${error.message}. (Pastiin lu udah jalanin SQL dari AI)`);
      } else {
        setMessage('Berhasil daftar! Silakan masuk.');
        setIsLogin(true);
      }
    }
    
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
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
        <p className="text-lg font-mono mb-8 border-b-2 border-black pb-4 whitespace-pre-wrap">
          {welcomeText}
        </p>

        {authMode === 'username' ? (
          // MODE USERNAME & PASSWORD (BUAT BOT/PEMANCING)
          <>
            <form onSubmit={handleUsernameAuth} className="flex flex-col gap-4">
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

              <div className="flex items-start gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="tos_username" 
                  className="mt-1 w-4 h-4 accent-black cursor-pointer"
                  checked={acceptedTos}
                  onChange={(e) => setAcceptedTos(e.target.checked)}
                />
                <label htmlFor="tos_username" className="text-xs font-mono text-gray-700 cursor-pointer">
                  Gue setuju sama <button type="button" onClick={() => setShowTosModal(true)} className="text-blue-600 underline font-bold hover:text-black">Aturan Main Rehat</button>.
                </label>
              </div>
              
              <button
                type="submit"
                className={`w-full brutal-btn brutal-shadow mt-4 ${!acceptedTos ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading || !acceptedTos}
              >
                {loading ? 'Nungguin...' : (isLogin ? 'Masuk' : 'Daftar Akun Baru')}
              </button>
            </form>

            <div className="mt-6 text-center font-mono text-sm flex flex-col gap-3">
              <button 
                onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
                className="underline hover:bg-black hover:text-white px-2 py-1 transition-colors inline-block"
              >
                {isLogin ? 'Belum punya akun? Daftar sini' : 'Udah punya akun? Masuk aja'}
              </button>
              
              <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-2">
                <button 
                  onClick={() => { setAuthMode('email'); setMessage(''); }}
                  className="text-gray-500 hover:text-black font-bold text-xs uppercase"
                >
                  Login Alternatif (Pake Email) &rarr;
                </button>
              </div>
            </div>
          </>
        ) : (
          // MODE EMAIL MAGIC LINK (BUAT ADMIN)
          <>
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block font-bold mb-2 uppercase">Email Asli Lu</label>
                <input
                  id="email"
                  className="w-full brutal-input"
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-start gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="tos_email" 
                  className="mt-1 w-4 h-4 accent-black cursor-pointer"
                  checked={acceptedTos}
                  onChange={(e) => setAcceptedTos(e.target.checked)}
                />
                <label htmlFor="tos_email" className="text-xs font-mono text-gray-700 cursor-pointer">
                  Gue setuju sama <button type="button" onClick={() => setShowTosModal(true)} className="text-blue-600 underline font-bold hover:text-black">Aturan Main Rehat</button>.
                </label>
              </div>

              <button
                type="submit"
                className={`w-full brutal-btn brutal-shadow mt-4 ${!acceptedTos ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading || !acceptedTos}
              >
                {loading ? 'Nungguin...' : 'Kirim Magic Link'}
              </button>
            </form>

            <div className="mt-6 text-center font-mono text-sm">
              <button 
                onClick={() => { setAuthMode('username'); setMessage(''); }}
                className="text-gray-500 hover:text-black font-bold text-xs uppercase"
              >
                &larr; Balik ke Login Biasa
              </button>
            </div>
          </>
        )}

        {message && (
          <div className="mt-6 p-4 brutal-border bg-black text-white font-mono text-sm">
            {message}
          </div>
        )}
      </div>

      {/* Modal Aturan Main (ToS) */}
      {showTosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white brutal-border brutal-shadow max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b-4 border-black flex justify-between items-center bg-yellow-300">
              <h2 className="text-2xl font-black uppercase">Aturan Main Rehat</h2>
              <button 
                onClick={() => setShowTosModal(false)}
                className="font-bold text-xl hover:text-red-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-sm space-y-4">
              <p className="font-bold">Selamat datang di Rehat. Sebelum lu lanjut, baca dulu aturan mainnya biar kita sama-sama enak:</p>
              
              <ol className="list-decimal list-inside space-y-2">
                <li><strong className="text-red-600">Dilarang Keras Posting Bokep/Pornografi:</strong> Gambar, teks, atau link yang berbau pornografi bakal langsung dihapus dan akun lu dibanned permanen.</li>
                <li><strong className="text-red-600">Dilarang Promosi Judi Online:</strong> Segala bentuk promosi, link, atau ajakan main judi online (slot, dll) dilarang keras.</li>
                <li><strong className="text-red-600">Dilarang Ujaran Kebencian (Hate Speech) & SARA:</strong> Jangan rasis, jangan bawa-bawa agama, suku, atau golongan buat nebar kebencian.</li>
                <li><strong className="text-red-600">Dilarang Pencemaran Nama Baik:</strong> Jangan nyebarin fitnah, doxing (nyebarin data pribadi orang), atau nge-bully user lain.</li>
                <li><strong className="text-red-600">Dilarang Spam:</strong> Jangan nyepam komentar atau postingan yang sama berulang-ulang.</li>
              </ol>

              <div className="bg-gray-100 p-4 border-l-4 border-black mt-4">
                <p className="font-bold uppercase mb-2">Hak Admin:</p>
                <p>Admin punya hak penuh buat <strong>MENGHAPUS KONTEN</strong> dan <strong>MEM-BANNED AKUN + IP ADDRESS</strong> lu tanpa pemberitahuan sebelumnya kalau lu melanggar aturan di atas. Kalau lu dilaporin ke pihak berwajib karena ulah lu sendiri, itu tanggung jawab lu pribadi.</p>
              </div>
            </div>
            <div className="p-4 border-t-4 border-black bg-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  setAcceptedTos(true);
                  setShowTosModal(false);
                }}
                className="brutal-btn bg-black text-white hover:bg-gray-800"
              >
                Gue Paham & Setuju
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
