import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send, Image as ImageIcon, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { GoogleGenAI } from '@google/genai';

export default function Feed({ session, onUserClick, onViewAllFriends }: { session: any, onUserClick: (userId: string) => void, onViewAllFriends: () => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State untuk komentar
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  // State untuk upload gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    fetchAds();
    fetchFriends();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      setErrorMsg(`Gagal mengambil data: ${error.message}. Pastiin lu udah bikin table 'likes' dan 'comments' di Supabase!`);
    } else if (data) {
      // Urutkan komentar dari yang terlama ke terbaru
      const formattedData = data.map(post => ({
        ...post,
        comments: post.comments?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
      }));
      setPosts(formattedData);
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kompresi gambar
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    
    try {
      setPostStatus('Mengompres gambar...');
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
      setPostStatus('');
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("Gagal memproses gambar.");
      setPostStatus('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !imageFile) return;

    setIsPosting(true);
    setErrorMsg('');
    let finalImageUrl = null;

    if (imageFile) {
      setPostStatus('Satpam AI sedang mengecek gambar...');
      try {
        // Convert to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        
        const base64String = base64Data.split(',')[1];
        const mimeType = imageFile.type;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64String
                }
              },
              {
                text: "Analyze this image. Does it contain pornography, nudity, extreme violence, gore, or animal cruelty? Answer ONLY with 'YES' or 'NO'."
              }
            ]
          }
        });

        const aiAnswer = response.text?.trim().toUpperCase() || "YES";
        
        if (aiAnswer.includes("YES")) {
          setIsPosting(false);
          setPostStatus('');
          setErrorMsg("Upload dibatalkan! Satpam AI mendeteksi konten yang tidak pantas (porno/kekerasan).");
          return;
        }

        setPostStatus('Mengunggah gambar ke server...');
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;

      } catch (err: any) {
        console.error("AI/Upload Error:", err);
        setIsPosting(false);
        setPostStatus('');
        setErrorMsg(`Gagal: ${err.message || JSON.stringify(err)}. (Kalau tulisannya 'new row violates row-level security policy', berarti lu belum ngasih izin upload di Supabase Storage)`);
        return;
      }
    }

    setPostStatus('Memposting curhatan...');
    const { error } = await supabase.from('posts').insert([
      { content: newPost, user_id: session.user.id, image_url: finalImageUrl }
    ]);

    if (error) {
      setErrorMsg(`Gagal posting: ${error.message}.`);
    } else {
      setNewPost('');
      removeImage();
      fetchPosts();
    }
    setIsPosting(false);
    setPostStatus('');
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
    fetchPosts();
  };

  const handlePostComment = async (postId: string, postOwnerId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;

    const { error } = await supabase.from('comments').insert([
      { post_id: postId, user_id: session.user.id, content: text }
    ]);

    if (!error) {
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      
      const notificationsToInsert: any[] = [];

      // Notifikasi buat yang punya post (kalau yang komen bukan yang punya post)
      if (postOwnerId !== session.user.id) {
        notificationsToInsert.push({
          user_id: postOwnerId,
          actor_id: session.user.id,
          type: 'comment',
          post_id: postId
        });
      }

      // Ambil semua user yang pernah komen di post ini buat dikasih notif 'reply'
      const { data: commentsData } = await supabase
        .from('comments')
        .select('user_id')
        .eq('post_id', postId);
        
      if (commentsData) {
        const otherCommenters = new Set<string>();
        commentsData.forEach(c => {
          // Jangan notif diri sendiri, dan jangan double notif ke post owner
          if (c.user_id !== session.user.id && c.user_id !== postOwnerId) {
            otherCommenters.add(c.user_id);
          }
        });

        otherCommenters.forEach(userId => {
          notificationsToInsert.push({
            user_id: userId,
            actor_id: session.user.id,
            type: 'reply',
            post_id: postId
          });
        });
      }

      if (notificationsToInsert.length > 0) {
        await supabase.from('notifications').insert(notificationsToInsert);
      }
      
      fetchPosts();
    } else {
      alert(`Gagal komen: ${error.message}`);
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
            disabled={isPosting}
          />
          
          {imagePreview && (
            <div className="relative w-max">
              <img src={imagePreview} alt="Preview" className="max-h-48 object-cover brutal-border" />
              <button 
                type="button" 
                onClick={removeImage} 
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 brutal-shadow hover:bg-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageSelect}
                disabled={isPosting}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="brutal-btn-outline flex items-center gap-2 px-3 py-2 text-sm"
                disabled={isPosting}
              >
                <ImageIcon size={18} />
                <span className="hidden md:inline">Tambah Gambar</span>
              </button>
              {postStatus && <span className="text-xs font-bold uppercase text-blue-600 animate-pulse">{postStatus}</span>}
            </div>
            
            <button
              className="brutal-btn brutal-shadow w-full md:w-auto"
              disabled={isPosting}
            >
              {isPosting ? 'Melempar...' : 'Lempar!'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        {posts.length === 0 && !errorMsg && (
          <div className="p-8 text-center font-mono text-gray-500 border-2 border-dashed border-gray-400 text-sm md:text-base">
            Belum ada yang lempar nasib. Jadilah yang pertama!
          </div>
        )}

        {posts.map((post) => {
          const isLiked = post.likes?.some((like: any) => like.user_id === session.user.id);
          const likeCount = post.likes?.length || 0;
          const commentCount = post.comments?.length || 0;
          const isCommentsExpanded = showComments[post.id];

          return (
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
                  
                  {post.image_url && (
                    <div className="mt-4">
                      <img src={post.image_url} alt="Post image" className="max-h-96 w-auto object-cover brutal-border" />
                    </div>
                  )}
                  
                  {/* Actions: Like & Comment */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t-2 border-gray-200">
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
                    
                    {/* Tombol Hapus (Hanya muncul kalau ini post milik user yang login) */}
                    {post.user_id === session.user.id && (
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="ml-auto text-red-600 text-xs font-bold uppercase hover:underline"
                      >
                        Hapus
                      </button>
                    )}
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
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setCommentText(prev => ({ ...prev, [post.id]: `@${comment.profiles?.username} ` }))}
                                      className="text-[10px] font-bold uppercase text-blue-600 hover:underline"
                                    >
                                      Balas
                                    </button>
                                    <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(comment.created_at))}</span>
                                  </div>
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
