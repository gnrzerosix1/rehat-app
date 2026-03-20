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
import SinglePost from './components/SinglePost';
import { LogOut, Home, Briefcase, User, Users, ShieldAlert, Bell } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'barter' | 'meetup' | 'profile' | 'admin' | 'userProfile' | 'friendsList' | 'notifications' | 'singlePost'>('feed');
  const [previousTab, setPreviousTab] = useState<'feed' | 'barter' | 'meetup' | 'profile' | 'admin' | 'userProfile' | 'friendsList' | 'notifications' | 'singlePost'>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  useEffect(() => {
    // Cek local session dulu (buat akun bot)
    const localSessionStr = localStorage.getItem('rehat_custom_session');
    if (localSessionStr) {
      try {
        const localSession = JSON.parse(localSessionStr);
        setSession(localSession);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Kalau gak ada, baru cek Supabase Auth (buat Admin)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('rehat_custom_session')) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      checkBanAndRecordIP(session.user.id);
      if (session.user.email === 'mediakindo@gmail.com') {
        fetchPendingReportsCount();
      }
    }
  }, [session, activeTab]);

  const checkBanAndRecordIP = async (userId: string) => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const { ip } = await res.json();

      // Check if IP is banned
      const { data: banned } = await supabase.from('banned_ips').select('ip_address').eq('ip_address', ip).single();
      if (banned) {
        alert('Akses ditolak. IP lu udah di-banned dari Rehat karena melanggar aturan.');
        handleLogout();
        return;
      }

      // Check if account is banned
      const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', userId).single();
      if (profile?.is_banned) {
        alert('Akses ditolak. Akun lu udah di-banned dari Rehat karena melanggar aturan.');
        handleLogout();
        return;
      }

      // Record IP
      await supabase.from('profiles').update({ last_ip: ip }).eq('id', userId);
    } catch (e) {
      console.error('IP check failed', e);
    }
  };

  const fetchPendingReportsCount = async () => {
    const { count } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingReportsCount(count || 0);
  };

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);
    
    setUnreadCount(count || 0);
  };

  const handleLogout = async () => {
    localStorage.removeItem('rehat_custom_session');
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) {
    return <Auth onCustomLogin={(sess) => setSession(sess)} />;
  }

  const isAdmin = session.user.email === 'mediakindo@gmail.com';

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab('userProfile');
  };

  const handlePostClick = (postId: string) => {
    setPreviousTab(activeTab);
    setSelectedPostId(postId);
    setActiveTab('singlePost');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="border-b-4 border-black p-4 sticky top-0 bg-white z-20 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 md:gap-3 cursor-pointer" 
          onClick={() => setActiveTab('feed')}
        >
          <div className="bg-black text-white w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-2xl md:text-3xl border-2 border-black brutal-shadow-sm">
            R
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">REHAT.</h1>
            <p className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest mt-1">Teman Nganggur Lu</p>
          </div>
        </div>
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
            onClick={handleLogout}
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
          onClick={() => {
            setSelectedUserId(session.user.id);
            setActiveTab('userProfile');
          }}
          className={`flex-1 p-2 md:p-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${isAdmin ? 'border-r-4 border-black' : ''} transition-colors ${
            activeTab === 'userProfile' && selectedUserId === session.user.id ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          <User size={20} />
          <span className="text-[10px] md:text-sm lg:text-lg font-bold uppercase">Profil</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`relative flex-1 p-2 md:p-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-colors ${
              activeTab === 'admin' ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            <ShieldAlert size={20} />
            <span className="text-[10px] md:text-sm lg:text-lg font-bold uppercase">Admin</span>
            {pendingReportsCount > 0 && (
              <span className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {pendingReportsCount}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="p-2 md:p-8 pb-24 md:pb-8">
        {activeTab === 'feed' && <Feed session={session} onUserClick={handleUserClick} onViewAllFriends={() => setActiveTab('friendsList')} onPostClick={handlePostClick} />}
        {activeTab === 'barter' && <SkillBarter session={session} onUserClick={handleUserClick} />}
        {activeTab === 'meetup' && <Meetup session={session} onUserClick={handleUserClick} />}
        {activeTab === 'editProfile' && <Profile session={session} onBack={() => setActiveTab('userProfile')} />}
        {activeTab === 'admin' && <Admin session={session} />}
        {activeTab === 'userProfile' && selectedUserId && (
          <UserProfile userId={selectedUserId} session={session} onBack={() => setActiveTab('feed')} onPostClick={handlePostClick} onEditProfile={() => setActiveTab('editProfile')} />
        )}
        {activeTab === 'friendsList' && (
          <FriendsList session={session} onUserClick={handleUserClick} onBack={() => setActiveTab('feed')} />
        )}
        {activeTab === 'notifications' && (
          <Notifications session={session} onUserClick={handleUserClick} onPostClick={handlePostClick} />
        )}
        {activeTab === 'singlePost' && selectedPostId && (
          <SinglePost postId={selectedPostId} session={session} onUserClick={handleUserClick} onBack={() => setActiveTab(previousTab)} />
        )}
      </main>
    </div>
  );
}
