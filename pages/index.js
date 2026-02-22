import Head from 'next/head';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // 1. Ambil data saat web dibuka
  useEffect(() => {
    fetchPosts();
  }, []);

  // Fungsi ambil data dari Database
  const fetchPosts = async () => {
    try {
      let { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false }); // Urutkan dari yang terbaru
      
      if (error) throw error;
      if (data) setPosts(data);
    } catch (error) {
      console.log("Error ambil data:", error.message);
    }
  };

  // 2. Fungsi Kirim Data (Logic ala Twitter)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    setIsError(false);

    try {
      // Kirim ke Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert([{ content: newPost }])
        .select();

      if (error) throw error;

      // SUKSES! Reset form dan update timeline
      setNewPost(''); 
      fetchPosts(); // Tarik data terbaru biar langsung muncul
      
    } catch (error) {
      console.error("Gagal posting:", error.message);
      setIsError(true);
      alert('Gagal posting bro! Cek kuncinya atau koneksi internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>REHAT. - Timeline</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=Space+Mono&display=swap" rel="stylesheet" />
        <style>{`
          body { background-color: #f0f2f5; font-family: 'Space Grotesk', sans-serif; color: #1a1a1a; }
          .mono { font-family: 'Space Mono', monospace; }
        `}</style>
      </Head>

      <div className="max-w-2xl mx-auto min-h-screen bg-white shadow-2xl border-x border-gray-200">
        
        {/* HEADER ala Twitter */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold uppercase tracking-wider">REHAT.</h1>
        </div>

        {/* INPUT BOX */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold text-xl shrink-0">
                ?
              </div>
              <div className="w-full">
                <textarea
                  className="w-full text-lg outline-none placeholder-gray-500 resize-none h-24 pt-2"
                  placeholder="Apa yang bikin lu capek hari ini?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                ></textarea>
                <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
                  <span className="text-xs text-blue-500 mono font-bold">Public & Anonim</span>
                  <button
                    type="submit"
                    disabled={loading || !newPost.trim()}
                    className={`px-6 py-2 rounded-full font-bold text-white transition-all ${
                      loading || !newPost.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                    }`}
                  >
                    {loading ? 'Mengirim...' : 'Posting'}
                  </button>
                </div>
              </div>
            </div>
            {isError && <p className="text-red-500 text-xs mt-2 text-right">Gagal terkirim. Cek console log.</p>}
          </form>
        </div>

        {/* FEED / TIMELINE */}
        <div className="divide-y divide-gray-100">
          {posts.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="mb-2">Belum ada curhatan.</p>
              <p className="text-xs">Jadilah yang pertama melempar nasib.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex gap-3">
                  {/* Avatar User Lain */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
                  
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">Anonim</span>
                      <span className="text-gray-500 text-sm">@{post.id}</span>
                      <span className="text-gray-400 text-sm">• {new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-gray-900 leading-normal whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {/* Fake Interaction Buttons */}
                    <div className="flex justify-between mt-3 max-w-md text-gray-400 text-sm">
                      <button className="hover:text-blue-500 flex items-center gap-2">💬 <span>0</span></button>
                      <button className="hover:text-green-500 flex items-center gap-2">⇄ <span>0</span></button>
                      <button className="hover:text-red-500 flex items-center gap-2">♥ <span>0</span></button>
                      <button className="hover:text-blue-500">Share</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}