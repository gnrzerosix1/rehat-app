import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function Meetup({ session }: { session: any }) {
  const [meetups, setMeetups] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMeetups();
  }, []);

  const fetchMeetups = async () => {
    const { data, error } = await supabase
      .from('meetups')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMeetups(data);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !time.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('meetups').insert([
      { title, location, time, user_id: session.user.id }
    ]);

    if (!error) {
      setTitle('');
      setLocation('');
      setTime('');
      fetchMeetups();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-8 p-6 brutal-border brutal-shadow bg-[#f0f0f0]">
        <h2 className="text-3xl font-bold uppercase mb-4">Ajak Nongkrong</h2>
        <p className="font-mono mb-6 pb-4 border-b-2 border-black">
          Bosen di rumah? Ajak ngopi atau mabar. Siapa tau ada yang nganggur juga di deket lu.
        </p>

        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <div>
            <label className="block font-bold mb-2 uppercase">Agenda / Acara:</label>
            <input
              className="w-full brutal-input"
              placeholder="Misal: Ngopi ngomongin nasib, Mabar ML"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2 uppercase">Lokasi:</label>
              <input
                className="w-full brutal-input"
                placeholder="Warkop Berkah, Discord, dll"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block font-bold mb-2 uppercase">Kapan:</label>
              <input
                className="w-full brutal-input"
                placeholder="Nanti malem jam 8, Besok sore"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <button
            className="self-end brutal-btn brutal-shadow mt-4"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Sebarkan Undangan'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meetups.map((meetup) => (
          <div key={meetup.id} className="p-6 brutal-border bg-white flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="inline-block bg-black text-white px-2 py-1 font-bold text-xs uppercase mb-2">Agenda</span>
                <p className="font-mono text-xl font-bold">{meetup.title}</p>
              </div>
              <div className="mb-2">
                <span className="inline-block border-2 border-black px-2 py-1 font-bold text-xs uppercase mb-1">Lokasi</span>
                <p className="font-mono text-md">{meetup.location}</p>
              </div>
              <div className="mb-6">
                <span className="inline-block border-2 border-black px-2 py-1 font-bold text-xs uppercase mb-1">Waktu</span>
                <p className="font-mono text-md">{meetup.time}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm font-bold uppercase border-t-2 border-black pt-4">
              <span>{meetup.profiles?.username || 'Anonim'}</span>
              <span>{formatDistanceToNow(new Date(meetup.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
