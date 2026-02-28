import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function Meetup({ session, onUserClick }: { session: any, onUserClick: (userId: string) => void }) {
  const [meetups, setMeetups] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCityAndMeetups();
  }, []);

  const fetchUserCityAndMeetups = async () => {
    // 1. Ambil kota user saat ini
    const { data: profile } = await supabase
      .from('profiles')
      .select('city')
      .eq('id', session.user.id)
      .single();

    const city = profile?.city || null;
    setUserCity(city);

    // 2. Ambil meetups, join dengan profile pembuatnya
    const { data, error } = await supabase
      .from('meetups')
      .select('*, profiles!inner(username, city)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // 3. Filter meetups: hanya tampilkan jika kota pembuat sama dengan kota user
      // Jika user belum set kota, tampilkan semua (atau bisa juga dikosongkan, tapi lebih baik tampilkan semua dengan peringatan)
      if (city) {
        const filtered = data.filter((m: any) => m.profiles?.city?.toLowerCase() === city.toLowerCase());
        setMeetups(filtered);
      } else {
        setMeetups(data);
      }
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
      fetchUserCityAndMeetups();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin mau hapus ajakan nongkrong ini?')) return;
    
    const { error } = await supabase.from('meetups').delete().eq('id', id);
    if (error) {
      alert(`Gagal hapus: ${error.message}`);
    } else {
      fetchUserCityAndMeetups();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-2 md:p-4">
      <div className="mb-6 md:mb-8 p-4 md:p-6 brutal-border brutal-shadow bg-[#f0f0f0]">
        <h2 className="text-2xl md:text-3xl font-bold uppercase mb-4">Ajak Nongkrong</h2>
        <p className="font-mono text-sm md:text-base mb-6 pb-4 border-b-2 border-black">
          Bosen di rumah? Ajak ngopi atau mabar. Siapa tau ada yang nganggur juga di deket lu.
        </p>

        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <div>
            <label className="block font-bold mb-2 uppercase text-sm md:text-base">Agenda / Acara:</label>
            <input
              className="w-full brutal-input text-sm md:text-base"
              placeholder="Misal: Ngopi ngomongin nasib, Mabar ML"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2 uppercase text-sm md:text-base">Lokasi:</label>
              <input
                className="w-full brutal-input text-sm md:text-base"
                placeholder="Warkop Berkah, Discord, dll"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block font-bold mb-2 uppercase text-sm md:text-base">Kapan:</label>
              <input
                className="w-full brutal-input text-sm md:text-base"
                placeholder="Nanti malem jam 8, Besok sore"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <button
            className="self-end brutal-btn brutal-shadow mt-4 w-full md:w-auto"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Sebarkan Undangan'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {meetups.map((meetup) => (
          <div key={meetup.id} className="p-4 md:p-6 brutal-border bg-white flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="inline-block bg-black text-white px-2 py-1 font-bold text-[10px] md:text-xs uppercase mb-2">Agenda</span>
                <p className="font-mono text-lg md:text-xl font-bold break-words">{meetup.title}</p>
              </div>
              <div className="mb-2">
                <span className="inline-block border-2 border-black px-2 py-1 font-bold text-[10px] md:text-xs uppercase mb-1">Lokasi</span>
                <p className="font-mono text-sm md:text-md break-words">{meetup.location}</p>
              </div>
              <div className="mb-6">
                <span className="inline-block border-2 border-black px-2 py-1 font-bold text-[10px] md:text-xs uppercase mb-1">Waktu</span>
                <p className="font-mono text-sm md:text-md break-words">{meetup.time}</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs md:text-sm font-bold uppercase border-t-2 border-black pt-4">
                <span 
                  className="cursor-pointer hover:underline truncate mr-2"
                  onClick={() => onUserClick(meetup.user_id)}
                >
                  {meetup.profiles?.username || 'Anonim'}
                </span>
                <span className="whitespace-nowrap">{formatDistanceToNow(new Date(meetup.created_at), { addSuffix: true })}</span>
              </div>

              {/* Tombol Hapus */}
              {meetup.user_id === session.user.id && (
                <div className="mt-4 text-right">
                  <button 
                    onClick={() => handleDelete(meetup.id)}
                    className="text-red-600 text-xs font-bold uppercase hover:underline"
                  >
                    Hapus Undangan
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
