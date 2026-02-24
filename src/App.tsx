import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Feed from './components/Feed';
import SkillBarter from './components/SkillBarter';
import Profile from './components/Profile';
import Meetup from './components/Meetup';
import Admin from './components/Admin';
import UserProfile from './components/UserProfile';
import FriendsList from './components/FriendsList';
import Notifications from './components/Notifications';
import { LogOut, Home, Briefcase, User, Users, ShieldAlert, Bell } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'barter' | 'meetup' | 'profile' | 'admin' | 'userProfile' | 'friendsList' | 'notifications'>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (session) {
      fetchUnreadCount();
    }
  }, [session, activeTab]);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);
    
    setUnreadCount(count || 0);
  };

  if (!session) {
    return <Auth />;
  }

  const isAdmin = session.user.email === 'mediakindo@gmail.com';

  const handleUserClick = (userId: string) => {
    if (userId === session.user.id) {
      setActiveTab('profile');
    } else {
      setSelectedUserId(userId);
      setActiveTab('userProfile');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="border-b-4 border-black p-4 sticky top-0 bg-white z-20 flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">REHAT.</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative flex items-center gap-2 font-bold uppercase hover:underline text-sm md:text-base"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 font-bold uppercase hover:underline text-sm md:text-base"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Navigation - Bottom on Mobile, Top on Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t-4 border-black bg-white z-50 md:relative md:border-t-0 md:border-b-4">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 p-2 md:p-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 border-r-4 border-black transition-colors ${
            activeTab === 'feed' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] md:text-sm lg:text-lg font-bold uppercase">Beranda</span>
        </button>
        <button
          onClick={() => setActiveTab('barter')}
          className={`flex-1 p-2 md:p-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 border-r-4 border-black transition-colors ${
            activeTab === 'barter' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Briefcase size={20} />
          <span className="text-[10px] md:text-sm lg:text-lg font-bold uppercase">Barter</span>
        </button>
        <button
          onClick={() => setActiveTab('meetup')}
          className={`flex-1 p-2 md:p-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 border-r-4 border-black transition-colors ${
            activeTab === 'meetup' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Users size={20} />
          <span className="text-[10px] md:text-sm lg:text-lg font-bold uppercase">Nongkrong</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 p-2 md:p-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${isAdmin ? 'border-r-4 border-black' : ''} transition-colors ${
            activeTab === 'profile' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <User size={20} />
          <span className="text-[10px] md:text-sm lg:text-lg font-bold uppercase">Profil</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 p-2 md:p-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-colors ${
              activeTab === 'admin' ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            <ShieldAlert size={20} />
            <span className="text-[10px] md:text-sm lg:text-lg font-bold uppercase">Admin</span>
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="p-2 md:p-8 pb-24 md:pb-8">
        {activeTab === 'feed' && <Feed session={session} onUserClick={handleUserClick} onViewAllFriends={() => setActiveTab('friendsList')} />}
        {activeTab === 'barter' && <SkillBarter session={session} onUserClick={handleUserClick} />}
        {activeTab === 'meetup' && <Meetup session={session} onUserClick={handleUserClick} />}
        {activeTab === 'profile' && <Profile session={session} />}
        {activeTab === 'admin' && <Admin session={session} />}
        {activeTab === 'userProfile' && selectedUserId && (
          <UserProfile userId={selectedUserId} session={session} onBack={() => setActiveTab('feed')} />
        )}
        {activeTab === 'friendsList' && (
          <FriendsList session={session} onUserClick={handleUserClick} onBack={() => setActiveTab('feed')} />
        )}
        {activeTab === 'notifications' && (
          <Notifications session={session} onUserClick={handleUserClick} />
        )}
      </main>
    </div>
  );
}
