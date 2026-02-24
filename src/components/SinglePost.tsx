import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send } from 'lucide-react';

export default function SinglePost({ postId, session, onUserClick, onBack }: { postId: string, session: any, onUserClick: (userId: string) => void, onBack: () => void }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
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
      .eq('id', postId)
      .single();
    
    if (data) {
      data.comments = data.comments?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || [];
      setPost(data);
    }
    setLoading(false);
  };

  const toggleLike = async (isLiked: boolean) => {
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', session.user.id);
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: session.user.id }]);
      if (post.user_id !== session.user.id) {
        await supabase.from('notifications').insert([{
          user_id: post.user_id,
          actor_id: session.user.id,
          type: 'like',
          post_id: postId
        }]);
      }
    }
    fetchPost();
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    const { error } = await supabase.from('comments').insert([
      { post_id: postId, user_id: session.user.id, content: commentText }
    ]);

    if (!error) {
      setCommentText('');
      
      // Ambil semua user yang pernah komen di post ini
      const { data: commentsData } = await supabase
        .from('comments')
        .select('user_id')
        .eq('post_id', postId);
        
      const usersToNotify = new Set<string>();
      
      // Tambahin yang punya post
      if (post.user_id !== session.user.id) {
        usersToNotify.add(post.user_id);
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
      
      fetchPost();
    } else {
      alert(`Gagal komen: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Yakin mau hapus curhatan ini?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      onBack();
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

  if (loading) return <div className="p-8 text-center font-mono font-bold uppercase">Loading postingan...</div>;
  if (!post) return <div className="p-8 text-center font-mono font-bold uppercase">Postingan nggak ketemu atau udah dihapus.</div>;

  const isLiked = post.likes?.some((like: any) => like.user_id === session.user.id);
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <div className="max-w-2xl mx-auto p-2 md:p-4">
      <button onClick={onBack} className="mb-6 font-bold uppercase hover:underline flex items-center gap-2 bg-black text-white px-4 py-2 brutal-shadow">
        ← Balik
      </button>

      <div className="p-4 md:p-6 brutal-border brutal-shadow bg-white">
        <div className="flex items-start gap-3 md:gap-4 mb-4">
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
            
            <div className="flex items-center gap-4 mt-4 pt-4 border-t-2 border-gray-200">
              <button 
                onClick={() => toggleLike(isLiked)}
                className={`flex items-center gap-1 font-bold text-sm ${isLiked ? 'text-red-600' : 'text-gray-600 hover:text-black'}`}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                <span>{likeCount}</span>
              </button>
              <div className="flex items-center gap-1 font-bold text-sm text-gray-600">
                <MessageCircle size={18} />
                <span>{commentCount}</span>
              </div>
              
              {post.user_id === session.user.id && (
                <button 
                  onClick={handleDelete}
                  className="ml-auto text-red-600 text-xs font-bold uppercase hover:underline"
                >
                  Hapus
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-black bg-gray-50 p-3 brutal-border">
              <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
                {post.comments?.length === 0 ? (
                  <p className="text-xs font-mono text-gray-500 text-center">Belum ada komentar.</p>
                ) : (
                  post.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2">
                      <div 
                        className="w-8 h-8 brutal-border overflow-hidden bg-gray-200 shrink-0 cursor-pointer"
                        onClick={() => onUserClick(comment.user_id)}
                      >
                        {comment.profiles?.avatar_url ? (
                          <img src={comment.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs">?</div>
                        )}
                      </div>
                      <div className="flex-1 bg-white p-2 brutal-border text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold uppercase text-xs cursor-pointer hover:underline" onClick={() => onUserClick(comment.user_id)}>
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

              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 brutal-input text-sm py-2 px-3"
                  placeholder="Tulis balasan..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                />
                <button 
                  onClick={handlePostComment}
                  className="bg-black text-white px-3 brutal-border hover:bg-gray-800 flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
