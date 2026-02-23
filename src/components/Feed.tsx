import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function Feed({ session, onUserClick, onViewAllFriends }: { session: any, onUserClick: (userId: string) => void, onViewAllFriends: () => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPosts();
    fetchAds();
    fetchFriends();
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

  const fetchFriends = async () => {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id);

    if (follows && follows.length > 0) {
      const followingIds = follows.map((f: any) => f.following_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', followingIds)
        .limit(5);
      
      if (profiles) {
        setFriends(profiles);
      }
    }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePost(e as unknown as React.FormEvent);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin mau hapus curhatan ini?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      alert(`Gagal hapus: ${error.message}`);
    } else {
      fetchPosts();
    }
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
    <div className="max-w-2xl mx-auto p-2 md:p-4">
      {/* Tampilkan Iklan jika ada */}
      {ads.length > 0 && (
        <div className="mb-6 md:mb-8 p-4 brutal-border bg-yellow-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <span className="bg-black text-white text-xs font-bold px-2 py-1 uppercase mr-2">Sponsor</span>
            <span className="font-bold text-sm md:text-base">{ads[0].content}</span>
          </div>
          {ads[0].link && (
            <a href={ads[0].link} target="_blank" rel="noreferrer" className="brutal-btn-outline text-xs px-3 py-1 bg-white whitespace-nowrap">
              Cekidot
            </a>
          )}
        </div>
      )}

      {/* Widget Teman */}
      <div className="mb-6 md:mb-8 p-4 brutal-border brutal-shadow bg-white">
        <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
          <h3 className="text-lg font-bold uppercase">Teman Lu</h3>
          <button onClick={onViewAllFriends} className="text-xs font-bold uppercase hover:underline text-blue-600">Lihat Semua</button>
        </div>
        
        {friends.length === 0 ? (
          <p className="font-mono text-xs text-gray-500">Belum ada teman. Add orang gih.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {friends.map(friend => (
              <div key={friend.id} className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80" onClick={() => onUserClick(friend.id)}>
                <div className="w-10 h-10 md:w-12 md:h-12 brutal-border overflow-hidden bg-gray-200 rounded-full">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg">?</div>
                  )}
                </div>
                <span className="text-[10px] md:text-xs font-bold uppercase max-w-[60px] truncate text-center">{friend.username || 'Anonim'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tampilkan Error RLS jika ada */}
      {errorMsg && (
        <div className="mb-6 md:mb-8 p-4 brutal-border bg-red-500 text-white font-mono text-xs md:text-sm">
          <strong>⚠️ ERROR SUPABASE:</strong> {errorMsg}
        </div>
      )}

      <div className="mb-6 md:mb-8 p-4 md:p-6 brutal-border brutal-shadow bg-white">
        <h2 className="text-2xl md:text-3xl font-bold uppercase mb-4 border-b-4 border-black pb-2">Lempar Nasib</h2>
        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <textarea
            className="w-full brutal-input min-h-[100px] md:min-h-[120px] resize-none text-sm md:text-base"
            placeholder="Gimana nasib lu hari ini? (Tekan Enter buat post, Shift+Enter buat baris baru)"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="self-end brutal-btn brutal-shadow w-full md:w-auto"
            disabled={loading}
          >
            {loading ? 'Melempar...' : 'Lempar!'}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        {posts.length === 0 && !errorMsg && (
          <div className="p-8 text-center font-mono text-gray-500 border-2 border-dashed border-gray-400 text-sm md:text-base">
            Belum ada yang lempar nasib. Jadilah yang pertama!
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="p-4 md:p-6 brutal-border bg-white">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              {/* Foto Profil */}
              <div 
                className="w-10 h-10 md:w-12 md:h-12 brutal-border overflow-hidden bg-gray-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onUserClick(post.user_id)}
              >
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg md:text-xl">?</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center text-xs md:text-sm font-bold uppercase border-b-2 border-black pb-2 mb-2">
                  <span 
                    className="cursor-pointer hover:underline truncate mr-2"
                    onClick={() => onUserClick(post.user_id)}
                  >
                    {post.profiles?.username || 'Anonim'}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
                <p className="font-mono text-sm md:text-lg whitespace-pre-wrap break-words">{renderTextWithLinks(post.content)}</p>
                
                {/* Tombol Hapus (Hanya muncul kalau ini post milik user yang login) */}
                {post.user_id === session.user.id && (
                  <div className="mt-4 text-right">
                    <button 
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 text-xs font-bold uppercase hover:underline"
                    >
                      Hapus Curhatan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
