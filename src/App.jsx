import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Moon, Sun, Plus, MoreVertical, 
  CheckCircle, XCircle, Trash2, Edit3, Image as ImageIcon, Send, Filter,
  LogOut, Settings, Activity, Users, MapPin, TrendingUp, Phone, Navigation, ShieldAlert, PieChart, BarChart, Eye, LayoutGrid, Monitor, Smartphone, Globe, ChevronDown, ArrowLeft, ArrowRight, ChevronRight, Loader2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, increment 
} from 'firebase/firestore';

// Sound Helper
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

// --- Configuration & Initialization ---
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

// ហាមបង្ហាញ Password នេះក្នុងកន្លែងដែលអាចមើលឃើញដោយ User ទូទៅ
const ADMIN_PASSWORD = "ict168mit";

// --- Styles Injection ---
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
    * { -webkit-tap-highlight-color: transparent; }
    .font-khmer { font-family: var(--font-khmer); }
    
    /* VERY IMPORTANT: Prevents auto-zoom on mobile when tapping inputs */
    input, textarea, select { 
      font-size: 16px !important; 
      touch-action: manipulation;
    }
    
    body { overscroll-behavior-y: none; background-color: #f8fafc; margin: 0; padding: 0; }
    .dark body { background-color: #0f172a; }
    
    .glass-panel { background: rgba(255, 255, 255, 1); border: 1px solid rgba(226, 232, 240, 1); }
    .dark .glass-panel { background: rgba(30, 41, 59, 1); border: 1px solid rgba(51, 65, 85, 1); }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .soft-shadow { box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
    .dark .soft-shadow { box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4); }
    .bg-theme { background-color: var(--theme-color) !important; }
    .text-theme { color: var(--theme-color) !important; }
    .border-theme { border-color: var(--theme-color) !important; }
    .fill-theme { fill: var(--theme-color) !important; }
    
    /* iPhone Safe Areas */
    .pt-safe { padding-top: env(safe-area-inset-top, 20px); }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
  `;
};

const REGIONS = {
  "រតនមណ្ឌល": { "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"], "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"], "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"] }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState('gateway'); 
  // បង្ខំឲ្យលោតមកគឺពណ៌ស (Light Mode) ជានិច្ចពេលចូលដំបូង
  const [theme, setTheme] = useState('light');
  const [themeColor, setThemeColor] = useState('#0d5c50'); // Deep Green/Teal (Theme color)
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  
  // [CHANGE_IMAGE_HERE_1_APP_LOGO]: Logo App ប្រើទូទៅ
  const [appLogo, setAppLogo] = useState('logo.png'); 
  const [language, setLanguage] = useState('km'); 
  
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' });
  const [locations, setLocations] = useState([]); 
  const [usersList, setUsersList] = useState([]); 
  const [chats, setChats] = useState([]);
  const [cyberLogs, setCyberLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [demographics, setDemographics] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { injectStyles(themeColor); }, [themeColor]);

  // Set physical body class for dark mode
  useEffect(() => {
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
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

  // Real-time tracking and database fetches
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
    
    // Heartbeat function to update "Online" status
    const updatePresence = () => {
        setDoc(profileRef, { lastActive: Date.now() }, { merge: true }).catch(console.error);
    };
    updatePresence(); // trigger once immediately
    const presenceInterval = setInterval(updatePresence, 45000); // every 45s

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setDoc(profileRef, { username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', uid: user.uid, timestamp: Date.now(), lastActive: Date.now() }, { merge: true });
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
    
    // Demographics Collection
    const demoRef = collection(db, 'artifacts', appId, 'public', 'data', 'demographics');
    const unsubDemo = onSnapshot(demoRef, (snapshot) => {
        setDemographics(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
    });

    return () => { clearInterval(presenceInterval); unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); unsubLogs(); unsubNotif(); unsubFavs(); unsubDemo(); };
  }, [user]);

  const showToast = (msg, type = 'success', duration = 4000) => { setToast({ msg, type }); setTimeout(() => setToast(null), duration); };
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

  if (isAuthLoading) return <div className={`flex items-center justify-center min-h-[100dvh] ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 bg-theme"></div></div>;

  // ==========================================
  // GATEWAY PAGE 1 (UPDATED TO MATCH photo_6190..._y.jpg)
  // ==========================================
  if (currentPage === 'gateway') {
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col font-khmer bg-slate-50 dark:bg-slate-900 overflow-y-auto hide-scrollbar`}>
        
        {/* Top Green Curved Section with Full Background Inside */}
        <div className="bg-theme w-full h-[60vh] md:h-[55vh] rounded-b-[3rem] md:rounded-b-[5rem] relative flex flex-col items-center pt-safe px-6 shadow-xl shrink-0 overflow-hidden">
            
            {/* [CHANGE_IMAGE_HERE_2_PAGE_1_BACKGROUND] */}
            <img src="back.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply" />
            
            {/* Gradient Overlay to make green pop */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-theme/80"></div>
            
            {/* Language Toggle */}
            <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setLanguage(l => l === 'km' ? 'en' : 'km')} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/30 hover:bg-white/30 transition-colors shadow-sm">
                    {language === 'km' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}
                </button>
            </div>
            
            {/* Center Content */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1 shadow-2xl mb-4 mt-12 md:mt-16 z-10 relative border-4 border-white/50">
               {/* [CHANGE_IMAGE_HERE_3_PAGE_1_LOGO] */}
               <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-white font-black text-xl md:text-3xl z-10 tracking-wide drop-shadow-md">
                {language === 'km' ? 'សូមស្វាគមន៍មកកាន់ TP Nice' : 'Welcome to TP Nice'}
            </h1>
        </div>

        {/* Bottom Content Section */}
        <div className="flex-1 flex flex-col items-center px-6 pt-12 pb-safe text-center justify-between z-10 relative bg-transparent">
           <div className="max-w-md w-full space-y-4">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight drop-shadow-sm">
                  {language === 'km' ? 'ទិន្នន័យ & ទំនាក់ទំនង' : 'Data & Communication'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium px-4">
                {language === 'km' 
                  ? 'ប្រព័ន្ធរុករកទិន្នន័យ និងសម្របសម្រួលទំនាក់ទំនងក្នុងគ្រាអាសន្ន។ បង្កើតឡើងដើម្បីផ្តល់ភាពងាយស្រួលដល់ប្រជាពលរដ្ឋក្នុងការទាក់ទងមេភូមិ ឃុំ ប៉ុស្តិ៍នគរបាល។'
                  : 'Data exploration and emergency coordination system. Built to provide citizens with easy direct communication.'}
              </p>
           </div>
           
           <div className="w-full max-w-sm mt-8 pb-8">
              <button onClick={() => setCurrentPage('app')} className="w-full bg-slate-800 dark:bg-theme text-white py-4 rounded-full font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all flex justify-between items-center px-2">
                 <div className="w-12"></div>
                 <span className="flex-1 tracking-wide">{language === 'km' ? 'អនុញ្ញាតឲ្យខ្លួនឯងចូលប្រើប្រាស់' : 'Authorize Access'}</span>
                 <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <ArrowRight className="text-slate-800 dark:text-theme w-5 h-5"/>
                 </div>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP PAGE 2 ---
  return (
    <div className={`min-h-[100dvh] font-khmer transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      <div className="text-slate-800 dark:text-slate-100 min-h-[100dvh] flex flex-col md:flex-row selection:bg-theme selection:text-white pb-16 md:pb-0">
        
        {toast && (
          <div className="fixed top-safe mt-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className={`px-5 py-3 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 backdrop-blur-md border ${toast.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' : toast.type === 'info' ? 'bg-slate-800/90 text-white border-slate-600' : 'bg-emerald-500/90 text-white border-emerald-400'}`}>
              {toast.type === 'error' ? <XCircle className="w-4 h-4"/> : toast.type === 'info' ? <Bell className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>} 
              {toast.msg}
            </div>
          </div>
        )}

        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} setAppLogo={setAppLogo} setCurrentPage={setCurrentPage} language={language} />

        <main className="flex-1 flex flex-col h-[100dvh] overflow-x-hidden overflow-y-auto relative w-full hide-scrollbar">
          
          {/* Header Conditional Rendering */}
          {currentView === 'home' ? (
             <HomeHeader setCurrentPage={setCurrentPage} profile={profile} notifications={notifications} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} language={language} db={db} appId={appId} user={user} showToast={showToast} theme={theme} toggleTheme={toggleTheme} />
          ) : (
             <TopBar theme={theme} toggleTheme={toggleTheme} searchQuery={searchQuery} setSearchQuery={setSearchQuery} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} notifications={notifications} appLogo={appLogo} db={db} appId={appId} showToast={showToast} user={user} setCurrentPage={setCurrentPage} language={language} />
          )}

          <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentView === 'home' && <HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} language={language} setCurrentView={setCurrentView} />}
            {currentView === 'data' && <DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} language={language} />}
            {currentView === 'reports' && <ReportsView locations={approvedLocations} usersList={usersList} language={language} demographics={demographics} />}
            {currentView === 'chat' && <ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />}
            {currentView === 'account' && <AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} themeColor={themeColor} setThemeColor={setThemeColor} theme={theme} setTheme={setTheme} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} language={language} />}
            {currentView === 'admin' && isAdmin && <AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} demographics={demographics} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} user={user} setIsAdmin={setIsAdmin} />}
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

