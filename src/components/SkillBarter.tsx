import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function SkillBarter({ session, onUserClick }: { session: any, onUserClick: (userId: string) => void }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [offer, setOffer] = useState('');
  const [need, setNeed] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSkills(data);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer.trim() || !need.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('skills').insert([
      { offer, need, user_id: session.user.id }
    ]);

    if (!error) {
      setOffer('');
      setNeed('');
      fetchSkills();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin mau hapus barteran ini?')) return;
    
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error) {
      alert(`Gagal hapus: ${error.message}`);
    } else {
      fetchSkills();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-2 md:p-4">
      <div className="mb-6 md:mb-8 p-4 md:p-6 brutal-border brutal-shadow bg-black text-white">
        <h2 className="text-2xl md:text-3xl font-bold uppercase mb-4">Bursa Barter Sisa Skill</h2>
        <p className="font-mono text-sm md:text-base mb-6 pb-4 border-b-2 border-white">
          Punya skill yang nggak kepake di kantor? Barter aja sama skill orang lain.
        </p>

        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2 uppercase text-sm md:text-base">Gue Punya Skill:</label>
              <input
                className="w-full brutal-input bg-white text-black text-sm md:text-base"
                placeholder="Misal: Bikin kopi enak, Excel VLOOKUP"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block font-bold mb-2 uppercase text-sm md:text-base">Gue Butuh Bantuan:</label>
              <input
                className="w-full brutal-input bg-white text-black text-sm md:text-base"
                placeholder="Misal: Benerin genteng, Bikin CV"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <button
            className="self-end brutal-btn-outline brutal-shadow mt-4 w-full md:w-auto"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Tawarkan Barter'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className="p-4 md:p-6 brutal-border bg-white flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="inline-block bg-black text-white px-2 py-1 font-bold text-[10px] md:text-xs uppercase mb-2">Menawarkan</span>
                <p className="font-mono text-base md:text-lg font-bold break-words">{skill.offer}</p>
              </div>
              <div className="mb-6">
                <span className="inline-block border-2 border-black px-2 py-1 font-bold text-[10px] md:text-xs uppercase mb-2">Mencari</span>
                <p className="font-mono text-base md:text-lg break-words">{skill.need}</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs md:text-sm font-bold uppercase border-t-2 border-black pt-4">
                <span 
                  className="cursor-pointer hover:underline truncate mr-2"
                  onClick={() => onUserClick(skill.user_id)}
                >
                  {skill.profiles?.username || 'Anonim'}
                </span>
                <span className="whitespace-nowrap">{formatDistanceToNow(new Date(skill.created_at), { addSuffix: true })}</span>
              </div>
              
              {/* Tombol Hapus */}
              {skill.user_id === session.user.id && (
                <div className="mt-4 text-right">
                  <button 
                    onClick={() => handleDelete(skill.id)}
                    className="text-red-600 text-xs font-bold uppercase hover:underline"
                  >
                    Hapus Barteran
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
