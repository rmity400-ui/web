import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Moon, Sun, Plus, MoreVertical, 
  CheckCircle, XCircle, Trash2, Edit3, Image as ImageIcon, Send, Filter,
  LogOut, Settings, Activity, Users, MapPin, TrendingUp, Phone, Navigation, ShieldAlert, PieChart, BarChart
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut
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
    playOsc(0); playOsc(0.15); playOsc(0.3); // ping-ping-ping
  } catch(e) { console.error("Audio error", e); }
};

// --- Configuration & Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  // ការពារការចេញអេក្រង់ស ពេល Deploy ទៅខាងក្រៅដោយប្រើ API របស់អ្នក
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

// --- Shared Styles Injection ---
const injectStyles = () => {
  const styleId = 'khmer-app-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&display=swap');
      
      :root {
        --font-khmer: 'Noto Sans Khmer', sans-serif;
        --theme-color: #4f46e5; /* indigo-600 */
      }
      
      .font-khmer { font-family: var(--font-khmer); }
      
      .glass-panel {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
      
      .dark .glass-panel {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      
      .soft-shadow { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); }
      .dark .soft-shadow { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); }
    `;
    document.head.appendChild(style);
  }
};

// --- Mock Initial Data (if db is empty) ---
const INITIAL_LOCATIONS = [
  { id: '1', title: 'សាលាបឋមសិក្សា', desc: 'សាលារៀនសម្រាប់កុមារក្នុងភូមិ', image: 'https://images.unsplash.com/photo-1600588636254-2070ed3f30db?auto=format&fit=crop&w=800&q=80', category: 'សាលារៀន', district: 'ស្រុករតនមណ្ឌល', commune: 'ត្រែង', village: 'ភ្នំរៃ', phone: '092000000', mapUrl: 'https://maps.google.com', status: 'approved', likes: 1240, authorId: 'admin' },
];

const REGIONS = {
  "រតនមណ្ឌល": {
    "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"],
    "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"],
    "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"],
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Global State
  const [currentPage, setCurrentPage] = useState('gateway'); // 'gateway' | 'app'
  const [theme, setTheme] = useState('light');
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appLogo, setAppLogo] = useState('logo.png'); // [CHANGE_IMAGE_HERE_1]: ទីតាំងផ្លាស់ប្តូរ Logo រួមរបស់ Web App (Sidebar & TopBar)
  const [language, setLanguage] = useState('km'); // មុខងារប្តូរភាសា (Language State)
  
  // Data State
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', role: 'user' });
  const [locations, setLocations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [chats, setChats] = useState([]);
  const [cyberLogs, setCyberLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState({});

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);

  // Initialize Auth & Theme
  useEffect(() => {
    injectStyles();
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) { console.error('Auth error:', err); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data (Follow strict rules)
  useEffect(() => {
    if (!user) return;

    // Profiles (name_data)
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'name_data', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        if (data.role === 'admin') setIsAdmin(true);
      } else {
        setDoc(profileRef, { username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', role: 'user', uid: user.uid, timestamp: Date.now() });
      }
    });

    const allUsersRef = collection(db, 'artifacts', appId, 'public', 'data', 'name_data');
    const unsubAllUsers = onSnapshot(allUsersRef, snap => setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    // Locations (data_user)
    const locationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'data_user');
    const unsubLocations = onSnapshot(locationsRef, (snapshot) => {
      let locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (locs.length === 0) {
        INITIAL_LOCATIONS.forEach(loc => setDoc(doc(locationsRef, loc.id), loc));
        locs = INITIAL_LOCATIONS;
      }
      setLocations(locs);
    });

    // Chats
    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    const unsubChats = onSnapshot(chatsRef, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      setChats(msgs);
    });

    // Cyber Logs
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs');
    const unsubLogs = onSnapshot(logsRef, snap => {
      const lg = snap.docs.map(d => ({id: d.id, ...d.data()}));
      lg.sort((a,b) => b.timestamp - a.timestamp);
      setCyberLogs(lg);
    });

    // Notifications
    const notifRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');
    const unsubNotif = onSnapshot(notifRef, snap => {
      const nt = snap.docs.map(d => ({id: d.id, ...d.data()}));
      nt.sort((a,b) => b.timestamp - a.timestamp);
      setNotifications(nt);
    });

    // Favorites
    const favRef = collection(db, 'artifacts', appId, 'users', user.uid, 'favorites');
    const unsubFavs = onSnapshot(favRef, (snapshot) => {
      const favMap = {};
      snapshot.docs.forEach(doc => { favMap[doc.id] = true; });
      setFavorites(favMap);
    });

    return () => { unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); unsubLogs(); unsubNotif(); unsubFavs(); };
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  const toggleFavorite = async (locationId) => {
    if (!user) return;
    const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', locationId);
    const locRef = doc(db, 'artifacts', appId, 'public', 'data', 'data_user', locationId);

    try {
      if (favorites[locationId]) {
        await deleteDoc(favDocRef);
        await updateDoc(locRef, { likes: increment(-1) });
      } else {
        await setDoc(favDocRef, { timestamp: Date.now() });
        await updateDoc(locRef, { likes: increment(1) });
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const approvedLocations = useMemo(() => locations.filter(l => l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => locations.filter(l => l.status === 'pending'), [locations]);

  if (isAuthLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // --- GATEWAY PAGE 1 ---
  if (currentPage === 'gateway') {
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col justify-center items-center p-6 bg-slate-950 text-white font-khmer overflow-hidden`}>
        
        {/* [CHANGE_IMAGE_HERE_2]: ទីតាំង Background ខាងក្រោយទំព័រដើម (Page 1) */}
        <div className="absolute inset-0 z-0">
          <img src="back.png" alt="Background Page 1" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950"></div>
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500 opacity-40 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-600 opacity-30 blur-[100px] rounded-full"></div>
        </div>

        {/* ប៊ូតុងប្តូរភាសា (Language Toggle) នៅទំព័រដើម */}
        <div className="absolute top-6 right-6 z-20">
            <button onClick={() => setLanguage(l => l === 'km' ? 'en' : 'km')} className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-bold border border-white/20 hover:bg-white/20 transition-colors shadow-lg">
                {language === 'km' ? '🇰🇭 ខ្មែរ' : '🇬🇧 English'}
            </button>
        </div>
        
        <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-md mt-8">
          
          {/* [CHANGE_IMAGE_HERE_3]: ទីតាំង Logo កណ្តាលទំព័រដើម (Page 1) */}
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-[2rem] bg-slate-800 border-4 border-indigo-500 p-2 shadow-2xl shadow-indigo-500/40 mb-6 overflow-hidden shrink-0">
            <img src={appLogo} alt="Logo Center" className="w-full h-full object-cover rounded-2xl" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 drop-shadow-lg text-center">
            Khmer TP
          </h1>
          
          <p className="text-center text-slate-200 mb-10 leading-relaxed text-sm md:text-base font-medium px-2 drop-shadow-md">
            {language === 'km' 
              ? 'ប្រព័ន្ធរុករកទិន្នន័យ និងសម្របសម្រួលទំនាក់ទំនងក្នុងគ្រាអាសន្ន។ បង្កើតឡើងដើម្បីផ្តល់ភាពងាយស្រួលដល់ប្រជាពលរដ្ឋក្នុងការទាក់ទងមេភូមិ ឃុំ ប៉ុស្តិ៍នគរបាល និងមន្ទីរពេទ្យដោយផ្ទាល់។'
              : 'Data exploration and emergency coordination system. Built to provide citizens with easy, direct communication to Village Chiefs, Communes, Police, and Hospitals.'}
          </p>
          
          <button 
            onClick={() => setCurrentPage('app')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 text-lg w-full justify-center border border-indigo-500/50"
          >
            {language === 'km' ? 'អនុញ្ញាតឲ្យខ្លួនឯងចូលប្រើប្រាស់' : 'Authorize entry for myself'}
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP PAGE 2 ---
  return (
    <div className={`min-h-screen font-khmer transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen flex selection:bg-indigo-500 selection:text-white">
        
        {/* Toast */}
        {toast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-top-5">
            <div className={`px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
              {toast.type === 'error' ? <XCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
              {toast.msg}
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} setAppLogo={setAppLogo} setCurrentPage={setCurrentPage} language={language} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Top Navigation */}
          <TopBar 
            theme={theme} 
            toggleTheme={toggleTheme} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            notifications={notifications}
            appLogo={appLogo}
            setAppLogo={setAppLogo}
            db={db}
            appId={appId}
            showToast={showToast}
            language={language}
          />

          {/* Dynamic View Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            {currentView === 'home' && (
              <HomeView 
                locations={approvedLocations} 
                searchQuery={searchQuery}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onOpenLocation={setSelectedLocation}
              />
            )}
            {currentView === 'data' && (
               !profile.username ? (
                 <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-300 py-20">
                    <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <User className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
                    <p className="text-slate-500 mb-8 max-w-md">សូមចូលទៅកាន់គណនី (Account) ដើម្បីកំណត់ឈ្មោះរបស់អ្នកជាមុនសិន ទើបអ្នកអាចចូលប្រើប្រាស់មុខងារទិន្នន័យនេះបាន។</p>
                    <button onClick={() => setCurrentView('account')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2">
                       <User className="w-5 h-5"/> ទៅកំណត់ឈ្មោះឥឡូវនេះ
                    </button>
                 </div>
               ) : (
                 <DataView 
                   locations={approvedLocations} 
                   searchQuery={searchQuery}
                   favorites={favorites}
                   toggleFavorite={toggleFavorite}
                   onOpenLocation={setSelectedLocation}
                   user={user}
                   profile={profile}
                   isAdmin={isAdmin}
                   showToast={showToast}
                   db={db}
                   appId={appId}
                 />
               )
            )}
            {currentView === 'reports' && (
              <ReportsView locations={approvedLocations} usersList={usersList} />
            )}
            {currentView === 'chat' && (
              <ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} />
            )}
            {currentView === 'account' && (
              <AccountView 
                user={user} 
                profile={profile} 
                db={db} 
                appId={appId} 
                showToast={showToast}
                themeColor={themeColor} 
                setThemeColor={setThemeColor} 
                theme={theme} 
                setTheme={setTheme}
                setCurrentPage={setCurrentPage}
                language={language}
                setLanguage={setLanguage}
              />
            )}
            {currentView === 'admin' && isAdmin && (
              <AdminDashboard 
                locations={locations} 
                pendingLocations={pendingLocations} 
                usersList={usersList}
                cyberLogs={cyberLogs}
                db={db} appId={appId} showToast={showToast}
                setCurrentView={setCurrentView}
              />
            )}
          </div>
          
          {/* Mobile Bottom Navigation */}
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} language={language} />

        </main>

        {/* Modals */}
        {selectedLocation && (
          <LocationDetailModal 
            location={selectedLocation} 
            onClose={() => setSelectedLocation(null)} 
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            db={db} appId={appId}
          />
        )}

      </div>
    </div>
  );
}