const Sidebar = ({ currentView, setCurrentView, isAdmin, appLogo, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home' },
    { id: 'data', icon: Map, label: language === 'km' ? 'ទិន្នន័យ' : 'Data' },
    { id: 'reports', icon: TrendingUp, label: language === 'km' ? 'របាយការណ៍' : 'Reports' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Messages' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin' });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-10 sticky top-0 h-screen shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
           <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[10px]" />
        </div>
        <div>
          <h1 className="font-bold text-base text-theme">Khmer TP</h1>
          <p className="text-[10px] text-slate-500 font-bold">{language === 'km' ? 'ស្វែងយល់ពីកម្ពុជា' : 'Discover Cambodia'}</p>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">{language === 'km' ? 'ម៉ឺនុយ' : 'Menu'}</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${currentView === item.id ? 'bg-theme/10 text-theme font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'}`}>
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'stroke-[2px]' : ''}`} />
            <div className="text-sm">{item.label}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

// CLEAN MOBILE BOTTOM NAV (Not floating, fixed to bottom like standard apps)
const BottomNav = ({ currentView, setCurrentView, isAdmin, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home' },
    { id: 'data', icon: LayoutGrid, label: language === 'km' ? 'ទិន្នន័យ' : 'Data' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Chat' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
      <div className="flex justify-around items-center h-[56px]">
        {navItems.map(item => {
           const isActive = currentView === item.id;
           return (
             <button 
               key={item.id} 
               onClick={() => setCurrentView(item.id)} 
               className={`flex-1 flex flex-col items-center justify-center h-full transition-colors duration-200 ${isActive ? 'text-theme' : 'text-slate-400 dark:text-slate-500'}`}
             >
               <item.icon className={`w-6 h-6 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
               <span className={`text-[9px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
             </button>
           )
        })}
      </div>
    </div>
  );
};

// HOME HEADER (Matches specific design with search bar inside green area)
const HomeHeader = ({ setCurrentPage, profile, notifications, notificationsOpen, setNotificationsOpen, searchQuery, setSearchQuery, language, db, appId, user, theme, toggleTheme }) => {
    return (
        <div className="bg-theme text-white rounded-b-[2rem] pt-[env(safe-area-inset-top,20px)] pb-6 px-4 md:px-8 shadow-md relative z-40 shrink-0">
           
           {/* Top Navigation Row */}
           <div className="flex justify-between items-center mb-5 pt-4">
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentPage('gateway')} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition shadow-sm"><ArrowLeft className="w-5 h-5 text-white"/></button>
                 <div className="flex flex-col">
                    <p className="text-[10px] text-white/80 font-bold">{language === 'km' ? 'ត្រឡប់' : 'Back'}</p>
                    <p className="text-sm font-bold flex items-center gap-1">Khmer TP</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={toggleTheme} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition shadow-sm">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
                 </button>
                 <div className="relative">
                     <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition shadow-sm" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-4 h-4 text-white" />
                        {notifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-transparent rounded-full"></span>}
                     </button>
                     {/* Notifications Dropdown */}
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 text-slate-800 dark:text-slate-100">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold flex justify-between">
                            <span>{language==='km'?'ការជូនដំណឹង':'Notifications'}</span><button onClick={() => setNotificationsOpen(false)}><XCircle className="w-4 h-4 text-slate-400" /></button>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <p className="p-4 text-center text-sm text-slate-500">គ្មានសារថ្មីទេ</p> : 
                              notifications.map(n => (
                                <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-start gap-2">
                                  <div>
                                    <p className={`text-sm font-bold ${n.type === 'error' ? 'text-rose-500' : 'text-theme'}`}>{n.title}</p>
                                    <p className="text-[11px] text-slate-500 mt-1">{n.msg}</p>
                                  </div>
                                  <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notifications', n.id)); }} className="text-slate-400 hover:text-rose-500 shrink-0"><XCircle className="w-4 h-4"/></button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                 </div>
                 <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden bg-white/20 p-0.5 shadow-sm">
                    <img src={profile.avatar} className="w-full h-full object-cover rounded-full" alt="Profile" />
                 </div>
              </div>
           </div>
           
           {/* Search Bar - Integrated in Green Header */}
           <div className="relative mx-1 mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                 type="text" 
                 placeholder={language === 'km' ? "ស្វែងរកសេវាកម្ម/ទីតាំង..." : "Search for a service..."} 
                 className="w-full bg-white text-slate-800 rounded-xl py-3 pl-11 pr-4 outline-none shadow-sm text-sm font-bold focus:ring-2 focus:ring-white/50 transition-all m-0" 
                 value={searchQuery} 
                 onChange={(e) => setSearchQuery(e.target.value)} 
              />
           </div>

           {/* Hero Box inside Header (Matches Pin by Olavid image style) */}
           <div className="bg-white/10 rounded-[1.2rem] p-5 relative overflow-hidden flex flex-row items-center justify-between mx-1 shadow-inner border border-white/20">
               <div className="flex-1 z-10 pr-2">
                   <h1 className="text-[15px] md:text-xl font-black uppercase leading-tight mb-2 tracking-wide drop-shadow-md">
                       {language === 'km' ? 'ស្វែងរកទីតាំង\nងាយស្រួល!' : 'YOUR SOLUTION,\nONE TAP AWAY!'}
                   </h1>
                   <p className="text-[10px] md:text-xs text-white/90 mb-4 leading-relaxed font-bold max-w-[160px]">
                       {language === 'km' ? 'រហ័ស និងងាយស្រួលសម្រាប់ការរុករក។' : 'Seamless & Fast Services at Your Fingertips.'}
                   </p>
                   <button className="bg-white text-theme px-5 py-2.5 rounded-lg text-[10px] font-black shadow-md active:scale-95 transition-transform">
                       {language === 'km' ? 'ស្វែងយល់' : 'Explore'}
                   </button>
               </div>
               
               {/* Decorative Graphic (Like the isometric room in the mockup) */}
               <div className="w-[110px] h-[110px] md:w-[130px] md:h-[130px] shrink-0 relative z-10">
                   {/* [CHANGE_IMAGE_HERE_4_PAGE_2_BANNER_GRAPHIC] */}
                   <img src="back.png" alt="Graphic" className="w-full h-full object-contain filter invert brightness-0 opacity-90 drop-shadow-xl" style={{filter: "brightness(0) invert(1)"}} />
               </div>
           </div>
        </div>
    );
};

// GENERIC TOPBAR FOR OTHER PAGES
const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, appLogo, setCurrentPage, language }) => {
  return (
    <header className="pt-[env(safe-area-inset-top,20px)] pb-3 px-4 md:px-6 bg-white dark:bg-slate-900 sticky top-0 z-40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
      <div className="md:hidden flex items-center shrink-0 pt-2">
        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[6px]" />
        </div>
      </div>
      
      <button onClick={()=>setCurrentPage('gateway')} className="hidden md:flex items-center gap-2 mt-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-500 transition shrink-0">
         <ArrowLeft className="w-4 h-4"/> {language === 'km' ? 'ត្រឡប់' : 'Back'}
      </button>

      <div className="flex-1 max-w-xl relative shrink min-w-0 mt-2 px-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-theme transition-colors" />
        <input 
          type="text" placeholder={language === 'km' ? "ស្វែងរក..." : "Search..."} 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-full py-2.5 pl-11 pr-4 outline-none border border-transparent focus:border-theme/30 focus:ring-1 focus:ring-theme/50 transition-all text-xs font-bold m-0"
        />
      </div>

      <div className="flex items-center shrink-0 mt-2">
        <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

// --- View: Home ---
const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, language, setCurrentView }) => {
  const [activeHomeFilter, setActiveHomeFilter] = useState('All');
  
  const filtered = locations.filter(l => {
     const matchesSearch = (l.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (l.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
     if(activeHomeFilter === 'All') return matchesSearch;
     if(activeHomeFilter === 'រតនមណ្ឌល') return matchesSearch && l.district === 'រតនមណ្ឌល';
     if(activeHomeFilter === 'ផ្សេងៗ') return matchesSearch && l.district !== 'រតនមណ្ឌល';
     return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pt-2">
      <div>
         <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="font-bold text-base text-slate-800 dark:text-white">{language==='km'?'ជម្រើសទីតាំង (Categories)':'Categories'}</h2>
            <button onClick={() => setCurrentView('data')} className="text-[11px] font-bold text-theme hover:underline">{language==='km'?'មើលទាំងអស់':'View all'} &gt;</button>
         </div>
         <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border transition-all active:scale-95 ${activeHomeFilter==='រតនមណ្ឌល'?'border-theme bg-theme/5':'border-slate-100 dark:border-slate-700'}`}>
               <div className="flex items-center gap-3">
                  <div className="text-theme"><Map className="w-5 h-5 stroke-[2px]"/></div>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200">ស្រុករតនមណ្ឌល</span>
               </div>
               <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${activeHomeFilter==='រតនមណ្ឌល'?'rotate-0':'-rotate-90'}`} />
            </button>
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='ផ្សេងៗ'?'All':'ផ្សេងៗ')} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border transition-all active:scale-95 ${activeHomeFilter==='ផ្សេងៗ'?'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10':'border-slate-100 dark:border-slate-700'}`}>
               <div className="flex items-center gap-3">
                  <div className="text-emerald-500"><Globe className="w-5 h-5 stroke-[2px]"/></div>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200">ស្រុកផ្សេងៗ</span>
               </div>
               <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${activeHomeFilter==='ផ្សេងៗ'?'rotate-0':'-rotate-90'}`} />
            </button>
         </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-slate-800 dark:text-white leading-none">{language==='km'?'ទីតាំងដែលបានដាក់បញ្ចូល':'Locations'}</h2>
        </div>
        {filtered.length === 0 ? (
           <div className="text-center py-10 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-500 shadow-sm">គ្មានទិន្នន័យ (No data found)</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {filtered.map(loc => (
              <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- View: Data ---
const DataView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId, setCurrentView, language }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', institution: '', phone: '', image: '', mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);

  const filtered = locations.filter(l => {
    const matchesSearch = (l.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (l.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
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
    if (!profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error'); setCurrentView('account'); return; }
    setForm({ title: '', institution: '', phone: '', image: '', mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.image) return showToast('សូមបំពេញឈ្មោះ និងរូបភាព', 'error');
    setLoading(true);
    try {
      let submitData = { ...form, author: profile.username, authorUid: user.uid, timestamp: Date.now() };
      if (activeTab === 'រតនមណ្ឌល') { submitData.province = 'បាត់ដំបង'; submitData.district = 'រតនមណ្ឌល'; }
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'data_admin'), { ...submitData, status: isAdmin ? 'approved' : 'pending', likes: 0 });
      
      if (isAdmin) showToast('ទិន្នន័យត្រូវបានបញ្ចូល ✅');
      else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), { title: 'សំណើបញ្ជូនជោគជ័យ ⏳', msg: `សូមរង់ចាំការអនុម័តពី Admin។`, type: 'info', timestamp: Date.now() });
        showToast('រាល់ទិន្នន័យរបស់អ្នកនឹងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យពី admin ដើម្បីបញ្ជាក់ថាពិតឬក៏ក្លែងក្លាយ', 'info', 6000);
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូន', 'error'); }
    setLoading(false);
  };

  if (!profile.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in zoom-in duration-300">
         <div className="w-16 h-16 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-4"><User className="w-8 h-8" /></div>
         <h2 className="text-lg font-bold mb-2">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-6 max-w-sm text-xs font-medium px-4">សូមចូលទៅកាន់គណនី (Account) ដើម្បីកំណត់ឈ្មោះរបស់អ្នក។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-6 py-3 rounded-full font-bold shadow-md active:scale-95 text-xs transition">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
         <h1 className="text-lg font-bold px-1">{language==='km'?'ទិន្នន័យទីតាំង':'Location Data'}</h1>
         <button onClick={handleOpenAdd} className="w-full sm:w-auto bg-theme text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-xs active:scale-95 transition-transform"><Plus className="w-4 h-4"/> {language==='km'?'បន្ថែមទីតាំង':'Add Location'}</button>
      </div>

      <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl overflow-hidden shadow-inner">
         {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-theme shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
         ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {['ទាំងអស់', 'ស្រុក', 'ឃុំ', 'ភូមិ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap shrink-0 border shadow-sm ${activeFilter === cat ? 'bg-theme text-white border-theme' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
        {filtered.length === 0 ? <p className="col-span-full text-center text-slate-500 py-10 font-bold text-xs bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">គ្មានទិន្នន័យ</p> : 
          filtered.map(loc => <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />)
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[90dvh] md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <h2 className="text-sm font-bold text-theme">បន្ថែមទិន្នន័យ: {activeTab}</h2>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-red-100 hover:text-red-500"><XCircle className="w-5 h-5 text-slate-500"/></button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 hide-scrollbar bg-white dark:bg-slate-900">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">ប្រភេទ</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-theme font-bold m-0">
                      <option value="សាលារៀន">សាលារៀន</option><option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option><option value="ប៉ុស្តិ៍ប៉ូលិស">ប៉ុស្តិ៍ប៉ូលិស</option>
                      <option value="មេភូមិ">មេភូមិ</option><option value="មេឃុំ">មេឃុំ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">ឈ្មោះ (Name) *</label>
                    <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-theme font-bold m-0" />
                  </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">ឈ្មោះស្ថាប័ន *</label>
                    <input type="text" required value={form.institution} onChange={e=>setForm({...form, institution: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-theme font-bold m-0" />
                </div>

                {activeTab === 'រតនមណ្ឌល' ? (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">ឃុំ</label>
                            <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2.5 text-xs outline-none font-bold border border-slate-200 dark:border-slate-600 m-0">
                                <option value="">ជ្រើសរើស</option>
                                {Object.keys(REGIONS["រតនមណ្ឌល"] || {}).map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">ភូមិ</label>
                            <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-lg p-2.5 text-xs outline-none font-bold border border-slate-200 dark:border-slate-600 disabled:opacity-50 m-0">
                                <option value="">ជ្រើសរើស</option>
                                {form.commune && REGIONS["រតនមណ្ឌល"][form.commune] && REGIONS["រតនមណ្ឌល"][form.commune].map(v=><option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-xs outline-none font-bold m-0" placeholder="ខេត្ត..."/>
                        <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-xs outline-none font-bold m-0" placeholder="ស្រុក..."/>
                        <input type="text" value={form.commune} onChange={e=>setForm({...form, commune: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-xs outline-none font-bold m-0" placeholder="ឃុំ..."/>
                        <input type="text" value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-xs outline-none font-bold m-0" placeholder="ភូមិ..."/>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-theme font-bold m-0" placeholder="លេខទូរស័ព្ទ..." />
                  <input type="url" value={form.mapUrl} onChange={e=>setForm({...form, mapUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-theme font-bold m-0" placeholder="Google Map Link..." />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">រូបភាព (Upload Picture) *</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 relative overflow-hidden transition-colors">
                     {form.image ? (
                        <><img src={form.image} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-bold bg-black/60 px-3 py-1.5 rounded-lg text-[10px] backdrop-blur-sm shadow-sm">ប្តូររូបភាព</span></div></>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                           <ImageIcon className="w-6 h-6 mb-1 opacity-70" />
                           <span className="text-[11px] font-bold">ចុចដើម្បី Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="hidden" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>
                <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="ការពណ៌នា..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-theme h-20 resize-none font-medium m-0"></textarea>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 pb-safe bg-white dark:bg-slate-900">
               <button type="submit" form="addForm" disabled={loading} className="w-full py-3.5 rounded-xl font-bold bg-theme text-white active:scale-95 disabled:opacity-50 transition shadow-md text-sm flex justify-center items-center gap-2">
                   {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> កំពុងផ្ញើរ...</> : (language==='km'?'ផ្ញើរសំណើរ(admin)':'Send Request')}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Reports ---
const ReportsView = ({ locations, usersList, language, demographics }) => {
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
    { label: language === 'km' ? 'អ្នកប្រើប្រាស់សរុប' : 'Total Users', count: totalUsers, color: 'text-theme' },
    { label: language === 'km' ? 'ប្រចាំសប្តាហ៍' : 'Weekly', count: weeklyUsers, color: 'text-teal-500' },
    { label: language === 'km' ? 'ប្រចាំខែ' : 'Monthly', count: monthlyUsers, color: 'text-amber-500' },
    { label: language === 'km' ? 'ប្រចាំឆ្នាំ' : 'Yearly', count: yearlyUsers, color: 'text-rose-500' },
  ];

  const cats = locations.reduce((acc, l) => { acc[l.category] = (acc[l.category]||0)+1; return acc; }, {});
  const chartColors = ['bg-[#10b981]', 'bg-[#3b82f6]', 'bg-[#6366f1]', 'bg-[#f43f5e]', 'bg-[#f59e0b]', 'bg-[#8b5cf6]', 'bg-[#06b6d4]'];

  // Calculate percentages cleanly (if 0, then 0%)
  const dailyPct = totalUsers ? Math.round((usersList.filter(u=>u.timestamp>dayAgo).length/totalUsers)*100) : 0;
  const weeklyPct = totalUsers ? Math.round((weeklyUsers/totalUsers)*100) : 0;
  const monthlyPct = totalUsers ? Math.round((monthlyUsers/totalUsers)*100) : 0;
  const yearlyPct = totalUsers ? Math.round((yearlyUsers/totalUsers)*100) : 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <h1 className="text-lg font-bold">{language==='km'?'របាយការណ៍សង្ខេប':'Summary Reports'}</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {stats.map((s, i) => (
           <div key={i} className="glass-panel p-4 rounded-[1.5rem] shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-500 mb-1">{s.label}</p>
              <h3 className={`text-2xl font-black ${s.color}`}>{s.count}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-[1.5rem] shadow-sm">
           <h3 className="text-xs font-bold mb-4 text-slate-500">{language==='km'?'ស្ថិតិទីតាំង (រង្វង់ភាគរយ)':'Location Percentage'}</h3>
           <div className="space-y-3">
             {Object.keys(cats).length === 0 ? <p className="text-[10px] font-bold text-slate-400">0 ទិន្នន័យ (0%)</p> : Object.entries(cats).map(([name, count], i) => {
               const pct = locations.length > 0 ? Math.round((count/locations.length)*100) : 0;
               return (
                 <div key={name}>
                   <div className="flex justify-between text-[10px] font-bold mb-1 text-slate-600 dark:text-slate-300"><span>{name} ({count})</span><span>{pct}%</span></div>
                   <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className={`h-full ${chartColors[i%7]} rounded-full`} style={{width:`${pct}%`}}></div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="glass-panel p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
           <h3 className="text-xs font-bold mb-4 text-slate-500">{language==='km'?'ស្ថិតិសកម្មអ្នកប្រើប្រាស់ (Line & Bar)':'User Activity (Line & Bar)'}</h3>
           <div className="flex-1 flex items-end gap-4 h-24 border-b border-l border-slate-200 dark:border-slate-700 pl-2 pb-2 relative mt-4">
               {[
                   {label: language==='km'?'ថ្ងៃនេះ':'Daily', pct: dailyPct},
                   {label: language==='km'?'សប្តាហ៍':'Weekly', pct: weeklyPct},
                   {label: language==='km'?'ខែ':'Monthly', pct: monthlyPct},
                   {label: language==='km'?'ឆ្នាំ':'Yearly', pct: yearlyPct}
               ].map((d, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1">
                       <div className="w-full max-w-[20px] bg-theme/80 rounded-t-[4px] relative transition-all" style={{height: `${Math.max(d.pct, 2)}%`}}>
                           <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold">{d.pct}%</div>
                       </div>
                       <span className="text-[9px] text-slate-500 mt-1">{d.label}</span>
                   </div>
               ))}
           </div>
        </div>
      </div>
      
      <div className="glass-panel p-5 rounded-[1.5rem] shadow-sm">
           <h3 className="text-xs font-bold mb-3">{language==='km'?'ទិន្នន័យទើបបញ្ចូលថ្មី':'Newly Added Data'}</h3>
           <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
             {locations.length === 0 ? <p className="text-[10px] font-bold text-slate-400">0 ទិន្នន័យ</p> : locations.slice(-5).reverse().map(l => (
               <div key={l.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="font-bold text-[11px] truncate w-2/3">{l.title}</span>
                  <span className="text-[9px] text-slate-500 font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">{new Date(l.timestamp||Date.now()).toLocaleString('km-KH')}</span>
               </div>
             ))}
           </div>
      </div>

      <div className="pt-2 flex justify-center pb-6">
        {editFooter ? (
          <div className="flex gap-2">
            <input type="text" value={footerText} onChange={e=>setFooterText(e.target.value)} className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none w-48 shadow-sm m-0" />
            <button onClick={()=>setEditFooter(false)} className="bg-theme text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Save</button>
          </div>
        ) : (
          <p onClick={()=>setEditFooter(true)} className="text-[9px] text-slate-400 font-bold cursor-pointer hover:text-theme transition">© {footerText}</p>
        )}
      </div>
    </div>
  );
};

const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView, isAdmin, language }) => {
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
    if (!profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error'); setCurrentView('account'); return; }
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
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in">
         <div className="w-16 h-16 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-4"><MessageCircle className="w-8 h-8" /></div>
         <h2 className="text-lg font-bold mb-2">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-xs mb-6 max-w-xs font-medium">សូមបង្កើតឈ្មោះរបស់អ្នកជាមុនសិន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md active:scale-95 transition">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100dvh-40px)] bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-theme text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">TP</div>
            <div>
                <h2 className="font-bold text-xs">Chat TP</h2>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> User ↔ {activeTarget}
                </div>
            </div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {targets.map(t => (
                <button key={t} onClick={() => setActiveTarget(t)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border shadow-sm ${activeTarget === t ? 'bg-theme text-white border-theme' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{t}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-[#0B1220]/30">
        {filteredChats.length === 0 ? <p className="text-center text-slate-400 py-10 text-[10px] font-bold">មិនទាន់មានសារទេ</p> : 
          filteredChats.map(msg => {
            const isMe = msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[9px] font-bold text-slate-500 ml-1">{msg.userName}</span>}
                  <div className={`px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm border ${isMe ? 'bg-theme text-white rounded-br-sm border-transparent' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder={language==='km'?"វាយសារ...":"Type message..."} className="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full py-2.5 px-4 text-xs font-medium outline-none focus:border-theme/30 m-0" />
          <button type="submit" disabled={!msgText.trim()} className="w-10 h-10 rounded-full bg-theme text-white flex items-center justify-center disabled:opacity-50 shrink-0 shadow-sm active:scale-95 transition-transform"><Send className="w-4 h-4 ml-0.5" /></button>
        </form>
      </div>
    </div>
  );
};

