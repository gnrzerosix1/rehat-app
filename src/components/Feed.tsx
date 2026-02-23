import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function Feed({ session }: { session: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPosts(data);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('posts').insert([
      { content: newPost, user_id: session.user.id }
    ]);

    if (!error) {
      setNewPost('');
      fetchPosts();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8 p-6 brutal-border brutal-shadow bg-white">
        <h2 className="text-3xl font-bold uppercase mb-4">Lempar Nasib</h2>
        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <textarea
            className="w-full brutal-input min-h-[120px] resize-none"
            placeholder="Gimana nasib lu hari ini? Jujur aja, nggak ada HRD di sini."
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
        {posts.map((post) => (
          <div key={post.id} className="p-6 brutal-border bg-white">
            <p className="font-mono text-lg mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex justify-between items-center text-sm font-bold uppercase border-t-2 border-black pt-4">
              <span>Anonim</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