// ==========================================
// VIEWS & COMPONENTS (Preserving exact CSS)
// ==========================================

const Sidebar = ({ currentView, setCurrentView, isAdmin, appLogo, setAppLogo, setCurrentPage, language }) => {
  const navItems = [
    { id: 'home', icon: Home, label: language === 'km' ? 'ទំព័រដើម' : 'Home', sub: 'Home' },
    { id: 'data', icon: Map, label: language === 'km' ? 'ទិន្នន័យ' : 'Data', sub: 'Data' },
    { id: 'reports', icon: TrendingUp, label: language === 'km' ? 'របាយការណ៍' : 'Reports', sub: 'Reports' },
    { id: 'chat', icon: MessageCircle, label: language === 'km' ? 'សារ' : 'Messages', sub: 'Messages' },
    { id: 'account', icon: User, label: language === 'km' ? 'គណនី' : 'Account', sub: 'Account' },
  ];

  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin', sub: 'Admin' });

  return (
    <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-200 dark:border-slate-800 z-10">
      <div className="p-6 flex items-center gap-3">
        <label className="cursor-pointer relative group shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-0.5">
            {/* [CHANGE_IMAGE_HERE_4]: ទីតាំង Logo ក្នុង Sidebar (ភ្ជាប់ជាមួយ appLogo state ខាងលើស្រាប់) */}
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[10px] group-hover:opacity-50 transition" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            if (e.target.files[0]) {
              const r = new FileReader(); r.onload = () => setAppLogo(r.result); r.readAsDataURL(e.target.files[0]);
            }
          }} />
        </label>
        <div>
          <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">Khmer TP</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">ស្វែងយល់ពីកម្ពុជា (Discover Cambodia)</p>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-4 px-3 uppercase tracking-wider">{language === 'km' ? 'ម៉ឺនុយ (Menu)' : 'Menu'}</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
              currentView === item.id 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentView === item.id ? 'stroke-[2.5px]' : ''}`} />
            <div className="text-left">
              <div className="font-medium">{item.label}</div>
              <div className="text-[10px] opacity-60 leading-tight">{item.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCurrentPage('gateway')}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group font-bold"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm">{language === 'km' ? 'ត្រឡប់ទៅទំព័រស្វាគមន៍' : 'Back to Gateway'}</span>
        </button>
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${
              currentView === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-1 transition-transform duration-300 ${currentView === item.id ? 'scale-110 stroke-[2.5px]' : ''}`} />
            <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen, notifications, appLogo, setAppLogo, db, appId, showToast, language }) => {
  return (
    <header className="px-4 py-4 md:px-8 glass-panel sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
      
      {/* Mobile Brand */}
      <div className="md:hidden flex items-center gap-2 shrink-0">
        <label className="cursor-pointer relative">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-lg flex items-center justify-center p-0.5">
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-[6px]" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            if (e.target.files[0]) {
              const r = new FileReader(); r.onload = () => setAppLogo(r.result); r.readAsDataURL(e.target.files[0]);
            }
          }} />
        </label>
        <div>
          <h1 className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">Khmer TP</h1>
          <p className="text-[9px] text-slate-500">ស្វែងយល់ពីកម្ពុជា (Discover Cambodia)</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder={language === 'km' ? "ស្វែងរកទីតាំង... (Search locations)" : "Search locations..."} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-2xl py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4 relative shrink-0">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
          </button>
          
          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-panel soft-shadow rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-medium flex justify-between">
                <span>{language === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}</span>
                <button onClick={() => setNotificationsOpen(false)}><XCircle className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? <p className="p-4 text-center text-sm text-slate-500">{language === 'km' ? 'គ្មានសារថ្មីទេ' : 'No new messages'}</p> : 
                  notifications.map(n => (
                    <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-start gap-2">
                      <div>
                        <p className={`text-sm font-bold ${n.type === 'error' ? 'text-red-500' : 'text-indigo-500'}`}>{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{n.msg}</p>
                      </div>
                      <button onClick={async () => {
                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notifications', n.id));
                        showToast('លុបសារចេញរួចរាល់');
                      }} className="text-slate-400 hover:text-red-500 shrink-0"><XCircle className="w-4 h-4"/></button>
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
  const filtered = locations.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="relative rounded-[2rem] overflow-hidden h-[300px] md:h-[400px] soft-shadow group">
        <img 
          src="back.png" 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent"></div>
        <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium mb-4 w-max border border-white/30 uppercase">
            សង្គ្រោះបន្ទាន់
          </div>
          <h1 className="text-2xl md:text-5xl font-bold text-white mb-2 leading-tight">ស្វែងរកទិន្នន័យសំខាន់ៗ<br className="hidden md:block"/>សម្រាប់ទាក់ទងពេលមានអាសន្ន!</h1>
          <p className="text-yellow-300 max-w-xl text-sm md:text-base font-medium italic">Find important information for emergency situations.</p>
        </div>
      </div>

      {/* Locations Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            ទីតាំងសំខាន់ៗដែលបានដាក់បញ្ចូល (Important Added Locations)
          </h2>
        </div>

        {filtered.length === 0 ? (
           <div className="text-center py-12 text-slate-500">មិនមានទិន្នន័យទេ (No locations found).</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((loc, i) => (
              <LocationCard 
                key={loc.id} 
                location={loc} 
                isFavorite={!!favorites[loc.id]} 
                onToggleFavorite={() => toggleFavorite(loc.id)}
                onClick={() => onOpenLocation(loc)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- View: Data (was Explore) ---
const DataView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Add Form State
  const [form, setForm] = useState({ title: '', institution: '', phone: '', image: '', mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);

  const filtered = locations.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by Main Tab
    const isRatanak = l.province === 'បាត់ដំបង' && l.district === 'រតនមណ្ឌល';
    if (activeTab === 'រតនមណ្ឌល' && !isRatanak) return false;
    if (activeTab === 'ស្រុកផ្សេងៗ' && isRatanak) return false;

    // Filter by Sub Level
    let matchesLevel = true;
    if (activeFilter === 'ស្រុក' && !l.district) matchesLevel = false;
    if (activeFilter === 'ឃុំ' && !l.commune) matchesLevel = false;
    if (activeFilter === 'ភូមិ' && !l.village) matchesLevel = false;

    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    if (!profile.username) {
      showToast('សូមបង្កើតឈ្មោះក្នុងគណនីជាមុនសិន', 'error');
      return;
    }
    setEditingId(null);
    setForm({ title: '', institution: '', phone: '', image: '', mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (e, id) => {
      e.stopPropagation();
      if(window.confirm("តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?")) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', id));
          showToast('ទិន្នន័យត្រូវបានលុបចោល');
      }
  };

  const handleEdit = (e, loc) => {
      e.stopPropagation();
      setForm(loc);
      setEditingId(loc.id);
      setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.image) return showToast('សូមបំពេញឈ្មោះ និងរូបភាព', 'error');
    setLoading(true);
    try {
      const isAuto = isAdmin;
      let submitData = { ...form, author: profile.username, timestamp: Date.now() };
      
      // Auto-assign province/district if tab is Ratanak Mondul
      if (activeTab === 'រតនមណ្ឌល') {
          submitData.province = 'បាត់ដំបង';
          submitData.district = 'រតនមណ្ឌល';
      }
      
      if (editingId) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', editingId), submitData);
          showToast('កែប្រែទិន្នន័យជោគជ័យ');
      } else {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'data_user'), {
            ...submitData, status: isAuto ? 'approved' : 'pending', likes: 0
          });

          if (isAuto) {
            showToast('OK សំណើររបស់អ្នកជោគជ័យ');
          } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { title: 'សំណើថ្មី', msg: `មានសំណើពី ${profile.username}`, type: 'info', timestamp: Date.now() });
            showToast('រាល់សំណើរនឹងត្រូវពិនិត្យដោយ Admin មុនអនុម័ត។ សូមរង់ចាំ ២នាទី។');
          }
      }
      setIsAddModalOpen(false);
      setForm({ title: '', institution: '', phone: '', image: '', mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
    } catch (err) { showToast('បរាជ័យ', 'error'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
             <h1 className="text-2xl font-bold flex items-center gap-2"><Map className="w-6 h-6 text-indigo-500" /> ទិន្នន័យភូមិសាស្ត្រ</h1>
             {/* Main Category Tabs */}
             <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab}
                    </button>
                ))}
             </div>
         </div>
         <button onClick={handleOpenAdd} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors soft-shadow whitespace-nowrap">
           <Plus className="w-5 h-5"/> បន្ថែមទីតាំងក្នុង {activeTab}
         </button>
      </div>

      {/* Sub Filters */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto hide-scrollbar max-w-full">
        {['ទាំងអស់', 'ស្រុក', 'ឃុំ', 'ភូមិ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFilter === cat ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
            {cat}
          </button>
        ))}
      </div>
      
      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? <p className="col-span-full text-center text-slate-500 py-10">គ្មានទិន្នន័យក្នុងផ្នែកនេះទេ</p> : 
          filtered.map((loc, i) => (
             <div key={loc.id} onClick={() => onOpenLocation(loc)} className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl soft-shadow cursor-pointer hover:-translate-y-1 transition-transform border border-slate-100 dark:border-slate-700/50 group relative">
               <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden relative shrink-0">
                  <img src={loc.image} alt={loc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded font-bold">{loc.category}</span>
               </div>
               <div className="flex flex-col justify-center flex-1">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{loc.title}</h3>
                  <p className="text-[10px] text-indigo-500 font-bold mb-1">{loc.province || 'មិនបញ្ជាក់ខេត្ត'} &gt; {loc.district || 'មិនបញ្ជាក់ស្រុក'}</p>
                  <p className="text-xs text-slate-500 mb-2">ឃុំ {loc.commune || '-'} • ភូមិ {loc.village || '-'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{loc.desc}</p>
               </div>
               
               {isAdmin && (
                   <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => handleEdit(e, loc)} className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shadow-sm"><Edit3 className="w-4 h-4"/></button>
                       <button onClick={(e) => handleDelete(e, loc.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg shadow-sm"><Trash2 className="w-4 h-4"/></button>
                   </div>
               )}
             </div>
          ))
        }
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden soft-shadow border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                  <h2 className="text-lg font-bold text-indigo-600">បន្ថែមទីតាំងថ្មី</h2>
                  <p className="text-xs text-slate-500">អ្នកកំពុងបន្ថែមក្នុងផ្នែក៖ <span className="font-bold">{activeTab}</span></p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"><XCircle className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ប្រភេទ</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="សាលារៀន">សាលារៀន</option><option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option><option value="ប៉ុស្តិ៍ប៉ូលិស">ប៉ុស្តិ៍ប៉ូលិស</option>
                      <option value="មេភូមិ">មេភូមិ</option><option value="មេឃុំ">មេឃុំ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ឈ្មោះ (Name)</label>
                    <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ឈ្មោះបុគ្គល ឬទីតាំង..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ឈ្មោះស្ថាប័ន (Institution Name)</label>
                    <input type="text" required value={form.institution} onChange={e=>setForm({...form, institution: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ឈ្មោះស្ថាប័ន..." />
                  </div>
                </div>

                {/* Geography Section Based on Active Tab */}
                {activeTab === 'រតនមណ្ឌល' ? (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ឃុំ</label>
                            <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">ជ្រើសរើសឃុំ</option>
                                {Object.keys(REGIONS["រតនមណ្ឌល"] || {}).map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ភូមិ</label>
                            <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                                <option value="">ជ្រើសរើសភូមិ</option>
                                {form.commune && REGIONS["រតនមណ្ឌល"] && REGIONS["រតនមណ្ឌល"][form.commune] && REGIONS["រតនមណ្ឌល"][form.commune].map(v=><option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ខេត្ត</label>
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ខេត្ត..." />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ស្រុក/ខណ្ឌ</label>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ស្រុក..." />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div><input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="លេខទូរស័ព្ទ..." /></div>
                  <div><input type="url" value={form.mapUrl} onChange={e=>setForm({...form, mapUrl: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Google Map Link (ជម្រើស)..." /></div>
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
                           <span className="text-sm font-bold">ចុចទីនេះដើម្បីបញ្ចូលរូបភាព</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required={!editingId} className="hidden" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>

                <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="ការពណ៌នា..." className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"></textarea>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
               <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition">បោះបង់</button>
               <button type="submit" form="addForm" disabled={loading} className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-md">ផ្ញើសំណើទៅ Admin</button>
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

  // Real calculation from Firebase users
  const totalUsers = usersList.length;
  const weeklyUsers = usersList.filter(u => u.timestamp > weekAgo).length;
  const monthlyUsers = usersList.filter(u => u.timestamp > monthAgo).length;
  const yearlyUsers = usersList.filter(u => u.timestamp > yearAgo).length;

  const stats = [
    { label: 'Total Users', count: totalUsers, color: 'text-indigo-500' },
    { label: 'Weekly Users', count: weeklyUsers, color: 'text-teal-500' },
    { label: 'Monthly Users', count: monthlyUsers, color: 'text-amber-500' },
    { label: 'Yearly Users', count: yearlyUsers, color: 'text-rose-500' },
  ];

  const cats = locations.reduce((acc, l) => { acc[l.category] = (acc[l.category]||0)+1; return acc; }, {});
  const chartColors = ['bg-[#10b981]', 'bg-[#3b82f6]', 'bg-[#6366f1]', 'bg-[#f43f5e]', 'bg-[#f59e0b]', 'bg-[#8b5cf6]', 'bg-[#06b6d4]'];
  const svgColors = ['#10b981', '#3b82f6', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold flex items-center gap-2"><PieChart className="w-6 h-6 text-indigo-500" /> Report Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <div key={i} className="glass-panel p-6 rounded-[2rem] soft-shadow border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{s.label}</p>
              <h3 className={`text-4xl font-black ${s.color}`}>{s.count}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 md:p-8 rounded-[2rem] soft-shadow border border-slate-200 dark:border-slate-800">
           <h3 className="text-lg font-bold mb-6">Percentage Breakdown (%)</h3>
           <div className="space-y-4">
             {Object.entries(cats).map(([name, count], i) => {
               const pct = totalUsers > 0 ? Math.round((count/Math.max(locations.length, 1))*100) : 0;
               return (
                 <div key={name}>
                   <div className="flex justify-between text-xs font-bold mb-1.5"><span>{name}</span><span>{pct}%</span></div>
                   <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className={`h-full ${chartColors[i%7]} rounded-full`} style={{width:`${pct}%`}}></div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-[2rem] soft-shadow border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
           <h3 className="text-lg font-bold mb-6">User Activity Trends (Line & Bar)</h3>
           <div className="flex-1 flex items-end gap-2 h-40 border-b border-l border-slate-200 dark:border-slate-700 pl-2 pb-2 relative">
               <div className="absolute -left-6 bottom-0 text-[10px] text-slate-400">0%</div>
               <div className="absolute -left-8 top-0 text-[10px] text-slate-400">100%</div>
               {[
                   {label: 'Daily', pct: totalUsers ? Math.round((usersList.filter(u=>u.timestamp>dayAgo).length/totalUsers)*100) : 0},
                   {label: 'Weekly', pct: totalUsers ? Math.round((weeklyUsers/totalUsers)*100) : 0},
                   {label: 'Monthly', pct: totalUsers ? Math.round((monthlyUsers/totalUsers)*100) : 0},
                   {label: 'Yearly', pct: totalUsers ? Math.round((yearlyUsers/totalUsers)*100) : 0}
               ].map((d, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1">
                       <div className="w-full max-w-[40px] bg-indigo-500/80 rounded-t-sm relative transition-all duration-1000 group hover:bg-indigo-400" style={{height: `${Math.max(d.pct, 5)}%`}}>
                           <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{d.pct}%</div>
                       </div>
                       <span className="text-[10px] text-slate-500 mt-2">{d.label}</span>
                   </div>
               ))}
           </div>
        </div>
      </div>
      
      <div className="glass-panel p-6 md:p-8 rounded-[2rem] soft-shadow border border-slate-200 dark:border-slate-800">
           <h3 className="text-lg font-bold mb-6">Newly Added Locations (Timestamped)</h3>
           <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
             {locations.slice(-6).reverse().map(l => (
               <div key={l.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-sm truncate">{l.title}</span>
                  <span className="text-xs text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm">{new Date(l.timestamp||Date.now()).toLocaleString('en-GB')}</span>
               </div>
             ))}
           </div>
      </div>

      <div className="pt-8 flex justify-center pb-10">
        {editFooter ? (
          <div className="flex gap-2">
            <input type="text" value={footerText} onChange={e=>setFooterText(e.target.value)} className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 outline-none w-64" />
            <button onClick={()=>setEditFooter(false)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Save</button>
          </div>
        ) : (
          <p onClick={()=>setEditFooter(true)} className="text-xs text-slate-400 font-bold cursor-pointer hover:text-indigo-500 transition">© {footerText}</p>
        )}
      </div>
    </div>
  );
};


// --- View: Chat ---
const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView }) => {
  const [msgText, setMsgText] = useState('');
  const [image, setImage] = useState(null);
  const [fileAttached, setFileAttached] = useState(false);
  const [activeTarget, setActiveTarget] = useState('Admin');
  const messagesEndRef = useRef(null);
  
  const targets = ['Admin', 'Village Chief', 'Commune Chief', 'Police'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { 
      scrollToBottom(); 
      // Play ping sound if new message arrives (simulated check by length or unread)
      if(chats.length > 0 && chats[chats.length-1].userId !== user?.uid) {
          playPingSound();
      }
  }, [chats]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!profile.username) {
      showToast('សូមបង្កើតឈ្មោះក្នុងគណនីជាមុនសិនដើម្បីបញ្ជូនសារ', 'error');
      setCurrentView('account');
      return;
    }
    if (!msgText.trim() && !image && !fileAttached) return;
    
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    await addDoc(chatRef, {
      text: msgText,
      image: image,
      fileAttached: fileAttached,
      target: activeTarget,
      userId: user.uid,
      userName: profile.username,
      avatar: profile.avatar,
      timestamp: Date.now()
    });
    
    // Alert Notification Trigger
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { title: 'សារថ្មីរាយការណ៍', msg: `អ្នកបានផ្ញើទៅ ${activeTarget}`, type: 'success', timestamp: Date.now() });

    setMsgText('');
    setImage(null);
    setFileAttached(false);
  };

  // Filter chat based on target 
  const filteredChats = chats.filter(c => c.target === activeTarget || c.target === 'All');

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] glass-panel rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in scale-95 duration-300 soft-shadow">
      {/* Chat Header & Target Selector */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 text-white flex items-center justify-center font-bold overflow-hidden">
                 {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover"/> : 'TP'}
               </div>
               <div>
                 <h2 className="font-bold">Chat TP Active/Online</h2>
                 <div className="flex items-center gap-1.5 text-xs text-slate-500">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                   User ↔ {activeTarget} ↔ Admin
                 </div>
               </div>
            </div>
        </div>
        
        {/* Contact Targets Bar */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {targets.map(t => (
                <button key={t} onClick={() => setActiveTarget(t)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTarget === t ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {t}
                </button>
            ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
        {filteredChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
             <p>មិនទាន់មានសារទេ។ (No messages yet.)</p>
          </div>
        ) : (
          filteredChats.map(msg => {
            const isMe = msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex max-w-[80%] md:max-w-[60%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-2 ml-2 mb-1">
                      <img src={msg.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-6 h-6 rounded-full object-cover shadow-sm" alt="av"/>
                      <span className="text-[10px] font-bold text-slate-500">{msg.userName} <span className="text-emerald-500 ml-1">✓ Viewed</span></span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm soft-shadow border border-slate-100 dark:border-slate-700'
                  }`}>
                    <p>{msg.text}</p>
                    {msg.image && <img src={msg.image} className="mt-2 rounded-xl max-h-48 border border-white/20" alt="img"/>}
                    {msg.fileAttached && <div className="mt-2 text-xs bg-black/10 p-2 rounded flex items-center gap-1"><Paperclip className="w-3 h-3"/> File Attached</div>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        {image && (
           <div className="mb-2 relative inline-block">
             <img src={image} className="h-16 rounded-lg object-cover border border-slate-200" alt="preview"/>
             <button onClick={()=>setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><XCircle className="w-3 h-3"/></button>
           </div>
        )}
        {fileAttached && <div className="mb-2 text-xs text-indigo-600 font-bold">1 File Ready</div>}
        
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <label className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer hover:bg-slate-200 transition">
             <Plus className="w-5 h-5 text-slate-500" />
             <input type="file" onChange={e=>{ if(e.target.files[0]) setFileAttached(true); }} className="hidden"/>
          </label>
          <label className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer hover:bg-slate-200 transition">
             <ImageIcon className="w-5 h-5 text-slate-500" />
             <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setImage(r.result); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
          </label>
          <input 
            type="text" 
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder={`សរសេរសារទៅកាន់ ${activeTarget}...`} 
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 px-6 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            type="submit" 
            disabled={!msgText.trim() && !image && !fileAttached}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- View: Profile (Account) ---
const AccountView = ({ user, profile, db, appId, showToast, themeColor, setThemeColor, theme, setTheme, setCurrentPage, language, setLanguage }) => {
  const [pwd, setPwd] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [localName, setLocalName] = useState(profile.username || '');
  const tColors = ['#4f46e5', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    setLocalName(profile.username || '');
  }, [profile.username]);

  const handleSaveName = async () => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'name_data', user.uid),{username: localName});
      showToast('រក្សាទុកឈ្មោះបានជោគជ័យ');
  };

  const handleAdminLogin = async () => {
    if (pwd === ADMIN_PASSWORD) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'name_data', user.uid), { role: 'admin' });
      showToast('ចូលប្រើប្រាស់ជា Admin ជោគជ័យ');
      setShowAdminLogin(false);
    } else {
      showToast('លេខសម្ងាត់មិនត្រឹមត្រូវ', 'error');
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), {
         username: profile.username || 'គ្មានឈ្មោះ', device: navigator.userAgent, ip: 'Tracked internally', timestamp: Date.now()
      });
      setPwd('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="glass-panel p-6 md:p-10 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden soft-shadow border border-white/50 dark:border-slate-700/50">
        <h1 className="text-2xl font-bold mb-6 w-full text-left">{language === 'km' ? 'គណនីរបស់អ្នក' : 'Your Account'}</h1>
        
        <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 p-1 mb-6">
          <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 overflow-hidden relative group">
             <img src={profile.avatar} className="w-full h-full object-cover" alt="av"/>
             <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Edit3 className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'name_data', user.uid),{avatar:r.result}); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
          </div>
        </div>
        
        <div className="w-full max-w-sm space-y-4">
           <div>
             <label className="text-xs font-bold text-slate-500 mb-1 block">{language === 'km' ? 'ឈ្មោះ (Name)' : 'Name'}</label>
             <div className="flex gap-2">
                 <input 
                     type="text" 
                     value={localName} 
                     onChange={e => setLocalName(e.target.value)} 
                     placeholder={language === 'km' ? "បញ្ចូលឈ្មោះ..." : "Enter name..."} 
                     className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                 />
                 <button onClick={handleSaveName} className="bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition">Save</button>
             </div>
           </div>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-10 rounded-[2.5rem] soft-shadow border border-white/50 dark:border-slate-700/50 space-y-6">
         <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> {language === 'km' ? 'ការកំណត់ (Settings)' : 'Settings'}</h2>
         
         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-sm">Dark Mode</span>
            <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              {theme === 'dark' ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>}
            </button>
         </div>

         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-sm">{language === 'km' ? 'ប្តូរភាសា (Language)' : 'Language'}</span>
            <button onClick={() => setLanguage(l => l === 'km' ? 'en' : 'km')} className="text-xs font-bold text-indigo-500 hover:text-white hover:bg-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg transition-colors shadow-sm">
                {language === 'km' ? '🇰🇭 ខ្មែរ' : '🇬🇧 English'}
            </button>
         </div>

         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-sm block mb-3">Theme Colors</span>
            <div className="flex gap-3">
              {tColors.map(c => (
                <button key={c} onClick={()=>setThemeColor(c)} className={`w-8 h-8 rounded-full border-2 ${themeColor===c?'border-slate-800 dark:border-white scale-110':'border-transparent'}`} style={{backgroundColor: c}}></button>
              ))}
            </div>
         </div>

         {profile.role !== 'admin' && (
           <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowAdminLogin(true)} className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-red-200 dark:border-red-900/30">
                 <ShieldAlert className="w-5 h-5"/> កិច្ចការរដ្ឋបាល (Administration)
              </button>

              {/* Admin Password Modal Popup */}
              {showAdminLogin && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                   <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAdminLogin(false)}></div>
                   <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 soft-shadow border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                      <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-red-500"><ShieldAlert className="w-6 h-6"/> បញ្ជាក់សិទ្ធិជា Admin</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">សូមបញ្ចូលលេខសម្ងាត់ដើម្បីចូលទៅកាន់ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល។</p>
                      
                      <div className="space-y-3">
                         <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="វាយបញ្ចូល Password..." className="w-full bg-slate-100 dark:bg-slate-800 px-5 py-4 rounded-xl text-base font-bold outline-none border border-transparent focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 tracking-widest text-center"/>
                         <button onClick={handleAdminLogin} className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-black shadow-lg shadow-red-500/30 transition-all active:scale-95 text-base">ចូលប្រព័ន្ធ (Login)</button>
                      </div>
                      
                      <button onClick={() => setShowAdminLogin(false)} className="w-full mt-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors">បោះបង់ (Cancel)</button>
                   </div>
                </div>
              )}
           </div>
         )}
         
         <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setCurrentPage('gateway')}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-5 h-5" /> {language === 'km' ? 'ត្រឡប់ទៅទំព័រស្វាគមន៍ (Back to Page 1)' : 'Back to Gateway (Page 1)'}
            </button>
         </div>
      </div>
    </div>
  );
};

// --- View: Admin Dashboard ---
const AdminDashboard = ({ locations, pendingLocations, usersList, cyberLogs, db, appId, showToast, setCurrentView }) => {
  const handleApprove = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', id), { status: 'approved' });
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { title: 'អនុម័តជោគជ័យ', msg: 'OK សំណើររបស់អ្នកជោគជ័យ', type: 'success', timestamp: Date.now() });
    showToast('អនុម័តជោគជ័យ');
  };

  const handleReject = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', id));
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { title: 'បដិសេធ', msg: 'NO សំណើររបស់អ្នកមិនត្រូវបានអនុញ្ញាត', type: 'error', timestamp: Date.now() });
    showToast('បដិសេធ', 'error');
  };

  const clearLog = async (id = null) => {
    if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
    else cyberLogs.forEach(async l => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-[2rem] shadow-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-indigo-400"/> Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">គ្រប់គ្រងទិន្នន័យ និងពិនិត្យទីតាំងថ្មីៗ</p>
        </div>
        <button 
          onClick={() => { setCurrentView('home'); showToast('ចាកចេញពី Admin រួចរាល់'); }} 
          className="mt-4 md:mt-0 px-5 py-2.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
        >
           <LogOut className="w-4 h-4"/> ចាកចេញ (Admin Logout)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div><p className="text-sm text-slate-500 mb-1">User Names</p><h3 className="text-3xl font-bold">{usersList.length}</h3></div>
            <Users className="w-8 h-8 text-indigo-500 opacity-80" />
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div><p className="text-sm text-slate-500 mb-1">Added Data</p><h3 className="text-3xl font-bold">{locations.length}</h3></div>
            <Activity className="w-8 h-8 text-amber-500 opacity-80" />
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div><p className="text-sm text-slate-500 mb-1">Security Alerts</p><h3 className="text-3xl font-bold">{cyberLogs.length}</h3></div>
            <ShieldAlert className="w-8 h-8 text-red-500 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pending Approvals */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-[400px]">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-amber-500" />
            ការស្នើសុំថ្មីៗ (Approvals)
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {pendingLocations.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500 text-sm">គ្មានការស្នើសុំទេ</div> : 
              pendingLocations.map(loc => (
                <div key={loc.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <img src={loc.image} alt="preview" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                   <div className="flex-1">
                      <h4 className="font-bold text-sm">{loc.title}</h4>
                      <p className="text-xs text-slate-500">អ្នកស្នើ: {loc.author}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => handleApprove(loc.id)} className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => handleReject(loc.id)} className="p-2 bg-red-100 text-red-600 rounded-xl"><XCircle className="w-5 h-5" /></button>
                   </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Security Logs */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-[400px]">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold flex items-center gap-2 text-red-500"><ShieldAlert className="w-5 h-5"/> Security</h3>
             <button onClick={()=>clearLog()} className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold">Clear All</button>
           </div>
           <div className="flex-1 overflow-y-auto space-y-3">
             {cyberLogs.length === 0 ? <p className="text-center text-slate-500 text-sm mt-10">Safe</p> : 
               cyberLogs.map(l => (
                 <div key={l.id} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-xs relative">
                    <p className="font-bold text-red-600 dark:text-red-400">{l.username}</p>
                    <p className="text-slate-500 mt-1">IP: {l.ip}</p>
                    <p className="text-slate-500">Device: {l.device}</p>
                    <button onClick={()=>clearLog(l.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">Clear One</button>
                 </div>
               ))
             }
           </div>
        </div>

      </div>
    </div>
  );
};


// --- Reusable Components ---
const LocationCard = ({ location, isFavorite, onToggleFavorite, onClick, index }) => {
  return (
    <div 
      onClick={onClick}
      className="glass-panel group rounded-[2rem] overflow-hidden cursor-pointer soft-shadow hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/40 dark:border-slate-700/50 flex flex-col h-full bg-white/40 dark:bg-slate-800/40"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={location.image} 
          alt={location.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-slate-200 dark:bg-slate-800"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-medium border border-white/20">
            {location.category}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {location.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
          {location.desc}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700/50 mt-auto">
           <div className="flex items-center gap-1.5 text-xs text-slate-500">
             <Heart className="w-3.5 h-3.5 fill-slate-300 dark:fill-slate-600" /> {location.likes || 0}
           </div>
           <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
             មើលលម្អិត &rarr;
           </span>
        </div>
      </div>
    </div>
  );
};

const LocationDetailModal = ({ location, onClose, favorites, toggleFavorite, db, appId }) => {
  const isFav = !!favorites[location.id];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden soft-shadow border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        
        {/* Modal Image Header */}
        <div className="relative h-64 sm:h-80 shrink-0">
          <img src={location.image} alt={location.title} className="w-full h-full object-cover bg-slate-200" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-6 left-6 right-6">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-medium border border-white/20 mb-3 inline-block">
              {location.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{location.title}</h2>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium">
                  <Heart className="w-4 h-4" /> {location.likes || 0} Likes
               </div>
               {location.status === 'pending' && (
                 <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-medium">
                   Pending Approval
                 </span>
               )}
             </div>
          </div>

          <div className="flex gap-3 mb-6">
             {location.phone && (
                <a href={`tel:${location.phone}`} className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition text-sm">
                  <Phone className="w-4 h-4"/> ទំនាក់ទំនង
                </a>
             )}
             {location.mapUrl && (
                <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition text-sm">
                  <Navigation className="w-4 h-4"/> Google Map
                </a>
             )}
          </div>

          <div className="prose dark:prose-invert max-w-none">
             <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
               <MapPin className="w-5 h-5 text-indigo-500" /> ការពិពណ៌នា
             </h3>
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
               {location.desc || 'មិនមានការពិពណ៌នា...'}
             </p>
             <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs text-slate-400 font-bold flex gap-2">
                  ឈ្មោះ (Name): <span className="text-slate-600 dark:text-slate-300">{location.title}</span>
                </p>
                <p className="text-xs text-slate-400 font-bold flex gap-2">
                  ស្ថាប័ន (Institution): <span className="text-slate-600 dark:text-slate-300">{location.institution || location.title}</span>
                </p>
             </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-center">
             <button 
               onClick={() => toggleFavorite(location.id)}
               className={`border px-8 py-3 rounded-full font-bold flex items-center gap-2 transition shadow-sm ${isFav ? 'bg-red-50 text-red-500 border-red-500 dark:bg-red-900/20' : 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'}`}
             >
               <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} /> {location.likes || 0} Likes (ពិត)
             </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};