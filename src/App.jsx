import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Plus, XCircle, Trash2, Edit3, 
  Image as ImageIcon, Send, LogOut, Settings, 
  LayoutGrid, Navigation, ShieldAlert, TrendingUp, Phone, CheckCircle, ArrowLeft, 
  ChevronDown, Globe, ArrowRight, Loader2, Clock, MapPin, PlusCircle, Copyright, Mic, Users, Camera
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

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
    let device = "Unknown", type = "PC";
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

// Force Light Mode ONLY & Prevent Zooming Completely
const injectStyles = (colorHex) => {
  const styleId = 'khmer-app-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
  styleEl.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700;900&display=swap');
    :root { 
      --font-khmer: 'Noto Sans Khmer', sans-serif; 
      --theme-color: ${colorHex}; 
    }
    * { 
      -webkit-tap-highlight-color: transparent; 
      touch-action: manipulation; 
    }
    html, body { 
      overscroll-behavior-y: none; 
      background-color: #f8fafc; /* Strict Light Mode Background */
      color: #0f172a;
      margin: 0; padding: 0; width: 100%; height: 100%;
    }
    .font-khmer { font-family: var(--font-khmer); }
    
    /* Strict stability for mobile text inputs - Prevents viewport zooming */
    input, textarea, select { 
      font-size: 16px !important; 
      touch-action: manipulation;
    } 
    
    .glass-panel { background: rgba(255, 255, 255, 1); border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .secondary-panel { background: #F8FAFC; border: 1px solid #E2E8F0; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .bg-theme { background-color: var(--theme-color) !important; }
    .text-theme { color: var(--theme-color) !important; }
    .border-theme { border-color: var(--theme-color) !important; }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
    .pt-safe { padding-top: env(safe-area-inset-top, 20px); }
  `;
};

// Helper to ensure rendering is safe against object injection
const safeStr = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => safeStr(v)).join(' • ');
  if (typeof val === 'object') {
     try { return JSON.stringify(val); } catch(e) { return fallback; }
  }
  return fallback;
};

// Custom Confirm Modal Component
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 border border-slate-100">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4 mx-auto border border-rose-100">
          <ShieldAlert className="w-7 h-7 text-rose-500" />
        </div>
        <h3 className="text-xl font-black text-center text-slate-800 mb-2">{safeStr(title)}</h3>
        <p className="text-[14px] text-center text-slate-500 mb-8 leading-relaxed font-medium">{safeStr(message)}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-600 active:scale-95 transition-transform hover:bg-slate-200">បដិសេធ (Cancel)</button>
          <button onClick={onConfirm} className="flex-1 py-3.5 rounded-xl font-bold bg-rose-600 text-white shadow-md active:scale-95 transition-transform hover:bg-rose-700">លុប (Confirm)</button>
        </div>
      </div>
    </div>
  );
};

// Default Hierarchy Settings
const DEFAULT_REGIONS = {
  "រតនមណ្ឌល": { "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"], "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"], "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"] }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState('gateway'); 
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('khmer_tp_color') || '#0f8b65');
  const [language, setLanguage] = useState(() => localStorage.getItem('khmer_tp_lang') || 'km'); 
  
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('khmer_tp_logo') || 'logo.png'); 
  
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' });
  const [locations, setLocations] = useState([]); 
  const [usersList, setUsersList] = useState([]); 
  const [chats, setChats] = useState([]);
  const [chatTargets, setChatTargets] = useState([]);
  const [cyberLogs, setCyberLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [dbRegions, setDbRegions] = useState(DEFAULT_REGIONS);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { 
    // Enforce no-zoom and remove dark classes on load
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');

    injectStyles(themeColor); 
    localStorage.setItem('khmer_tp_color', themeColor);
  }, [themeColor]);

  useEffect(() => { localStorage.setItem('khmer_tp_lang', language); }, [language]);
  useEffect(() => { localStorage.setItem('khmer_tp_logo', appLogo); }, [appLogo]);

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

  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
    const updatePresence = () => { setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(() => {}); };
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000); 

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setDoc(profileRef, { username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', uid: user.uid, timestamp: Date.now(), lastActive: Date.now() }, { merge: true });
    });

    const allUsersRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_data');
    const unsubAllUsers = onSnapshot(allUsersRef, snap => {
       setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const locationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'database_admin');
    const unsubLocations = onSnapshot(locationsRef, (snapshot) => setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    // Update to user_chat as requested
    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_chat');
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
    
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions');
    const unsubConfig = onSnapshot(configRef, (snap) => {
        if(snap.exists() && snap.data().data) {
            setDbRegions(snap.data().data);
        } else {
            setDoc(configRef, { data: DEFAULT_REGIONS }, { merge: true });
            setDbRegions(DEFAULT_REGIONS);
        }
    });

    const targetsRef = collection(db, 'artifacts', appId, 'public', 'data', 'chat_targets');
    const unsubTargets = onSnapshot(targetsRef, (snap) => {
      if (snap.empty) {
        const defaultTargets = [
          { id: 'Admin', label: 'Admin Support', role: 'Support', status: 'online', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
          { id: 'Police', label: 'ប៉ូលីស (Police)', role: 'Emergency', status: 'online', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
          { id: 'Commune Chief', label: 'មេឃុំ (Commune)', role: 'Administration', status: 'online', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
        ];
        defaultTargets.forEach(t => {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', t.id), t).catch(() => {});
        });
      } else {
        const trg = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        trg.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChatTargets(trg);
      }
    });

    return () => { clearInterval(presenceInterval); unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); unsubLogs(); unsubNotif(); unsubFavs(); unsubConfig(); unsubTargets(); };
  }, [user]);

  const showToast = (msg, type = 'success', duration = 4000) => { 
      const safeMsg = typeof msg === 'string' ? msg : 'Error';
      setToast({ msg: safeMsg, type }); 
      setTimeout(() => setToast(null), duration); 
  };

  const toggleFavorite = async (locationId) => {
    if (!user) return;
    const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', locationId);
    const locRef = doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', locationId);
    try {
      if (favorites[locationId]) { await deleteDoc(favDocRef); await updateDoc(locRef, { likes: increment(-1) }); } 
      else { await setDoc(favDocRef, { timestamp: Date.now() }); await updateDoc(locRef, { likes: increment(1) }); }
    } catch (e) { console.error('Error toggling favorite:', e); }
  };

  const approvedLocations = useMemo(() => locations.filter(l => l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => locations.filter(l => l.status === 'pending'), [locations]);

  if (isAuthLoading) return <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f8b65]"></div></div>;

  // ==========================================
  // GATEWAY PAGE 1
  // ==========================================
  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col font-khmer bg-slate-50 overflow-y-auto hide-scrollbar text-white md:flex-row">
        <div className="bg-[#0f8b65] w-full h-[55vh] md:h-[100vh] md:w-1/2 rounded-b-[3.5rem] md:rounded-b-none md:rounded-r-[3.5rem] relative flex flex-col items-center pt-safe px-6 shadow-xl shrink-0 overflow-hidden">
            <img 
              src="back.png" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="background" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#021f1b]/80 via-[#0f8b65]/70 to-[#0f8b65]/95"></div>
            
            <div className="w-28 h-28 bg-white rounded-full p-1.5 shadow-2xl mb-6 mt-12 md:mt-24 z-10 relative border-[3px] border-white/30">
               <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            
            {/* Exact Title Requested */}
            <h1 className="text-white font-black text-2xl md:text-3xl z-10 tracking-wide drop-shadow-md text-center px-4 leading-snug">
                សូមស្វាគមន៍មកកាន់ TP Nice វិ.ស.ស
            </h1>
        </div>

        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-safe text-center justify-center z-10 relative md:w-1/2">
           <div className="max-w-sm w-full space-y-3 mb-10">
              <h2 className="text-2xl font-black text-slate-800 leading-tight">
                  ទិន្នន័យ & ទំនាក់ទំនង
              </h2>
              <p className="text-slate-500 text-[14px] leading-relaxed font-medium">
                  ប្រព័ន្ធរុករកទិន្នន័យ និងសម្របសម្រួលទំនាក់ទំនងក្នុងគ្រាអាសន្ន។ បង្កើតឡើងដើម្បីផ្តល់ភាពងាយស្រួលដល់ប្រជាពលរដ្ឋ។
              </p>
           </div>
           
           <div className="w-full max-w-[260px]">
              <button onClick={() => setCurrentPage('app')} className="w-full bg-[#0f8b65] text-white py-3.5 px-5 rounded-full font-bold text-[16px] shadow-lg shadow-teal-700/20 hover:bg-[#0d6e50] active:scale-95 transition-all duration-300 flex justify-between items-center group border border-teal-500">
                 <div className="w-10"></div>
                 <span className="flex-1 tracking-wide text-center">ចូលប្រើប្រាស់</span>
                 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:translate-x-1 transition-transform border border-white/30">
                    <ArrowRight className="text-white w-5 h-5"/>
                 </div>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN APP PAGE 2 
  // ==========================================
  return (
    <div className="min-h-[100dvh] font-khmer bg-slate-50 text-slate-800 flex flex-col md:flex-row pb-[65px] md:pb-0">
      
      {toast && (
        <div className="fixed top-safe mt-2 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top-5 fade-in duration-300 w-full max-w-[90vw] md:max-w-sm">
          <div className={`px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-start gap-3 backdrop-blur-md border ${toast.type === 'error' ? 'bg-rose-500 text-white border-rose-400' : toast.type === 'info' ? 'bg-slate-800 text-white border-slate-600' : 'bg-emerald-600 text-white border-emerald-400'}`}>
            {toast.type === 'error' ? <XCircle className="w-5 h-5 shrink-0 mt-0.5"/> : toast.type === 'info' ? <Bell className="w-5 h-5 shrink-0 mt-0.5"/> : <CheckCircle className="w-5 h-5 shrink-0 mt-0.5"/>} 
            <span className="flex-1 text-left leading-relaxed">{safeStr(toast.msg)}</span>
          </div>
        </div>
      )}

      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} language={language} />

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative w-full">
        
        <TopHeader 
            setCurrentPage={setCurrentPage} notifications={notifications} notificationsOpen={notificationsOpen} 
            setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            db={db} appId={appId} user={user} appLogo={appLogo} currentView={currentView} language={language}
        />

        <div className={`flex-1 overflow-x-hidden ${currentView === 'chat' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6 lg:p-8'} w-full max-w-7xl mx-auto pb-6`}>
          {currentView === 'home' && <HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} setCurrentView={setCurrentView} language={language} />}
          {currentView === 'data' && <DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} dbRegions={dbRegions} language={language} />}
          {currentView === 'reports' && <ReportsView locations={approvedLocations} usersList={usersList} />}
          {currentView === 'chat' && <ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} usersList={usersList} chatTargets={chatTargets} language={language} />}
          {currentView === 'account' && <AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} themeColor={themeColor} setThemeColor={setThemeColor} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />}
          {currentView === 'admin' && isAdmin && <AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} dbRegions={dbRegions} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} setIsAdmin={setIsAdmin} chatTargets={chatTargets} />}
        </div>
      </main>

      <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />

      {selectedLocation && <LocationDetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} />}
    </div>
  );
}

