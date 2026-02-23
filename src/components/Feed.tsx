import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function Feed({ session }: { session: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPosts();
    fetchAds();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      setErrorMsg(`Gagal mengambil data: ${error.message}. Kalo lu baru bikin table, pastiin RLS (Row Level Security) udah di-disable atau disetting public read di Supabase!`);
    } else if (data) {
      setPosts(data);
      setErrorMsg('');
    }
  };

  const fetchAds = async () => {
    const { data } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data) setAds(data);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.from('posts').insert([
      { content: newPost, user_id: session.user.id }
    ]);

    if (error) {
      setErrorMsg(`Gagal posting: ${error.message}. Pastiin RLS table 'posts' udah di-disable buat insert.`);
    } else {
      setNewPost('');
      fetchPosts();
    }
    setLoading(false);
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:bg-black hover:text-white transition-colors break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Tampilkan Iklan jika ada */}
      {ads.length > 0 && (
        <div className="mb-8 p-4 brutal-border bg-yellow-300 flex justify-between items-center">
          <div>
            <span className="bg-black text-white text-xs font-bold px-2 py-1 uppercase mr-2">Sponsor</span>
            <span className="font-bold">{ads[0].content}</span>
          </div>
          {ads[0].link && (
            <a href={ads[0].link} target="_blank" rel="noreferrer" className="brutal-btn-outline text-xs px-3 py-1 bg-white">
              Cekidot
            </a>
          )}
        </div>
      )}

      {/* Tampilkan Error RLS jika ada */}
      {errorMsg && (
        <div className="mb-8 p-4 brutal-border bg-red-500 text-white font-mono text-sm">
          <strong>⚠️ ERROR SUPABASE:</strong> {errorMsg}
        </div>
      )}

      <div className="mb-8 p-6 brutal-border brutal-shadow bg-white">
        <h2 className="text-3xl font-bold uppercase mb-4 border-b-4 border-black pb-2">Beranda / Lempar Nasib</h2>
        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <textarea
            className="w-full brutal-input min-h-[120px] resize-none"
            placeholder="Gimana nasib lu hari ini? Jujur aja, nggak ada HRD di sini. Boleh share link loker juga."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            disabled={loading}
          />
          <button
            className="self-end brutal-btn brutal-shadow"
            disabled={loading}
          >
            {loading ? 'Melempar...' : 'Lempar!'}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-6">
        {posts.length === 0 && !errorMsg && (
          <div className="p-8 text-center font-mono text-gray-500 border-2 border-dashed border-gray-400">
            Belum ada yang lempar nasib. Jadilah yang pertama!
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="p-6 brutal-border bg-white">
            <div className="flex items-start gap-4 mb-4">
              {/* Foto Profil */}
              <div className="w-12 h-12 brutal-border overflow-hidden bg-gray-200 shrink-0">
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xl">?</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center text-sm font-bold uppercase border-b-2 border-black pb-2 mb-2">
                  <span>{post.profiles?.username || 'Anonim'}</span>
                  <span className="text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
                <p className="font-mono text-lg whitespace-pre-wrap">{renderTextWithLinks(post.content)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
