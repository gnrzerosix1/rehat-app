import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function UserProfile({ userId, session, onBack }: { userId: string, session: any, onBack: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
    checkFollowStatus();
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchUserPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', session.user.id)
      .eq('following_id', userId)
      .single();
    if (data) setIsFollowing(true);
  };

  const toggleFollow = async () => {
    setFollowLoading(true);
    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId);
      setIsFollowing(false);
    } else {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: session.user.id, following_id: userId }]);
      if (!error) setIsFollowing(true);
      else alert(`Gagal nambah teman: ${error.message}. Pastiin lu udah bikin table 'follows'`);
    }
    setFollowLoading(false);
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:bg-black hover:text-white transition-colors break-all">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) return <div className="p-8 text-center font-mono font-bold uppercase">Loading profil...</div>;
  if (!profile) return <div className="p-8 text-center font-mono font-bold uppercase">User nggak ketemu.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button onClick={onBack} className="mb-6 font-bold uppercase hover:underline flex items-center gap-2 bg-black text-white px-4 py-2 brutal-shadow">
        ← Balik
      </button>

      <div className="p-8 brutal-border brutal-shadow bg-white mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 text-center sm:text-left">
          <div className="w-32 h-32 brutal-border overflow-hidden bg-gray-200 shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-4xl">?</div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold uppercase">{profile.username || 'Anonim'}</h2>
            <p className="font-mono text-gray-600 mt-4 bg-[#f0f0f0] p-4 brutal-border">{profile.bio || 'Orang ini belum nulis bio apa-apa.'}</p>
          </div>
        </div>

        <button
          onClick={toggleFollow}
          disabled={followLoading}
          className={`w-full py-3 font-bold uppercase border-4 border-black transition-colors brutal-shadow ${
            isFollowing ? 'bg-white text-black hover:bg-red-100' : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {followLoading ? 'Tunggu...' : isFollowing ? 'Batal Temanan' : '+ Tambah Teman'}
        </button>
      </div>

      <h3 className="text-2xl font-bold uppercase mb-4 border-b-4 border-black pb-2">Postingan {profile.username || 'Anonim'}</h3>
      <div className="flex flex-col gap-6">
        {posts.length === 0 ? (
          <p className="font-mono text-gray-500 p-8 text-center border-2 border-dashed border-gray-400">Belum ada postingan.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-6 brutal-border bg-white">
              <p className="font-mono text-lg mb-4 whitespace-pre-wrap">{renderTextWithLinks(post.content)}</p>
              <div className="text-sm font-bold uppercase border-t-2 border-black pt-4 text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
