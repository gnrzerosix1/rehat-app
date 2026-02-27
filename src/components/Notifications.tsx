import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications({ session, onUserClick, onPostClick }: { session: any, onUserClick: (userId: string) => void, onPostClick: (postId: string) => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    markAsRead();
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(username, avatar_url),
        post:posts(content)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);
  };

  if (loading) return <div className="p-8 text-center font-mono font-bold uppercase">Loading notifikasi...</div>;

  return (
    <div className="max-w-2xl mx-auto p-2 md:p-4">
      <div className="mb-6 md:mb-8 p-4 md:p-6 brutal-border brutal-shadow bg-white">
        <h2 className="text-2xl md:text-3xl font-bold uppercase mb-4 border-b-4 border-black pb-2">Notifikasi</h2>
        
        {notifications.length === 0 ? (
          <p className="font-mono text-gray-500 text-center p-8 border-2 border-dashed border-gray-400">Belum ada notifikasi nih. Sepi amat.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 brutal-border flex items-start gap-4 transition-colors ${notif.is_read ? 'bg-white' : 'bg-yellow-100'} ${notif.post_id ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={() => {
                  if (notif.post_id) {
                    onPostClick(notif.post_id);
                  }
                }}
              >
                <div 
                  className="w-10 h-10 brutal-border overflow-hidden bg-gray-200 shrink-0 cursor-pointer relative z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUserClick(notif.actor_id);
                  }}
                >
                  {notif.actor?.avatar_url ? (
                    <img src={notif.actor.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm md:text-base">
                    <span 
                      className="font-bold uppercase cursor-pointer hover:underline relative z-10" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick(notif.actor_id);
                      }}
                    >
                      {notif.actor?.username || 'Anonim'}
                    </span>
                    {' '}
                    {notif.type === 'like' && 'nge-like curhatan lu.'}
                    {notif.type === 'comment' && 'ngomentarin curhatan lu.'}
                    {notif.type === 'reply' && 'ikut nimbrung/balas komentar di curhatan.'}
                    {notif.type === 'follow' && 'mulai ngikutin lu (nambah teman).'}
                  </p>
                  {notif.post && (
                    <div className="mt-2 p-3 bg-[#f0f0f0] brutal-border border-l-4 border-black">
                      <p className="text-sm text-gray-700 italic line-clamp-2">
                        "{notif.post.content}"
                      </p>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                  
                  {notif.post_id && (
                    <button 
                      className="mt-3 text-xs font-bold uppercase bg-black text-white px-3 py-1 brutal-shadow hover:bg-gray-800 relative z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick(notif.post_id);
                      }}
                    >
                      Lihat Postingan →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
