import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Feed from './components/Feed';
import SkillBarter from './components/SkillBarter';
import Profile from './components/Profile';
import Meetup from './components/Meetup';
import Admin from './components/Admin';
import { LogOut, Home, Briefcase, User, Users, ShieldAlert } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'barter' | 'meetup' | 'profile' | 'admin'>('feed');

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

  const isAdmin = session.user.email === 'mediakindo@gmail.com';

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="border-b-4 border-black p-4 sticky top-0 bg-white z-20 flex justify-between items-center">
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
      <nav className="flex flex-wrap border-b-4 border-black bg-white sticky top-[76px] z-20">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 min-w-[120px] p-3 md:p-4 font-bold uppercase text-sm md:text-lg flex items-center justify-center gap-2 border-r-4 border-black transition-colors ${
            activeTab === 'feed' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Home size={20} />
          <span className="hidden md:inline">Lempar Nasib</span>
        </button>
        <button
          onClick={() => setActiveTab('barter')}
          className={`flex-1 min-w-[120px] p-3 md:p-4 font-bold uppercase text-sm md:text-lg flex items-center justify-center gap-2 border-r-4 border-black transition-colors ${
            activeTab === 'barter' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Briefcase size={20} />
          <span className="hidden md:inline">Bursa Barter</span>
        </button>
        <button
          onClick={() => setActiveTab('meetup')}
          className={`flex-1 min-w-[120px] p-3 md:p-4 font-bold uppercase text-sm md:text-lg flex items-center justify-center gap-2 border-r-4 border-black transition-colors ${
            activeTab === 'meetup' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Users size={20} />
          <span className="hidden md:inline">Nongkrong</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[120px] p-3 md:p-4 font-bold uppercase text-sm md:text-lg flex items-center justify-center gap-2 ${isAdmin ? 'border-r-4 border-black' : ''} transition-colors ${
            activeTab === 'profile' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <User size={20} />
          <span className="hidden md:inline">Profil</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 min-w-[120px] p-3 md:p-4 font-bold uppercase text-sm md:text-lg flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'admin' ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            <ShieldAlert size={20} />
            <span className="hidden md:inline">Admin</span>
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {activeTab === 'feed' && <Feed session={session} />}
        {activeTab === 'barter' && <SkillBarter session={session} />}
        {activeTab === 'meetup' && <Meetup session={session} />}
        {activeTab === 'profile' && <Profile session={session} />}
        {activeTab === 'admin' && <Admin session={session} />}
      </main>
    </div>
  );
}
