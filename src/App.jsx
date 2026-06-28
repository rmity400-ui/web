import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Plus, XCircle, Trash2, Edit3, 
  Image as ImageIcon, Send, LogOut, Settings, 
  LayoutGrid, Navigation, ShieldAlert, TrendingUp, Phone, CheckCircle, ArrowLeft, 
  ChevronDown, Globe, ArrowRight, Loader2, Clock, MapPin, PlusCircle, Copyright, Mic, Users
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
      background-color: #f8fafc; /* Strict Light Mode */
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
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.map(v => safeStr(v)).join(', ');
  return fallback;
};

// Custom Confirm Modal Component
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 mx-auto">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-800 mb-2">{safeStr(title)}</h3>
        <p className="text-sm text-center text-slate-500 mb-6">{safeStr(message)}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-700 active:scale-95 transition-transform">បដិសេធ</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold bg-rose-600 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-transform">លុប</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState('gateway'); 
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('khmer_tp_color') || '#0f766e');
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
  const [cyberLogs, setCyberLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [demographics, setDemographics] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { 
    // Ensure viewport forbids zooming on inputs
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';

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
    
    const updatePresence = () => {
        setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(() => {});
    };
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
    
    const demoRef = collection(db, 'artifacts', appId, 'public', 'data', 'demographics');
    const unsubDemo = onSnapshot(demoRef, (snapshot) => {
        setDemographics(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
    });

    return () => { clearInterval(presenceInterval); unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); unsubLogs(); unsubNotif(); unsubFavs(); unsubDemo(); };
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

  if (isAuthLoading) return <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]"></div></div>;

  // ==========================================
  // GATEWAY PAGE 1 (High Contrast, Clear Background, Modern Button)
  // ==========================================
  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col font-khmer bg-slate-50 overflow-y-auto hide-scrollbar text-white md:flex-row">
        {/* Top Curve Container - Sharp image, dark overlay for contrast */}
        <div className="bg-[#0f766e] w-full h-[58vh] md:h-[100vh] md:w-1/2 rounded-b-[3.5rem] md:rounded-b-none md:rounded-r-[3.5rem] relative flex flex-col items-center pt-safe px-6 shadow-xl shrink-0 overflow-hidden">
            <img 
              src="back.png" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="background" 
            />
            {/* Dark gradient overlay ensures UI Visibility & High Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#021f1b]/80 via-[#0f766e]/70 to-[#0f766e]/95"></div>
            
            <div className="w-28 h-28 bg-white rounded-full p-1.5 shadow-2xl mb-5 mt-10 md:mt-24 z-10 relative border-4 border-white/20">
               <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            
            {/* Title Requested */}
            <p className="text-white font-black text-xl md:text-2xl z-10 tracking-wide drop-shadow-md text-center">
                សូមស្វាគមន៍មកកាន់ TP Nice វិ.ស.ស
            </p>
        </div>

        {/* Bottom Gateway Button Panel */}
        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-safe text-center justify-center z-10 relative md:w-1/2">
           <div className="max-w-sm w-full space-y-3 mb-10">
              <h2 className="text-2xl font-black text-slate-800 leading-tight">
                  ទិន្នន័យ & ទំនាក់ទំនង
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  ប្រព័ន្ធរុករកទិន្នន័យ និងសម្របសម្រួលទំនាក់ទំនងក្នុងគ្រាអាសន្ន។ បង្កើតឡើងដើម្បីផ្តល់ភាពងាយស្រួលដល់ប្រជាពលរដ្ឋ។
              </p>
           </div>
           
           <div className="w-full max-w-sm">
              <button onClick={() => setCurrentPage('app')} className="w-full bg-[#0f766e] text-white py-4 rounded-xl font-bold text-[16px] shadow-lg shadow-teal-700/20 hover:bg-[#0d5c50] active:scale-95 transition-all flex justify-between items-center px-2">
                 <div className="w-12"></div>
                 <span className="flex-1 tracking-wide">ចូលប្រើប្រាស់</span>
                 <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <ArrowRight className="text-[#0f766e] w-5 h-5"/>
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
    <div className="min-h-[100dvh] font-khmer bg-slate-50 text-slate-800 flex flex-col md:flex-row pb-[60px] md:pb-0">
      
      {/* Global Toast Alert */}
      {toast && (
        <div className="fixed top-safe mt-2 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-full max-w-[90vw] md:max-w-sm">
          <div className={`px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-start gap-3 backdrop-blur-md ${toast.type === 'error' ? 'bg-rose-500 text-white' : toast.type === 'info' ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'}`}>
            {toast.type === 'error' ? <XCircle className="w-5 h-5 shrink-0 mt-0.5"/> : toast.type === 'info' ? <Bell className="w-5 h-5 shrink-0 mt-0.5"/> : <CheckCircle className="w-5 h-5 shrink-0 mt-0.5"/>} 
            <span className="flex-1 text-left leading-relaxed">{safeStr(toast.msg)}</span>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} language={language} />

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative w-full">
        
        {/* Unified Top Header with Search and Back Button */}
        <TopHeader 
            setCurrentPage={setCurrentPage} profile={profile} notifications={notifications} notificationsOpen={notificationsOpen} 
            setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            db={db} appId={appId} user={user} appLogo={appLogo} currentView={currentView} language={language}
        />

        <div className="flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {currentView === 'home' && <HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} language={language} setCurrentView={setCurrentView} />}
          {currentView === 'data' && <DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} language={language} />}
          {currentView === 'reports' && <ReportsView locations={approvedLocations} usersList={usersList} language={language} demographics={demographics} />}
          {currentView === 'chat' && <ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} usersList={usersList} language={language} />}
          {currentView === 'account' && <AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} themeColor={themeColor} setThemeColor={setThemeColor} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} language={language} setCurrentView={setCurrentView} />}
          {currentView === 'admin' && isAdmin && <AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} demographics={demographics} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} user={user} setIsAdmin={setIsAdmin} language={language} />}
        </div>
      </main>

      <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />

      {selectedLocation && <LocationDetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} favorites={favorites} toggleFavorite={toggleFavorite} />}
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
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'Chat TP' : 'Messages' },
    { id: 'account', icon: User, label: language === 'km' ? 'តាមដាន' : 'Account' },
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
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'Chat TP' : 'Chat' },
    { id: 'account', icon: User, label: language === 'km' ? 'តាមដាន' : 'Account' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex justify-around items-center h-[60px] pb-safe">
      {navItems.map(item => {
         const isActive = currentView === item.id;
         return (
           <button key={item.id} onClick={() => setCurrentView(item.id)} className="relative flex-1 flex flex-col items-center justify-center h-full active:bg-slate-50 transition-colors">
             <div className={`flex flex-col items-center justify-center transition-colors ${isActive ? 'text-theme' : 'text-slate-400'}`}>
                <item.icon className={`w-6 h-6 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className="text-[9px] font-bold">{item.label}</span>
             </div>
           </button>
         )
      })}
      </div>
    </div>
  );
};

// UNIFIED HEADER (Logo left, Search styled properly, Back button lowered)
const TopHeader = ({ setCurrentPage, profile, notifications, notificationsOpen, setNotificationsOpen, searchQuery, setSearchQuery, db, appId, user, appLogo, currentView, language }) => {
    return (
        <div className="bg-white border-b border-slate-200 pt-safe px-4 pb-3 shadow-sm relative z-40 shrink-0">
           
           <div className="flex justify-between items-center mb-4 pt-2">
              <div className="flex items-center gap-2.5">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-sm border border-slate-200">
                    <img src={appLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-[15px] font-black leading-tight text-slate-800">TP Nice វិ.ស.ស</h1>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="relative">
                     <button className="p-2 bg-slate-100 rounded-full active:scale-95 transition shadow-sm relative border border-slate-200" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-5 h-5 text-slate-600" />
                        {notifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
                     </button>
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden z-50 text-slate-800">
                          <div className="p-3 border-b border-slate-100 font-bold flex justify-between text-xs bg-slate-50">
                            <span>ការជូនដំណឹង</span><button onClick={() => setNotificationsOpen(false)}><XCircle className="w-4 h-4 text-slate-400" /></button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {notifications.length === 0 ? <p className="p-4 text-center text-xs text-slate-500">គ្មានសារថ្មីទេ</p> : 
                              notifications.map(n => (
                                <div key={n.id} className="p-3.5 border-b border-slate-50 flex justify-between items-start gap-2 hover:bg-slate-50">
                                  <div className="flex-1">
                                    <p className={`text-xs font-bold ${n.type === 'error' ? 'text-rose-500' : 'text-theme'}`}>{safeStr(n.title)}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{safeStr(n.msg)}</p>
                                  </div>
                                  <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notifications', n.id)); }} className="text-slate-400 hover:text-rose-500 shrink-0"><XCircle className="w-4 h-4"/></button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                 </div>
                 <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm">
                    <img src={profile.avatar} className="w-full h-full object-cover rounded-full" alt="Profile" />
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col gap-3 w-full">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ស្វែងរកទីតាំង..." 
                  className="w-full bg-slate-100 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-11 pr-4 outline-none text-[15px] font-medium border border-transparent focus:border-theme/30 focus:bg-white transition-colors m-0 shadow-inner" 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                />
              </div>

              {/* Lowered Back Button - Hidden on Home, Visible on other views */}
              {currentView !== 'home' && (
                 <div className="md:hidden flex">
                    <button onClick={()=>setCurrentPage('gateway')} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-transform">
                       <ArrowLeft className="w-3.5 h-3.5"/> ត្រឡប់ក្រោយ
                    </button>
                 </div>
              )}
           </div>
        </div>
    );
};

// --- View: Home ---
const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, language, setCurrentView }) => {
  const [activeHomeFilter, setActiveHomeFilter] = useState('All');
  
  const filtered = locations.filter(l => {
     // Safeguard string evaluations
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
      <div>
         <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="font-black text-sm text-slate-800">ជម្រើសទីតាំង (Categories)</h2>
         </div>
         <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`bg-white p-3.5 rounded-[1rem] flex flex-col justify-center items-start shadow-sm border transition-all active:scale-95 ${activeHomeFilter==='រតនមណ្ឌល' ? 'border-theme ring-1 ring-theme bg-theme/5' : 'border-slate-200 hover:border-theme/50'}`}>
               <div className="bg-theme/10 p-2 rounded-lg text-theme mb-2"><Map className="w-5 h-5 stroke-[2px]"/></div>
               <span className="font-bold text-xs text-slate-800">រតនមណ្ឌល</span>
            </button>
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='ផ្សេងៗ'?'All':'ផ្សេងៗ')} className={`bg-white p-3.5 rounded-[1rem] flex flex-col justify-center items-start shadow-sm border transition-all active:scale-95 ${activeHomeFilter==='ផ្សេងៗ' ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
               <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-500 mb-2"><Globe className="w-5 h-5 stroke-[2px]"/></div>
               <span className="font-bold text-xs text-slate-800">ស្រុកផ្សេងៗ</span>
            </button>
         </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-black text-slate-800 leading-none">ទិន្នន័យដែលបានបញ្ចូល</h2>
          <button onClick={() => setCurrentView('data')} className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-theme">មើលទាំងអស់ <ArrowRight className="w-3 h-3"/></button>
        </div>
        {filtered.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 font-bold text-xs text-slate-400 shadow-sm">គ្មានទិន្នន័យ (No data found)</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
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
  
  // Data Management: Names (Array), Phone, Role, Description
  const [form, setForm] = useState({ names: [''], role: '', phone: '', image: '', mapUrl: '', desc: '', category: 'មេភូមិ', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);

  const filtered = locations.filter(l => {
    const combinedNames = Array.isArray(l.names) ? l.names.join(' ') : safeStr(l.title);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = combinedNames.toLowerCase().includes(searchLower) || safeStr(l.desc).toLowerCase().includes(searchLower);
    
    const isRatanak = l.district === 'រតនមណ្ឌល';
    if (activeTab === 'រតនមណ្ឌល' && !isRatanak) return false;
    if (activeTab === 'ស្រុកផ្សេងៗ' && isRatanak) return false;
    
    let matchesLevel = true;
    if (activeFilter === 'ឃុំ' && !l.commune) matchesLevel = false;
    if (activeFilter === 'ភូមិ' && !l.village) matchesLevel = false;
    if (activeFilter === 'ប៉ូលីស' && l.category !== 'ប៉ូលីស') matchesLevel = false;
    if (activeFilter === 'ពេទ្យ' && l.category !== 'មន្ទីរពេទ្យ') matchesLevel = false;
    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    if (!profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error'); setCurrentView('account'); return; }
    setForm({ names: [''], role: '', phone: '', image: '', mapUrl: '', desc: '', category: 'មេភូមិ', province: '', district: '', commune: '', village: '' });
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const validNames = form.names.filter(n => n.trim() !== '');
    if (validNames.length === 0) return showToast('សូមបញ្ចូលយ៉ាងហោចណាស់ឈ្មោះមួយ', 'error');
    if (!form.image) return showToast('សូមបញ្ចូលរូបភាព', 'error');
    
    setLoading(true);
    try {
      const titleStr = validNames.join(' | '); 
      let submitData = { ...form, title: titleStr, author: profile.username, authorUid: user.uid, timestamp: Date.now() };
      
      delete submitData.names; 

      if (activeTab === 'រតនមណ្ឌល') { submitData.province = 'បាត់ដំបង'; submitData.district = 'រតនមណ្ឌល'; }
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'database_admin'), { ...submitData, status: isAdmin ? 'approved' : 'pending', likes: 0, timestamp: Date.now() });
      
      if (isAdmin) showToast('ទិន្នន័យត្រូវបានបញ្ចូលជោគជ័យ ✅');
      else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), { title: 'សំណើបញ្ជូនជោគជ័យ ⏳', msg: `រាល់ទិន្នន័យរបស់អ្នកនឹងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យពីផ្នែករដ្ឋបាលសិន ដើម្បីបញ្ជាក់ថាពិតឬក៏ក្លែងក្លាយ។`, type: 'info', timestamp: Date.now() });
        showToast('រាល់ទិន្នន័យរបស់អ្នកនឹងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យពីផ្នែករដ្ឋបាលសិន ដើម្បីបញ្ជាក់ថាពិតឬក៏ក្លែងក្លាយ ⏳', 'info', 6000);
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូន', 'error'); }
    setLoading(false);
  };

  if (!profile.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in zoom-in duration-300">
         <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-200"><User className="w-8 h-8" /></div>
         <h2 className="text-lg font-black mb-2 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-6 max-w-sm text-xs font-medium px-4">សូមចូលទៅកាន់គណនី (Account) ដើម្បីកំណត់ឈ្មោះរបស់អ្នកសិន។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-8 py-3.5 rounded-xl font-bold shadow-md active:scale-95 text-sm transition">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 mt-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
         <h1 className="text-lg font-black px-1 text-slate-800">គ្រប់គ្រងទិន្នន័យ</h1>
         <button onClick={handleOpenAdd} className="w-full sm:w-auto bg-theme text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-xs active:scale-95 transition-transform"><Plus className="w-4 h-4"/> បន្ថែមទិន្នន័យទីតាំង</button>
      </div>

      <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm overflow-hidden">
         {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${activeTab === tab ? 'bg-slate-100 text-theme shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
         ))}
      </div>

      {/* Categories requested: ឃុំ, ភូមិ, ប៉ូលីស, ពេទ្យ */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {['ទាំងអស់', 'ឃុំ', 'ភូមិ', 'ប៉ូលីស', 'ពេទ្យ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap shrink-0 border ${activeFilter === cat ? 'bg-theme text-white border-theme shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <MapPin className="w-10 h-10 text-slate-300 mb-3" />
             <p className="font-bold text-xs text-slate-500">មិនមានទិន្នន័យសម្រាប់ជម្រើសនេះទេ</p>
          </div>
        ) : 
          filtered.map(loc => <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />)
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 px-0 md:px-4">
          <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[90dvh] md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-sm font-black text-theme">បន្ថែមទិន្នន័យ: {activeTab}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><XCircle className="w-5 h-5 text-slate-500"/></button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 hide-scrollbar bg-white">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-4">
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner space-y-3">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-600">ឈ្មោះ (Names) *</label>
                      <button type="button" onClick={handleAddNameField} className="text-theme text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1 active:scale-95"><Plus className="w-3 h-3"/> បន្ថែម</button>
                   </div>
                   {form.names.map((name, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                         <input type="text" required value={name} onChange={e=>handleNameChange(e.target.value, idx)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[16px] outline-none focus:border-theme font-bold shadow-sm m-0" placeholder={`ឈ្មោះទី ${idx+1}...`} />
                         {form.names.length > 1 && (
                            <button type="button" onClick={()=>handleRemoveNameField(idx)} className="p-3.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 active:scale-95"><Trash2 className="w-4 h-4"/></button>
                         )}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5 ml-1">ប្រភេទ Category *</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[16px] outline-none focus:border-theme font-bold shadow-sm appearance-none cursor-pointer m-0">
                      <option value="មេភូមិ">មេភូមិ</option><option value="មេឃុំ">មេឃុំ</option><option value="ប៉ូលិស">ប៉ូលិស</option>
                      <option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option><option value="សាលារៀន">សាលារៀន</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5 ml-1">តួនាទី (Role) *</label>
                    <input type="text" required value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[16px] outline-none focus:border-theme font-bold shadow-sm m-0" placeholder="ឧ: ប្រធានភូមិ..." />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                    <label className="text-[11px] font-bold text-slate-600 block mb-2 border-b border-slate-200 pb-2">កំណត់ទីតាំង</label>
                    {activeTab === 'រតនមណ្ឌល' ? (
                        <div className="grid grid-cols-2 gap-3">
                            <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white rounded-lg p-2.5 text-[16px] outline-none font-bold border border-slate-200 m-0 shadow-sm appearance-none cursor-pointer">
                                <option value="">ជ្រើសរើសឃុំ</option>
                                {Object.keys(REGIONS["រតនមណ្ឌល"] || {}).map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                            <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white rounded-lg p-2.5 text-[16px] outline-none font-bold border border-slate-200 disabled:opacity-50 m-0 shadow-sm appearance-none cursor-pointer">
                                <option value="">ជ្រើសរើសភូមិ</option>
                                {form.commune && REGIONS["រតនមណ្ឌល"][form.commune] && REGIONS["រតនមណ្ឌល"][form.commune].map(v=><option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ខេត្ត..."/>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ស្រុក..."/>
                            <input type="text" value={form.commune} onChange={e=>setForm({...form, commune: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ឃុំ..."/>
                            <input type="text" value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[16px] outline-none font-bold shadow-sm m-0" placeholder="ភូមិ..."/>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[16px] outline-none focus:border-theme font-bold shadow-sm m-0" placeholder="លេខទូរស័ព្ទ..." />
                  <input type="url" value={form.mapUrl} onChange={e=>setForm({...form, mapUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[16px] outline-none focus:border-theme font-bold shadow-sm m-0" placeholder="Google Map Link..." />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5 ml-1">រូបភាព (Upload Picture) *</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 relative overflow-hidden transition-colors shadow-inner">
                     {form.image ? (
                        <><img src={form.image} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-slate-800 font-bold bg-white/90 px-4 py-2 rounded-xl text-xs backdrop-blur-md shadow-sm flex gap-2 items-center"><Edit3 className="w-4 h-4"/> ប្តូររូបភាព</span></div></>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                           <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                           <span className="text-xs font-bold">ចុចទីនេះដើម្បី Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="hidden" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>
                
                <div>
                   <label className="text-[11px] font-bold text-slate-600 block mb-1.5 ml-1">ការពណ៌នា (Description)</label>
                   <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="សរសេរការពណ៌នាខ្លីៗ..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[16px] outline-none focus:border-theme h-24 resize-none font-medium shadow-inner m-0"></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 shrink-0 pb-safe bg-white">
               <button type="submit" form="addForm" disabled={loading} className="w-full py-4 rounded-xl font-black bg-slate-800 hover:bg-slate-900 text-white active:scale-95 disabled:opacity-50 transition shadow-lg text-sm flex justify-center items-center gap-2">
                   {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> កំពុងផ្ញើរ...</> : 'ផ្ញើរសំណើរ (Admin)'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Reports ---
const ReportsView = ({ locations, usersList, language, demographics = [] }) => {
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
    { label: language === 'km' ? 'អ្នកប្រើប្រាស់សរុប' : 'Total Users', count: totalUsers, pct: 100, color: 'text-slate-800' },
    { label: language === 'km' ? 'សប្តាហ៍នេះ' : 'Weekly', count: weeklyUsers, pct: calcPct(weeklyUsers, totalUsers), color: 'text-theme' },
    { label: language === 'km' ? 'ខែនេះ' : 'Monthly', count: monthlyUsers, pct: calcPct(monthlyUsers, totalUsers), color: 'text-indigo-600' },
    { label: language === 'km' ? 'ឆ្នាំនេះ' : 'Yearly', count: yearlyUsers, pct: calcPct(yearlyUsers, totalUsers), color: 'text-rose-600' },
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
    <div className="space-y-5 animate-in fade-in duration-300">
      <h1 className="text-xl font-black text-slate-800 border-l-4 border-slate-800 pl-2">របាយការណ៍សង្ខេប</h1>
      
      {/* 4 Cards */}
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
        {/* Bar Chart */}
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

        {/* Line Chart */}
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

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 w-full">
                <h3 className="text-sm font-bold text-slate-800 mb-2 border-l-4 border-rose-500 pl-2">ចំណាត់ថ្នាក់ទិន្នន័យ (Pie)</h3>
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

// --- View: Chat (Messenger Style - User List -> Message View) ---
const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView, isAdmin, usersList }) => {
  const [msgText, setMsgText] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const messagesEndRef = useRef(null);
  
  // Standard authorities for normal users
  const authorities = [
      { id: 'Admin', icon: ShieldCheck, label: 'Admin Support', isOnline: true },
      { id: 'Police', icon: ShieldAlert, label: 'ប៉ូលីស (Police)', isOnline: true },
      { id: 'Commune Chief', icon: Users, label: 'មេឃុំ (Commune)', isOnline: true }
  ];

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chats, activeChatUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error'); setCurrentView('account'); return; }
    if (!msgText.trim()) return;
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {
      text: msgText, 
      target: activeChatUser.id, 
      userId: user.uid, 
      userName: profile.username, 
      timestamp: Date.now()
    });
    setMsgText('');
  };

  const deleteMessage = async (msgId) => {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chats', msgId));
  };

  if (!profile.username) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in">
         <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 border border-indigo-100 shadow-sm"><MessageCircle className="w-10 h-10" /></div>
         <h2 className="text-xl font-black mb-2 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-sm mb-8 max-w-xs font-medium">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះមុននឹងផ្ញើសារ។</p>
         <button onClick={() => setCurrentView('account')} className="bg-theme text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-md active:scale-95 transition-transform">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  // --- CONTACT LIST VIEW ---
  if (!activeChatUser) {
     const contactsToShow = isAdmin 
       ? usersList.map(u => ({ id: u.uid || u.id, label: safeStr(u.username) || 'Unknown', avatar: u.avatar, isOnline: (Date.now() - (u.lastActive||0)) < 120000 }))
       : authorities;

     return (
        <div className="flex flex-col h-[calc(100dvh-150px)] md:h-[calc(100dvh-50px)] bg-white rounded-3xl md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm mt-2">
           <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 shrink-0">
               <h1 className="text-xl font-black text-slate-800">Chat TP (សារ)</h1>
               <p className="text-xs text-slate-500 font-bold mt-1">ភ្ជាប់ទំនាក់ទំនងភ្លាមៗ</p>
           </div>
           <div className="flex-1 overflow-y-auto p-2 md:p-4 hide-scrollbar">
              {contactsToShow.map((contact, i) => (
                  <div key={i} onClick={() => setActiveChatUser(contact)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors active:scale-95 border border-transparent hover:border-slate-100 mb-2">
                      <div className="relative">
                          {contact.avatar ? (
                             <img src={contact.avatar} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="av"/>
                          ) : (
                             <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500"><contact.icon className="w-6 h-6"/></div>
                          )}
                          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${contact.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="flex-1 border-b border-slate-100 pb-4">
                          <h3 className="font-bold text-[15px] text-slate-800 leading-tight">{safeStr(contact.label)}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">{contact.isOnline ? 'Online ឥឡូវនេះ' : 'Offline'}</p>
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
    <div className="flex flex-col h-[calc(100dvh-150px)] md:h-[calc(100dvh-50px)] bg-white rounded-3xl md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm mt-2 relative">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0 z-10 shadow-sm">
        <button onClick={() => setActiveChatUser(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 active:scale-95 transition border border-slate-200"><ArrowLeft className="w-5 h-5 text-slate-600"/></button>
        <div className="relative">
           {activeChatUser.avatar ? (
               <img src={activeChatUser.avatar} className="w-10 h-10 rounded-full border border-slate-200 object-cover" alt="av"/>
            ) : (
               <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500"><activeChatUser.icon className="w-5 h-5"/></div>
            )}
           <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${activeChatUser.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
        </div>
        <div>
            <h2 className="font-black text-sm text-slate-800">{safeStr(activeChatUser.label)}</h2>
            <p className="text-[10px] font-bold text-slate-500">{activeChatUser.isOnline ? 'Active now' : 'Offline'}</p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50">
        {filteredChats.length === 0 ? <p className="text-center text-slate-400 py-10 text-xs font-bold bg-white rounded-2xl border border-dashed border-slate-200 max-w-xs mx-auto mt-10">ចាប់ផ្តើមការសន្ទនា...</p> : 
          filteredChats.map(msg => {
            const isMe = isAdmin ? msg.target === activeChatUser.id : msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`flex max-w-[80%] md:max-w-[60%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-500 ml-1">{safeStr(msg.userName)}</span>}
                  <div className="flex items-center gap-2">
                      {isMe && <button onClick={()=>deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-50 rounded-full transition"><Trash2 className="w-3.5 h-3.5"/></button>}
                      <div className={`px-4 py-3 rounded-2xl text-[14.5px] font-medium leading-relaxed shadow-sm ${isMe ? 'bg-[#0f766e] text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'}`}>
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
      <div className="p-3 bg-white border-t border-slate-100 shrink-0 pb-safe z-10">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Action Icons */}
          <button type="button" className="p-2.5 text-slate-400 hover:text-theme bg-slate-50 hover:bg-slate-100 rounded-full transition active:scale-95"><Plus className="w-5 h-5"/></button>
          <button type="button" className="p-2.5 text-rose-400 hover:text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-full transition active:scale-95 hidden sm:flex"><MapPin className="w-5 h-5"/></button>
          
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

const AccountView = ({ user, profile, db, appId, showToast, setIsAdmin }) => {
  const [pwd, setPwd] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [localName, setLocalName] = useState(profile.username || '');
  const [isEditingName, setIsEditingName] = useState(profile.username ? false : true);

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
         <h1 className="text-2xl font-black text-slate-800">តាមដាន (គណនីផ្ទាល់ខ្លួន)</h1>
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
                   <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-[16px] font-bold outline-none focus:border-[#0f766e] shadow-inner text-center sm:text-left m-0" placeholder="កំណត់ឈ្មោះរបស់អ្នក..."/>
                   <button onClick={handleSaveName} className="bg-[#0f766e] text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-teal-600/20 active:scale-95 transition-transform w-full sm:w-auto">រក្សាទុក</button>
               </div>
           ) : (
               <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl shadow-inner">
                   <span className="text-lg font-black text-slate-800">{safeStr(profile.username)}</span>
                   <button onClick={() => setIsEditingName(true)} className="text-theme bg-teal-50 border border-teal-100 font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm"><Edit3 className="w-3.5 h-3.5"/> កែប្រែ</button>
               </div>
           )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
         <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 mb-4"><Settings className="w-5 h-5 text-slate-400"/> ការកំណត់ (Settings)</h2>
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
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password..." className="w-full bg-slate-50 p-4 rounded-2xl mb-6 text-center tracking-[0.3em] outline-none font-bold border border-slate-200 text-[16px] focus:border-slate-400 shadow-inner m-0"/>
              <div className="flex gap-3">
                <button onClick={() => setShowAdminLogin(false)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-xs border border-slate-200 active:scale-95 transition-transform">បោះបង់</button>
                <button onClick={handleAdminLogin} className="flex-1 bg-slate-800 text-white py-3.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform">ចូល</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// ADMIN VIEW - Secure Firebase Dashboard
const AdminDashboard = ({ locations = [], pendingLocations = [], usersList = [], cyberLogs = [], db, appId, showToast, setCurrentView, setIsAdmin }) => {
  const [activeTab, setActiveTab] = useState('data'); 
  const [itemToDelete, setItemToDelete] = useState(null); 
  const [editingLoc, setEditingLoc] = useState(null);
  
  const handleApprove = async (id, authorUid) => { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id), { status: 'approved' }); 
      if(authorUid) await addDoc(collection(db, 'artifacts', appId, 'users', authorUid, 'notifications'), { title: 'សំណើរជោគជ័យ ✅', msg: 'ទិន្នន័យត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធផ្លូវការ។', type: 'success', timestamp: Date.now() });
      showToast('អនុម័តជោគជ័យ ✅'); 
  };
  
  const confirmDeleteLocation = async () => {
      if(!itemToDelete) return;
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', itemToDelete));
        showToast('លុបទិន្នន័យបានជោគជ័យ');
      } catch(e) { console.error(e); }
      setItemToDelete(null);
  };

  const clearLog = async (id = null) => {
    if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
    else cyberLogs?.forEach(async l => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)));
  };
  
  const handleAdminLogout = () => { setIsAdmin(false); setCurrentView('home'); showToast('បានចាកចេញពី Admin'); };
  
  const handleEditSave = async (e) => { 
      e.preventDefault(); 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', editingLoc.id), editingLoc); 
      setEditingLoc(null); 
      showToast('កែប្រែជោគជ័យ'); 
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 max-w-5xl mx-auto relative">
      
      <ConfirmModal 
         isOpen={!!itemToDelete} 
         title="បញ្ជាក់ការលុប" 
         message="តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។"
         onConfirm={confirmDeleteLocation}
         onCancel={() => setItemToDelete(null)}
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
          {id: 'data', label: 'ទិន្នន័យ & ទីតាំង'}, {id: 'approvals', label: 'អនុម័តសំណើរ'}, {id: 'security', label: 'កំណត់ត្រា Security'}
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
                      <button onClick={()=>handleApprove(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-transform">អនុម័ត</button>
                      <button onClick={()=>setItemToDelete(loc.id)} className="flex-1 md:flex-none bg-rose-50 text-rose-600 border border-rose-200 px-6 py-3 rounded-xl font-black text-xs shadow-sm active:scale-95 transition-transform">បដិសេធ</button>
                    </div>
                 </div>
               )})
             }
           </div>
        </div>
      )}

      {activeTab === 'data' && (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-black text-sm mb-5 border-l-4 border-[#0f766e] pl-3 text-slate-800">ទិន្នន័យដែលបានអនុម័តសរុប ({locations.filter(l=>l.status==='approved').length})</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 1: Ratanak Mondul */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-xs mb-3 text-theme bg-white p-2 rounded-lg shadow-sm w-fit border border-slate-100">១. ស្រុករតនមណ្ឌល</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                           {locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').map(loc => {
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
                                     <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100"><Edit3 className="w-3.5 h-3.5"/></button>
                                     <button onClick={()=>setItemToDelete(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </div>
                               </div>
                           )})}
                        </div>
                    </div>

                    {/* Section 2: Other Districts */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-xs mb-3 text-indigo-600 bg-white p-2 rounded-lg shadow-sm w-fit border border-slate-100">២. ស្រុកផ្សេងៗ</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                           {locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').map(loc => {
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
                                     <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100"><Edit3 className="w-3.5 h-3.5"/></button>
                                     <button onClick={()=>setItemToDelete(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
             <h3 className="font-black text-sm border-l-4 border-rose-500 pl-3 text-slate-800">កំណត់ត្រាសុវត្ថិភាព (Security Logs)</h3>
             <button onClick={()=>clearLog()} className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl font-black shadow-sm active:scale-95 transition-transform flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5"/> Clear All</button>
           </div>
           <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
             {cyberLogs?.length === 0 ? <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"><p className="text-sm font-bold text-slate-400">ប្រព័ន្ធមានសុវត្ថិភាពល្អ 100%</p></div> : 
               cyberLogs?.map(l => (
                 <div key={l.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] relative shadow-sm">
                    <p className="font-black text-rose-600 mb-1.5 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4"/> Failed Login Attempt</p>
                    <p className="text-slate-800 font-bold mb-0.5 text-xs">User: {safeStr(l.username)}</p>
                    <p className="text-slate-500 mb-1">{safeStr(l.device)} ({safeStr(l.type)}) • IP: <span className="font-mono bg-slate-200 px-1 rounded">{safeStr(l.ip)}</span></p>
                    <p className="text-slate-400 text-[9px] font-medium mt-2">{new Date(l.timestamp).toLocaleString()}</p>
                    <button onClick={()=>clearLog(l.id)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 bg-white shadow-sm border border-slate-200 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
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
    <div onClick={onClick} className="glass-panel group rounded-[1.5rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full bg-white relative">
      <div className="relative h-32 md:h-40 overflow-hidden shrink-0">
        <img src={location.image} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-slate-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-70"></div>
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-theme rounded-lg text-white text-[9px] font-black shadow-sm tracking-wide uppercase">{safeStr(location.category)}</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
           <h3 className="font-black text-sm md:text-[15px] text-slate-800 line-clamp-2 leading-snug mb-2">{displayTitle}</h3>
           <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-theme shrink-0" />
              <span className="line-clamp-1">{location.village ? `${safeStr(location.village)}, ${safeStr(location.commune)}` : (safeStr(location.district) || 'រតនមណ្ឌល')}</span>
           </p>
           {location.phone && (
              <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5 mb-2">
                 <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                 <span>{safeStr(location.phone)}</span>
              </p>
           )}
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
          
          {/* Action Buttons as Required */}
          <div className="flex gap-3 mb-6">
             {location.phone && <a href={`tel:${location.phone}`} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"><Phone className="w-4 h-4"/> ខលទាក់ទង</a>}
             {location.mapUrl && <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-slate-800/20 active:scale-95 transition-transform"><MapPin className="w-4 h-4"/> បើកផែនទី</a>}
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