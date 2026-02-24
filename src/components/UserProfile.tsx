import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send } from 'lucide-react';

export default function UserProfile({ userId, session, onBack }: { userId: string, session: any, onBack: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  // State untuk komentar
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

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
      .select(`
        *,
        profiles(username, avatar_url),
        likes(user_id),
        comments(
          id,
          content,
          created_at,
          user_id,
          profiles(username, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) {
      const formattedData = data.map(post => ({
        ...post,
        comments: post.comments?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
      }));
      setPosts(formattedData);
    }
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
      // Hapus pertemanan dari kedua sisi (biar seimbang)
      await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: userId });
      await supabase.from('follows').delete().match({ follower_id: userId, following_id: session.user.id });
      setIsFollowing(false);
    } else {
      // Tambah pertemanan ke kedua sisi (biar saling berteman)
      const { error } = await supabase.from('follows').insert([
        { follower_id: session.user.id, following_id: userId },
        { follower_id: userId, following_id: session.user.id }
      ]);
      if (!error) {
        setIsFollowing(true);
        // Notifikasi Follow
        await supabase.from('notifications').insert([{
          user_id: userId,
          actor_id: session.user.id,
          type: 'follow'
        }]);
      }
      else alert(`Gagal nambah teman: ${error.message}. Pastiin lu udah bikin table 'follows'`);
    }
    setFollowLoading(false);
  };

  const toggleLike = async (postId: string, postOwnerId: string, isLiked: boolean) => {
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', session.user.id);
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: session.user.id }]);
      
      // Notifikasi Like
      if (postOwnerId !== session.user.id) {
        await supabase.from('notifications').insert([{
          user_id: postOwnerId,
          actor_id: session.user.id,
          type: 'like',
          post_id: postId
        }]);
      }
    }
    fetchUserPosts();
  };

  const handlePostComment = async (postId: string, postOwnerId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;

    const { error } = await supabase.from('comments').insert([
      { post_id: postId, user_id: session.user.id, content: text }
    ]);

    if (!error) {
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      
      // Ambil semua user yang pernah komen di post ini
      const { data: commentsData } = await supabase
        .from('comments')
        .select('user_id')
        .eq('post_id', postId);
        
      const usersToNotify = new Set<string>();
      
      // Tambahin yang punya post
      if (postOwnerId !== session.user.id) {
        usersToNotify.add(postOwnerId);
      }
      
      // Tambahin semua yang pernah komen
      if (commentsData) {
        commentsData.forEach(c => {
          if (c.user_id !== session.user.id) {
            usersToNotify.add(c.user_id);
          }
        });
      }

      const notificationsToInsert = Array.from(usersToNotify).map(userId => ({
        user_id: userId,
        actor_id: session.user.id,
        type: 'comment',
        post_id: postId
      }));

      if (notificationsToInsert.length > 0) {
        await supabase.from('notifications').insert(notificationsToInsert);
      }
      
      fetchUserPosts();
    } else {
      alert(`Gagal komen: ${error.message}`);
    }
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
          posts.map((post) => {
            const isLiked = post.likes?.some((like: any) => like.user_id === session.user.id);
            const likeCount = post.likes?.length || 0;
            const commentCount = post.comments?.length || 0;
            const isCommentsExpanded = showComments[post.id];

            return (
              <div key={post.id} className="p-6 brutal-border bg-white">
                <p className="font-mono text-lg mb-4 whitespace-pre-wrap">{renderTextWithLinks(post.content)}</p>
                
                <div className="flex justify-between items-center text-sm font-bold uppercase border-t-2 border-black pt-4 text-gray-500">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleLike(post.id, post.user_id, isLiked)}
                      className={`flex items-center gap-1 font-bold text-sm ${isLiked ? 'text-red-600' : 'text-gray-600 hover:text-black'}`}
                    >
                      <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                      <span>{likeCount}</span>
                    </button>
                    <button 
                      onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex items-center gap-1 font-bold text-sm text-gray-600 hover:text-black"
                    >
                      <MessageCircle size={18} />
                      <span>{commentCount}</span>
                    </button>
                  </div>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>

                {/* Comments Section */}
                {isCommentsExpanded && (
                  <div className="mt-4 pt-4 border-t-2 border-black bg-gray-50 p-3 brutal-border">
                    {/* List Comments */}
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                      {post.comments?.length === 0 ? (
                        <p className="text-xs font-mono text-gray-500 text-center">Belum ada komentar.</p>
                      ) : (
                        post.comments?.map((comment: any) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-8 h-8 brutal-border overflow-hidden bg-gray-200 shrink-0">
                              {comment.profiles?.avatar_url ? (
                                <img src={comment.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs">?</div>
                              )}
                            </div>
                            <div className="flex-1 bg-white p-2 brutal-border text-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold uppercase text-xs">
                                  {comment.profiles?.username || 'Anonim'}
                                </span>
                                <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(comment.created_at))}</span>
                              </div>
                              <p className="font-mono break-words">{renderTextWithLinks(comment.content)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 brutal-input text-sm py-2 px-3"
                        placeholder="Tulis balasan..."
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePostComment(post.id, post.user_id);
                          }
                        }}
                      />
                      <button 
                        onClick={() => handlePostComment(post.id, post.user_id)}
                        className="bg-black text-white px-3 brutal-border hover:bg-gray-800 flex items-center justify-center"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
