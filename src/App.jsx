import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Moon, Sun, Plus, MoreVertical, 
  CheckCircle, XCircle, Trash2, Edit3, Image as ImageIcon, Send, Filter,
   ut, Settings, Activity, Users, MapPin, TrendingUp, Phone, Navigation, ShieldAlert, PieChart, BarChart, Eye, LayoutGrid, Monitor, Smartphone, Globe, ChevronDown, ArrowLeft, ChevronLeft
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, increment 
} from 'firebase/firestore';

const playPingSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playOsc = (time) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.1);
      osc.start(ctx.currentTime + time); osc.stop(ctx.currentTime + time + 0.1);
    };
    playOsc(0); playOsc(0.15); playOsc(0.3);
  } catch(e) { console.error("Audio error", e); }
};

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = "Unknown";
    let type = "PC";
    if (/android/i.test(ua)) { device = "Android"; type = "Mobile"; }
    else if (/ipad|iphone|ipod/i.test(ua)) { device = "iOS"; type = "Mobile"; }
    else if (/windows/i.test(ua)) { device = "Windows"; type = "PC"; }
    else if (/mac/i.test(ua)) { device = "Mac OS"; type = "PC"; }
    return { device, type, ua };
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E",
  authDomain: "ramit-7e364.firebaseapp.com",
  projectId: "ramit-7e364",
  storageBucket: "ramit-7e364.firebasestorage.app",
  messagingSenderId: "1036691345731",
  appId: "1:1036691345731:web:df8121852c6137e3b35ff6"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ramit-7e364';
const ADMIN_PASSWORD = "ict168mit";