const AccountView = ({ user, profile, db, appId, showToast, themeColor, setThemeColor, theme, setTheme, setCurrentPage, setIsAdmin }) => {
  const [pwd, setPwd] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [localName, setLocalName] = useState(profile.username || '');
  const [isEditingName, setIsEditingName] = useState(profile.username ? false : true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const tColors = ['#0d5c50', '#0f766e', '#4f46e5', '#3b82f6', '#f43f5e', '#f59e0b', '#0f3460']; 

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

  const handleSaveName = async () => {
      if(!localName.trim()) return showToast('ឈ្មោះមិនអាចទទេ', 'error');
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{username: localName});
      setIsEditingName(false);
      showToast('រក្សាទុកជោគជ័យ');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-300 pb-10">
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] flex flex-col items-center shadow-sm border border-slate-100 dark:border-slate-700">
        <h1 className="text-lg font-bold mb-4 w-full text-left">គណនី</h1>
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 mb-4 overflow-hidden border-[3px] border-theme relative group shadow-sm">
             <img src={profile.avatar} className="w-full h-full object-cover" alt="av"/>
             <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Edit3 className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{avatar:r.result}); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
        </div>
        <div className="w-full">
           <label className="text-[10px] font-bold text-slate-500 pl-1 mb-1 block">ឈ្មោះអ្នកប្រើប្រាស់</label>
           {isEditingName ? (
               <div className="flex gap-2">
                   <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-theme shadow-inner m-0" placeholder="កំណត់ឈ្មោះ..."/>
                   <button onClick={handleSaveName} className="bg-theme text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">Save</button>
               </div>
           ) : (
               <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl">
                   <span className="text-sm font-bold">{profile.username}</span>
                   <button onClick={() => setIsEditingName(true)} className="text-theme text-[11px] font-bold px-3 py-1 bg-theme/10 rounded-lg">Edit</button>
               </div>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
         <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300"><Settings className="w-4 h-4"/> ការកំណត់ (Settings)</h2>
         
         <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-xs">Dark Mode</span>
            <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5"/> : <Sun className="w-3.5 h-3.5"/>}
            </button>
         </div>

         <div className="relative flex flex-col p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 gap-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowColorPicker(!showColorPicker)}>
               <span className="font-bold text-xs">ប្តូរពណ៌ (Theme Color)</span>
               <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{backgroundColor: themeColor}}></div>
            </div>
            {showColorPicker && (
               <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 justify-center animate-in slide-in-from-top-2 flex-wrap">
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
           <div className="relative w-full max-w-xs mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700"><ShieldAlert className="w-6 h-6 text-slate-500"/></div>
              <h3 className="text-base font-bold mb-4">តម្រូវអោយផ្ទៀងផ្ទាត់</h3>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password..." className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 text-center tracking-widest outline-none font-bold border border-slate-200 dark:border-slate-700 text-sm focus:border-slate-400 m-0"/>
              <div className="flex gap-2">
                <button onClick={() => setShowAdminLogin(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold text-xs">បោះបង់</button>
                <button onClick={handleAdminLogin} className="flex-1 bg-slate-800 dark:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">ចូល</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ locations = [], pendingLocations = [], usersList = [], cyberLogs = [], chats = [], demographics = [], db, appId, showToast, setCurrentView, user, setIsAdmin }) => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [monitoringUser, setMonitoringUser] = useState(null);
  const [editingLoc, setEditingLoc] = useState(null);
  const [demoForm, setDemoForm] = useState({ district: 'រតនមណ្ឌល', commune: '', village: '', families: '', people: '' });
  
  const handleApprove = async (id, authorUid) => { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', id), { status: 'approved' }); 
      if(authorUid) await addDoc(collection(db, 'artifacts', appId, 'users', authorUid, 'notifications'), { title: 'សំណើរជោគជ័យ', msg: 'សំណើររបស់អ្នកជោគជ័យ', type: 'success', timestamp: Date.now() });
      showToast('អនុម័តជោគជ័យ ✅'); 
  };
  const handleReject = async (id, authorUid) => { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', id)); 
      if(authorUid) await addDoc(collection(db, 'artifacts', appId, 'users', authorUid, 'notifications'), { title: 'សំណើរបដិសេធ', msg: 'សំណើររបស់អ្នកមិនជោគជ័យ សូមព្យាយាមម្តងទៀត !', type: 'error', timestamp: Date.now() });
      showToast('លុបចោលរួចរាល់ ❌', 'error'); 
  };
  const clearLog = async (id = null) => {
    if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
    else cyberLogs?.forEach(async l => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)));
  };
  const handleAdminLogout = () => { setIsAdmin(false); setCurrentView('account'); showToast('ចាកចេញពី Admin'); };
  const handleEditSave = async (e) => { e.preventDefault(); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', editingLoc.id), editingLoc); setEditingLoc(null); showToast('កែប្រែជោគជ័យ'); };

  const handleAddDemo = async (e) => {
      e.preventDefault();
      if(!demoForm.commune || !demoForm.village) return showToast('បំពេញព័ត៌មានអោយគ្រប់', 'error');
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'demographics'), {
          district: demoForm.district, commune: demoForm.commune, village: demoForm.village, families: parseInt(demoForm.families||0), people: parseInt(demoForm.people||0), timestamp: Date.now()
      });
      setDemoForm({ district: demoForm.district, commune: '', village: '', families: '', people: '' });
      showToast('បន្ថែមស្ថិតិជោគជ័យ');
  };
  const handleDeleteDemo = async (id) => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'demographics', id)); showToast('លុបរួចរាល់'); };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 text-white p-4 md:p-5 rounded-2xl shadow-lg border border-slate-800">
        <div>
           <h1 className="text-sm md:text-base font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400"/> Admin Panel</h1>
        </div>
        <button onClick={handleAdminLogout} className="mt-3 sm:mt-0 px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-[10px] font-bold flex items-center gap-2 transition border border-slate-700 shadow-sm"><LogOut className="w-3.5 h-3.5"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[
          {id: 'approvals', label: 'អនុម័តសំណើរ'}, {id: 'data', label: 'ទិន្នន័យរួម'}, {id: 'monitor', label: 'សកម្មភាព Users'}, {id: 'security', label: 'កំណត់ត្រាសុវត្ថិភាព'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-colors border shadow-sm ${activeTab === t.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'approvals' && (
        <div className="glass-panel p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
           <h3 className="font-bold text-xs mb-3">សំណើររង់ចាំ ({pendingLocations?.length||0})</h3>
           <div className="space-y-3">
             {pendingLocations?.length === 0 ? <p className="text-[10px] text-slate-500 font-bold text-center py-10">គ្មានសំណើរថ្មី</p> : 
               pendingLocations.map(loc => (
                 <div key={loc.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <img src={loc.image} className="w-12 h-12 object-cover rounded-lg bg-slate-200 shrink-0 shadow-sm" alt="loc"/>
                      <div className="flex-1">
                        <p className="font-bold text-xs">{loc.title}</p>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">ស្ថាប័ន: {loc.institution}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">អ្នកស្នើ: {loc.author}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={()=>handleApprove(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-sm">ព្រម</button>
                      <button onClick={()=>handleReject(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-sm">បដិសេធ</button>
                    </div>
                 </div>
               ))
             }
           </div>
        </div>
      )}

      {activeTab === 'data' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs mb-3 text-theme">បន្ថែមស្ថិតិ / ទិន្នន័យរួម</h3>
                <form onSubmit={handleAddDemo} className="space-y-3">
                   <div>
                       <select value={demoForm.district} onChange={e=>setDemoForm({...demoForm, district: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold outline-none m-0 focus:border-theme">
                          <option value="រតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                          <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                       </select>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <input type="text" required value={demoForm.commune} onChange={e=>setDemoForm({...demoForm, commune: e.target.value})} placeholder="ឈ្មោះឃុំ..." className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold outline-none m-0 focus:border-theme"/>
                      <input type="text" required value={demoForm.village} onChange={e=>setDemoForm({...demoForm, village: e.target.value})} placeholder="ឈ្មោះភូមិ..." className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold outline-none m-0 focus:border-theme"/>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <input type="number" required value={demoForm.families} onChange={e=>setDemoForm({...demoForm, families: e.target.value})} placeholder="ចំនួនគ្រួសារ..." className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold outline-none m-0 focus:border-theme"/>
                      <input type="number" required value={demoForm.people} onChange={e=>setDemoForm({...demoForm, people: e.target.value})} placeholder="ចំនួនប្រជាជន..." className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold outline-none m-0 focus:border-theme"/>
                   </div>
                   <button type="submit" className="w-full bg-theme text-white py-2.5 rounded-xl font-bold text-[10px] shadow-sm active:scale-95 transition-transform">បញ្ចូលទិន្នន័យ</button>
                </form>
            </div>

            <div className="glass-panel p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full max-h-[500px]">
                <h3 className="font-bold text-xs mb-3">បញ្ជីទិន្នន័យបែងចែកតាមស្រុក</h3>
                <div className="space-y-4 overflow-y-auto pr-1 flex-1 hide-scrollbar">
                   {['រតនមណ្ឌល', 'ផ្សេងៗ'].map(dist => {
                      const items = demographics?.filter(d => d.district === dist) || [];
                      return (
                         <div key={dist}>
                             <h4 className="text-[11px] font-bold text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{dist} ({items.length})</h4>
                             <div className="space-y-2">
                               {items.length === 0 ? <p className="text-[9px] text-slate-400">គ្មានទិន្នន័យ</p> : 
                                 items.map(d => (
                                   <div key={d.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                       <div>
                                           <p className="text-[10px] font-bold">ភូមិ: {d.village}</p>
                                           <p className="text-[9px] text-slate-500">ឃុំ: {d.commune} • គ្រួសារ: {d.families} • មនុស្ស: {d.people}</p>
                                       </div>
                                       <button onClick={()=>handleDeleteDemo(d.id)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                   </div>
                                 ))
                               }
                             </div>
                         </div>
                      )
                   })}
                </div>
            </div>
         </div>
      )}
      
      {activeTab === 'monitor' && (
        <div className="glass-panel p-4 rounded-2xl shadow-sm">
           <h3 className="font-bold mb-3 text-xs">សកម្មភាព Users (Live)</h3>
           <div className="space-y-2 max-h-[400px] overflow-y-auto">
             {usersList?.length === 0 ? <p className="text-[10px] font-bold text-slate-500">គ្មាន User ទេ</p> : 
               [...usersList].sort((a,b)=>(b.lastActive||0)-(a.lastActive||0)).map(u => {
                 const isOnline = (Date.now() - (u.lastActive || 0)) < 120000;
                 return (
                   <div key={u.id} onClick={()=>setMonitoringUser(u)} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:border-theme transition">
                     <div className="flex items-center gap-2">
                        <img src={u.avatar} className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600" alt="av" />
                        <span className="font-bold text-[11px]">{u.username || (u.uid || u.id || '').substring(0,6) || 'User'}</span>
                     </div>
                     <span className={`flex items-center gap-1 text-[9px] font-bold ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div> {isOnline ? 'Online' : 'Offline'}
                     </span>
                   </div>
                 )
               })
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
        <div className="glass-panel p-4 rounded-2xl shadow-sm">
           <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-xs">កំណត់ត្រាសុវត្ថិភាព (Logs)</h3>
             <button onClick={()=>clearLog()} className="text-[9px] bg-rose-100 text-rose-600 px-2 py-1.5 rounded-lg font-bold shadow-sm active:scale-95 transition-transform">Clear All</button>
           </div>
           <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
             {cyberLogs?.length === 0 ? <p className="text-[10px] font-bold text-slate-500 py-10 text-center">ប្រព័ន្ធមានសុវត្ថិភាពល្អ 100%</p> : 
               cyberLogs?.map(l => (
                 <div key={l.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] relative shadow-sm">
                    <p className="font-bold text-rose-500 mb-0.5">{l.username}</p>
                    <p className="text-slate-500">{l.device} • {l.ip}</p>
                    <p className="text-slate-400 text-[8px] mt-1">{new Date(l.timestamp).toLocaleString()}</p>
                    <button onClick={()=>clearLog(l.id)} className="absolute top-2 right-2 text-rose-400 font-bold p-1">លុប</button>
                 </div>
               ))
             }
           </div>
        </div>
      )}
    </div>
  );
};

const LocationCard = ({ location, isFavorite, onToggleFavorite, onClick }) => {
  return (
    <div onClick={onClick} className="glass-panel group rounded-[1.2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col h-full bg-white dark:bg-slate-800 relative">
      <div className="relative h-28 md:h-32 overflow-hidden shrink-0">
        <img src={location.image} alt={location.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-slate-100 dark:bg-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
        <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
          <h3 className="font-bold text-[11px] md:text-xs line-clamp-1 leading-tight">{location.title}</h3>
          <p className="text-[8px] md:text-[9px] text-slate-300 line-clamp-1 font-bold mt-0.5">{location.province || ''} {location.district || ''}</p>
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded text-white text-[8px] font-bold shadow-sm">{location.category}</span>
        </div>
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <p className="text-[9px] text-slate-500 line-clamp-2 flex-1 mb-2 font-medium leading-relaxed">{location.desc}</p>
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-2 mt-auto">
           <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`flex items-center gap-1 text-[10px] font-bold p-1 -m-1 rounded-full transition-colors ${isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}>
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
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden soft-shadow max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        <div className="relative h-40 shrink-0">
          <img src={location.image} alt={location.title} className="w-full h-full object-cover bg-slate-200" />
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 transition-colors rounded-full text-white backdrop-blur-md shadow-sm"><XCircle className="w-5 h-5" /></button>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-3 left-4 text-white">
             <span className="px-2 py-0.5 bg-theme/80 backdrop-blur-md rounded text-white text-[9px] font-bold shadow-sm">{location.category}</span>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1 hide-scrollbar bg-slate-50/50 dark:bg-slate-900">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-base font-bold leading-tight">{location.title}</h2>
                <p className="text-[10px] text-slate-500 font-bold mt-1">{location.institution}</p>
             </div>
             <button onClick={() => toggleFavorite(location.id)} className={`p-2 rounded-full border shadow-sm transition-colors ${isFav ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}><Heart className={`w-4 h-4 ${isFav ? 'fill-current':''}`}/></button>
          </div>
          <div className="flex gap-2 mb-4">
             {location.phone && <a href={`tel:${location.phone}`} className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[10px] shadow-sm active:scale-95 transition-transform"><Phone className="w-3.5 h-3.5"/> Call</a>}
             {location.mapUrl && <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-theme/10 text-theme border border-theme/20 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[10px] shadow-sm active:scale-95 transition-transform"><Navigation className="w-3.5 h-3.5"/> Map</a>}
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{location.desc || 'មិនមានការពិពណ៌នា...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};