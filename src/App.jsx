import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Moon, Sun, Plus, MoreVertical, 
  CheckCircle, XCircle, Trash2, Edit3, Image as ImageIcon, Send, Filter,
  LogOut, Settings, Activity, Users, MapPin, TrendingUp, Phone, Navigation, ShieldAlert, PieChart, BarChart, Eye, LayoutGrid, Monitor, Smartphone, Globe, ChevronDown, ArrowLeft, ArrowRight
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
    body.dark { background-color: #0B1220; color: #FFFFFF; }
    .font-khmer { font-family: var(--font-khmer); }
    .glass-panel { background: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.05); }
    .dark .glass-panel { background: #111827; border: 1px solid #1E293B; }
    .secondary-panel { background: #F8FAFC; border: 1px solid #E2E8F0; }
    .dark .secondary-panel { background: #1E293B; border: 1px solid #334155; }
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
  const [theme, setTheme] = useState('dark');
  const [themeColor, setThemeColor] = useState('#6366F1');
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
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

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

  if (isAuthLoading) return <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-[#0B1220]' : 'bg-slate-50'}`}><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 bg-theme"></div></div>;

  // --- GATEWAY PAGE 1 ---
  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#f8fafd] dark:bg-[#0B1220] flex flex-col md:flex-row font-khmer overflow-y-auto md:overflow-hidden selection:bg-theme selection:text-white">
        
        {/* Language Toggle */}
        <div className="absolute top-4 right-4 z-50">
            <button onClick={() => setLanguage(l => l === 'km' ? 'en' : 'km')} className="px-3 py-1.5 glass-panel rounded-full text-[10px] font-bold text-slate-800 dark:text-white shadow-sm transition-colors flex items-center gap-1.5">
                {language === 'km' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}
            </button>
        </div>

        {/* =========================================
            MOBILE LAYOUT (Hidden on Desktop)
        =========================================== */}
        <div className="md:hidden flex flex-col w-full min-h-screen relative z-10 bg-[#eef3f9] dark:bg-[#0B1220]">
          
          {/* Top Section */}
          <div className="flex flex-col items-center pt-12 px-4 shrink-0 relative z-20">
             <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1E293B] shadow-md mb-4 overflow-hidden bg-white shrink-0">
               <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
             </div>
             <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5 text-center">
               {language === 'km' ? 'សូមស្វាគមន៍មកកាន់ TP nice ' : 'Khmer TP'}
             </h1>
             <p className="text-slate-600 dark:text-[#94A3B8] text-[10px] font-bold flex items-center gap-1.5 opacity-90 mb-4">
               <span>អាចស្វែងរកទិន្នន័យ</span> • <span>ជូនដំណឹងអាសន្ន</span> • <span>រាយការណ៍ណាមួយដែលកើតឡើងក្នុងតំបន់របស់អ្នក!</span>
             </p>
          </div>

          {/* Middle Image Area */}
          <div className="flex-1 w-full px-4 py-2 relative z-20 flex flex-col justify-center min-h-[200px]">
             <img src="back.png" className="w-full h-full object-cover rounded-[24px] shadow-lg border-[3px] border-white dark:border-[#1E293B]" />
          </div>

          {/* Buttons Section */}
          <div className="w-full px-6 pt-4 pb-8 shrink-0 relative z-30">
             <div className="space-y-3 max-w-sm mx-auto">
               <button onClick={() => setCurrentPage('app')} className="w-full bg-slate-900 dark:bg-theme text-white rounded-full p-1.5 flex items-center justify-between shadow-lg active:scale-95 transition border border-transparent">
                 <div className="w-10"></div>
                 <span className="font-bold text-[13px] tracking-wide text-center flex-1">{language === 'km' ? 'អនុញ្ញាតឱ្យខ្លួនឯងចូលប្រើប្រាស់' : 'Allow Access'}</span>
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                    <ArrowRight className="text-slate-900 dark:text-theme w-5 h-5"/>
                 </div>
               </button>
             </div>
          </div>

          {/* Very Bottom Dark Curve */}
          <div className="w-full h-[12vh] shrink-0 relative mt-auto z-10 overflow-hidden">
             <svg viewBox="0 0 1440 320" className="absolute top-0 w-full h-[80px]" preserveAspectRatio="none">
                <path fill="#cda85c" className="dark:fill-[#1E293B]" d="M0,160L80,176C160,192,320,224,480,213.3C640,203,800,149,960,138.7C1120,128,1280,160,1360,176L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
                <path fill="#0f172a" className="dark:fill-[#0B1220]" d="M0,192L80,202.7C160,213,320,235,480,218.7C640,203,800,149,960,144C1120,139,1280,181,1360,202.7L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
             </svg>
             <div className="absolute inset-0 top-[60px] bg-[#0f172a] dark:bg-[#0B1220]"></div>
          </div>
        </div>

        {/* =========================================
            DESKTOP LAYOUT
        =========================================== */}
        <div className="hidden md:flex flex-row w-full h-screen relative z-10">
           <div className="flex-[1.2] flex flex-col justify-center items-center p-12 bg-white dark:bg-[#111827] z-20 shadow-[10px_0_40px_rgba(0,0,0,0.05)] border-r dark:border-[#1E293B]">
              <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-[#1E293B] shadow-lg mb-6 bg-white p-1 shrink-0">
                <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-wide text-center">
                {language === 'km' ? 'សាលារៀនជ័យវរ្ម័នទី៧' : 'Khmer TP'}
              </h1>
              <p className="text-slate-600 dark:text-[#94A3B8] text-sm font-bold flex items-center gap-2 mb-10 opacity-90">
                <span>មូលដ្ឋានសិក្សា</span> • <span>គុណភាព</span> • <span>វិន័យ</span>
              </p>
              <div className="w-full max-w-sm space-y-4">
                <button onClick={() => setCurrentPage('app')} className="w-full bg-slate-900 dark:bg-theme text-white rounded-full p-2 flex items-center justify-between shadow-md active:scale-95 transition hover:opacity-90">
                  <div className="w-12"></div>
                  <span className="font-bold text-base tracking-wide">{language === 'km' ? 'អនុញ្ញាតឱ្យខ្លួនឯងចូលប្រើប្រាស់' : 'Allow Access'}</span>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <ArrowRight className="text-slate-900 dark:text-theme w-5 h-5"/>
                  </div>
                </button>
              </div>
           </div>
           <div className="flex-[1.8] relative h-full">
              <img src="back.png" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/10 to-slate-900/40 dark:to-[#0B1220]/80"></div>
           </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP PAGE 2 ---
  return (
    <div className={`min-h-screen font-khmer transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-[#F8FAFC] dark:bg-[#0B1220] text-slate-800 dark:text-[#FFFFFF] min-h-screen flex selection:bg-theme/30 selection:text-theme">
        
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4">
            <div className={`px-4 py-2.5 rounded-full shadow-lg font-bold text-[12px] flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {toast.type === 'error' ? <XCircle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>} {toast.msg}
            </div>
          </div>
        )}

        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} setAppLogo={setAppLogo} setCurrentPage={setCurrentPage} language={language} />

        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <TopBar theme={theme} toggleTheme={toggleTheme} searchQuery={searchQuery} setSearchQuery={setSearchQuery} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} notifications={notifications} appLogo={appLogo} setAppLogo={setAppLogo} db={db} appId={appId} showToast={showToast} user={user} setCurrentPage={setCurrentPage} language={language} />

          <div className="flex-1 overflow-y-auto px-4 py-4 md:p-6 pb-24 md:pb-6">
            <div className="max-w-5xl mx-auto h-full">
              {currentView === 'home' && <HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} language={language} appLogo={appLogo} />}
              {currentView === 'data' && <DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} language={language} />}
              {currentView === 'reports' && <ReportsView locations={approvedLocations} usersList={usersList} language={language} />}
              {currentView === 'chat' && <ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />}
              {currentView === 'account' && <AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} themeColor={themeColor} setThemeColor={setThemeColor} theme={theme} setTheme={setTheme} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} language={language} />}
              {currentView === 'admin' && isAdmin && <AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} profile={profile} user={user} setIsAdmin={setIsAdmin} />}
            </div>
          </div>
          
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />
        </main>

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
    <aside className="hidden md:flex flex-col w-64 glass-panel z-10 border-r-0 border-r-slate-200 dark:border-r-[#1E293B]">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-[#1E293B]">
          <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-800 dark:text-white">Khmer TP</h1>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-[#94A3B8] mb-2 px-3 uppercase tracking-wider">{language === 'km' ? 'ម៉ឺនុយ' : 'Menu'}</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${currentView === item.id ? 'bg-theme text-white' : 'text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-800 dark:hover:text-white'}`}>
            <item.icon className={`w-4 h-4 ${currentView === item.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
            <div className="font-medium text-sm">{item.label}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const BottomNav = ({ currentView, setCurrentView, isAdmin, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home' },
    { id: 'data', icon: Map, label: language === 'km' ? 'ទិន្នន័យ' : 'Data' },
    { id: 'reports', icon: TrendingUp, label: language === 'km' ? 'របាយការណ៍' : 'Reports' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Chat' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t-0 border-t-slate-200 dark:border-t-[#1E293B] pb-safe pt-1 px-1 z-50">
      <div className="flex justify-between items-center px-1">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setCurrentView(item.id)} 
            className={`flex flex-col items-center justify-center w-full h-[60px] relative transition-colors ${currentView === item.id ? 'text-theme' : 'text-[#94A3B8]'}`}
          >
            <item.icon className={`w-6 h-6 mb-1 ${currentView === item.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen, notifications, appLogo, setAppLogo, db, appId, showToast, user, setCurrentPage, language }) => {
  return (
    <header className="px-4 py-2 md:py-3 md:px-8 glass-panel sticky top-0 z-40 flex items-center justify-between gap-3 border-b-0 border-b-slate-200 dark:border-b-[#1E293B]">
      
      {/* Mobile Back & Brand */}
      <div className="md:hidden flex items-center gap-3 shrink-0">
        <button onClick={()=>setCurrentPage('gateway')} className="text-slate-500 dark:text-[#94A3B8] p-1"><ArrowLeft className="w-5 h-5"/></button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-[#1E293B] overflow-hidden bg-white">
          <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Desktop Back */}
      <button onClick={()=>setCurrentPage('gateway')} className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-[#1E293B] rounded-lg text-xs font-bold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0">
         <ArrowLeft className="w-4 h-4"/> ត្រឡប់
      </button>

      {/* Search Bar */}
      <div className="flex-1 w-full max-w-sm relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#94A3B8]" />
        <input 
          type="text" placeholder={language === 'km' ? "ស្វែងរកទីតាំង..." : "Search..."} 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full secondary-panel text-slate-800 dark:text-white placeholder-[#94A3B8] rounded-full py-2 pl-9 pr-4 outline-none focus:ring-1 focus:ring-theme transition-all text-xs font-medium"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={toggleTheme} className="text-[#94A3B8] hover:text-slate-800 dark:hover:text-white transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative">
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="text-[#94A3B8] hover:text-slate-800 dark:hover:text-white transition-colors relative mt-1">
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#111827]"></span>}
          </button>
          
          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-72 glass-panel soft-shadow rounded-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-[#1E293B] font-bold text-xs flex justify-between items-center bg-slate-50 dark:bg-[#111827]">
                <span>ការជូនដំណឹង</span><button onClick={() => setNotificationsOpen(false)}><XCircle className="w-4 h-4 text-[#94A3B8]" /></button>
              </div>
              <div className="max-h-60 overflow-y-auto bg-white dark:bg-[#111827]">
                {notifications.length === 0 ? <p className="p-4 text-center text-xs font-medium text-[#94A3B8]">គ្មានសារថ្មីទេ</p> : 
                  notifications.map(n => (
                    <div key={n.id} className="p-3 border-b border-slate-50 dark:border-[#1E293B] flex justify-between items-start gap-2">
                      <div className="mt-0.5">{n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : '⏳'}</div>
                      <div className="flex-1">
                        <p className={`text-[11px] font-bold ${n.type === 'error' ? 'text-red-500' : 'text-theme'}`}>{n.title}</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium line-clamp-2">{n.msg}</p>
                      </div>
                      <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notifications', n.id)); }} className="text-[#94A3B8] hover:text-red-500 shrink-0"><XCircle className="w-3.5 h-3.5"/></button>
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
const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, language, appLogo }) => {
  const filtered = locations.filter(l => l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Banner */}
      <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-row items-center gap-4 soft-shadow">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-slate-200 dark:border-[#1E293B] overflow-hidden shrink-0">
           <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-1 leading-tight">
             {language === 'km' ? 'សាលារៀនជ័យវរ្ម័នទី៧' : 'Khmer TP'}
          </h1>
          <p className="text-[10px] md:text-xs text-[#94A3B8] font-bold">
            មូលដ្ឋានសិក្សា • គុណភាព • វិន័យ
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 border-l-4 border-theme pl-2">
          <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
             ទីតាំងសំខាន់ៗដែលបានដាក់បញ្ចូល
          </h2>
        </div>

        {filtered.length === 0 ? (
           <div className="text-center py-8 text-[#94A3B8] glass-panel rounded-2xl font-bold text-xs">គ្មានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((loc, i) => (
              <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} index={i} isAdmin={false} />
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
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), { title: 'សំណើថ្មីបានបញ្ជូន', msg: `រាល់សំណើររបស់អ្នកនឹងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យ។ សូមរង់ចាំ! ⏳`, type: 'info', timestamp: Date.now() });
        showToast('បានផ្ញើរសំណើរ (Admin) ⏳');
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូនទិន្នន័យ', 'error'); }
    setLoading(false);
  };

  if (!profile.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in fade-in">
         <div className="w-16 h-16 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-4"><User className="w-8 h-8" /></div>
         <h2 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-[#94A3B8] mb-6 text-xs font-medium max-w-[260px]">ចូលទៅកំណត់ឈ្មោះក្នុងគណនី (Account) ទើបអាចប្រើប្រាស់មុខងារនេះបាន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-md">
            ទៅកំណត់ឈ្មោះឥឡូវនេះ
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
         <div className="flex secondary-panel p-1 rounded-lg w-[70%] sm:w-auto">
            {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'glass-panel text-theme shadow-sm border-transparent dark:border-transparent' : 'text-[#94A3B8]'}`}>{tab}</button>
            ))}
         </div>
         <button onClick={handleOpenAdd} className="bg-theme text-white p-2 rounded-lg font-bold flex items-center justify-center shadow-sm shrink-0"><Plus className="w-4 h-4"/></button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {['ទាំងអស់', 'ស្រុក', 'ឃុំ', 'ភូមិ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${activeFilter === cat ? 'bg-theme text-white' : 'secondary-panel text-[#94A3B8]'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.length === 0 ? <p className="col-span-full text-center text-[#94A3B8] py-8 font-bold text-xs">គ្មានទិន្នន័យ</p> : 
          filtered.map((loc, i) => (
             <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} index={i} isAdmin={false} />
          ))
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative w-full max-w-sm glass-panel rounded-2xl overflow-hidden soft-shadow max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-[#1E293B] flex justify-between items-center secondary-panel">
              <h2 className="text-sm font-bold text-theme">បន្ថែមទិន្នន័យ</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#94A3B8] hover:text-red-500"><XCircle className="w-4 h-4"/></button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-white dark:bg-[#111827]">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#94A3B8] block mb-1">ប្រភេទ</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full secondary-panel rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-theme font-medium text-slate-800 dark:text-white">
                      <option value="សាលារៀន">សាលារៀន</option><option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option><option value="ប៉ុស្តិ៍ប៉ូលិស">ប៉ុស្តិ៍ប៉ូលិស</option>
                      <option value="មេភូមិ">មេភូមិ</option><option value="មេឃុំ">មេឃុំ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#94A3B8] block mb-1">ឈ្មោះ (Name)</label>
                    <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full secondary-panel rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-theme font-medium text-slate-800 dark:text-white" />
                  </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-[#94A3B8] block mb-1">ឈ្មោះស្ថាប័ន</label>
                    <input type="text" required value={form.institution} onChange={e=>setForm({...form, institution: e.target.value})} className="w-full secondary-panel rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-theme font-medium text-slate-800 dark:text-white" />
                </div>

                {activeTab === 'រតនមណ្ឌល' ? (
                    <div className="grid grid-cols-2 gap-3 p-3 secondary-panel rounded-lg">
                        <div>
                            <label className="text-[10px] font-bold text-[#94A3B8] block mb-1">ឃុំ</label>
                            <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#334155] rounded p-1.5 text-[10px] outline-none font-medium">
                                <option value="">ជ្រើសរើស</option>
                                {Object.keys(REGIONS["រតនមណ្ឌល"] || {}).map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-[#94A3B8] block mb-1">ភូមិ</label>
                            <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#334155] rounded p-1.5 text-[10px] outline-none font-medium">
                                <option value="">ជ្រើសរើស</option>
                                {form.commune && REGIONS["រតនមណ្ឌល"][form.commune] && REGIONS["រតនមណ្ឌល"][form.commune].map(v=><option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 p-3 secondary-panel rounded-lg">
                        <div>
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#334155] rounded p-1.5 text-[10px] outline-none font-medium" placeholder="ខេត្ត"/>
                        </div>
                        <div>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#334155] rounded p-1.5 text-[10px] outline-none font-medium" placeholder="ស្រុក/ខណ្ឌ"/>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full secondary-panel rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-theme font-medium text-slate-800 dark:text-white" placeholder="លេខទូរស័ព្ទ..." />
                  <input type="url" value={form.mapUrl} onChange={e=>setForm({...form, mapUrl: e.target.value})} className="w-full secondary-panel rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-theme font-medium text-slate-800 dark:text-white" placeholder="Google Map..." />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#94A3B8] block mb-1">រូបភាព *</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-300 dark:border-[#334155] rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1E293B] relative overflow-hidden">
                     {form.image ? (
                        <>
                           <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-[#0B1220]/60 flex items-center justify-center opacity-0 hover:opacity-100"><span className="text-white font-bold text-[10px]">ប្តូររូបភាព</span></div>
                        </>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                           <ImageIcon className="w-5 h-5 mb-1" />
                           <span className="text-[10px] font-bold">Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="hidden" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>
              </form>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-[#1E293B] secondary-panel flex justify-end gap-2">
               <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-[#94A3B8] text-xs">បោះបង់</button>
               <button type="submit" form="addForm" disabled={loading} className="px-4 py-2 rounded-lg font-bold bg-theme text-white text-xs">បញ្ជូន</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Reports ---
const ReportsView = ({ locations, usersList, language }) => {
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
  const chartColors = ['bg-[#6366f1]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#f43f5e]', 'bg-[#8b5cf6]', 'bg-[#06b6d4]'];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <h1 className="text-lg font-bold flex items-center gap-2"><PieChart className="w-5 h-5 text-theme" /> {language === 'km' ? 'របាយការណ៍' : 'Reports'}</h1>
      
      <div className="grid grid-cols-2 gap-3">
         {stats.map((s, i) => (
           <div key={i} className="glass-panel p-3 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-[#94A3B8] mb-1">{s.label}</p>
              <h3 className={`text-xl font-black ${s.color}`}>{s.count}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-2xl">
           <h3 className="text-xs font-bold mb-3 text-slate-800 dark:text-white">ស្ថិតិទីតាំង (រង្វង់ភាគរយ)</h3>
           <div className="space-y-3">
             {Object.keys(cats).length === 0 ? <p className="text-[10px] font-bold text-[#94A3B8]">គ្មានទិន្នន័យ (0%)</p> : Object.entries(cats).map(([name, count], i) => {
               const pct = totalUsers > 0 ? Math.round((count/Math.max(locations.length, 1))*100) : 0;
               return (
                 <div key={name}>
                   <div className="flex justify-between text-[10px] font-bold mb-1"><span>{name}</span><span>{pct}%</span></div>
                   <div className="w-full h-1.5 bg-slate-100 dark:bg-[#1E293B] rounded-full overflow-hidden">
                     <div className={`h-full ${chartColors[i%6]} rounded-full`} style={{width:`${pct}%`}}></div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
           <h3 className="text-xs font-bold mb-3 text-slate-800 dark:text-white">ស្ថិតិសកម្មភាពអ្នកប្រើប្រាស់</h3>
           <div className="flex-1 flex items-end gap-3 h-24 border-b border-l border-slate-200 dark:border-[#1E293B] pl-2 pb-2 relative mt-2 w-full">
               {[
                   {label: 'សប្តាហ៍', pct: totalUsers ? Math.round((weeklyUsers/totalUsers)*100) : 0},
                   {label: 'ខែ', pct: totalUsers ? Math.round((monthlyUsers/totalUsers)*100) : 0},
                   {label: 'ឆ្នាំ', pct: totalUsers ? Math.round((yearlyUsers/totalUsers)*100) : 0}
               ].map((d, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1 w-full">
                       <div className="w-full max-w-[20px] bg-theme/80 rounded-t-[4px] relative" style={{height: `${Math.max(d.pct, 5)}%`}}>
                           <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold">{d.pct}%</div>
                       </div>
                       <span className="text-[9px] text-[#94A3B8]">{d.label}</span>
                   </div>
               ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Chat ---
const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView, isAdmin, language }) => {
  const [msgText, setMsgText] = useState('');
  const [activeTarget, setActiveTarget] = useState('Admin');
  const messagesEndRef = useRef(null);
  const targets = ['Admin', 'Village Chief', 'Commune Chief', 'Police'];

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chats]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!profile.username) { showToast('សូមបង្កើតឈ្មោះសិន', 'error'); return; }
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
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in">
         <div className="w-16 h-16 bg-theme/10 text-theme rounded-full flex items-center justify-center mb-4"><MessageCircle className="w-8 h-8" /></div>
         <h2 className="text-lg font-bold mb-2">តម្រូវឲ្យមានឈ្មោះ</h2>
         <p className="text-[#94A3B8] mb-6 text-xs font-medium max-w-[240px]">សូមបង្កើតឈ្មោះរបស់អ្នកជាមុនសិន ទើបអាចចូលទៅកាន់ប្រព័ន្ធផ្ញើសារបាន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-sm">ទៅកំណត់ឈ្មោះ</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] glass-panel rounded-2xl overflow-hidden soft-shadow">
      <div className="p-3 border-b border-slate-100 dark:border-[#1E293B] secondary-panel flex flex-col gap-3">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-theme text-white flex items-center justify-center font-bold text-xs shrink-0">TP</div>
            <div>
                <h2 className="font-bold text-xs">Chat TP</h2>
                <div className="flex items-center gap-1 text-[9px] text-[#94A3B8] font-bold">
                    User ↔ {activeTarget}
                </div>
            </div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {targets.map(t => (
                <button key={t} onClick={() => setActiveTarget(t)} className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${activeTarget === t ? 'bg-theme text-white' : 'glass-panel text-[#94A3B8] border-transparent'}`}>{t}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white dark:bg-[#0B1220]/30">
        {filteredChats.length === 0 ? <p className="text-center text-[#94A3B8] py-8 font-bold text-[11px]">មិនទាន់មានសារទេ</p> : 
          filteredChats.map(msg => {
            const isMe = msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[9px] font-bold text-[#94A3B8] ml-2">{msg.userName}</span>}
                  <div className={`px-3 py-2 rounded-xl text-xs font-medium ${isMe ? 'bg-theme text-white rounded-br-sm' : 'secondary-panel text-slate-800 dark:text-white rounded-bl-sm'}`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 secondary-panel border-t border-slate-100 dark:border-[#1E293B]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="សរសេរសារ..." className="flex-1 h-10 glass-panel border-transparent rounded-full px-4 text-xs font-medium outline-none focus:ring-1 focus:ring-theme" />
          <button type="submit" disabled={!msgText.trim()} className="w-10 h-10 rounded-full bg-theme text-white flex items-center justify-center disabled:opacity-50 shrink-0"><Send className="w-4 h-4 ml-0.5" /></button>
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
  const tColors = ['#6366F1', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const handleAdminLogin = async () => {
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true); 
      showToast('ចូលប្រើជា Admin ជោគជ័យ');
      setShowAdminLogin(false);
    } else {
      showToast('លេខសម្ងាត់ខុស', 'error');
      const info = getDeviceInfo();
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), {
         username: profile.username || 'Anonymous', ...info, ip: 'Hidden', timestamp: Date.now()
      });
      setPwd('');
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-4 animate-in fade-in duration-300">
      
      {/* Profile Card */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center">
        <div className="w-[80px] h-[80px] rounded-full secondary-panel mb-3 overflow-hidden border-2 border-theme relative group">
             <img src={profile.avatar} className="w-full h-full object-cover" alt="av"/>
             <label className="absolute inset-0 bg-[#0B1220]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                <Edit3 className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{avatar:r.result}); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
        </div>
        <div className="w-full space-y-1.5">
           <label className="text-[10px] font-bold text-[#94A3B8] text-left block">ឈ្មោះ (Name)</label>
           <div className="flex gap-2">
               <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 h-10 secondary-panel border-none px-3 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-theme" />
               <button onClick={()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{username: localName})} className="h-10 bg-theme text-white px-4 rounded-lg text-xs font-bold shadow-sm">Save</button>
           </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="glass-panel p-2 rounded-2xl space-y-1">
         
         <div className="flex items-center justify-between p-3">
            <span className="font-bold text-xs text-slate-800 dark:text-white">Dark Mode</span>
            <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="text-[#94A3B8]">
              {theme === 'dark' ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
            </button>
         </div>

         <div className="flex flex-col p-3 border-t border-slate-100 dark:border-[#1E293B]">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowColorPicker(!showColorPicker)}>
               <span className="font-bold text-xs text-slate-800 dark:text-white">ប្តូរពណ៌ (Theme Color)</span>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" style={{backgroundColor: themeColor}}></div>
                 <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
               </div>
            </div>
            {showColorPicker && (
               <div className="flex gap-2 pt-3 justify-center">
                 {tColors.map(c => <button key={c} onClick={()=>setThemeColor(c)} className={`w-6 h-6 rounded-full transition-transform ${themeColor===c?'ring-1 ring-offset-1 ring-slate-400 scale-110':'hover:scale-110'}`} style={{backgroundColor: c}}></button>)}
               </div>
            )}
         </div>

         <div className="p-2 border-t border-slate-100 dark:border-[#1E293B]">
            <button onClick={() => setShowAdminLogin(true)} className="w-full secondary-panel text-[#94A3B8] h-10 rounded-lg font-bold flex items-center justify-center gap-1.5 text-xs">
               <ShieldAlert className="w-4 h-4"/> កិច្ចការរដ្ឋបាល (Admin)
            </button>
         </div>
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-sm" onClick={() => setShowAdminLogin(false)}></div>
           <div className="relative w-full max-w-[280px] glass-panel rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-theme"/> បញ្ចូលលេខសម្ងាត់</h3>
                 <button onClick={() => setShowAdminLogin(false)} className="text-[#94A3B8]"><XCircle className="w-4 h-4"/></button>
              </div>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password" className="w-full h-10 secondary-panel px-3 rounded-lg mb-4 text-center tracking-[0.2em] outline-none font-bold text-sm"/>
              <button onClick={handleAdminLogin} className="w-full h-10 bg-theme text-white rounded-lg font-bold text-xs shadow-sm">ចូលប្រព័ន្ធ</button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- View: Admin Dashboard ---
const AdminDashboard = ({ locations, pendingLocations, usersList, cyberLogs, chats, db, appId, showToast, setCurrentView, setIsAdmin }) => {
  const [activeTab, setActiveTab] = useState('approvals');
  
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
    setCurrentView('home');
    showToast('ចាកចេញពី Admin រួចរាល់');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between glass-panel p-4 rounded-2xl">
        <h1 className="text-base font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-theme"/> Admin</h1>
        <button onClick={handleAdminLogout} className="h-8 px-3 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {[
          {id: 'approvals', label: `អនុម័ត (${pendingLocations.length})`}, {id: 'data', label: 'ទិន្នន័យ'}, {id: 'security', label: 'សន្តិសុខ'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 h-8 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-theme text-white' : 'glass-panel text-[#94A3B8]'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'approvals' && (
        <div className="glass-panel p-4 rounded-2xl">
           <div className="space-y-3">
             {pendingLocations.length === 0 ? <p className="text-xs text-[#94A3B8] font-bold text-center py-6">គ្មានសំណើរថ្មី</p> : 
               pendingLocations.map(loc => (
                 <div key={loc.id} className="p-3 secondary-panel rounded-xl flex items-center justify-between gap-2 border-none">
                    <div className="flex items-center gap-3">
                      <img src={loc.image} className="w-10 h-10 object-cover rounded-lg shrink-0 bg-slate-200" alt=""/>
                      <div>
                        <p className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{loc.title}</p>
                        <p className="text-[9px] text-[#94A3B8]">{loc.author}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={()=>handleApprove(loc.id)} className="w-8 h-8 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg flex items-center justify-center"><CheckCircle className="w-4 h-4"/></button>
                      <button onClick={()=>handleReject(loc.id)} className="w-8 h-8 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg flex items-center justify-center"><XCircle className="w-4 h-4"/></button>
                    </div>
                 </div>
               ))
             }
           </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="glass-panel p-4 rounded-2xl">
           <div className="space-y-2 max-h-60 overflow-y-auto">
             {locations.filter(l=>l.status==='approved').map(l => (
               <div key={l.id} className="p-2 secondary-panel rounded-lg flex justify-between items-center text-[11px] border-none">
                 <span className="font-bold truncate max-w-[180px]">{l.title}</span>
                 <button onClick={()=>handleReject(l.id)} className="p-1 text-red-500 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-panel p-4 rounded-2xl">
           <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-xs">Security Logs</h3>
             <button onClick={()=>clearLog()} className="text-[9px] text-red-500 font-bold">Clear All</button>
           </div>
           <div className="space-y-2 max-h-60 overflow-y-auto">
             {cyberLogs.length === 0 ? <p className="text-xs font-bold text-[#94A3B8] py-4 text-center">Safe</p> : 
               cyberLogs.map(l => (
                 <div key={l.id} className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg text-[10px] relative">
                    <p className="font-bold text-red-500">{l.username}</p>
                    <p className="text-slate-500">IP: {l.ip}</p>
                    <button onClick={()=>clearLog(l.id)} className="absolute top-2 right-2 text-red-400"><XCircle className="w-3.5 h-3.5"/></button>
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
    <div onClick={onClick} className="glass-panel group rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full relative">
      <div className="relative h-28 overflow-hidden shrink-0">
        <img src={location.image} alt={location.title} className="w-full h-full object-cover bg-slate-200 dark:bg-[#1E293B]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80"></div>
        <div className="absolute bottom-2 left-3 right-3 text-white">
          <h3 className="font-bold text-[11px] line-clamp-1">{location.title}</h3>
          <p className="text-[8px] text-[#94A3B8] font-bold">{location.province || ''} {location.district || ''}</p>
        </div>
      </div>
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
           <span className="text-[8px] px-1.5 py-0.5 secondary-panel rounded text-[#94A3B8] font-bold">{location.category}</span>
           <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-1 rounded transition-colors ${isFavorite ? 'text-rose-500' : 'text-[#94A3B8]'}`}>
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
      <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm glass-panel rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="relative h-40 shrink-0">
          <img src={location.image} alt={location.title} className="w-full h-full object-cover bg-slate-200" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-[#0B1220]/60 rounded-full text-white backdrop-blur-md"><XCircle className="w-5 h-5" /></button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-base font-bold text-white line-clamp-2">{location.title}</h2>
            <span className="text-[10px] text-theme font-bold">{location.category}</span>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-white dark:bg-[#0B1220]">
          <div className="flex justify-between items-start gap-3">
             <div className="flex-1">
                <p className="text-[10px] text-[#94A3B8] font-bold mb-1"><MapPin className="w-3 h-3 inline mr-1 -mt-0.5"/> {location.province} • {location.district}</p>
                <p className="text-xs text-slate-800 dark:text-white font-bold mt-1">ស្ថាប័ន: <span className="text-theme">{location.institution}</span></p>
             </div>
             <button onClick={() => toggleFavorite(location.id)} className={`p-2 rounded-full transition-colors border ${isFav ? 'bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-900/20 dark:border-rose-900/50' : 'bg-slate-50 border-slate-100 text-[#94A3B8] dark:bg-[#1E293B] dark:border-[#1E293B]'}`}><Heart className={`w-5 h-5 ${isFav ? 'fill-current':''}`}/></button>
          </div>
          
          <div className="flex gap-2">
             {location.phone && (
               <a href={`tel:${location.phone}`} className="flex-1 h-10 secondary-panel text-emerald-600 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[10px]"><Phone className="w-3.5 h-3.5"/> Call</a>
             )}
             {location.mapUrl && <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 h-10 secondary-panel text-theme rounded-xl flex items-center justify-center gap-1.5 font-bold text-[10px]"><Navigation className="w-3.5 h-3.5"/> Map</a>}
          </div>

          <div className="secondary-panel p-3 rounded-xl text-[11px] font-medium text-slate-600 dark:text-[#94A3B8] leading-relaxed border-none">
             {location.desc || 'មិនមានការពិពណ៌នា...'}
          </div>
        </div>
      </div>
    </div>
  );
};