const injectStyles = (colorHex) => {
  const styleId = 'khmer-app-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&display=swap');
    :root { --font-khmer: 'Noto Sans Khmer', sans-serif; --theme-color: ${colorHex}; }
    .font-khmer { font-family: var(--font-khmer); }
    .glass-panel { background: rgba(255, 255, 255, 1); border: 1px solid rgba(226, 232, 240, 1); }
    .dark .glass-panel { background: rgba(15, 23, 42, 1); border: 1px solid rgba(51, 65, 85, 1); }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .soft-shadow { box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
    .dark .soft-shadow { box-shadow: 0 4px 20px -2px rgba(0,0,0,0.3); }
    .bg-theme { background-color: var(--theme-color) !important; }
    .text-theme { color: var(--theme-color) !important; }
    .border-theme { border-color: var(--theme-color) !important; }
    .fill-theme { fill: var(--theme-color) !important; }
    .stroke-theme { stroke: var(--theme-color) !important; }
  `;
};

const REGIONS = {
  "រតនមណ្ឌល": { "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"], "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"], "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"] }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState('gateway'); 
  const [theme, setTheme] = useState('light');
  const [themeColor, setThemeColor] = useState('#0f766e'); // Using an emerald/blue-green color as default to match design
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  
  const [appLogo, setAppLogo] = useState('logo.png'); 
  const [language, setLanguage] = useState('km'); 
  
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' });
  const [locations, setLocations] = useState([]); 
  const [usersList, setUsersList] = useState([]); 
  const [chats, setChats] = useState([]);
  const [cyberLogs, setCyberLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState({});

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { injectStyles(themeColor); }, [themeColor]);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) { console.error('Auth error:', err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setIsAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setDoc(profileRef, { username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', uid: user.uid, timestamp: Date.now() }, { merge: true });
    });

    const allUsersRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_data');
    const unsubAllUsers = onSnapshot(allUsersRef, snap => setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    const locationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'data_admin');
    const unsubLocations = onSnapshot(locationsRef, (snapshot) => setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    const unsubChats = onSnapshot(chatsRef, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp - b.timestamp); setChats(msgs);
    });

    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs');
    const unsubLogs = onSnapshot(logsRef, snap => {
      const lg = snap.docs.map(d => ({id: d.id, ...d.data()})); lg.sort((a,b) => b.timestamp - a.timestamp); setCyberLogs(lg);
    });

    const notifRef = collection(db, 'artifacts', appId, 'users', user.uid, 'notifications');
    const unsubNotif = onSnapshot(notifRef, snap => {
      const nt = snap.docs.map(d => ({id: d.id, ...d.data()})); nt.sort((a,b) => b.timestamp - a.timestamp); setNotifications(nt);
    });

    const favRef = collection(db, 'artifacts', appId, 'users', user.uid, 'favorites');
    const unsubFavs = onSnapshot(favRef, (snapshot) => {
      const favMap = {}; snapshot.docs.forEach(doc => { favMap[doc.id] = true; }); setFavorites(favMap);
    });

    return () => { unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); unsubLogs(); unsubNotif(); unsubFavs(); };
  }, [user]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 5000); };
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleFavorite = async (locationId) => {
    if (!user) return;
    const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', locationId);
    const locRef = doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', locationId);
    try {
      if (favorites[locationId]) { await deleteDoc(favDocRef); await updateDoc(locRef, { likes: increment(-1) }); } 
      else { await setDoc(favDocRef, { timestamp: Date.now() }); await updateDoc(locRef, { likes: increment(1) }); }
    } catch (e) { console.error('Error toggling favorite:', e); }
  };

  const approvedLocations = useMemo(() => locations.filter(l => l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => locations.filter(l => l.status === 'pending'), [locations]);

  if (isAuthLoading) return <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 bg-theme"></div></div>;

  // ==========================================
  // GATEWAY PAGE 1 (MOCKUP 1 DESIGN)
  // ==========================================
  if (currentPage === 'gateway') {
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col font-khmer bg-slate-50 dark:bg-slate-900 overflow-y-auto`}>
        {/* Top Colored Curve Section */}
        <div className="bg-theme w-full h-[55vh] md:h-[50vh] rounded-b-[3rem] md:rounded-b-[5rem] relative flex flex-col items-center pt-16 px-6 shadow-md shrink-0">
            {/* Logo */}
            <div className="w-20 h-20 bg-white rounded-[1.2rem] p-1 shadow-lg mb-3 z-10 relative">
               <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                  if (e.target.files[0]) { const r = new FileReader(); r.onload = () => setAppLogo(r.result); r.readAsDataURL(e.target.files[0]); }
               }} title="Change Logo"/>
            </div>
            {/* Subtitle */}
            <p className="text-white font-medium text-sm md:text-base z-10">សូមស្វាគមន៍មកកាន់ TP nice</p>

            {/* Floating Illustration Image */}
            <div className="absolute -bottom-16 w-[85%] max-w-[320px] h-[220px] z-20">
               <img src="back.png" />
            </div>

            {/* Language Toggle Corner */}
            <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setLanguage(l => l === 'km' ? 'en' : 'km')} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/30 hover:bg-white/30 transition-colors">
                    {language === 'km' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}
                </button>
            </div>
        </div>

        {/* Bottom Content Section */}
        <div className="flex-1 flex flex-col items-center px-6 pt-24 pb-10 text-center justify-between z-10 relative">
           <div className="max-w-md w-full space-y-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">ទិន្នន័យ & ទំនាក់ទំនង</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                ប្រព័ន្ធរុករកទិន្នន័យ និងសម្របសម្រួលទំនាក់ទំនងក្នុងគ្រាអាសន្ន។ បង្កើតឡើងដើម្បីផ្តល់ភាពងាយស្រួលដល់ប្រជាពលរដ្ឋក្នុងការទាក់ទងមេភូមិ ឃុំ ប៉ុស្តិ៍នគរបាល និងមន្ទីរពេទ្យដោយផ្ទាល់។
              </p>
           </div>
           
           <div className="w-full max-w-sm mt-8 space-y-3">
              <button onClick={() => setCurrentPage('app')} className="w-full bg-theme text-white py-4 rounded-2xl font-bold text-base shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] active:scale-95 transition-transform flex justify-center items-center gap-2">
                 អនុញ្ញាតឲ្យខ្លួនឯងចូលប្រើប្រាស់
              </button>
           </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN APP PAGE 2 (MOCKUP 2 DESIGN)
  // ==========================================
  return (
    <div className={`min-h-screen font-khmer transition-colors duration-300 ${theme === 'dark' ? 'dark' : 'bg-slate-50'}`}>
      <div className="text-slate-800 dark:text-slate-100 min-h-screen flex flex-col md:flex-row selection:bg-theme selection:text-white pb-20 md:pb-0">
        
        {toast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5">
            <div className={`px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {toast.type === 'error' ? <XCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {toast.msg}
            </div>
          </div>
        )}

        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} setAppLogo={setAppLogo} setCurrentPage={setCurrentPage} language={language} />

        <main className="flex-1 flex flex-col h-screen overflow-x-hidden overflow-y-auto relative w-full hide-scrollbar">
          
          {/* Integrated TopBar & Search specifically for Home, or generic for others */}
          {currentView === 'home' ? (
             <HomeHeader 
                setCurrentPage={setCurrentPage} 
                profile={profile} 
                notifications={notifications} 
                notificationsOpen={notificationsOpen} 
                setNotificationsOpen={setNotificationsOpen}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                language={language}
                db={db} appId={appId} user={user} showToast={showToast}
             />
          ) : (
             <TopBar theme={theme} toggleTheme={toggleTheme} searchQuery={searchQuery} setSearchQuery={setSearchQuery} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} notifications={notifications} appLogo={appLogo} setAppLogo={setAppLogo} db={db} appId={appId} showToast={showToast} user={user} setCurrentPage={setCurrentPage} language={language} />
          )}

          <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentView === 'home' && <HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} language={language} appLogo={appLogo} setCurrentView={setCurrentView} />}
            {currentView === 'data' && <DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} language={language} />}
            {currentView === 'reports' && <ReportsView locations={approvedLocations} usersList={usersList} language={language} />}
            {currentView === 'chat' && <ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />}
            {currentView === 'account' && <AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} themeColor={themeColor} setThemeColor={setThemeColor} theme={theme} setTheme={setTheme} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} language={language} />}
            {currentView === 'admin' && isAdmin && <AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} profile={profile} user={user} setIsAdmin={setIsAdmin} />}
          </div>
        </main>

        <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />

        {selectedLocation && <LocationDetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} favorites={favorites} toggleFavorite={toggleFavorite} />}
      </div>
    </div>
  );
}

// ==========================================
// VIEWS & COMPONENTS
// ==========================================

const Sidebar = ({ currentView, setCurrentView, isAdmin, appLogo, setAppLogo, setCurrentPage, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home' },
    { id: 'data', icon: Map, label: language === 'km' ? 'ទិន្នន័យ' : 'Data' },
    { id: 'reports', icon: TrendingUp, label: language === 'km' ? 'របាយការណ៍' : 'Reports' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Messages' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin' });

  return (
    <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-200 dark:border-slate-800 z-10 sticky top-0 h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700 shrink-0">
           <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[10px]" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-theme">Khmer TP</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">ស្វែងយល់ពីកម្ពុជា</p>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-4 px-3 uppercase tracking-wider">{language === 'km' ? 'ម៉ឺនុយ' : 'Menu'}</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${currentView === item.id ? 'bg-theme text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'scale-110' : ''}`} />
            <div className="font-medium text-sm">{item.label}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

// FLOATING BOTTOM NAV (MOCKUP 2 DESIGN)
const BottomNav = ({ currentView, setCurrentView, isAdmin, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home' },
    { id: 'data', icon: LayoutGrid, label: language === 'km' ? 'ទិន្នន័យ' : 'Data' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Chat' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white dark:bg-slate-800 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-2 flex justify-between items-center z-50 border border-slate-100 dark:border-slate-700">
      {navItems.map(item => {
         const isActive = currentView === item.id;
         return (
           <button 
             key={item.id} 
             onClick={() => setCurrentView(item.id)} 
             className={`flex items-center justify-center gap-2 p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-theme text-white px-5' : 'text-slate-400 hover:text-theme flex-1'}`}
           >
             <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
             {isActive && <span className="text-xs font-bold whitespace-nowrap animate-in fade-in zoom-in duration-300">{item.label}</span>}
           </button>
         )
      })}
    </div>
  );
};

// HOME SPECIFIC HEADER (MATCHES MOCKUP 2)
const HomeHeader = ({ setCurrentPage, profile, notifications, notificationsOpen, setNotificationsOpen, searchQuery, setSearchQuery, language, db, appId, user, showToast }) => {
    return (
        <div className="bg-theme text-white rounded-b-[2.5rem] pt-safe pb-8 px-4 md:px-8 shadow-md relative z-40">
           <div className="flex justify-between items-center mb-6 pt-4">
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentPage('gateway')} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"><ChevronLeft className="w-5 h-5 text-white"/></button>
                 <div className="flex flex-col">
                    <p className="text-[10px] text-white/70 font-medium">ត្រឡប់ទៅទំព័រទី១</p>
                    <p className="text-sm font-bold flex items-center gap-1">Khmer TP</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative">
                     <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-5 h-5 text-white" />
                        {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-theme rounded-full"></span>}
                     </button>
                     {/* Notifications Dropdown */}
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 text-slate-800 dark:text-slate-100">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold flex justify-between">
                            <span>ការជូនដំណឹង</span><button onClick={() => setNotificationsOpen(false)}><XCircle className="w-4 h-4 text-slate-400" /></button>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <p className="p-4 text-center text-sm text-slate-500">គ្មានសារថ្មីទេ</p> : 
                              notifications.map(n => (
                                <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-start gap-2">
                                  <div>
                                    <p className={`text-sm font-bold ${n.type === 'error' ? 'text-red-500' : 'text-theme'}`}>{n.title}</p>
                                    <p className="text-[11px] text-slate-500 mt-1">{n.msg}</p>
                                  </div>
                                  <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notifications', n.id)); }} className="text-slate-400 hover:text-red-500 shrink-0"><XCircle className="w-4 h-4"/></button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                 </div>
                 <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden bg-white/20 p-0.5">
                    <img src={profile.avatar} className="w-full h-full object-cover rounded-full" alt="Profile" />
                 </div>
              </div>
           </div>
           
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                 type="text" 
                 placeholder={language === 'km' ? "ស្វែងរកសេវាកម្ម..." : "Search for a service..."} 
                 className="w-full bg-white text-slate-800 rounded-[1.2rem] py-3.5 pl-12 pr-4 outline-none shadow-sm text-sm font-medium focus:ring-2 focus:ring-white/50 transition-all" 
                 value={searchQuery} 
                 onChange={(e) => setSearchQuery(e.target.value)} 
              />
           </div>
        </div>
    );
};

// GENERIC TOPBAR FOR OTHER PAGES
const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen, notifications, appLogo, setAppLogo, db, appId, showToast, user, setCurrentPage, language }) => {
  return (
    <header className="px-4 py-3 md:px-8 bg-white dark:bg-slate-900 sticky top-0 z-40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
      <div className="md:hidden flex items-center gap-2 shrink-0">
        <label className="cursor-pointer relative">
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center p-0.5 border border-slate-200 dark:border-slate-700">
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[6px]" />
          </div>
        </label>
      </div>

      <button onClick={()=>setCurrentPage('gateway')} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-500 transition shrink-0">
         <ArrowLeft className="w-4 h-4"/> ត្រឡប់
      </button>

      <div className="w-full order-last md:order-none md:flex-1 md:max-w-xl relative group px-1 md:px-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-theme transition-colors" />
        <input 
          type="text" placeholder={language === 'km' ? "ស្វែងរកទីតាំង..." : "Search locations..."} 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-full py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-theme/30 focus:ring-2 focus:ring-theme/10 transition-all text-sm font-medium"
        />
      </div>

      <div className="flex items-center gap-2 relative shrink-0">
        <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

// --- View: Home (INTEGRATES MOCKUP 2 CONTENT LAYOUT) ---
const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, language, setCurrentView }) => {
  const [activeHomeFilter, setActiveHomeFilter] = useState('All');
  
  const filtered = locations.filter(l => {
     const matchesSearch = l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc?.toLowerCase().includes(searchQuery.toLowerCase());
     if(activeHomeFilter === 'All') return matchesSearch;
     if(activeHomeFilter === 'រតនមណ្ឌល') return matchesSearch && l.district === 'រតនមណ្ឌល';
     if(activeHomeFilter === 'ផ្សេងៗ') return matchesSearch && l.district !== 'រតនមណ្ឌល';
     return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Service Categories (As per Mockup 2) */}
      <div className="mt-2">
         <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">ជម្រើសទីតាំង (Categories)</h2>
            <button onClick={() => setActiveHomeFilter('All')} className="text-xs font-bold text-theme hover:underline">View all &gt;</button>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setActiveHomeFilter('រតនមណ្ឌល')} className={`bg-white dark:bg-slate-800 p-4 rounded-[1.2rem] flex items-center justify-between shadow-sm border transition-transform active:scale-95 ${activeHomeFilter==='រតនមណ្ឌល'?'border-theme ring-1 ring-theme':'border-slate-100 dark:border-slate-700'}`}>
               <div className="flex items-center gap-3">
                  <div className="text-theme"><Map className="w-6 h-6 stroke-[1.5px]"/></div>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">ស្រុករតនមណ្ឌល</span>
               </div>
               <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
            </button>
            <button onClick={() => setActiveHomeFilter('ផ្សេងៗ')} className={`bg-white dark:bg-slate-800 p-4 rounded-[1.2rem] flex items-center justify-between shadow-sm border transition-transform active:scale-95 ${activeHomeFilter==='ផ្សេងៗ'?'border-emerald-500 ring-1 ring-emerald-500':'border-slate-100 dark:border-slate-700'}`}>
               <div className="flex items-center gap-3">
                  <div className="text-emerald-500"><Globe className="w-6 h-6 stroke-[1.5px]"/></div>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">ស្រុកផ្សេងៗ</span>
               </div>
               <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
            </button>
         </div>
      </div>

      {/* Popular Services / Locations Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">ទីតាំងដែលបានដាក់បញ្ចូល (Locations)</h2>
          <button onClick={() => setCurrentView('data')} className="text-xs font-bold text-theme hover:underline">View all &gt;</button>
        </div>

        {filtered.length === 0 ? (
           <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-500">គ្មានទិន្នន័យ (No data found)</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((loc, i) => (
              <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- View: Data ---
const DataView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId, setCurrentView }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({ title: '', institution: '', phone: '', image: '', mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);

  const filtered = locations.filter(l => {
    const matchesSearch = l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc?.toLowerCase().includes(searchQuery.toLowerCase());
    const isRatanak = l.province === 'បាត់ដំបង' && l.district === 'រតនមណ្ឌល';
    if (activeTab === 'រតនមណ្ឌល' && !isRatanak) return false;
    if (activeTab === 'ស្រុកផ្សេងៗ' && isRatanak) return false;

    let matchesLevel = true;
    if (activeFilter === 'ស្រុក' && !l.district) matchesLevel = false;
    if (activeFilter === 'ឃុំ' && !l.commune) matchesLevel = false;
    if (activeFilter === 'ភូមិ' && !l.village) matchesLevel = false;
    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    if (!profile.username) { 
      showToast('សូមបង្កើតឈ្មោះក្នុងគណនីជាមុនសិន', 'error'); 
      setCurrentView('account');
      return; 
    }
    setForm({ title: '', institution: '', phone: '', image: '', mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.image) return showToast('សូមបំពេញឈ្មោះ និងរូបភាព', 'error');
    setLoading(true);
    try {
      let submitData = { ...form, author: profile.username, timestamp: Date.now() };
      if (activeTab === 'រតនមណ្ឌល') { submitData.province = 'បាត់ដំបង'; submitData.district = 'រតនមណ្ឌល'; }
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'data_admin'), { ...submitData, status: isAdmin ? 'approved' : 'pending', likes: 0 });
      if (isAdmin) showToast('ទិន្នន័យត្រូវបានបញ្ចូលដោយជោគជ័យ ✅');
      else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), { title: 'សំណើថ្មីបានបញ្ជូន', msg: `រាល់សំណើររបស់អ្នកនឹងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យពីផ្នែករដ្ឋបាលសិន ដើម្បីបញ្ជាក់ថាទិន្នន័យពិតប្រាកដ ឬក្លែងក្លាយ។ សូមរង់ចាំ! ⏳`, type: 'info', timestamp: Date.now() });
        showToast('បានផ្ញើរសំណើរ (Admin) ⏳');
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូនទិន្នន័យ', 'error'); }
    setLoading(false);
  };

  if (!profile.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in zoom-in duration-300">
         <div className="w-20 h-20 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-6"><User className="w-10 h-10" /></div>
         <h2 className="text-xl font-bold mb-2">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-6 max-w-sm text-sm font-medium">សូមចូលទៅកាន់គណនី (Account) ដើម្បីកំណត់ឈ្មោះរបស់អ្នកជាមុនសិន ទើបអ្នកអាចចូលប្រើប្រាស់មុខងារទិន្នន័យនេះបាន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-6 py-3 rounded-full font-bold shadow-md transition-transform active:scale-95 text-sm">
            ទៅកំណត់ឈ្មោះឥឡូវនេះ
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <h1 className="text-2xl font-bold flex items-center gap-2">ទិន្នន័យ</h1>
         <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-full w-full sm:w-auto overflow-hidden">
            {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-theme shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
            ))}
         </div>
         <button onClick={handleOpenAdd} className="w-full md:w-auto bg-theme text-white px-5 py-2.5 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm text-sm"><Plus className="w-4 h-4"/> បន្ថែមទីតាំង</button>
      </div>

      <div className="flex items-center gap-2 p-1 overflow-x-auto hide-scrollbar">
        {['ទាំងអស់', 'ស្រុក', 'ឃុំ', 'ភូមិ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeFilter === cat ? 'bg-theme text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? <p className="col-span-full text-center text-slate-500 py-10 font-bold text-sm">គ្មានទិន្នន័យ</p> : 
          filtered.map((loc, i) => (
             <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} index={i} isAdmin={false} />
          ))
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl overflow-hidden soft-shadow max-h-[90vh] flex flex-col border-t md:border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-base font-bold text-theme">បន្ថែមទិន្នន័យ: {activeTab}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><XCircle className="w-5 h-5 text-slate-500"/></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">ប្រភេទ</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-theme font-bold">
                      <option value="សាលារៀន">សាលារៀន</option><option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option><option value="ប៉ុស្តិ៍ប៉ូលិស">ប៉ុស្តិ៍ប៉ូលិស</option>
                      <option value="មេភូមិ">មេភូមិ</option><option value="មេឃុំ">មេឃុំ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">ឈ្មោះ (Name)</label>
                    <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-theme font-bold" />
                  </div>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">ឈ្មោះស្ថាប័ន</label>
                    <input type="text" required value={form.institution} onChange={e=>setForm({...form, institution: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-theme font-bold" />
                </div>

                {activeTab === 'រតនមណ្ឌល' ? (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 block mb-1">ឃុំ</label>
                            <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-xs outline-none font-bold border border-slate-100 dark:border-slate-700">
                                <option value="">ជ្រើសរើស</option>
                                {Object.keys(REGIONS["រតនមណ្ឌល"] || {}).map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 block mb-1">ភូមិ</label>
                            <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-xs outline-none font-bold border border-slate-100 dark:border-slate-700">
                                <option value="">ជ្រើសរើស</option>
                                {form.commune && REGIONS["រតនមណ្ឌល"][form.commune] && REGIONS["រតនមណ្ឌល"][form.commune].map(v=><option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div><input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-xs outline-none font-bold" placeholder="ខេត្ត..."/></div>
                        <div><input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-xs outline-none font-bold" placeholder="ស្រុក..."/></div>
                        <div><input type="text" value={form.commune} onChange={e=>setForm({...form, commune: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-xs outline-none font-bold" placeholder="ឃុំ..."/></div>
                        <div><input type="text" value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-xs outline-none font-bold" placeholder="ភូមិ..."/></div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div><input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-theme font-bold" placeholder="លេខទូរស័ព្ទ..." /></div>
                  <div><input type="url" value={form.mapUrl} onChange={e=>setForm({...form, mapUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-theme font-bold" placeholder="Google Map Link..." /></div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">រូបភាព (Upload Picture) *</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 relative overflow-hidden transition-colors">
                     {form.image ? (
                        <><img src={form.image} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-bold bg-black/50 px-3 py-1.5 rounded-full text-[10px]">ប្តូររូបភាព</span></div></>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                           <ImageIcon className="w-6 h-6 mb-1 opacity-70" />
                           <span className="text-[11px] font-bold">ចុចដើម្បី Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="hidden" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>

                <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="ការពណ៌នា..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-theme h-20 resize-none font-medium"></textarea>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 pb-safe">
               <button type="submit" form="addForm" disabled={loading} className="w-full py-3 rounded-xl font-bold bg-theme text-white hover:opacity-90 disabled:opacity-50 transition shadow-md">ផ្ញើរសំណើរ (Admin)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Reports ---
const ReportsView = ({ locations, usersList }) => {
  const [footerText, setFooterText] = useState('រក្សាសិទ្ធិដោយយុវជន VMC វិ.ស.ស @');
  const [editFooter, setEditFooter] = useState(false);

  const now = Date.now();
  const dayAgo = now - 86400000;
  const weekAgo = now - 604800000;
  const monthAgo = now - 2592000000;
  const yearAgo = now - 31536000000;

  const totalUsers = usersList.length;
  const weeklyUsers = usersList.filter(u => u.timestamp > weekAgo).length;
  const monthlyUsers = usersList.filter(u => u.timestamp > monthAgo).length;
  const yearlyUsers = usersList.filter(u => u.timestamp > yearAgo).length;

  const stats = [
    { label: 'អ្នកប្រើប្រាស់សរុប', count: totalUsers, color: 'text-theme' },
    { label: 'ប្រចាំសប្តាហ៍', count: weeklyUsers, color: 'text-teal-500' },
    { label: 'ប្រចាំខែ', count: monthlyUsers, color: 'text-amber-500' },
    { label: 'ប្រចាំឆ្នាំ', count: yearlyUsers, color: 'text-rose-500' },
  ];

  const cats = locations.reduce((acc, l) => { acc[l.category] = (acc[l.category]||0)+1; return acc; }, {});
  const chartColors = ['bg-[#10b981]', 'bg-[#3b82f6]', 'bg-[#6366f1]', 'bg-[#f43f5e]', 'bg-[#f59e0b]', 'bg-[#8b5cf6]', 'bg-[#06b6d4]'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-xl font-bold flex items-center gap-2">របាយការណ៍</h1>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
         {stats.map((s, i) => (
           <div key={i} className="glass-panel p-4 rounded-[1.5rem] soft-shadow text-center">
              <p className="text-[10px] font-bold text-slate-500 mb-1">{s.label}</p>
              <h3 className={`text-2xl font-black ${s.color}`}>{s.count}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-[1.5rem] soft-shadow">
           <h3 className="text-xs font-bold mb-4">ស្ថិតិទីតាំង (រង្វង់ភាគរយ)</h3>
           <div className="space-y-3">
             {Object.keys(cats).length === 0 ? <p className="text-xs font-bold text-slate-500">គ្មានទិន្នន័យ (0%)</p> : Object.entries(cats).map(([name, count], i) => {
               const pct = totalUsers > 0 ? Math.round((count/Math.max(locations.length, 1))*100) : 0;
               return (
                 <div key={name}>
                   <div className="flex justify-between text-[10px] font-bold mb-1"><span>{name}</span><span>{pct}%</span></div>
                   <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className={`h-full ${chartColors[i%7]} rounded-full`} style={{width:`${pct}%`}}></div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="glass-panel p-5 rounded-[1.5rem] soft-shadow flex flex-col justify-between">
           <h3 className="text-xs font-bold mb-4">ស្ថិតិសកម្មភាពអ្នកប្រើប្រាស់ (Line & Bar)</h3>
           <div className="flex-1 flex items-end gap-4 h-24 border-b border-l border-slate-200 dark:border-slate-700 pl-2 pb-2 relative mt-4">
               {[
                   {label: 'សប្តាហ៍', pct: totalUsers ? Math.round((weeklyUsers/totalUsers)*100) : 0},
                   {label: 'ខែ', pct: totalUsers ? Math.round((monthlyUsers/totalUsers)*100) : 0},
                   {label: 'ឆ្នាំ', pct: totalUsers ? Math.round((yearlyUsers/totalUsers)*100) : 0}
               ].map((d, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1">
                       <div className="w-full max-w-[20px] bg-theme/80 rounded-t-[4px] relative transition-all" style={{height: `${Math.max(d.pct, 5)}%`}}>
                           <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold">{d.pct}%</div>
                       </div>
                       <span className="text-[9px] text-slate-500 mt-1">{d.label}</span>
                   </div>
               ))}
           </div>
        </div>
      </div>
      
      <div className="glass-panel p-5 rounded-[1.5rem] soft-shadow">
           <h3 className="text-xs font-bold mb-3">ទិន្នន័យទើបបញ្ចូលថ្មី</h3>
           <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
             {locations.slice(-5).reverse().map(l => (
               <div key={l.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="font-bold text-[11px] truncate w-2/3">{l.title}</span>
                  <span className="text-[9px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">{new Date(l.timestamp||Date.now()).toLocaleString('km-KH')}</span>
               </div>
             ))}
           </div>
      </div>

      <div className="pt-2 flex justify-center pb-4">
        {editFooter ? (
          <div className="flex gap-2">
            <input type="text" value={footerText} onChange={e=>setFooterText(e.target.value)} className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 outline-none w-48" />
            <button onClick={()=>setEditFooter(false)} className="bg-theme text-white px-3 py-1.5 rounded-lg text-xs font-bold">Save</button>
          </div>
        ) : (
          <p onClick={()=>setEditFooter(true)} className="text-[9px] text-slate-400 font-bold cursor-pointer hover:text-theme transition">© {footerText}</p>
        )}
      </div>
    </div>
  );
};

// --- View: Chat ---
const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView, isAdmin }) => {
  const [msgText, setMsgText] = useState('');
  const [activeTarget, setActiveTarget] = useState('Admin');
  const messagesEndRef = useRef(null);
  const targets = ['Admin', 'Village Chief', 'Commune Chief', 'Police'];

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
      if(chats.length > 0 && chats[chats.length-1].userId !== user?.uid) playPingSound();
  }, [chats]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!profile.username) { showToast('សូមបង្កើតឈ្មោះក្នុងគណនីសិន', 'error'); setCurrentView('account'); return; }
    if (!msgText.trim()) return;
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {
      text: msgText, target: activeTarget, userId: user.uid, userName: profile.username, timestamp: Date.now()
    });
    setMsgText('');
  };

  const filteredChats = chats.filter(c => {
    if (isAdmin) return c.target === activeTarget; 
    return c.userId === user?.uid && c.target === activeTarget; 
  });

  if (!profile.username) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in py-10">
         <div className="w-20 h-20 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-4"><MessageCircle className="w-10 h-10" /></div>
         <h2 className="text-xl font-bold mb-2">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-sm mb-6 max-w-xs font-medium">សូមបង្កើតឈ្មោះរបស់អ្នកជាមុនសិន ទើបអាចចូលទៅកាន់ប្រព័ន្ធផ្ញើសារបាន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme hover:opacity-90 text-white px-6 py-3 rounded-full font-bold text-sm shadow-md">ទៅកំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] glass-panel rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-theme text-white flex items-center justify-center font-bold text-xs shrink-0">TP</div>
            <div>
                <h2 className="font-bold text-sm">Chat TP</h2>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> User ↔ {activeTarget}
                </div>
            </div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {targets.map(t => (
                <button key={t} onClick={() => setActiveTarget(t)} className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${activeTarget === t ? 'bg-theme text-white shadow-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{t}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50 dark:bg-slate-900/30">
        {filteredChats.length === 0 ? <p className="text-center text-slate-400 py-10 text-xs font-bold">មិនទាន់មានសារទេ</p> : 
          filteredChats.map(msg => {
            const isMe = msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[9px] font-bold text-slate-500 ml-2">{msg.userName}</span>}
                  <div className={`px-4 py-2.5 rounded-[1.2rem] text-sm font-medium ${isMe ? 'bg-theme text-white rounded-br-sm shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="វាយសាររបស់អ្នក..." className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-theme" />
          <button type="submit" disabled={!msgText.trim()} className="w-10 h-10 rounded-full bg-theme text-white flex items-center justify-center disabled:opacity-50 shrink-0 shadow-sm"><Send className="w-4 h-4 ml-0.5" /></button>
        </form>
      </div>
    </div>
  );
};

// --- View: Account ---
const AccountView = ({ user, profile, db, appId, showToast, themeColor, setThemeColor, theme, setTheme, setCurrentPage, setIsAdmin }) => {
  const [pwd, setPwd] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [localName, setLocalName] = useState(profile.username || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const tColors = ['#0f766e', '#4f46e5', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#0f3460']; // Added #0f3460 to match mockup

  const handleAdminLogin = async () => {
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true); 
      showToast('ចូលប្រើជា Admin ជោគជ័យ');
      setShowAdminLogin(false);
      setPwd('');
    } else {
      showToast('លេខសម្ងាត់ខុស', 'error');
      const info = getDeviceInfo();
      let ipAddr = 'Unknown';
      try { const res = await fetch('https://api.ipify.org?format=json'); const data = await res.json(); ipAddr = data.ip; } catch(e) {}
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), {
         username: profile.username || 'Anonymous', ...info, ip: ipAddr, timestamp: Date.now()
      });
      setPwd('');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="glass-panel p-5 md:p-8 rounded-[2rem] flex flex-col items-center soft-shadow">
        <h1 className="text-lg font-bold mb-4 w-full text-left">គណនី</h1>
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden border-[3px] border-theme relative group shadow-sm">
             <img src={profile.avatar} className="w-full h-full object-cover" alt="av"/>
             <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Edit3 className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{avatar:r.result}); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
        </div>
        <div className="w-full space-y-1">
           <label className="text-[10px] font-bold text-slate-500 pl-1">ឈ្មោះអ្នកប្រើប្រាស់</label>
           <div className="flex gap-2">
               <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-theme" placeholder="កំណត់ឈ្មោះ..."/>
               <button onClick={()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{username: localName})} className="bg-theme text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm">Save</button>
           </div>
        </div>
      </div>

      <div className="glass-panel p-5 md:p-8 rounded-[2rem] soft-shadow space-y-3">
         <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300"><Settings className="w-4 h-4"/> ការកំណត់</h2>
         
         <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-xs">Dark Mode</span>
            <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5"/> : <Sun className="w-3.5 h-3.5"/>}
            </button>
         </div>

         <div className="relative flex flex-col p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 gap-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowColorPicker(!showColorPicker)}>
               <span className="font-bold text-xs">ប្តូរពណ៌ (Theme Color)</span>
               <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{backgroundColor: themeColor}}></div>
            </div>
            {showColorPicker && (
               <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 justify-center animate-in slide-in-from-top-2">
                 {tColors.map(c => <button key={c} onClick={()=>setThemeColor(c)} className={`w-6 h-6 rounded-full shadow-sm transition-transform ${themeColor===c?'ring-2 ring-slate-400 scale-110':'hover:scale-110'}`} style={{backgroundColor: c}}></button>)}
               </div>
            )}
         </div>

         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setShowAdminLogin(true)} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs hover:bg-slate-100 transition">
               <ShieldAlert className="w-3.5 h-3.5"/> កិច្ចការរដ្ឋបាល (Admin Only)
            </button>
         </div>
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in bg-slate-900/60 backdrop-blur-sm">
           <div className="relative w-full max-w-xs mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 soft-shadow border border-slate-200 dark:border-slate-700 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert className="w-6 h-6 text-slate-500"/></div>
              <h3 className="text-base font-bold mb-4">តម្រូវអោយផ្ទៀងផ្ទាត់</h3>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password..." className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 text-center tracking-widest outline-none font-bold border border-slate-200 dark:border-slate-700 text-sm focus:border-slate-400"/>
              <div className="flex gap-2">
                <button onClick={() => setShowAdminLogin(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold text-xs">បោះបង់</button>
                <button onClick={handleAdminLogin} className="flex-1 bg-slate-800 dark:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-xs">ចូល</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- View: Admin Dashboard (Secure Layout) ---
const AdminDashboard = ({ locations, pendingLocations, usersList, cyberLogs, chats, db, appId, showToast, setCurrentView, profile, user, setIsAdmin }) => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [monitoringUser, setMonitoringUser] = useState(null);
  const [editingLoc, setEditingLoc] = useState(null);
  
  const handleApprove = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', id), { status: 'approved' });
    showToast('អនុម័តជោគជ័យ ✅');
  };
  const handleReject = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', id));
    showToast('លុបចោលរួចរាល់ ❌', 'error');
  };
  const clearLog = async (id = null) => {
    if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
    else cyberLogs.forEach(async l => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)));
  };
  
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setCurrentView('account');
    showToast('ចាកចេញពី Admin រួចរាល់');
  };

  const handleEditSave = async (e) => {
      e.preventDefault();
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', editingLoc.id), editingLoc);
      setEditingLoc(null);
      showToast('កែប្រែទិន្នន័យជោគជ័យ ✅');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto">
      {/* Admin Header strictly separate */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 text-white p-5 md:p-6 rounded-[2rem] shadow-lg">
        <div>
           <h1 className="text-lg md:text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400"/> Admin Control Panel</h1>
           <p className="text-[10px] text-slate-400 mt-1">គ្រប់គ្រងប្រព័ន្ធផ្តាច់មុខ</p>
        </div>
        <button onClick={handleAdminLogout} className="mt-4 sm:mt-0 px-4 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2 transition"><LogOut className="w-4 h-4"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[
          {id: 'approvals', label: 'អនុម័តសំណើរ'}, {id: 'data', label: 'ទិន្នន័យរួម'}, {id: 'monitor', label: 'តាមដានសកម្មភាព'}, {id: 'security', label: 'សុវត្ថិភាពប្រព័ន្ធ'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === t.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'approvals' && (
        <div className="glass-panel p-4 md:p-6 rounded-2xl">
           <h3 className="font-bold text-sm mb-4">សំណើររង់ចាំ ({pendingLocations.length})</h3>
           <div className="space-y-3">
             {pendingLocations.length === 0 ? <p className="text-xs text-slate-500 font-bold text-center py-10">គ្មានសំណើរថ្មី</p> : 
               pendingLocations.map(loc => (
                 <div key={loc.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <img src={loc.image} className="w-14 h-14 object-cover rounded-lg bg-slate-200 shrink-0" alt="loc"/>
                      <div className="flex-1">
                        <p className="font-bold text-xs">{loc.title}</p>
                        <p className="text-[9px] text-slate-500 font-bold mb-1">ស្ថាប័ន: {loc.institution}</p>
                        <p className="text-[9px] text-slate-500">អ្នកស្នើ: {loc.author}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={()=>handleApprove(loc.id)} className="flex-1 md:flex-none bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> ព្រម</button>
                      <button onClick={()=>handleReject(loc.id)} className="flex-1 md:flex-none bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5"/> បដិសេធ</button>
                    </div>
                 </div>
               ))
             }
           </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="glass-panel p-4 md:p-5 rounded-2xl">
              <h3 className="font-bold mb-3 text-xs text-theme">រតនមណ្ឌល (Data)</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').length === 0 ? <p className="text-[10px] text-slate-500 font-bold text-center py-4">គ្មាន</p> :
                  locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').map(l => (
                    <div key={l.id} className="p-2.5 flex justify-between items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div><span className="font-bold block text-[11px] truncate w-40">{l.title}</span><span className="text-[9px] text-slate-500">ឃុំ {l.commune} • ភូមិ {l.village}</span></div>
                      <div className="flex gap-1.5">
                          <button onClick={()=>setEditingLoc(l)} className="p-1 bg-amber-50 text-amber-500 rounded hover:bg-amber-100"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>handleReject(l.id)} className="p-1 bg-rose-50 text-rose-500 rounded hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  ))
                }
              </div>
           </div>

           <div className="glass-panel p-4 md:p-5 rounded-2xl">
              <h3 className="font-bold mb-3 text-xs text-slate-700 dark:text-slate-300">ស្រុកផ្សេងៗ (Data)</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').length === 0 ? <p className="text-[10px] text-slate-500 font-bold text-center py-4">គ្មាន</p> :
                  locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').map(l => (
                    <div key={l.id} className="p-2.5 flex justify-between items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div><span className="font-bold block text-[11px] truncate w-40">{l.title}</span><span className="text-[9px] text-slate-500">{l.province} • {l.district}</span></div>
                      <div className="flex gap-1.5">
                          <button onClick={()=>setEditingLoc(l)} className="p-1 bg-amber-50 text-amber-500 rounded hover:bg-amber-100"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>handleReject(l.id)} className="p-1 bg-rose-50 text-rose-500 rounded hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  ))
                }
              </div>
           </div>

           {editingLoc && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                 <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold mb-4">កែប្រែទិន្នន័យ (Admin)</h3>
                    <form onSubmit={handleEditSave} className="space-y-2.5">
                       <input value={editingLoc.title} onChange={e=>setEditingLoc({...editingLoc, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-slate-400" placeholder="ឈ្មោះទីតាំង"/>
                       <input value={editingLoc.institution} onChange={e=>setEditingLoc({...editingLoc, institution: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-slate-400" placeholder="ស្ថាប័ន"/>
                       <input value={editingLoc.phone} onChange={e=>setEditingLoc({...editingLoc, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-slate-400" placeholder="លេខទូរស័ព្ទ"/>
                       <textarea value={editingLoc.desc} onChange={e=>setEditingLoc({...editingLoc, desc: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs font-medium h-16 outline-none focus:border-slate-400" placeholder="ការពិពណ៌នា..."></textarea>
                       <div className="flex gap-2 pt-2">
                           <button type="button" onClick={()=>setEditingLoc(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 rounded-lg font-bold text-xs">បោះបង់</button>
                           <button type="submit" className="flex-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-2.5 rounded-lg font-bold text-xs">រក្សាទុក</button>
                       </div>
                    </form>
                 </div>
              </div>
           )}
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="glass-panel p-4 md:p-6 rounded-2xl">
           <h3 className="font-bold mb-4 text-sm">តាមដានសកម្មភាព User (Live)</h3>
           <div className="space-y-2">
             {usersList.length === 0 ? <p className="text-xs font-bold text-slate-500">គ្មាន User ទេ</p> : 
               usersList.map(u => (
                 <div key={u.id} onClick={()=>setMonitoringUser(u)} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer flex justify-between items-center border border-slate-100 dark:border-slate-700 hover:border-slate-300 transition">
                   <span className="font-bold text-xs">{u.username || u.uid.substring(0,6)}</span>
                   <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Online</span>
                 </div>
               ))
             }
           </div>
           {monitoringUser && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[60vh] border border-slate-200 dark:border-slate-700">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-xs">ប្រវត្តិឆាត: {monitoringUser.username}</span>
                    <button onClick={()=>setMonitoringUser(null)} className="p-1 bg-white dark:bg-slate-700 rounded-full"><XCircle className="w-4 h-4 text-slate-500"/></button>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                    {chats.filter(c => c.userId === monitoringUser.uid).length === 0 ? <p className="text-[10px] font-bold text-center text-slate-400 py-10">គ្មានសារ</p> : 
                      chats.filter(c => c.userId === monitoringUser.uid).map(msg => (
                        <div key={msg.id} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] shadow-sm">
                          <p className="font-bold text-slate-400 mb-0.5">To: {msg.target}</p>
                          <p className="font-medium text-slate-700 dark:text-slate-300">{msg.text}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-panel p-4 md:p-6 rounded-2xl">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-sm">សុវត្ថិភាពប្រព័ន្ធ (Security Logs)</h3>
             <button onClick={()=>clearLog()} className="text-[9px] bg-rose-100 text-rose-600 px-2 py-1 rounded font-bold shadow-sm">Clear All</button>
           </div>
           <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
             {cyberLogs.length === 0 ? <p className="text-xs font-bold text-slate-500 py-10 text-center">គ្មានទិន្នន័យការលួចចូលទេ (Safe 100%)</p> : 
               cyberLogs.map(l => (
                 <div key={l.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] relative shadow-sm">
                    <p className="font-bold text-rose-500 mb-0.5 text-xs">{l.username}</p>
                    <div className="flex flex-col gap-0.5 text-slate-500 font-medium">
                        <span>{l.device} ({l.type})</span>
                        <span className="font-mono">IP: {l.ip}</span>
                        <span className="text-[8px] mt-1 opacity-70">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                    <button onClick={()=>clearLog(l.id)} className="absolute top-2 right-2 p-1.5 bg-rose-50 text-rose-500 rounded font-bold">Remove</button>
                 </div>
               ))
             }
           </div>
        </div>
      )}
    </div>
  );
};

// --- Reusable Components ---
const LocationCard = ({ location, isFavorite, onToggleFavorite, onClick }) => {
  return (
    <div onClick={onClick} className="glass-panel group rounded-[1.2rem] overflow-hidden cursor-pointer soft-shadow hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col h-full bg-white dark:bg-slate-800/80 relative">
      <div className="relative h-36 overflow-hidden shrink-0">
        <img src={location.image} alt={location.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-slate-100 dark:bg-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-2 left-3 right-3 text-white">
          <h3 className="font-bold text-xs line-clamp-1">{location.title}</h3>
          <p className="text-[9px] text-slate-300 line-clamp-1 font-bold">{location.province || ''} {location.district || ''}</p>
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-white text-[8px] font-bold">{location.category}</span>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[9px] text-slate-500 line-clamp-2 flex-1 mb-2 font-medium leading-relaxed">{location.desc}</p>
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-2 mt-auto">
           <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`flex items-center gap-1 text-[10px] font-bold ${isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}>
             <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} /> {location.likes || 0}
           </button>
        </div>
      </div>
    </div>
  );
};

const LocationDetailModal = ({ location, onClose, favorites, toggleFavorite }) => {
  const isFav = !!favorites[location.id];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden soft-shadow max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
        <div className="relative h-40 shrink-0">
          <img src={location.image} alt={location.title} className="w-full h-full object-cover bg-slate-200" />
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 transition-colors rounded-full text-white"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-3">
             <div>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] rounded font-bold border border-slate-200 dark:border-slate-700">{location.category}</span>
                <h2 className="text-base font-bold mt-1.5 leading-tight">{location.title}</h2>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{location.institution}</p>
             </div>
             <button onClick={() => toggleFavorite(location.id)} className={`p-2 rounded-full border ${isFav ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}><Heart className={`w-4 h-4 ${isFav ? 'fill-current':''}`}/></button>
          </div>
          <div className="flex gap-2 mb-3">
             {location.phone && <a href={`tel:${location.phone}`} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2 rounded-xl flex items-center justify-center gap-1 font-bold text-[9px]"><Phone className="w-3 h-3"/> {location.phone}</a>}
             {location.mapUrl && <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-theme/10 text-theme border border-theme/20 py-2 rounded-xl flex items-center justify-center gap-1 font-bold text-[9px]"><Navigation className="w-3 h-3"/> ផែនទី</a>}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
             <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{location.desc || 'មិនមានការពិពណ៌នា...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};