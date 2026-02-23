import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function SkillBarter({ session }: { session: any }) {
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

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-8 p-6 brutal-border brutal-shadow bg-black text-white">
        <h2 className="text-3xl font-bold uppercase mb-4">Bursa Barter Sisa Skill</h2>
        <p className="font-mono mb-6 pb-4 border-b-2 border-white">
          Punya skill yang nggak kepake di kantor? Barter aja sama skill orang lain.
        </p>

        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2 uppercase">Gue Punya Skill:</label>
              <input
                className="w-full brutal-input bg-white text-black"
                placeholder="Misal: Bikin kopi enak, Excel VLOOKUP"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block font-bold mb-2 uppercase">Gue Butuh Bantuan:</label>
              <input
                className="w-full brutal-input bg-white text-black"
                placeholder="Misal: Benerin genteng, Bikin CV"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <button
            className="self-end brutal-btn-outline brutal-shadow mt-4"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Tawarkan Barter'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className="p-6 brutal-border bg-white flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="inline-block bg-black text-white px-2 py-1 font-bold text-xs uppercase mb-2">Menawarkan</span>
                <p className="font-mono text-lg font-bold">{skill.offer}</p>
              </div>
              <div className="mb-6">
                <span className="inline-block border-2 border-black px-2 py-1 font-bold text-xs uppercase mb-2">Mencari</span>
                <p className="font-mono text-lg">{skill.need}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm font-bold uppercase border-t-2 border-black pt-4">
              <span>{skill.profiles?.username || 'Anonim'}</span>
              <span>{formatDistanceToNow(new Date(skill.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
