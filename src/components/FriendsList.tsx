import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function FriendsList({ session, onUserClick, onBack }: { session: any, onUserClick: (userId: string) => void, onBack: () => void }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id);

    if (follows && follows.length > 0) {
      const followingIds = follows.map((f: any) => f.following_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .in('id', followingIds);
      
      if (profiles) {
        setFriends(profiles);
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-2 md:p-4">
      <button onClick={onBack} className="mb-6 font-bold uppercase hover:underline flex items-center gap-2 bg-black text-white px-4 py-2 brutal-shadow">
        ← Balik ke Beranda
      </button>

      <div className="mb-6 md:mb-8 p-4 md:p-6 brutal-border brutal-shadow bg-white">
        <h2 className="text-2xl md:text-3xl font-bold uppercase mb-4 border-b-4 border-black pb-2">Daftar Teman Lu</h2>
        
        {loading ? (
          <p className="font-mono">Loading...</p>
        ) : friends.length === 0 ? (
          <p className="font-mono text-gray-500">Lu belum punya teman. Kasihan. Coba add orang di beranda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friends.map(friend => (
              <div key={friend.id} className="p-4 brutal-border flex items-center gap-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onUserClick(friend.id)}>
                <div className="w-12 h-12 brutal-border overflow-hidden bg-gray-200 shrink-0">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold uppercase truncate">{friend.username || 'Anonim'}</p>
                  <p className="font-mono text-xs text-gray-500 truncate">{friend.bio || 'Tidak ada bio'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
