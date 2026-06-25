import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Moon, Sun, Plus, MoreVertical, 
  CheckCircle, XCircle, Trash2, Edit3, Image as ImageIcon, Send, Filter,
  LogOut, Settings, Activity, Users, MapPin, TrendingUp, Phone, Navigation, ShieldAlert, PieChart, BarChart, Eye, LayoutGrid, Monitor, Smartphone, Globe, ChevronDown, ArrowLeft
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
    .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.4); }
    .dark .glass-panel { background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.05); }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .soft-shadow { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); }
    .dark .soft-shadow { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); }
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
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Strictly Local State
  const [appLogo, setAppLogo] = useState('logo.png'); 
  
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

  // --- GATEWAY PAGE 1 (Mobile Responsive) ---
  if (currentPage === 'gateway') {
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 md:p-12 text-white font-khmer overflow-y-auto bg-slate-950`}>
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img src="back.png" alt="Background" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
        </div>

        {/* Top: Logo & Title */}
        <div className="relative z-10 flex flex-col items-center mt-8 md:mt-16 w-full animate-in fade-in slide-in-from-top-8 duration-700">
          {/* [CHANGE_IMAGE_HERE_3]: Logo Center Page 1 */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-slate-800 border-4 border-slate-700 shadow-2xl mb-4 overflow-hidden shrink-0">
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-wider text-white drop-shadow-lg text-center">Khmer TP</h1>
        </div>
        
        {/* Bottom: Description & Button */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl mb-4 md:mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <p className="text-center text-slate-300 mb-8 leading-relaxed text-sm font-medium">
            ប្រព័ន្ធរុករកទិន្នន័យ និងសម្របសម្រួលទំនាក់ទំនងក្នុងគ្រាអាសន្ន។ បង្កើតឡើងដើម្បីផ្តល់ភាពងាយស្រួលដល់ប្រជាពលរដ្ឋក្នុងការទាក់ទងមេភូមិ ឃុំ ប៉ុស្តិ៍នគរបាល និងមន្ទីរពេទ្យដោយផ្ទាល់។
          </p>
          <button onClick={() => setCurrentPage('app')} className="bg-theme text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 text-base w-full justify-center">
            អនុញ្ញាតឲ្យខ្លួនឯងចូលប្រើប្រាស់
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP PAGE 2 ---
  return (
    <div className={`min-h-screen font-khmer transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen flex selection:bg-theme selection:text-white">
        
        {toast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5">
            <div className={`px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {toast.type === 'error' ? <XCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {toast.msg}
            </div>
          </div>
        )}

        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} setAppLogo={setAppLogo} setCurrentPage={setCurrentPage} />

        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <TopBar theme={theme} toggleTheme={toggleTheme} searchQuery={searchQuery} setSearchQuery={setSearchQuery} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} notifications={notifications} appLogo={appLogo} setAppLogo={setAppLogo} db={db} appId={appId} showToast={showToast} user={user} setCurrentPage={setCurrentPage} />

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            {currentView === 'home' && <HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} />}
            {currentView === 'data' && <DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} />}
            {currentView === 'reports' && <ReportsView locations={approvedLocations} usersList={usersList} />}
            {currentView === 'chat' && <ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} />}
            {currentView === 'account' && <AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} themeColor={themeColor} setThemeColor={setThemeColor} theme={theme} setTheme={setTheme} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />}
            {currentView === 'admin' && isAdmin && <AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} profile={profile} user={user} setIsAdmin={setIsAdmin} />}
          </div>
          
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />
        </main>

        {selectedLocation && <LocationDetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} favorites={favorites} toggleFavorite={toggleFavorite} />}
      </div>
    </div>
  );
}

// ==========================================
// VIEWS & COMPONENTS
// ==========================================

const Sidebar = ({ currentView, setCurrentView, isAdmin, appLogo, setAppLogo, setCurrentPage }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម' },
    { id: 'data', icon: Map, label: 'ទិន្នន័យ' },
    { id: 'reports', icon: TrendingUp, label: 'របាយការណ៍' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'account', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'អ្នកគ្រប់គ្រង' });

  return (
    <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-200 dark:border-slate-800 z-10">
      <div className="p-6 flex items-center gap-3">
        <label className="cursor-pointer relative group shrink-0">
          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[10px] group-hover:opacity-50 transition" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) { const r = new FileReader(); r.onload = () => setAppLogo(r.result); r.readAsDataURL(e.target.files[0]); } }} />
        </label>
        <div>
          <h1 className="font-bold text-xl text-theme">Khmer TP</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">ស្វែងយល់ពីកម្ពុជា</p>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-4 px-3 uppercase tracking-wider">ម៉ឺនុយ</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${currentView === item.id ? 'bg-theme text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <item.icon className={`w-5 h-5 transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
            <div className="font-medium text-sm">{item.label}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const BottomNav = ({ currentView, setCurrentView, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម' },
    { id: 'data', icon: Map, label: 'ទិន្នន័យ' },
    { id: 'reports', icon: TrendingUp, label: 'របាយការណ៍' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'account', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${currentView === item.id ? 'text-theme' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200'}`}>
            <item.icon className={`w-5 h-5 mb-1 transition-transform duration-300 ${currentView === item.id ? 'scale-110 stroke-[2.5px]' : ''}`} />
            <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen, notifications, appLogo, setAppLogo, db, appId, showToast, user, setCurrentPage }) => {
  return (
    <header className="px-4 py-3 md:px-8 glass-panel sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
      {/* Mobile Back & Brand */}
      <div className="md:hidden flex items-center gap-2 shrink-0">
        <button onClick={()=>setCurrentPage('gateway')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><ArrowLeft className="w-4 h-4"/></button>
        <label className="cursor-pointer relative">
          <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center p-0.5 border border-slate-300 dark:border-slate-700">
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[6px]" />
          </div>
        </label>
      </div>

      {/* Desktop Back */}
      <button onClick={()=>setCurrentPage('gateway')} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-500 transition shrink-0">
         <ArrowLeft className="w-4 h-4"/> ត្រឡប់
      </button>

      {/* Search Bar - Optimized for Mobile */}
      <div className="flex-1 w-full max-w-xl relative group px-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-theme transition-colors" />
        <input 
          type="text" placeholder="ស្វែងរកទីតាំង..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-full py-2.5 pl-9 pr-4 outline-none border border-transparent focus:border-theme/30 focus:ring-2 focus:ring-theme/10 transition-all text-sm font-medium"
        />
      </div>

      <div className="flex items-center gap-2 relative shrink-0">
        <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative">
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 relative">
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
          </button>
          
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-panel soft-shadow rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
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
      </div>
    </header>
  );
};

// --- View: Home ---
const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation }) => {
  const filtered = locations.filter(l => l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-[2rem] overflow-hidden h-[200px] md:h-[350px] soft-shadow group bg-slate-800">
        <img src="back.png" alt="Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h1 className="text-base md:text-2xl font-bold text-white mb-1 leading-tight drop-shadow-md">
             ស្វែងរកទិន្នន័យសំខាន់ៗសម្រាប់ទាក់ទងពេលមានអាសន្ន!
          </h1>
          <span className="text-[10px] md:text-sm text-yellow-400 font-medium italic block">Search for critical data for emergency contacts!</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 border-l-4 border-theme pl-3">
             ទីតាំងសំខាន់ៗដែលបានដាក់បញ្ចូល
          </h2>
        </div>

        {filtered.length === 0 ? (
           <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 font-bold">គ្មានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { title: 'សំណើថ្មី', msg: `មានសំណើពី ${profile.username}`, type: 'info', timestamp: Date.now() });
        showToast('រាល់សំណើររបស់អ្នកនឹងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យពីផ្នែករដ្ឋបាលសិន ដើម្បីបញ្ជាក់ថាទិន្នន័យរបស់អ្នកពិត ឬក្លែងក្លាយ។ សូមរង់ចាំដោយក្តីអនុគ្រោះ! ⏳', 'success');
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូនទិន្នន័យ', 'error'); }
    setLoading(false);
  };

  if (!profile.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-300 py-20">
         <div className="w-24 h-24 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-6 shadow-inner"><User className="w-12 h-12" /></div>
         <h2 className="text-2xl font-bold mb-3">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-8 max-w-md">សូមចូលទៅកាន់គណនី (Account) ដើម្បីកំណត់ឈ្មោះរបស់អ្នកជាមុនសិន ទើបអ្នកអាចចូលប្រើប្រាស់មុខងារទិន្នន័យនេះបាន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme hover:opacity-90 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2">
            <User className="w-5 h-5"/> ទៅកំណត់ឈ្មោះឥឡូវនេះ
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
             <h1 className="text-2xl font-bold flex items-center gap-2">ទិន្នន័យ</h1>
             <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-theme shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
                ))}
             </div>
         </div>
         <button onClick={handleOpenAdd} className="w-full md:w-auto bg-theme text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"><Plus className="w-5 h-5"/> បន្ថែមទីតាំង</button>
      </div>

      <div className="flex items-center gap-2 p-1 overflow-x-auto hide-scrollbar">
        {['ទាំងអស់', 'ស្រុក', 'ឃុំ', 'ភូមិ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeFilter === cat ? 'bg-theme text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? <p className="col-span-full text-center text-slate-500 py-10 font-bold">គ្មានទិន្នន័យ</p> : 
          filtered.map((loc, i) => (
             <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} index={i} isAdmin={false} />
          ))
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden soft-shadow max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-theme">បន្ថែមទិន្នន័យក្នុង {activeTab}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-500 rounded-full"><XCircle className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ប្រភេទ</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-theme font-bold">
                      <option value="សាលារៀន">សាលារៀន</option><option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option><option value="ប៉ុស្តិ៍ប៉ូលិស">ប៉ុស្តិ៍ប៉ូលិស</option>
                      <option value="មេភូមិ">មេភូមិ</option><option value="មេឃុំ">មេឃុំ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ឈ្មោះ (Name)</label>
                    <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-theme font-bold" />
                  </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ឈ្មោះស្ថាប័ន</label>
                    <input type="text" required value={form.institution} onChange={e=>setForm({...form, institution: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-theme font-bold" />
                </div>

                {activeTab === 'រតនមណ្ឌល' ? (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ឃុំ</label>
                            <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none font-bold">
                                <option value="">ជ្រើសរើស</option>
                                {Object.keys(REGIONS["រតនមណ្ឌល"] || {}).map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ភូមិ</label>
                            <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none font-bold">
                                <option value="">ជ្រើសរើស</option>
                                {form.commune && REGIONS["រតនមណ្ឌល"][form.commune] && REGIONS["រតនមណ្ឌល"][form.commune].map(v=><option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ខេត្ត</label>
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none font-bold" placeholder="វាយបញ្ចូល..."/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ស្រុក/ខណ្ឌ</label>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none font-bold" placeholder="វាយបញ្ចូល..."/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ឃុំ (ជម្រើស)</label>
                            <input type="text" value={form.commune} onChange={e=>setForm({...form, commune: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none font-bold" placeholder="វាយបញ្ចូល..."/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ភូមិ (ជម្រើស)</label>
                            <input type="text" value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none font-bold" placeholder="វាយបញ្ចូល..."/>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div><input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-theme font-bold" placeholder="លេខទូរស័ព្ទ..." /></div>
                  <div><input type="url" value={form.mapUrl} onChange={e=>setForm({...form, mapUrl: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-theme font-bold" placeholder="Google Map Link..." /></div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">រូបភាព (Upload Picture) *</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 relative overflow-hidden transition-colors">
                     {form.image ? (
                        <>
                           <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full text-xs">ប្តូររូបភាព</span></div>
                        </>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                           <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                           <span className="text-sm font-bold">ចុចដើម្បី Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="hidden" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>

                <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="ការពណ៌នា..." className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-theme h-20 resize-none font-bold"></textarea>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
               <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition">បោះបង់</button>
               <button type="submit" form="addForm" disabled={loading} className="px-5 py-2.5 rounded-xl font-bold bg-theme text-white hover:opacity-90 disabled:opacity-50 transition shadow-md">ផ្ញើរសំណើរ (Admin)</button>
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold flex items-center gap-2"><PieChart className="w-6 h-6 text-theme" /> របាយការណ៍</h1>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {stats.map((s, i) => (
           <div key={i} className="glass-panel p-5 rounded-2xl soft-shadow border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[11px] font-bold text-slate-500 mb-1">{s.label}</p>
              <h3 className={`text-3xl font-black ${s.color}`}>{s.count}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl soft-shadow border border-slate-200 dark:border-slate-800">
           <h3 className="text-sm font-bold mb-4">ស្ថិតិទីតាំង (រង្វង់ភាគរយ)</h3>
           <div className="space-y-4">
             {Object.keys(cats).length === 0 ? <p className="text-xs font-bold text-slate-500">គ្មានទិន្នន័យ (0%)</p> : Object.entries(cats).map(([name, count], i) => {
               const pct = totalUsers > 0 ? Math.round((count/Math.max(locations.length, 1))*100) : 0;
               return (
                 <div key={name}>
                   <div className="flex justify-between text-[10px] font-bold mb-1"><span>{name}</span><span>{pct}%</span></div>
                   <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className={`h-full ${chartColors[i%7]} rounded-full`} style={{width:`${pct}%`}}></div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl soft-shadow border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
           <h3 className="text-sm font-bold mb-4">ស្ថិតិសកម្មភាពអ្នកប្រើប្រាស់ (Line & Bar)</h3>
           <div className="flex-1 flex items-end gap-4 h-32 border-b border-l border-slate-200 dark:border-slate-700 pl-2 pb-2 relative mt-4">
               {[
                   {label: 'សប្តាហ៍', pct: totalUsers ? Math.round((weeklyUsers/totalUsers)*100) : 0},
                   {label: 'ខែ', pct: totalUsers ? Math.round((monthlyUsers/totalUsers)*100) : 0},
                   {label: 'ឆ្នាំ', pct: totalUsers ? Math.round((yearlyUsers/totalUsers)*100) : 0}
               ].map((d, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1">
                       <div className="w-full max-w-[30px] bg-theme/80 rounded-t-sm relative transition-all" style={{height: `${Math.max(d.pct, 5)}%`}}>
                           <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold">{d.pct}%</div>
                       </div>
                       <span className="text-[10px] text-slate-500 mt-1">{d.label}</span>
                   </div>
               ))}
           </div>
        </div>
      </div>
      
      <div className="glass-panel p-6 rounded-3xl soft-shadow border border-slate-200 dark:border-slate-800">
           <h3 className="text-sm font-bold mb-4">ទិន្នន័យទើបបញ្ចូលថ្មី</h3>
           <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
             {locations.slice(-5).reverse().map(l => (
               <div key={l.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="font-bold text-xs truncate">{l.title}</span>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{new Date(l.timestamp||Date.now()).toLocaleString('km-KH')}</span>
               </div>
             ))}
           </div>
      </div>

      <div className="pt-4 flex justify-center pb-6">
        {editFooter ? (
          <div className="flex gap-2">
            <input type="text" value={footerText} onChange={e=>setFooterText(e.target.value)} className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 outline-none w-48" />
            <button onClick={()=>setEditFooter(false)} className="bg-theme text-white px-3 py-1.5 rounded-lg text-xs font-bold">Save</button>
          </div>
        ) : (
          <p onClick={()=>setEditFooter(true)} className="text-[10px] text-slate-400 font-bold cursor-pointer hover:text-theme transition">© {footerText}</p>
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
      <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in py-20">
         <div className="w-24 h-24 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-6 shadow-inner"><MessageCircle className="w-12 h-12" /></div>
         <h2 className="text-2xl font-bold mb-3">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-8 max-w-md font-bold">សូមបង្កើតឈ្មោះរបស់អ្នកជាមុនសិន ទើបអាចចូលទៅកាន់ប្រព័ន្ធផ្ញើសារបាន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme hover:opacity-90 text-white px-8 py-3.5 rounded-xl font-bold">ទៅកំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] glass-panel rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden soft-shadow">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-theme text-white flex items-center justify-center font-bold">TP</div>
            <div>
                <h2 className="font-bold text-sm">Chat TP</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> User ↔ {activeTarget}
                </div>
            </div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {targets.map(t => (
                <button key={t} onClick={() => setActiveTarget(t)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTarget === t ? 'bg-theme text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{t}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
        {filteredChats.length === 0 ? <p className="text-center text-slate-400 py-10 font-bold">មិនទាន់មានសារទេ</p> : 
          filteredChats.map(msg => {
            const isMe = msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-500 ml-2">{msg.userName}</span>}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm font-bold ${isMe ? 'bg-theme text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700'}`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="វាយសាររបស់អ្នក..." className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-theme" />
          <button type="submit" disabled={!msgText.trim()} className="w-12 h-12 rounded-full bg-theme text-white flex items-center justify-center disabled:opacity-50"><Send className="w-5 h-5 ml-1" /></button>
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
  const tColors = ['#4f46e5', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const handleAdminLogin = async () => {
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true); 
      showToast('ចូលប្រើជា Admin ជោគជ័យ');
      setShowAdminLogin(false);
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
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="glass-panel p-6 rounded-[2rem] flex flex-col items-center soft-shadow border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold mb-4 w-full text-left">គណនី</h1>
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 mb-4 overflow-hidden border-2 border-theme relative group">
             <img src={profile.avatar} className="w-full h-full object-cover" alt="av"/>
             <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Edit3 className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{avatar:r.result}); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
        </div>
        <div className="w-full space-y-2">
           <label className="text-xs font-bold text-slate-500">ឈ្មោះ</label>
           <div className="flex gap-2">
               <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 bg-slate-100 dark:bg-slate-800 border-none px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-theme" />
               <button onClick={()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{username: localName})} className="bg-theme text-white px-4 py-2.5 rounded-xl text-sm font-bold">Save</button>
           </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[2rem] soft-shadow border border-slate-200 dark:border-slate-800 space-y-3">
         <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Settings className="w-4 h-4"/> ការកំណត់</h2>
         
         <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-sm">Dark Mode</span>
            <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
              {theme === 'dark' ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>}
            </button>
         </div>

         <div className="relative flex flex-col p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 gap-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowColorPicker(!showColorPicker)}>
               <span className="font-bold text-sm">ប្តូរពណ៌ (Theme Color)</span>
               <div className="w-6 h-6 rounded-full border border-slate-300" style={{backgroundColor: themeColor}}></div>
               <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            {showColorPicker && (
               <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 justify-center animate-in slide-in-from-top-2">
                 {tColors.map(c => <button key={c} onClick={()=>setThemeColor(c)} className={`w-8 h-8 rounded-full shadow-sm transition-transform ${themeColor===c?'ring-2 ring-slate-400 scale-110':'hover:scale-110'}`} style={{backgroundColor: c}}></button>)}
               </div>
            )}
         </div>

         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setShowAdminLogin(true)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
               <ShieldAlert className="w-4 h-4"/> កិច្ចការរដ្ឋបាល (Admin)
            </button>
         </div>
         
         <button onClick={() => setCurrentPage('gateway')} className="w-full bg-rose-50 text-rose-600 dark:bg-rose-900/10 dark:text-rose-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 text-sm">
            <LogOut className="w-4 h-4" /> ត្រឡប់ទៅទំព័រទី១
         </button>
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAdminLogin(false)}></div>
           <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 soft-shadow border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-theme"/> បញ្ចូលលេខសម្ងាត់</h3>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password..." className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl mb-4 text-center tracking-widest outline-none font-bold focus:ring-2 focus:ring-theme"/>
              <button onClick={handleAdminLogin} className="w-full bg-theme text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90">ចូលប្រព័ន្ធ</button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- View: Admin Dashboard ---
const AdminDashboard = ({ locations, pendingLocations, usersList, cyberLogs, chats, db, appId, showToast, setCurrentView, setIsAdmin }) => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [monitoringUser, setMonitoringUser] = useState(null);
  const [editingLoc, setEditingLoc] = useState(null);
  
  const handleApprove = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', id), { status: 'approved' });
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { title: 'អនុម័តជោគជ័យ', msg: 'សំណើររបស់អ្នកជោគជ័យ! ទិន្នន័យត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធ។ ✅', type: 'success', timestamp: Date.now() });
    showToast('អនុម័តជោគជ័យ ✅');
  };
  const handleReject = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', id));
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { title: 'បដិសេធ', msg: 'សំណើររបស់អ្នកមិនជោគជ័យទេ! សូមពិនិត្យមើលទិន្នន័យឡើងវិញឲ្យបានច្បាស់លាស់! ❌', type: 'error', timestamp: Date.now() });
    showToast('លុបចោលរួចរាល់ ❌', 'error');
  };
  const clearLog = async (id = null) => {
    if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
    else cyberLogs.forEach(async l => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)));
  };
  
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setCurrentView('home');
    showToast('ចាកចេញពី Admin រួចរាល់');
  };

  const handleEditSave = async (e) => {
      e.preventDefault();
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', editingLoc.id), editingLoc);
      setEditingLoc(null);
      showToast('កែប្រែទិន្នន័យជោគជ័យ ✅');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-100 dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
        <div><h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-theme"/> គ្រប់គ្រងរដ្ឋបាល</h1></div>
        <button onClick={handleAdminLogout} className="mt-4 md:mt-0 px-4 py-2 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-sm font-bold flex items-center gap-2"><LogOut className="w-4 h-4"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[
          {id: 'approvals', label: 'អនុម័ត'}, {id: 'data', label: 'ទិន្នន័យ'}, {id: 'monitor', label: 'តាមដាន'}, {id: 'security', label: 'សន្តិសុខ'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-theme text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'approvals' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
           <h3 className="font-bold mb-4">សំណើររង់ចាំ ({pendingLocations.length})</h3>
           <div className="space-y-3">
             {pendingLocations.length === 0 ? <p className="text-sm text-slate-500 font-bold text-center py-10">គ្មានសំណើរថ្មី</p> : 
               pendingLocations.map(loc => (
                 <div key={loc.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <img src={loc.image} className="w-16 h-16 object-cover rounded-lg bg-slate-200" alt="loc"/>
                      <div>
                        <p className="font-bold text-sm text-theme">{loc.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold mb-1">ស្ថាប័ន: {loc.institution}</p>
                        <p className="text-[10px] text-slate-500">អ្នកស្នើ: {loc.author}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={()=>handleApprove(loc.id)} className="flex-1 bg-emerald-100 text-emerald-600 px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4"/> ព្រម</button>
                      <button onClick={()=>handleReject(loc.id)} className="flex-1 bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><XCircle className="w-4 h-4"/> បដិសេធ</button>
                    </div>
                 </div>
               ))
             }
           </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
           <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold mb-4 text-theme">ស្រុករតនមណ្ឌល (Data)</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').length === 0 ? <p className="text-xs text-slate-500 font-bold">គ្មានទិន្នន័យ</p> :
                  locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').map(l => (
                    <div key={l.id} className="p-3 flex justify-between items-center text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div><span className="font-bold block text-sm">{l.title}</span><span className="text-[10px] text-slate-500">ឃុំ {l.commune} • ភូមិ {l.village}</span></div>
                      <div className="flex gap-2">
                          <button onClick={()=>setEditingLoc(l)} className="p-1.5 bg-amber-50 text-amber-500 rounded hover:bg-amber-100"><Edit3 className="w-4 h-4"/></button>
                          <button onClick={()=>handleReject(l.id)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))
                }
              </div>
           </div>

           <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold mb-4 text-slate-700 dark:text-slate-300">ស្រុកផ្សេងៗ (Data)</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').length === 0 ? <p className="text-xs text-slate-500 font-bold">គ្មានទិន្នន័យ</p> :
                  locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').map(l => (
                    <div key={l.id} className="p-3 flex justify-between items-center text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div><span className="font-bold block text-sm">{l.title}</span><span className="text-[10px] text-slate-500">{l.province} • {l.district}</span></div>
                      <div className="flex gap-2">
                          <button onClick={()=>setEditingLoc(l)} className="p-1.5 bg-amber-50 text-amber-500 rounded hover:bg-amber-100"><Edit3 className="w-4 h-4"/></button>
                          <button onClick={()=>handleReject(l.id)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))
                }
              </div>
           </div>

           {/* Admin Edit Data Modal */}
           {editingLoc && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                 <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-lg font-bold mb-4">កែប្រែទិន្នន័យ (Admin)</h3>
                    <form onSubmit={handleEditSave} className="space-y-3">
                       <input value={editingLoc.title} onChange={e=>setEditingLoc({...editingLoc, title: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-sm" placeholder="ឈ្មោះទីតាំង"/>
                       <input value={editingLoc.institution} onChange={e=>setEditingLoc({...editingLoc, institution: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-sm" placeholder="ស្ថាប័ន"/>
                       <input value={editingLoc.phone} onChange={e=>setEditingLoc({...editingLoc, phone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-sm" placeholder="លេខទូរស័ព្ទ"/>
                       <textarea value={editingLoc.desc} onChange={e=>setEditingLoc({...editingLoc, desc: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-sm h-20" placeholder="ការពិពណ៌នា..."></textarea>
                       <div className="flex gap-2 pt-4">
                           <button type="button" onClick={()=>setEditingLoc(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-xl font-bold text-sm">បោះបង់</button>
                           <button type="submit" className="flex-1 bg-theme text-white py-3 rounded-xl font-bold text-sm">រក្សាទុក</button>
                       </div>
                    </form>
                 </div>
              </div>
           )}
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
           <h3 className="font-bold mb-4">តាមដាន User (Online)</h3>
           <div className="space-y-2">
             {usersList.length === 0 ? <p className="text-xs font-bold text-slate-500">គ្មាន User ទេ</p> : 
               usersList.map(u => (
                 <div key={u.id} onClick={()=>setMonitoringUser(u)} className="p-3 bg-white dark:bg-slate-800 rounded-xl cursor-pointer flex justify-between items-center border border-slate-100 dark:border-slate-700 hover:border-theme transition">
                   <span className="font-bold text-sm">{u.username || u.uid.substring(0,6)}</span>
                   <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Online</span>
                 </div>
               ))
             }
           </div>
           {monitoringUser && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[60vh] border border-slate-200 dark:border-slate-700">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-sm">ប្រវត្តិឆាត: {monitoringUser.username}</span>
                    <button onClick={()=>setMonitoringUser(null)} className="p-1 bg-slate-200 dark:bg-slate-700 rounded-full"><XCircle className="w-5 h-5 text-slate-600 dark:text-slate-300"/></button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    {chats.filter(c => c.userId === monitoringUser.uid).length === 0 ? <p className="text-xs font-bold text-center text-slate-400 py-10">គ្មានសារ</p> : 
                      chats.filter(c => c.userId === monitoringUser.uid).map(msg => (
                        <div key={msg.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                          <p className="font-bold text-theme mb-1">To: {msg.target}</p>
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
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-sm">សន្តិសុខ (Security Logs)</h3>
             <button onClick={()=>clearLog()} className="text-[10px] bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold shadow-sm">Clear All</button>
           </div>
           <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
             {cyberLogs.length === 0 ? <p className="text-sm font-bold text-slate-500 py-10 text-center">គ្មានទិន្នន័យលួចចូលទេ (Safe)</p> : 
               cyberLogs.map(l => (
                 <div key={l.id} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-xs relative">
                    <p className="font-bold text-red-600 mb-1">{l.username}</p>
                    <div className="flex flex-col gap-1 text-slate-500 font-medium">
                        <span>Device: {l.device} ({l.type})</span>
                        <span>IP Addr: {l.ip}</span>
                        <span className="text-[10px] mt-1">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                    <button onClick={()=>clearLog(l.id)} className="absolute top-3 right-3 px-2 py-1 bg-white dark:bg-slate-800 rounded font-bold text-red-500 shadow-sm border border-red-100 dark:border-red-900/50">Remove</button>
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
const LocationCard = ({ location, isFavorite, onToggleFavorite, onClick, isAdmin, handleEdit, handleDelete }) => {
  return (
    <div onClick={onClick} className="glass-panel group rounded-[1.5rem] overflow-hidden cursor-pointer soft-shadow hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-700 flex flex-col h-full bg-white dark:bg-slate-800/80 relative">
      <div className="relative h-40 overflow-hidden shrink-0">
        <img src={location.image} alt={location.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-slate-200 dark:bg-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-sm line-clamp-1">{location.title}</h3>
          <p className="text-[10px] text-slate-300 line-clamp-1 font-bold">{location.province || ''} {location.district || ''}</p>
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-white text-[9px] font-bold border border-white/20">{location.category}</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-[10px] text-slate-500 line-clamp-2 flex-1 mb-2 font-medium">{location.desc}</p>
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2">
           <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`flex items-center gap-1 text-xs font-bold ${isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
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
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden soft-shadow max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
        <div className="relative h-48 shrink-0">
          <img src={location.image} alt={location.title} className="w-full h-full object-cover bg-slate-200" />
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 rounded-full text-white"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-3">
             <div>
                <span className="px-2 py-1 bg-theme/10 text-theme text-[10px] rounded font-bold">{location.category}</span>
                <h2 className="text-xl font-bold mt-1">{location.title}</h2>
                <p className="text-xs text-slate-500 font-bold">{location.institution}</p>
             </div>
             <button onClick={() => toggleFavorite(location.id)} className={`p-2 rounded-full ${isFav ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}><Heart className={`w-5 h-5 ${isFav ? 'fill-current':''}`}/></button>
          </div>
          <div className="flex gap-2 mb-4">
             {location.phone && <a href={`tel:${location.phone}`} className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl flex items-center justify-center gap-1 font-bold text-[10px]"><Phone className="w-3 h-3"/> {location.phone}</a>}
             {location.mapUrl && <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-theme/10 text-theme py-2 rounded-xl flex items-center justify-center gap-1 font-bold text-[10px]"><Navigation className="w-3 h-3"/> Google Map</a>}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
             <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{location.desc || 'មិនមានការពិពណ៌នា...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};