// ==========================================
// VIEWS & COMPONENTS
// ==========================================

const Sidebar = ({ currentView, setCurrentView, isAdmin, appLogo, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home' },
    { id: 'data', icon: LayoutGrid, label: language === 'km' ? 'ទិន្នន័យ' : 'Data' },
    { id: 'reports', icon: TrendingUp, label: language === 'km' ? 'របាយការណ៍' : 'Reports' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Messages' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin' });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-10 h-[100dvh] shrink-0 shadow-sm">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
           <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-black text-lg text-theme leading-tight">TP Nice វិ.ស.ស</h1>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto hide-scrollbar">
        <div className="text-[10px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">ម៉ឺនុយ</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors duration-200 ${currentView === item.id ? 'bg-theme/10 text-theme font-bold' : 'text-slate-500 hover:bg-slate-50 font-medium'}`}>
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'stroke-[2px]' : ''}`} />
            <div className="text-sm">{item.label}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const BottomNav = ({ currentView, setCurrentView, isAdmin, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home' },
    { id: 'data', icon: LayoutGrid, label: language === 'km' ? 'ទិន្នន័យ' : 'Data' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Messages' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-[65px] pb-safe px-1">
      {navItems.map(item => {
         const isActive = currentView === item.id;
         return (
           <button key={item.id} onClick={() => setCurrentView(item.id)} className="relative flex-1 flex flex-col items-center justify-center h-full active:bg-slate-50 transition-colors">
             <div className={`flex flex-col items-center justify-center transition-colors ${isActive ? 'text-theme -translate-y-1' : 'text-slate-400'}`}>
                <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className="text-[9px] font-bold">{item.label}</span>
             </div>
           </button>
         )
      })}
      </div>
    </div>
  );
};

// UNIFIED HEADER
const TopHeader = ({ setCurrentPage, notifications, notificationsOpen, setNotificationsOpen, searchQuery, setSearchQuery, db, appId, user, appLogo, currentView, language }) => {
    return (
        <div className="bg-white border-b border-slate-200 pt-[calc(env(safe-area-inset-top,10px)+10px)] px-4 md:px-8 pb-4 shadow-sm relative z-40 shrink-0">
           
           <div className="flex justify-between items-center mb-4 pt-2">
              {/* Logo left as requested */}
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-sm border border-slate-200">
                    <img src={appLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-[16px] font-black leading-tight text-slate-800 tracking-wide">TP Nice វិ.ស.ស</h1>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="relative">
                     <button className="p-2.5 bg-slate-50 rounded-full active:scale-95 transition shadow-sm relative border border-slate-200 hover:bg-slate-100" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-5 h-5 text-slate-600" />
                        {notifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
                     </button>
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in zoom-in-95">
                          <div className="p-3.5 border-b border-slate-100 font-bold flex justify-between text-sm bg-slate-50">
                            <span>ការជូនដំណឹង</span><button onClick={() => setNotificationsOpen(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <p className="p-5 text-center text-sm text-slate-500 font-bold">គ្មានសារថ្មីទេ</p> : 
                              notifications.map(n => (
                                <div key={n.id} className="p-4 border-b border-slate-50 flex justify-between items-start gap-3 hover:bg-slate-50 transition-colors">
                                  <div className="flex-1">
                                    <p className={`text-xs font-black ${n.type === 'error' ? 'text-rose-500' : 'text-theme'}`}>{safeStr(n.title)}</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">{safeStr(n.msg)}</p>
                                  </div>
                                  <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notifications', n.id)); }} className="text-slate-400 hover:text-rose-500 shrink-0 p-1"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col gap-3 w-full">
              {currentView !== 'home' && (
                 <div className="md:hidden flex">
                    <button onClick={()=>setCurrentPage('gateway')} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-transform hover:bg-slate-100">
                       <ArrowLeft className="w-3.5 h-3.5"/> ត្រឡប់ក្រោយ
                    </button>
                 </div>
              )}
              
              {/* Only show Search Box on Home page */}
              {currentView === 'home' && (
                  <div className="relative w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme bg-theme/10 p-1.5 rounded-md">
                       <Search className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      placeholder={language === 'km' ? "ស្វែងរកទីតាំង ឬសេវាកម្ម..." : "Search locations..."} 
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl py-3.5 pl-12 pr-4 outline-none text-[15px] font-bold shadow-inner border border-slate-200 focus:border-theme/50 transition-all m-0" 
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
              )}
           </div>
        </div>
    );
};

// --- View: Home ---
const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, setCurrentView, language }) => {
  const [activeHomeFilter, setActiveHomeFilter] = useState('All');
  
  const filtered = locations.filter(l => {
     const combinedNames = Array.isArray(l.names) ? l.names.join(' ') : safeStr(l.title);
     const safeDesc = safeStr(l.desc);
     const matchesSearch = combinedNames.toLowerCase().includes(searchQuery.toLowerCase()) || safeDesc.toLowerCase().includes(searchQuery.toLowerCase());
     if(activeHomeFilter === 'All') return matchesSearch;
     if(activeHomeFilter === 'រតនមណ្ឌល') return matchesSearch && l.district === 'រតនមណ្ឌល';
     if(activeHomeFilter === 'ផ្សេងៗ') return matchesSearch && l.district !== 'រតនមណ្ឌល';
     return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pt-2">
      
      <div className="bg-[#0f8b65] rounded-[1.5rem] p-5 shadow-lg relative overflow-hidden flex flex-row items-center justify-between border border-teal-800/20 w-full min-h-[140px]">
         <div className="absolute top-0 right-0 w-32 h-full bg-[#0a664a] rounded-l-[100px] z-0"></div>
         <div className="flex-1 z-10 pr-2">
             <h1 className="text-[17px] md:text-xl font-black text-white leading-tight mb-2 tracking-wide font-khmer">
                 ទិន្នន័យសំខាន់ៗ នៅទីនេះ!
             </h1>
             <p className="text-[11px] md:text-xs text-teal-100 mb-4 leading-relaxed font-medium">
                 រហ័ស ងាយស្រួល និងអាចទុកចិត្តបាន សម្រាប់អ្នកទាំងអស់គ្នា
             </p>
             <button onClick={()=>setCurrentView('data')} className="bg-white text-[#0f8b65] px-4 py-2.5 rounded-full text-[11px] font-black shadow-md active:scale-95 transition-transform flex items-center gap-1.5 w-fit hover:bg-slate-50">
                 ស្វែងយល់ <ArrowRight className="w-3.5 h-3.5"/>
             </button>
         </div>
         <div className="w-[85px] h-[85px] md:w-[110px] md:h-[110px] shrink-0 z-10 overflow-hidden rounded-full shadow-md bg-[#e6f4ea] border-[4px] border-[#34d399] flex items-center justify-center">
             <MessageCircle className="w-10 h-10 text-[#0f8b65] opacity-50" />
         </div>
      </div>

      <div>
         <div className="flex justify-between items-center mb-4 px-1 border-l-4 border-theme pl-2">
            <h2 className="font-black text-sm text-slate-800 leading-none">ជម្រើសទីតាំង</h2>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`bg-white p-4 rounded-[1.2rem] flex flex-col justify-center items-center shadow-md border transition-all active:scale-95 ${activeHomeFilter==='រតនមណ្ឌល' ? 'border-theme ring-2 ring-theme bg-theme/5' : 'border-slate-200 hover:border-theme/50'}`}>
               <div className={`p-3 rounded-full mb-2 ${activeHomeFilter==='រតនមណ្ឌល' ? 'bg-theme text-white' : 'bg-teal-50 text-theme'}`}><Map className="w-6 h-6 stroke-[2px]"/></div>
               <span className="font-black text-sm text-slate-800">រតនមណ្ឌល</span>
            </button>
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='ផ្សេងៗ'?'All':'ផ្សេងៗ')} className={`bg-white p-4 rounded-[1.2rem] flex flex-col justify-center items-center shadow-md border transition-all active:scale-95 ${activeHomeFilter==='ផ្សេងៗ' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
               <div className={`p-3 rounded-full mb-2 ${activeHomeFilter==='ផ្សេងៗ' ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-500'}`}><Globe className="w-6 h-6 stroke-[2px]"/></div>
               <span className="font-black text-sm text-slate-800">ស្រុកផ្សេងៗ</span>
            </button>
         </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 px-1 border-l-4 border-rose-500 pl-2">
          <h2 className="text-sm font-black text-slate-800 leading-none">ទិន្នន័យដែលបានបញ្ចូល</h2>
          <button onClick={() => setCurrentView('data')} className="text-[10px] font-bold text-theme flex items-center gap-1 hover:underline bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm active:scale-95 hover:bg-slate-50">មើលទាំងអស់ <ArrowRight className="w-3 h-3"/></button>
        </div>
        {filtered.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-[1.5rem] border-2 border-dashed border-slate-200 font-bold text-sm text-slate-400 shadow-sm">គ្មានទិន្នន័យ (No data found)</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(loc => (
              <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- View: Data (Data Management) ---
const DataView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId, setCurrentView, dbRegions }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Data Management: Names (Array), Phone, Role, Description, Map Coordinates
  const [form, setForm] = useState({ names: [''], role: '', phone: '', image: '', coords: null, mapUrl: '', desc: '', category: 'ឃុំ', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle, loading, success, error

  const filtered = locations.filter(l => {
    const combinedNames = Array.isArray(l.names) ? l.names.join(' ') : safeStr(l.title);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = combinedNames.toLowerCase().includes(searchLower) || safeStr(l.desc).toLowerCase().includes(searchLower) || safeStr(l.role).toLowerCase().includes(searchLower);
    
    const isRatanak = l.district === 'រតនមណ្ឌល';
    if (activeTab === 'រតនមណ្ឌល' && !isRatanak) return false;
    if (activeTab === 'ស្រុកផ្សេងៗ' && isRatanak) return false;
    
    let matchesLevel = true;
    if (activeFilter === 'ឃុំ' && l.category !== 'ឃុំ') matchesLevel = false;
    if (activeFilter === 'ភូមិ' && l.category !== 'ភូមិ') matchesLevel = false;
    if (activeFilter === 'ប៉ូលីស' && l.category !== 'ប៉ូលីស') matchesLevel = false;
    if (activeFilter === 'ពេទ្យ' && l.category !== 'មន្ទីរពេទ្យ') matchesLevel = false;
    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    if (!isAdmin && !profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error'); setCurrentView('account'); return; }
    setForm({ names: [''], role: '', phone: '', image: '', coords: null, mapUrl: '', desc: '', category: 'ឃុំ', province: '', district: '', commune: '', village: '' });
    setGpsStatus('idle');
    setIsAddModalOpen(true);
  };

  const handleAddNameField = () => { if(form.names.length < 3) setForm({ ...form, names: [...form.names, ''] }); };
  const handleNameChange = (val, idx) => {
      const newNames = [...form.names];
      newNames[idx] = val;
      setForm({ ...form, names: newNames });
  };
  const handleRemoveNameField = (idx) => {
      if(form.names.length <= 1) return;
      const newNames = form.names.filter((_, i) => i !== idx);
      setForm({ ...form, names: newNames });
  };

  const handleCaptureGPS = (e) => {
     e.preventDefault();
     setGpsStatus('loading');
     if(navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
             (pos) => {
                 setForm({...form, coords: {lat: pos.coords.latitude, lng: pos.coords.longitude}});
                 setGpsStatus('success');
                 showToast('ចាប់ទីតាំងបានជោគជ័យ', 'success');
             },
             (err) => {
                 setGpsStatus('error');
                 showToast('មិនអាចចាប់ទីតាំងបានទេ!', 'error');
             }
         );
     } else {
         setGpsStatus('error');
         showToast('ឧបករណ៍របស់អ្នកមិនស្គាល់ GPS ទេ', 'error');
     }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const validNames = form.names.filter(n => n.trim() !== '');
    if (validNames.length === 0) return showToast('សូមបញ្ចូលយ៉ាងហោចណាស់ឈ្មោះមួយ', 'error');
    if (!form.image) return showToast('សូមបញ្ចូលរូបភាព', 'error');
    
    setLoading(true);
    try {
      const titleStr = validNames.join(' | '); 
      let submitData = { ...form, title: titleStr, author: profile.username || 'Admin', authorUid: user.uid, timestamp: Date.now() };
      
      delete submitData.names; 

      if (activeTab === 'រតនមណ្ឌល') { submitData.province = 'បាត់ដំបង'; submitData.district = 'រតនមណ្ឌល'; }
      
      // Store in database_admin collection
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'database_admin'), { ...submitData, status: isAdmin ? 'approved' : 'pending', likes: 0, timestamp: Date.now() });
      
      if (isAdmin) {
        showToast('ទិន្នន័យត្រូវបានបញ្ចូលជោគជ័យ ✅');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), { title: 'សំណើបញ្ជូនជោគជ័យ ⏳', msg: `រាល់សំណើរដែលអ្នកបានផ្ញើរនិងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យពី admin ដើម្បីបញ្ចាក់ថាទិន្នន័យពិតឬក្លែងក្លាយ។`, type: 'info', timestamp: Date.now() });
        showToast('រាល់សំណើរដែលអ្នកបានផ្ញើរនិងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យពី admin ដើម្បីបញ្ចាក់ថាទិន្នន័យពិតឬក្លែងក្លាយ ។', 'info', 6000);
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូន', 'error'); }
    setLoading(false);
  };

  if (!profile.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in zoom-in duration-300">
         <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm"><User className="w-10 h-10" /></div>
         <h2 className="text-xl font-black mb-2 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-8 text-sm max-w-xs font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះរបស់អ្នកសិន។ បើគ្មានឈ្មោះទេ មិនអាចបញ្ជូលទិន្នន័យបានទេ។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-teal-600/20 active:scale-95 text-sm transition-transform hover:bg-[#0d6e50]">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  const ratanakCommunes = dbRegions && dbRegions["រតនមណ្ឌល"] ? Object.keys(dbRegions["រតនមណ្ឌល"]) : [];
  const selectedCommuneVillages = form.commune && dbRegions && dbRegions["រតនមណ្ឌល"] && dbRegions["រតនមណ្ឌល"][form.commune] ? dbRegions["រតនមណ្ឌល"][form.commune] : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300 mt-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
         <h1 className="text-lg font-black px-1 text-slate-800">ទិន្នន័យ</h1>
         <button onClick={handleOpenAdd} className="w-full sm:w-auto bg-theme text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm active:scale-95 transition-transform"><Plus className="w-5 h-5"/> បន្ថែមទិន្នន័យទីតាំង</button>
      </div>

      <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm overflow-hidden">
         {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === tab ? 'bg-slate-100 text-theme shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
         ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pt-1">
        {['ទាំងអស់', 'ឃុំ', 'ភូមិ', 'ប៉ូលីស', 'ពេទ្យ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-5 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap shrink-0 border shadow-sm ${activeFilter === cat ? 'bg-theme text-white border-theme' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <MapPin className="w-12 h-12 text-slate-300 mb-3" />
             <p className="font-bold text-sm text-slate-500">មិនមានទិន្នន័យសម្រាប់ជម្រើសនេះទេ</p>
          </div>
        ) : 
          filtered.map(loc => <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />)
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 px-0 md:px-4">
          <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[90dvh] md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 border border-slate-200 pointer-events-auto">
            <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-base font-black text-theme">បន្ថែមទិន្នន័យ: {activeTab}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white shadow-sm border border-slate-200 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors active:scale-95"><XCircle className="w-5 h-5 text-slate-500"/></button>
            </div>
            
            <div className="p-4 md:p-5 overflow-y-auto flex-1 hide-scrollbar bg-white">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-5">
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner space-y-3">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">ឈ្មោះ (Names) *</label>
                      <button type="button" onClick={handleAddNameField} className="text-theme text-[10px] font-black bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1 active:scale-95 hover:bg-slate-50"><Plus className="w-3 h-3"/> បន្ថែម</button>
                   </div>
                   {form.names.map((name, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                         <input type="text" required value={name} onChange={e=>handleNameChange(e.target.value, idx)} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-[16px] outline-none focus:border-theme font-bold shadow-sm m-0 text-slate-800" placeholder={`ឈ្មោះទី ${idx+1}...`} />
                         {form.names.length > 1 && (
                            <button type="button" onClick={()=>handleRemoveNameField(idx)} className="p-3.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 active:scale-95 shadow-sm hover:bg-rose-100"><Trash2 className="w-5 h-5"/></button>
                         )}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1.5 ml-1">ប្រភេទ Category *</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[16px] outline-none focus:border-theme font-bold shadow-inner appearance-none cursor-pointer m-0 text-slate-800">
                      <option value="ឃុំ">ឃុំ</option><option value="ភូមិ">ភូមិ</option><option value="ប៉ូលិស">ប៉ូលិស</option>
                      <option value="ពេទ្យ">ពេទ្យ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1.5 ml-1">តួនាទី (Role) *</label>
                    <input type="text" required value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[16px] outline-none focus:border-theme font-bold shadow-inner m-0 text-slate-800" placeholder="ឧ: ប្រធានភូមិ..." />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                    <label className="text-[11px] font-bold text-slate-600 block mb-2 border-b border-slate-200 pb-2">កំណត់ទីតាំង</label>
                    {activeTab === 'រតនមណ្ឌល' ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1 ml-1">ឃុំ</label>
                                <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white rounded-xl p-3 text-[16px] outline-none font-bold border border-slate-200 m-0 shadow-sm appearance-none cursor-pointer text-slate-800">
                                    <option value="">ជ្រើសរើសឃុំ</option>
                                    {ratanakCommunes.map(c=><option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1 ml-1">ភូមិ</label>
                                <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white rounded-xl p-3 text-[16px] outline-none font-bold border border-slate-200 disabled:opacity-50 m-0 shadow-sm appearance-none cursor-pointer text-slate-800">
                                    <option value="">ជ្រើសរើសភូមិ</option>
                                    {selectedCommuneVillages.map(v=><option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ខេត្ត..."/>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ស្រុក..."/>
                            <input type="text" value={form.commune} onChange={e=>setForm({...form, commune: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ឃុំ..."/>
                            <input type="text" value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ភូមិ..."/>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1.5 ml-1">លេខទូរស័ព្ទ *</label>
                      <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[16px] outline-none focus:border-theme font-bold shadow-inner m-0 text-slate-800" placeholder="លេខទូរស័ព្ទ..." />
                  </div>
                  <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1.5 ml-1">ទីតាំង (GPS Map)</label>
                      {/* GPS LOCATION BUTTON INSTEAD OF URL */}
                      <button type="button" onClick={handleCaptureGPS} className={`w-full flex items-center justify-center gap-2 rounded-xl p-3.5 text-sm font-bold shadow-sm active:scale-95 transition-colors border ${gpsStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                         {gpsStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin"/> : (gpsStatus === 'success' ? <CheckCircle className="w-4 h-4"/> : <MapPin className="w-4 h-4"/>)}
                         {gpsStatus === 'success' ? 'ចាប់ទីតាំងបានជោគជ័យ' : 'ចាប់ទីតាំងបច្ចុប្បន្ន'}
                      </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5 ml-1">រូបភាព (Upload Picture) *</label>
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 relative overflow-hidden transition-colors shadow-inner">
                     {form.image ? (
                        <><img src={form.image} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"><span className="text-slate-800 font-bold bg-white/90 px-4 py-2 rounded-xl text-xs backdrop-blur-md shadow-sm flex gap-2 items-center pointer-events-auto"><Edit3 className="w-4 h-4"/> ប្តូររូបភាព</span></div></>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-2"><ImageIcon className="w-6 h-6 text-slate-400" /></div>
                           <span className="text-xs font-bold text-slate-500">ចុចទីនេះដើម្បី Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="hidden" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>
                
                <div>
                   <label className="text-[11px] font-bold text-slate-500 block mb-1.5 ml-1">ការពណ៌នា (Description)</label>
                   <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="សរសេរការពណ៌នាខ្លីៗ..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[16px] outline-none focus:border-theme h-28 resize-none font-medium shadow-inner m-0 text-slate-800"></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 md:p-5 border-t border-slate-100 shrink-0 pb-safe bg-slate-50">
               <button type="submit" form="addForm" disabled={loading} className="w-full py-4 rounded-xl font-black bg-slate-800 hover:bg-slate-900 text-white active:scale-95 disabled:opacity-50 transition shadow-lg text-[15px] flex justify-center items-center gap-2 tracking-wide uppercase">
                   {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> កំពុងផ្ញើរ...</> : 'ផ្ញើរសំណើរ'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Reports ---
const ReportsView = ({ locations, usersList }) => {
  const now = Date.now();
  const weekAgo = now - 604800000;
  const monthAgo = now - 2592000000;
  const yearAgo = now - 31536000000;

  const totalUsers = usersList.length;
  const weeklyUsers = usersList.filter(u => u.timestamp > weekAgo).length;
  const monthlyUsers = usersList.filter(u => u.timestamp > monthAgo).length;
  const yearlyUsers = usersList.filter(u => u.timestamp > yearAgo).length;

  const calcPct = (part, total) => total > 0 ? Math.round((part/total)*100) : 0;

  const stats = [
    { label: 'អ្នកប្រើប្រាស់សរុប', count: totalUsers, pct: 100, color: 'text-slate-800' },
    { label: 'សប្តាហ៍នេះ', count: weeklyUsers, pct: calcPct(weeklyUsers, totalUsers), color: 'text-theme' },
    { label: 'ខែនេះ', count: monthlyUsers, pct: calcPct(monthlyUsers, totalUsers), color: 'text-indigo-600' },
    { label: 'ឆ្នាំនេះ', count: yearlyUsers, pct: calcPct(yearlyUsers, totalUsers), color: 'text-rose-600' },
  ];

  const cats = locations.reduce((acc, l) => { acc[safeStr(l.category)] = (acc[safeStr(l.category)]||0)+1; return acc; }, {});
  const chartColors = ['#0f766e', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6'];
  const pieChartData = Object.entries(cats).map(([name, value]) => ({name, value}));

  const currentYear = new Date().getFullYear();
  const monthlyData = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'].map((name, index) => {
    const startM = new Date(currentYear, index, 1).getTime();
    const endM = new Date(currentYear, index + 1, 0, 23, 59, 59).getTime();
    const usersInMonth = usersList.filter(u => (u.timestamp || 0) >= startM && (u.timestamp || 0) <= endM).length;
    const entriesInMonth = locations.filter(l => (l.timestamp || 0) >= startM && (l.timestamp || 0) <= endM).length;
    return { name, users: usersInMonth, entries: entriesInMonth };
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pt-2">
      <h1 className="text-xl font-black text-slate-800 border-l-4 border-slate-800 pl-2">របាយការណ៍សង្ខេប</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
              <h3 className={`text-3xl font-black ${s.color}`}>{s.count}</h3>
              <div className="absolute top-4 right-4 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-[9px] font-bold text-slate-500">
                  {s.pct}%
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="text-sm font-bold text-slate-700 mb-6 border-l-4 border-indigo-500 pl-2">កំណើនអ្នកប្រើប្រាស់ (Bar)</h3>
           <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}} />
                   <Bar dataKey="users" fill="#6366f1" radius={[4,4,0,0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="text-sm font-bold text-slate-700 mb-6 border-l-4 border-theme pl-2">ទិន្នន័យបញ្ចូល (Line)</h3>
           <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                   <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}} />
                   <Line type="monotone" dataKey="entries" stroke="#0f766e" strokeWidth={3} dot={{r: 4, fill: '#0f766e'}} activeDot={{r: 6}} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 w-full">
                <h3 className="text-sm font-black text-slate-800 mb-2 border-l-4 border-rose-500 pl-2">ចំណាត់ថ្នាក់ទិន្នន័យ (Pie)</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">ការបែងចែកទិន្នន័យតាមតួនាទី និងស្ថាប័ន។</p>
                <div className="space-y-3">
                   {pieChartData.length === 0 ? <p className="text-xs text-slate-400 font-bold">No Data</p> : 
                     pieChartData.map((d, i) => (
                       <div key={d.name} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{backgroundColor: chartColors[i%chartColors.length]}}></div>
                             <span className="text-xs font-bold text-slate-700">{d.name}</span>
                          </div>
                          <span className="text-xs font-black">{d.value}</span>
                       </div>
                     ))
                   }
                </div>
            </div>
            <div className="h-64 w-full md:w-1/2">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                       {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- View: Chat (Messenger Style Mobile Optimization) ---
const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView, isAdmin, usersList, chatTargets }) => {
  const [msgText, setMsgText] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const messagesEndRef = useRef(null);

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chats, activeChatUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error'); setCurrentView('account'); return; }
    if (!msgText.trim()) return;
    
    // Change to user_chat as requested
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
      text: msgText, 
      target: activeChatUser.id, 
      userId: user.uid, 
      userName: profile.username, 
      timestamp: Date.now()
    });
    setMsgText('');
  };

  const deleteMessage = async (msgId) => {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_chat', msgId));
  };

  if (!profile.username) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in">
         <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 border border-indigo-100 shadow-sm"><MessageCircle className="w-10 h-10" /></div>
         <h2 className="text-xl font-black mb-2 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-sm mb-8 max-w-xs font-medium">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះមុននឹងផ្ញើសារ។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-md active:scale-95 transition-transform hover:bg-[#0d6e50]">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  // --- CONTACT LIST VIEW ---
  if (!activeChatUser) {
     const contactsToShow = isAdmin 
       ? usersList.map(u => ({ id: u.uid || u.id, label: safeStr(u.username) || 'Unknown', avatar: u.avatar, isOnline: (Date.now() - (u.lastActive||0)) < 120000 }))
       : chatTargets || [];

     return (
        // Changed to strictly fill height without scrolling document
        <div className="flex flex-col h-full md:bg-white md:rounded-3xl md:border md:border-slate-200 overflow-hidden md:shadow-sm">
           <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 shrink-0 hidden md:block">
               <h1 className="text-xl font-black text-slate-800">សារ</h1>
               <p className="text-xs text-slate-500 font-bold mt-1">ភ្ជាប់ទំនាក់ទំនងភ្លាមៗ</p>
           </div>
           <div className="flex-1 overflow-y-auto p-2 md:p-4 hide-scrollbar bg-slate-50 md:bg-white">
              {contactsToShow && contactsToShow.map((contact, i) => (
                  <div key={contact.id || i} onClick={() => setActiveChatUser(contact)} className="flex items-center gap-4 p-4 hover:bg-slate-100 bg-white rounded-2xl cursor-pointer transition-colors active:scale-95 border border-slate-100 mb-2 shadow-sm">
                      <div className="relative">
                          {contact.avatar ? (
                             <img src={contact.avatar} className="w-14 h-14 rounded-full border border-slate-200 object-cover shadow-sm bg-white" alt="av"/>
                          ) : (
                             <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm"><Users className="w-6 h-6"/></div>
                          )}
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[3px] border-white ${contact.isOnline || contact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="flex-1 pb-1">
                          <h3 className="font-bold text-[16px] text-slate-800 leading-tight">{safeStr(contact.label)}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">{contact.isOnline || contact.status === 'online' ? 'Online ឥឡូវនេះ' : 'Offline'}</p>
                      </div>
                  </div>
              ))}
           </div>
        </div>
     );
  }

  // --- MESSAGE ROOM VIEW ---
  const filteredChats = chats.filter(c => {
      if(isAdmin) return c.userId === activeChatUser.id;
      return c.userId === user.uid && c.target === activeChatUser.id;
  });

  return (
    // Strictly constrained container for chat
    <div className="flex flex-col h-full bg-slate-50 md:bg-white md:rounded-3xl md:border md:border-slate-200 overflow-hidden relative shadow-sm">
      
      {/* Chat Header */}
      <div className="p-3 md:p-4 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0 z-10 shadow-sm">
        <button onClick={() => setActiveChatUser(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 active:scale-95 transition border border-slate-200"><ArrowLeft className="w-5 h-5 text-slate-600"/></button>
        <div className="relative">
           {activeChatUser.avatar ? (
               <img src={activeChatUser.avatar} className="w-10 h-10 rounded-full border border-slate-200 object-cover" alt="av"/>
            ) : (
               <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500"><Users className="w-5 h-5"/></div>
            )}
           <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${activeChatUser.isOnline || activeChatUser.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
        </div>
        <div>
            <h2 className="font-black text-sm text-slate-800">{safeStr(activeChatUser.label)}</h2>
            <p className="text-[10px] font-bold text-slate-500">{activeChatUser.isOnline || activeChatUser.status === 'online' ? 'Active now' : 'Offline'}</p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50 hide-scrollbar pb-[100px]">
        {filteredChats.length === 0 ? <p className="text-center text-slate-400 py-10 text-xs font-bold bg-white rounded-2xl border border-dashed border-slate-200 max-w-xs mx-auto mt-10 p-6">ចាប់ផ្តើមការសន្ទនា...</p> : 
          filteredChats.map(msg => {
            const isMe = isAdmin ? msg.target === activeChatUser.id : msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`flex max-w-[80%] md:max-w-[60%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-500 ml-1">{safeStr(msg.userName)}</span>}
                  <div className="flex items-center gap-2">
                      {isMe && <button onClick={()=>deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-50 rounded-full transition"><Trash2 className="w-3.5 h-3.5"/></button>}
                      <div className={`px-4 py-3 rounded-2xl text-[15px] font-medium leading-relaxed shadow-sm border ${isMe ? 'bg-theme text-white rounded-br-sm border-transparent' : 'bg-white text-slate-800 rounded-bl-sm border-slate-200'}`}>
                        <p>{safeStr(msg.text)}</p>
                      </div>
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Chat Input Area strictly bound to bottom */}
      <div className="p-2 md:p-3 bg-white border-t border-slate-200 shrink-0 pb-safe z-10">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Action Icons aligned near input */}
          <button type="button" className="p-2.5 text-slate-400 hover:text-theme bg-slate-50 hover:bg-slate-100 rounded-full transition active:scale-95"><Plus className="w-5 h-5"/></button>
          <button type="button" className="p-2.5 text-rose-400 hover:text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-full transition active:scale-95"><Camera className="w-5 h-5"/></button>
          <button type="button" className="p-2.5 text-sky-500 hover:text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-full transition active:scale-95" title="Police Tracking (UI)"><MapPin className="w-5 h-5"/></button>

          <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Aa" className="flex-1 bg-slate-100 border border-transparent rounded-full py-3 px-5 text-[16px] outline-none focus:border-theme/30 focus:bg-white transition-colors m-0 shadow-inner text-slate-800" />
          
          {msgText.trim() ? (
              <button type="submit" className="w-12 h-12 rounded-full bg-theme text-white flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform"><Send className="w-5 h-5 ml-1" /></button>
          ) : (
              <button type="button" className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors"><Mic className="w-5 h-5"/></button>
          )}
        </form>
      </div>
    </div>
  );
};

const AccountView = ({ user, profile, db, appId, showToast, setIsAdmin, themeColor, setThemeColor }) => {
  const [pwd, setPwd] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [localName, setLocalName] = useState(profile.username || '');
  const [isEditingName, setIsEditingName] = useState(profile.username ? false : true);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tColors = ['#0f8b65', '#2563eb', '#4f46e5', '#db2777', '#dc2626']; 

  const handleAdminLogin = async () => {
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true); 
      showToast('ចូលប្រើជា Admin ជោគជ័យ');
      setShowAdminLogin(false);
      setPwd('');
    } else {
      showToast('លេខសម្ងាត់ខុស', 'error');
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
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10 mt-4">
      <div className="flex items-center gap-3 mb-2 px-2">
         <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm"><User className="w-6 h-6"/></div>
         <h1 className="text-2xl font-black text-slate-800">គណនី</h1>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] flex flex-col items-center shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100"></div>
        <div className="w-24 h-24 rounded-full bg-white mb-6 overflow-hidden border-4 border-white shadow-xl relative group z-10">
             <img src={profile.avatar} className="w-full h-full object-cover bg-slate-100" alt="av"/>
             <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Edit3 className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{avatar:r.result}); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
        </div>
        <div className="w-full relative z-10">
           <label className="text-xs font-bold text-slate-500 pl-1 mb-2 block text-center uppercase tracking-wider">ឈ្មោះអ្នកប្រើប្រាស់</label>
           {isEditingName ? (
               <div className="flex flex-col sm:flex-row gap-3">
                   <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-[16px] font-bold outline-none focus:border-theme shadow-inner text-center sm:text-left m-0 text-slate-800" placeholder="កំណត់ឈ្មោះរបស់អ្នក..."/>
                   <button onClick={handleSaveName} className="bg-theme text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-teal-600/20 active:scale-95 transition-transform w-full sm:w-auto hover:bg-[#0d6e50]">រក្សាទុក</button>
               </div>
           ) : (
               <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl shadow-inner">
                   <span className="text-lg font-black text-slate-800">{safeStr(profile.username)}</span>
                   <button onClick={() => setIsEditingName(true)} className="text-theme bg-teal-50 border border-teal-100 font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm"><Edit3 className="w-3.5 h-3.5"/> កែប្រែ</button>
               </div>
           )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">
         <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
            <Settings className="w-5 h-5 text-slate-400"/> ការកំណត់ (Settings)
         </h2>
         
         <div className="relative flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowColorPicker(!showColorPicker)}>
               <span className="font-bold text-xs text-slate-700">ប្តូរពណ៌ Theme Color</span>
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-white shadow-sm" style={{backgroundColor: themeColor}}></div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showColorPicker ? 'rotate-180' : ''}`} />
               </div>
            </div>
            {showColorPicker && (
               <div className="flex gap-3 pt-4 border-t border-slate-200 justify-center animate-in slide-in-from-top-2 flex-wrap">
                 {tColors.map(c => <button key={c} onClick={()=>setThemeColor(c)} className={`w-8 h-8 rounded-full shadow-sm transition-transform ${themeColor===c?'ring-2 ring-slate-800 scale-110':'hover:scale-110'}`} style={{backgroundColor: c}}></button>)}
               </div>
            )}
         </div>

         <div className="pt-2">
            <button onClick={() => setShowAdminLogin(true)} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-slate-900 transition active:scale-95 shadow-md">
               <ShieldAlert className="w-4 h-4 text-amber-400"/> ចូលប្រើជា Admin (Admin Portal)
            </button>
         </div>
      </div>

      {/* Admin Verification Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in bg-slate-900/60 backdrop-blur-sm">
           <div className="relative w-full max-w-xs mx-auto bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200 shadow-sm"><ShieldAlert className="w-8 h-8 text-slate-600"/></div>
              <h3 className="text-lg font-black mb-6 text-slate-800">ផ្ទៀងផ្ទាត់សិទ្ធិ Admin</h3>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password..." className="w-full bg-slate-50 p-4 rounded-2xl mb-6 text-center tracking-[0.3em] outline-none font-bold border border-slate-200 text-[16px] focus:border-slate-400 shadow-inner m-0 text-slate-800"/>
              <div className="flex gap-3">
                <button onClick={() => setShowAdminLogin(false)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-xs border border-slate-200 active:scale-95 transition-transform hover:bg-slate-200">បោះបង់</button>
                <button onClick={handleAdminLogin} className="flex-1 bg-slate-800 text-white py-3.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform hover:bg-slate-900">ចូល</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// ADMIN VIEW - Secure Firebase Dashboard
const AdminDashboard = ({ locations = [], pendingLocations = [], usersList = [], cyberLogs = [], dbRegions, db, appId, showToast, setCurrentView, setIsAdmin, chatTargets }) => {
  const [activeTab, setActiveTab] = useState('data'); 
  const [editingLoc, setEditingLoc] = useState(null);

  // Unified Confirm Action State
  const [confirmAction, setConfirmAction] = useState(null);
  const openConfirm = (title, message, action) => setConfirmAction({ title, message, action });
  const handleConfirm = async () => {
     if (confirmAction && confirmAction.action) await confirmAction.action();
     setConfirmAction(null);
  };

  // Form states for adding Hierarchy 
  const [newCommune, setNewCommune] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  
  // Custom chat target form states
  const [newChatLabel, setNewChatLabel] = useState('');
  const [newChatRole, setNewChatRole] = useState('');
  const [newChatAvatar, setNewChatAvatar] = useState('');

  const ratanakCommunes = dbRegions && dbRegions["រតនមណ្ឌល"] ? dbRegions["រតនមណ្ឌល"] : {};

  const handleApprove = async (id, authorUid) => { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id), { status: 'approved' }); 
      if(authorUid) await addDoc(collection(db, 'artifacts', appId, 'users', authorUid, 'notifications'), { title: 'សំណើរជោគជ័យ ✅', msg: 'ទិន្នន័យត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធផ្លូវការ។', type: 'success', timestamp: Date.now() });
      showToast('អនុម័តជោគជ័យ ✅'); 
  };
  
  const handleReject = (id, authorUid) => { 
      openConfirm("បញ្ជាក់ការបដិសេធ", "តើអ្នកពិតជាចង់បដិសេធ និងលុបសំណើរនេះមែនទេ?", async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id)); 
        if(authorUid) await addDoc(collection(db, 'artifacts', appId, 'users', authorUid, 'notifications'), { title: 'សំណើរបដិសេធ', msg: 'សំណើររបស់អ្នកត្រូវបានបដិសេធ ❌', type: 'error', timestamp: Date.now() });
        showToast('បានបដិសេធសំណើរ', 'error'); 
      });
  };

  const confirmDeleteLocation = (id) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទិន្នន័យទីតាំងនេះមែនទេ?", async () => {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id));
         showToast('លុបទិន្នន័យបានជោគជ័យ');
      });
  };

  const clearLog = (id = null) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបកំណត់ត្រាសុវត្ថិភាពនេះមែនទេ?", async () => {
         if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
         else cyberLogs?.forEach(async l => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)));
      });
  };
  
  const handleAdminLogout = () => { setIsAdmin(false); setCurrentView('home'); showToast('បានចាកចេញពី Admin'); };
  
  const handleEditSave = async (e) => { 
      e.preventDefault(); 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', editingLoc.id), editingLoc); 
      setEditingLoc(null); 
      showToast('កែប្រែជោគជ័យ'); 
  };

  const handleAddCommune = async (e) => {
     e.preventDefault();
     if(!newCommune.trim()) return;
     const currentData = dbRegions["រតនមណ្ឌល"] || {};
     if(currentData[newCommune]) return showToast('ឃុំនេះមានរួចហើយ!', 'error');
     const updated = { ...dbRegions, "រតនមណ្ឌល": { ...currentData, [newCommune]: [] } };
     await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updated });
     setNewCommune(''); showToast('បន្ថែមឃុំជោគជ័យ');
  };

  const handleAddVillage = async (e) => {
     e.preventDefault();
     if(!selectedCommune || !newVillage.trim()) return showToast('សូមជ្រើសរើសឃុំសិន', 'error');
     const currentData = dbRegions["រតនមណ្ឌល"] || {};
     const currentVillages = currentData[selectedCommune] || [];
     if(currentVillages.includes(newVillage)) return showToast('ភូមិនេះមានរួចហើយ!', 'error');
     const updated = { ...dbRegions, "រតនមណ្ឌល": { ...currentData, [selectedCommune]: [...currentVillages, newVillage] } };
     await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updated });
     setNewVillage(''); showToast('បន្ថែមភូមិជោគជ័យ');
  };

  const handleDeleteCommune = (cName) => {
     openConfirm("បញ្ជាក់ការលុប", `តើអ្នកពិតជាចង់លុបឃុំ ${cName} មែនទេ?`, async () => {
         const currentData = { ...dbRegions["រតនមណ្ឌល"] };
         delete currentData[cName];
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: { ...dbRegions, "រតនមណ្ឌល": currentData } });
     });
  };

  const handleDeleteVillage = (cName, vName) => {
     openConfirm("បញ្ជាក់ការលុប", `តើអ្នកពិតជាចង់លុបភូមិ ${vName} មែនទេ?`, async () => {
         const currentVillages = dbRegions["រតនមណ្ឌល"][cName] || [];
         const updatedVillages = currentVillages.filter(v => v !== vName);
         const currentData = { ...dbRegions["រតនមណ្ឌល"], [cName]: updatedVillages };
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: { ...dbRegions, "រតនមណ្ឌល": currentData } });
     });
  };

  const handleAddChatTarget = async (e) => {
     e.preventDefault();
     if(!newChatLabel.trim()) return;
     const id = crypto.randomUUID();
     await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', id), {
        id,
        label: newChatLabel,
        role: newChatRole || 'ភ្នាក់ងារ',
        avatar: newChatAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        status: 'online',
        isDefault: false,
        timestamp: Date.now()
     });
     setNewChatLabel(''); setNewChatRole(''); setNewChatAvatar('');
     showToast('បន្ថែមទំនាក់ទំនងឆាតថ្មីជោគជ័យ ✅');
  };

  const handleDeleteChatTarget = (id) => {
     openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទំនាក់ទំនងឆាតនេះមែនទេ?", async () => {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', id));
         showToast('លុបជោគជ័យ ✅');
     });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 max-w-5xl mx-auto relative">
      
      <ConfirmModal 
         isOpen={!!confirmAction} 
         title={confirmAction?.title} 
         message={confirmAction?.message}
         onConfirm={handleConfirm}
         onCancel={() => setConfirmAction(null)}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800 text-white p-5 md:p-6 rounded-[2rem] shadow-lg border border-slate-700">
        <div>
           <h1 className="text-lg md:text-xl font-black flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-emerald-400"/> Firebase Admin Panel</h1>
           <p className="text-[11px] text-slate-400 mt-1 font-bold">ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យផ្លូវការ</p>
        </div>
        <button onClick={handleAdminLogout} className="mt-5 sm:mt-0 px-5 py-2.5 bg-slate-700 hover:bg-rose-600 rounded-xl text-xs font-black flex items-center gap-2 transition-colors shadow-sm active:scale-95"><LogOut className="w-4 h-4"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 pt-2">
        {[
          {id: 'data', label: 'ទិន្នន័យ & ទីតាំង'}, {id: 'chat_manage', label: 'គ្រប់គ្រងទំនាក់ទំនងឆាត'}, {id: 'approvals', label: 'អនុម័តសំណើរ'}, {id: 'security', label: 'កំណត់ត្រា Security'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-colors border shadow-sm ${activeTab === t.id ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'approvals' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <h3 className="font-black text-sm mb-5 border-l-4 border-amber-500 pl-3 text-slate-800">សំណើររង់ចាំ (Pending: {pendingLocations?.length||0})</h3>
           <div className="space-y-4">
             {pendingLocations?.length === 0 ? <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"><p className="text-sm text-slate-400 font-bold">គ្មានសំណើរថ្មីទេ</p></div> : 
               pendingLocations.map(loc => {
                 const displayTitle = Array.isArray(loc.names) ? loc.names.join(' • ') : safeStr(loc.title);
                 return (
                 <div key={loc.id} className="p-4 bg-slate-50 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-4 w-full md:w-auto">
                      <img src={loc.image} className="w-16 h-16 object-cover rounded-xl bg-slate-200 shrink-0 shadow-sm border border-slate-200" alt="loc"/>
                      <div className="flex-1">
                        <p className="font-black text-sm text-slate-800 leading-tight">{displayTitle}</p>
                        <p className="text-[11px] text-slate-600 font-bold mt-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 w-fit">{safeStr(loc.category)}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">ស្នើដោយ: {safeStr(loc.author)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={()=>handleApprove(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-transform hover:bg-emerald-700">អនុម័ត</button>
                      <button onClick={()=>handleReject(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-rose-50 text-rose-600 border border-rose-200 px-6 py-3 rounded-xl font-black text-xs shadow-sm active:scale-95 transition-transform hover:bg-rose-100">បដិសេធ</button>
                    </div>
                 </div>
               )})
             }
           </div>
        </div>
      )}

      {activeTab === 'chat_manage' && (
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-black text-sm border-l-4 border-theme pl-3 text-slate-800">បន្ថែមទំនាក់ទំនងសម្រាប់ Chat TP</h3>
            
            <form onSubmit={handleAddChatTarget} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 block mb-1">ឈ្មោះទំនាក់ទំនង (Label)</label>
                     <input type="text" value={newChatLabel} onChange={e=>setNewChatLabel(e.target.value)} required placeholder="ឧ: លោក មេភូមិសំបួរ..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[16px] font-bold text-slate-800 outline-none focus:border-theme shadow-sm m-0" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 block mb-1">តួនាទី (Role)</label>
                     <input type="text" value={newChatRole} onChange={e=>setNewChatRole(e.target.value)} required placeholder="ឧ: រដ្ឋបាល ឬ សន្តិសុខ..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[16px] font-bold text-slate-800 outline-none focus:border-theme shadow-sm m-0" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 block mb-1">Upload រូបភាព (Image Avatar)</label>
                     <div className="flex items-center gap-2">
                         {newChatAvatar ? <img src={newChatAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" /> : <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400"/></div>}
                         <input type="file" accept="image/*" onChange={e => {
                             if (e.target.files[0]) {
                                 const r = new FileReader();
                                 r.onload = () => setNewChatAvatar(r.result);
                                 r.readAsDataURL(e.target.files[0]);
                             }
                         }} className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] font-bold text-slate-800 outline-none focus:border-theme shadow-sm m-0" />
                     </div>
                  </div>
               </div>
               <button type="submit" className="bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-black shadow active:scale-95 transition-all w-full md:w-auto hover:bg-slate-900">
                  + បន្ថែមទំនាក់ទំនង
               </button>
            </form>

            <div className="space-y-3">
               <h4 className="font-black text-xs text-slate-500">បញ្ជីទំនាក់ទំនងបច្ចុប្បន្ន</h4>
               <div className="space-y-3">
                  {chatTargets && chatTargets.map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                         <div className="flex items-center gap-3">
                            <img src={t.avatar} className="w-10 h-10 rounded-full object-cover border bg-white" alt="avatar" />
                            <div>
                               <p className="text-xs font-black text-slate-800">{safeStr(t.label)}</p>
                               <span className="text-[10px] text-slate-500 font-bold">{safeStr(t.role)}</span>
                            </div>
                         </div>
                         <button onClick={()=>handleDeleteChatTarget(t.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl border border-rose-100 active:scale-95 transition-all">
                            <Trash2 className="w-4 h-4"/>
                         </button>
                      </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {activeTab === 'data' && (
         <div className="space-y-6">
            
            {/* Added Section based on i2.png */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
               <h3 className="font-black text-sm mb-5 border-l-4 border-amber-500 pl-3 text-slate-800">រចនាសម្ព័ន្ធទីតាំង (រតនមណ្ឌល)</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                       <label className="text-xs font-bold text-slate-600 mb-3 block">បន្ថែមឃុំថ្មី</label>
                       <form onSubmit={handleAddCommune} className="flex gap-3">
                           <input type="text" value={newCommune} onChange={e=>setNewCommune(e.target.value)} placeholder="ឈ្មោះឃុំ..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[16px] outline-none focus:border-theme shadow-inner text-slate-800 m-0"/>
                           <button type="submit" className="bg-[#0f766e] text-white px-5 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform hover:bg-[#0d6e50]">បន្ថែម</button>
                       </form>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                       <label className="text-xs font-bold text-slate-600 mb-3 block">បន្ថែមភូមិថ្មី</label>
                       <form onSubmit={handleAddVillage} className="space-y-3">
                           <select value={selectedCommune} onChange={e=>setSelectedCommune(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[16px] outline-none shadow-inner appearance-none cursor-pointer m-0 text-slate-800">
                               <option value="">ជ្រើសរើសឃុំ...</option>
                               {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.keys(dbRegions["រតនមណ្ឌល"]).map(c=><option key={c} value={c}>{c}</option>)}
                           </select>
                           <div className="flex gap-3">
                               <input type="text" value={newVillage} onChange={e=>setNewVillage(e.target.value)} placeholder="ឈ្មោះភូមិ..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[16px] outline-none focus:border-theme shadow-inner text-slate-800 m-0"/>
                               <button type="submit" className="bg-[#0f766e] text-white px-5 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform hover:bg-[#0d6e50]">បន្ថែម</button>
                           </div>
                       </form>
                   </div>
               </div>
               
               <div className="space-y-4">
                   {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.entries(dbRegions["រតនមណ្ឌល"]).map(([cName, villages]) => (
                       <div key={cName} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                           <div className="bg-slate-100 p-4 flex justify-between items-center border-b border-slate-200">
                               <span className="font-bold text-sm text-slate-800">ឃុំ: {cName}</span>
                               <button onClick={()=>handleDeleteCommune(cName)} className="text-rose-500 hover:text-rose-600 p-1 bg-white rounded border border-rose-100"><Trash2 className="w-4 h-4"/></button>
                           </div>
                           <div className="p-4 flex flex-wrap gap-2">
                               {villages.length === 0 ? <span className="text-[10px] text-slate-400">គ្មានភូមិ</span> : 
                                 villages.map(vName => (
                                     <div key={vName} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm">
                                         {vName} <button onClick={()=>handleDeleteVillage(cName, vName)} className="text-slate-400 hover:text-rose-500"><XCircle className="w-3.5 h-3.5"/></button>
                                     </div>
                                 ))
                               }
                           </div>
                       </div>
                   ))}
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-black text-sm mb-5 border-l-4 border-[#0f766e] pl-3 text-slate-800">ទិន្នន័យដែលបានអនុម័តសរុប ({locations.filter(l=>l.status==='approved').length})</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 1: Ratanak Mondul */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-xs mb-3 text-theme bg-white p-2 rounded-lg shadow-sm w-fit border border-slate-100">១. ស្រុករតនមណ្ឌល</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                           {locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-5 text-[10px] text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-xl">គ្មានទិន្នន័យ</p> :
                             locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').map(loc => {
                               const displayTitle = Array.isArray(loc.names) ? loc.names[0] : safeStr(loc.title);
                               return (
                               <div key={loc.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-3">
                                     <img src={loc.image} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"/>
                                     <div>
                                        <p className="text-xs font-black text-slate-800 line-clamp-1">{displayTitle}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{safeStr(loc.commune)} • {safeStr(loc.village)}</p>
                                     </div>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                     <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 active:scale-95"><Edit3 className="w-3.5 h-3.5"/></button>
                                     <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 active:scale-95"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </div>
                               </div>
                           )})}
                        </div>
                    </div>

                    {/* Section 2: Other Districts */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-xs mb-3 text-indigo-600 bg-white p-2 rounded-lg shadow-sm w-fit border border-slate-100">២. ស្រុកផ្សេងៗ</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                           {locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-5 text-[10px] text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-xl">គ្មានទិន្នន័យ</p> :
                             locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').map(loc => {
                               const displayTitle = Array.isArray(loc.names) ? loc.names[0] : safeStr(loc.title);
                               return (
                               <div key={loc.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-3">
                                     <img src={loc.image} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"/>
                                     <div>
                                        <p className="text-xs font-black text-slate-800 line-clamp-1">{displayTitle}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{safeStr(loc.district)}</p>
                                     </div>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                     <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 active:scale-95"><Edit3 className="w-3.5 h-3.5"/></button>
                                     <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 active:scale-95"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </div>
                               </div>
                           )})}
                        </div>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* Editing Modal */}
      {editingLoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-md mx-auto rounded-[2rem] p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90dvh] flex flex-col">
              <h3 className="text-base font-black mb-5 text-slate-800 border-b border-slate-100 pb-3">កែប្រែទិន្នន័យ (Update Document)</h3>
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                  <form id="editFormAdmin" onSubmit={handleEditSave} className="space-y-4 px-1">
                     <div>
                         <label className="text-xs font-bold text-slate-500 mb-1 block">Title / Name</label>
                         <input value={safeStr(editingLoc.title)} onChange={e=>setEditingLoc({...editingLoc, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[16px] font-bold outline-none focus:border-[#0f766e] m-0 text-slate-800"/>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="text-xs font-bold text-slate-500 mb-1 block">Role</label>
                             <input value={safeStr(editingLoc.role || editingLoc.category)} onChange={e=>setEditingLoc({...editingLoc, role: e.target.value, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[16px] font-bold outline-none focus:border-[#0f766e] m-0 text-slate-800"/>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 mb-1 block">Phone</label>
                             <input value={safeStr(editingLoc.phone)} onChange={e=>setEditingLoc({...editingLoc, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[16px] font-bold outline-none focus:border-[#0f766e] m-0 text-slate-800"/>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="text-xs font-bold text-slate-500 mb-1 block">Commune</label>
                             <input value={safeStr(editingLoc.commune)} onChange={e=>setEditingLoc({...editingLoc, commune: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[16px] font-bold outline-none focus:border-[#0f766e] m-0 text-slate-800"/>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 mb-1 block">Village</label>
                             <input value={safeStr(editingLoc.village)} onChange={e=>setEditingLoc({...editingLoc, village: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[16px] font-bold outline-none focus:border-[#0f766e] m-0 text-slate-800"/>
                         </div>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                         <textarea value={safeStr(editingLoc.desc)} onChange={e=>setEditingLoc({...editingLoc, desc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[16px] font-medium h-24 outline-none focus:border-[#0f766e] resize-none m-0 text-slate-800"></textarea>
                     </div>
                  </form>
              </div>
              <div className="flex gap-3 pt-5 mt-auto border-t border-slate-100">
                 <button type="button" onClick={()=>setEditingLoc(null)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm border border-slate-200 active:scale-95 transition-transform">បោះបង់</button>
                 <button type="submit" form="editFormAdmin" className="flex-1 bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform">Update</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in">
           <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
             <h3 className="font-black text-sm border-l-4 border-rose-500 pl-3 text-slate-800">កំណត់ត្រាសុវត្ថិភាព (Security Logs)</h3>
             <button onClick={()=>clearLog()} className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl font-black shadow-sm active:scale-95 transition-transform flex items-center gap-1.5 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5"/> Clear All</button>
           </div>
           <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
             {cyberLogs?.length === 0 ? <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"><p className="text-sm font-bold text-slate-400">ប្រព័ន្ធមានសុវត្ថិភាពល្អ 100%</p></div> : 
               cyberLogs?.map(l => (
                 <div key={l.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] relative shadow-sm">
                    <p className="font-black text-rose-600 mb-1.5 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4"/> Failed Login Attempt</p>
                    <p className="text-slate-800 font-bold mb-0.5 text-xs">User: {safeStr(l.username)}</p>
                    <p className="text-slate-500 mb-1">{safeStr(l.device)} ({safeStr(l.type)}) • IP: <span className="font-mono bg-slate-200 px-1 rounded">{safeStr(l.ip)}</span></p>
                    <p className="text-slate-400 text-[9px] font-medium mt-2">{new Date(l.timestamp).toLocaleString()}</p>
                    <button onClick={()=>clearLog(l.id)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 bg-white shadow-sm border border-slate-200 p-2 rounded-lg transition-colors hover:bg-rose-50"><Trash2 className="w-4 h-4"/></button>
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
  const displayTitle = Array.isArray(location.names) && location.names.length > 0 
      ? location.names.join(' • ') 
      : (safeStr(location.title) || 'គ្មានឈ្មោះ');

  return (
    <div onClick={onClick} className="glass-panel group rounded-[1.5rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full bg-white relative border border-slate-200">
      <div className="relative h-32 md:h-40 overflow-hidden shrink-0">
        <img src={location.image} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-slate-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-70"></div>
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-theme rounded-lg text-white text-[9px] font-black shadow-sm tracking-wide uppercase">{safeStr(location.category)}</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
           <h3 className="font-black text-sm md:text-[15px] text-slate-800 line-clamp-2 leading-snug mb-2.5">{displayTitle}</h3>
           <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-theme shrink-0" />
              <span className="line-clamp-1">{location.village ? `${safeStr(location.village)}, ${safeStr(location.commune)}` : (safeStr(location.district) || 'រតនមណ្ឌល')}</span>
           </p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
           <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="flex items-center gap-1.5 text-xs font-bold p-1 -m-1 rounded-full transition-all">
             <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} /> 
             <span className="text-slate-500">{location.likes || 0}</span>
           </button>
        </div>
      </div>
    </div>
  );
};

const LocationDetailModal = ({ location, onClose }) => {
  const displayTitle = Array.isArray(location.names) && location.names.length > 0 
      ? location.names.join(' • ') 
      : (safeStr(location.title) || 'គ្មានឈ្មោះ');

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in slide-in-from-bottom-10 md:zoom-in-95 max-h-[92dvh]">
        <div className="relative h-60 shrink-0">
          <img src={location.image} alt={displayTitle} className="w-full h-full object-cover bg-slate-100" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2.5 bg-white/70 hover:bg-white transition-colors rounded-full text-slate-800 backdrop-blur-md shadow-sm border border-white/50 active:scale-95"><XCircle className="w-5 h-5" /></button>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-4 left-5 text-white">
             <span className="px-3 py-1.5 bg-theme rounded-lg text-white text-[10px] font-black shadow-sm uppercase tracking-wider">{safeStr(location.category)}</span>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar bg-white">
          <div className="flex flex-col mb-6">
             <h2 className="text-2xl font-black leading-tight text-slate-800 mb-2">{displayTitle}</h2>
             <p className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">តួនាទី: {safeStr(location.role || location.institution)}</p>
          </div>
          
          <div className="flex gap-3 mb-6">
             {location.phone && <a href={`tel:${location.phone}`} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform hover:bg-indigo-700"><Phone className="w-4 h-4"/> ខលទាក់ទង</a>}
             {location.coords ? (
                <a href={`https://www.google.com/maps?q=${location.coords.lat},${location.coords.lng}`} target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-slate-800/20 active:scale-95 transition-transform hover:bg-slate-900"><MapPin className="w-4 h-4"/> បើកផែនទី</a>
             ) : location.mapUrl ? (
                <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-slate-800/20 active:scale-95 transition-transform hover:bg-slate-900"><MapPin className="w-4 h-4"/> បើកផែនទី</a>
             ) : null}
          </div>

          <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ទីតាំងលម្អិត (Location Details)</h4>
                 <div className="space-y-2.5">
                    <p className="text-xs font-bold text-slate-700 flex justify-between"><span>ខេត្ត:</span> <span>{safeStr(location.province) || 'បាត់ដំបង'}</span></p>
                    <p className="text-xs font-bold text-slate-700 flex justify-between"><span>ស្រុក:</span> <span>{safeStr(location.district) || 'រតនមណ្ឌល'}</span></p>
                    <p className="text-xs font-bold text-slate-700 flex justify-between"><span>ឃុំ:</span> <span>{safeStr(location.commune) || '-'}</span></p>
                    <p className="text-xs font-bold text-slate-700 flex justify-between"><span>ភូមិ:</span> <span>{safeStr(location.village) || '-'}</span></p>
                 </div>
              </div>
              
              {location.desc && (
                  <div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 mt-6">ការពណ៌នា (Description)</h4>
                     <p className="text-[13px] font-medium text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">{safeStr(location.desc)}</p>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};