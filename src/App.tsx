import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Feed from './components/Feed';
import SkillBarter from './components/SkillBarter';
import { LogOut, Home, Briefcase } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'barter'>('feed');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="border-b-4 border-black p-4 sticky top-0 bg-white z-10 flex justify-between items-center">
        <h1 className="text-4xl font-bold uppercase tracking-tighter">REHAT.</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 font-bold uppercase hover:underline"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </header>

      {/* Navigation */}
      <nav className="flex border-b-4 border-black bg-white sticky top-[76px] z-10">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 p-4 font-bold uppercase text-lg flex items-center justify-center gap-2 border-r-4 border-black transition-colors ${
            activeTab === 'feed' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Home size={24} />
          Lempar Nasib
        </button>
        <button
          onClick={() => setActiveTab('barter')}
          className={`flex-1 p-4 font-bold uppercase text-lg flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'barter' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Briefcase size={24} />
          Bursa Barter
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {activeTab === 'feed' ? <Feed session={session} /> : <SkillBarter session={session} />}
      </main>
    </div>
  );
}
