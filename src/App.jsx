import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Plus, XCircle, Trash2, Edit3, 
  Image as ImageIcon, Send, LogOut, Settings, 
  LayoutGrid, ShieldAlert, TrendingUp, Phone, CheckCircle, ArrowLeft, 
  ChevronDown, Globe, ArrowRight, Loader2, MapPin, Copyright, Mic, Users, Camera, X, Play, AlertOctagon, Ban, Check, RefreshCw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const playVoiceMelody = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1046.50]; 
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const startTime = now + index * 0.15; const duration = 0.25;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime); osc.stop(startTime + duration);
    });
  } catch(e) {}
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

const injectStyles = () => {
  const styleId = 'khmer-app-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
  styleEl.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700;900&display=swap');
    :root { 
      --font-khmer: 'Noto Sans Khmer', sans-serif; 
      --theme-color: #0f8b65;
    }
    * { -webkit-tap-highlight-color: transparent; touch-action: manipulation; box-sizing: border-box; }
    html, body { 
      overscroll-behavior-y: none; 
      background-color: #f1f5f9; 
      color: #0f172a; margin: 0; padding: 0; width: 100%; height: 100%; touch-action: pan-x pan-y;
    }
    .font-khmer { font-family: var(--font-khmer); }
    input, textarea, select { font-size: 16px !important; outline: none; } 
    input:focus, textarea:focus, select:focus { border-color: var(--theme-color) !important; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 15px); }
    .pt-safe { padding-top: max(env(safe-area-inset-top), 15px); }
    .bg-7colors {
       background: linear-gradient(135deg, #f0fdf4, #e0f2fe, #f5f3ff, #fdf2f8, #fff1f2, #fffbeb, #f0fdf4);
       background-size: 400% 400%;
       animation: gradientMove 15s ease infinite;
    }
    .btn-gradient {
       background: linear-gradient(135deg, #0f8b65, #059669);
       box-shadow: 0 4px 15px rgba(15, 139, 101, 0.2);
       color: white; border: none; transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-gradient:active { transform: scale(0.96); box-shadow: 0 2px 10px rgba(15, 139, 101, 0.1); }
    .premium-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(226, 232, 240, 0.8); }
    .glass-nav { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid rgba(226, 232, 240, 0.8); }
    @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  `;
};

const safeStr = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => safeStr(v)).join(' • ');
  return fallback;
};

const DEFAULT_REGIONS = {
  "រតនមណ្ឌល": { "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"], "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"], "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"] }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('gateway'); 
  const [language, setLanguage] = useState('km'); 
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  
  const [appLogo, setAppLogo] = useState('logo.png'); 
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isBanned: false, warnings: 0 });
  
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
  const [gpsStatus, setGpsStatus] = useState('red'); 
  const [gpsCoords, setGpsCoords] = useState(null);

  useEffect(() => { 
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover';
    injectStyles(); 
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try { await signInWithCustomToken(auth, __initial_auth_token); } 
            catch (e) { await signInAnonymously(auth); }
        } else {
            await signInAnonymously(auth);
        }
      } catch (err) { console.error('Auth error:', err); }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { 
        setUser(currentUser); 
        setIsAuthLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
    setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
    const presenceInterval = setInterval(() => {
        setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
    }, 30000); 

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setDoc(profileRef, { username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', uid: user.uid, timestamp: Date.now(), isBanned: false, warnings: 0 }, { merge: true });
    }, (e)=>console.error(e));

    const unsubAllUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), snap => {
       setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, (e)=>console.error(e));

    const unsubLocations = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'database_admin'), snap => {
        setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (e)=>console.error(e));

    const unsubChats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), snap => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp - b.timestamp); setChats(msgs);
    }, (e)=>console.error(e));

    const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), snap => {
      const lg = snap.docs.map(d => ({id: d.id, ...d.data()})); lg.sort((a,b) => b.timestamp - a.timestamp); setCyberLogs(lg);
    }, (e)=>console.error(e));

    const unsubNotif = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), snap => {
      const nt = snap.docs.map(d => ({id: d.id, ...d.data()})); nt.sort((a,b) => b.timestamp - a.timestamp); setNotifications(nt);
    }, (e)=>console.error(e));

    const unsubFavs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'favorites'), snap => {
      const favMap = {}; snap.docs.forEach(doc => { favMap[doc.id] = true; }); setFavorites(favMap);
    }, (e)=>console.error(e));
    
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions');
    const unsubConfig = onSnapshot(configRef, (snap) => {
        if(snap.exists() && snap.data().data) setDbRegions(snap.data().data);
        else { setDoc(configRef, { data: DEFAULT_REGIONS }, { merge: true }); setDbRegions(DEFAULT_REGIONS); }
    }, (e)=>console.error(e));

    const unsubTargets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'chat_targets'), snap => {
      if (snap.empty) {
        const defaultTargets = [
          { id: 'Admin', label: 'Admin Support', role: 'Support', district: 'រតនមណ្ឌល', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
          { id: 'Police', label: 'ប៉ុស្តិ៍ប៉ូលិសក្នុងភូមិ/ឃុំ', role: 'Emergency', district: 'រតនមណ្ឌល', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
          { id: 'Commune Chief', label: 'មេឃុំ/ចៅសង្កាត់', role: 'Administration', district: 'រតនមណ្ឌល', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
        ];
        defaultTargets.forEach(t => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', t.id), t).catch(()=>{}));
      } else {
        const trg = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        trg.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChatTargets(trg);
      }
    }, (e)=>console.error(e));

    return () => { 
        clearInterval(presenceInterval); 
        unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); 
        unsubLogs(); unsubNotif(); unsubFavs(); unsubConfig(); unsubTargets(); 
    };
  }, [user]);

  const showToast = (msg, type = 'success', duration = 3000) => { 
      setToast({ msg: safeStr(msg), type }); 
      setTimeout(() => setToast(null), duration); 
  };

  const handleGPS = () => {
     setGpsStatus('loading');
     if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
             (pos) => {
                 setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                 setGpsStatus('green');
                 showToast('ចាប់ទីតាំងបានជោគជ័យ', 'success');
             },
             (err) => {
                 setGpsStatus('red');
                 showToast('បរាជ័យក្នុងការចាប់ទីតាំង! សូមបើក Location ឧបករណ៍', 'error');
             },
             { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
         );
     } else {
         setGpsStatus('red');
         showToast('ឧបករណ៍របស់អ្នកមិនគាំទ្រ GPS ទេ', 'error');
     }
  };

  const toggleFavorite = async (locationId) => {
    if (!user) return;
    const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', locationId);
    const locRef = doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', locationId);
    try {
      if (favorites[locationId]) { await deleteDoc(favDocRef); await updateDoc(locRef, { likes: increment(-1) }); } 
      else { await setDoc(favDocRef, { timestamp: Date.now() }); await updateDoc(locRef, { likes: increment(1) }); }
    } catch (e) {}
  };

  const approvedLocations = useMemo(() => locations.filter(l => l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => locations.filter(l => l.status === 'pending'), [locations]);

  if (isAuthLoading) return <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50"><Loader2 className="w-10 h-10 text-[#0f8b65] animate-spin"/></div>;

  if (profile?.isBanned && !isAdmin) {
      return (
        <div className="fixed inset-0 z-[9999] bg-rose-600 text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 font-khmer">
           <Ban className="w-24 h-24 mb-5 animate-pulse text-white/90" />
           <h1 className="text-3xl font-black mb-3">គណនីត្រូវបានបិទ!</h1>
           <p className="text-sm font-medium leading-relaxed max-w-sm text-rose-100 bg-rose-700/50 p-4 rounded-2xl border border-rose-500/50">
              ឧបករណ៍របស់អ្នកត្រូវបានផ្តាច់ចេញពីប្រព័ន្ធ និងដកសិទ្ធិប្រើប្រាស់។
           </p>
        </div>
      );
  }

  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col font-khmer bg-slate-50 overflow-y-auto hide-scrollbar text-slate-800 md:flex-row">
        <div className="bg-7colors w-full h-[55vh] md:h-[100vh] md:w-1/2 rounded-b-[3rem] md:rounded-b-none md:rounded-r-[3rem] relative flex flex-col items-center pt-safe px-6 shadow-xl shrink-0 overflow-hidden animate-in fade-in duration-700">
            <img src="back.png" className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none" alt="Cambodia" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60 pointer-events-none"></div>
            
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-2xl mb-4 mt-16 md:mt-32 z-10 relative border-[2.5px] border-emerald-400">
               <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            
            <h1 className="text-white font-black text-2xl md:text-3xl z-10 tracking-wide drop-shadow-md text-center px-4 leading-snug">
                សូមស្វាគមន៍មកកាន់<br/>TP Nice
            </h1>
        </div>

        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-safe text-center justify-center z-10 relative md:w-1/2 bg-slate-50">
           <div className="max-w-sm w-full space-y-3 mb-10">
              <h2 className="text-2xl font-black text-slate-800 leading-tight">គោលបំណងកម្មវិធី</h2>
              <p className="text-slate-500 text-[14px] leading-relaxed font-medium px-2">
                  កម្មវិធី TP Nice ត្រូវបានបង្កើតឡើងសម្រាប់ស្វែងរកព័ត៌មាន ទំនាក់ទំនង មេភូមិ មេឃុំ ប៉ូលិស មន្ទីរពេទ្យ សាលារៀន និងសេវាសាធារណៈផ្សេងៗ។
              </p>
           </div>
           
           <div className="w-full max-w-[280px]">
              <button onClick={() => setCurrentPage('app')} className="w-full btn-gradient py-3.5 px-4 rounded-[20px] font-bold text-[15px] shadow-lg active:scale-95 transition-all duration-300 flex justify-center items-center group">
                 <span className="tracking-wide">អនុញ្ញាតឲ្យចូលប្រើប្រាស់</span>
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 font-khmer bg-slate-50 text-slate-800 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      
      {user && currentView !== 'chat' && (
         <div className="absolute bottom-[80px] md:bottom-8 right-4 md:right-8 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500 pointer-events-auto">
             <GPSButton gpsStatus={gpsStatus} handleGPS={handleGPS} className="w-12 h-12 shadow-lg bg-white border hover:scale-105 active:scale-95" />
         </div>
      )}

      {toast && (
        <div className="absolute top-safe mt-2 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top-5 fade-in duration-300 w-full max-w-[90vw] md:max-w-sm pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-3 backdrop-blur-md border pointer-events-auto ${toast.type === 'error' ? 'bg-rose-500 text-white border-rose-400' : toast.type === 'info' ? 'bg-slate-800 text-white border-slate-600' : 'bg-[#0f8b65] text-white border-emerald-500'}`}>
            {toast.type === 'error' ? <XCircle className="w-5 h-5 shrink-0"/> : toast.type === 'info' ? <Bell className="w-5 h-5 shrink-0"/> : <CheckCircle className="w-5 h-5 shrink-0"/>} 
            <span className="flex-1 text-left leading-relaxed">{safeStr(toast.msg)}</span>
          </div>
        </div>
      )}

      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <TopHeader 
            setCurrentPage={setCurrentPage} notifications={notifications} notificationsOpen={notificationsOpen} 
            setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            db={db} appId={appId} user={user} appLogo={appLogo} currentView={currentView} profile={profile}
        />

        <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50 w-full max-w-7xl mx-auto">
           {currentView === 'home' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} setCurrentView={setCurrentView} /></div>}
           {currentView === 'data' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} dbRegions={dbRegions} gpsCoords={gpsCoords} captureGps={handleGPS} /></div>}
           {currentView === 'reports' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><ReportsView locations={approvedLocations} usersList={usersList} /></div>}
           {currentView === 'chat' && <div className="flex-1 overflow-hidden p-0"><ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} usersList={usersList} chatTargets={chatTargets} dbRegions={dbRegions} gpsStatus={gpsStatus} captureGps={handleGPS} gpsCoords={gpsCoords} /></div>}
           {currentView === 'account' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} /></div>}
           {currentView === 'admin' && isAdmin && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} dbRegions={dbRegions} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} setIsAdmin={setIsAdmin} chatTargets={chatTargets} /></div>}
        </div>
        
        {currentView !== 'chat' && (
           <div className="pb-[75px] md:pb-4 pt-3 border-t border-slate-200 text-center shrink-0 bg-white z-10">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Copyright className="w-3 h-3"/> រក្សាសិទ្ធិដោយ យុវជនស្ម័គ្រចិត្ត VMC © ២០២៧
             </p>
           </div>
        )}
      </main>

      <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />

      {selectedLocation && <LocationDetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} />}
    </div>
  );
}

const Sidebar = ({ currentView, setCurrentView, isAdmin, appLogo }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម' },
    { id: 'data', icon: LayoutGrid, label: 'ទិន្នន័យ' },
    { id: 'reports', icon: TrendingUp, label: 'របាយការណ៍' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'account', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'អ្នកគ្រប់គ្រង' });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-10 h-[100dvh] shrink-0 shadow-sm animate-in fade-in">
      <div className="p-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
           <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-black text-[15px] text-[#0f8b65] leading-tight uppercase tracking-wider pb-1">TP Nice</h1>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
        <div className="text-[10px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">ម៉ឺនុយ</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors duration-200 ${currentView === item.id ? 'bg-[#0f8b65]/10 text-[#0f8b65] font-bold' : 'text-slate-500 hover:bg-slate-50 font-medium'}`}>
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <div className="text-[13px]">{item.label}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const BottomNav = ({ currentView, setCurrentView, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម' },
    { id: 'data', icon: LayoutGrid, label: 'ទិន្នន័យ' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'account', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] animate-in fade-in pb-safe">
      <div className="flex justify-around items-center h-[65px] px-2">
      {navItems.map(item => {
         const isActive = currentView === item.id;
         return (
           <button key={item.id} onClick={() => setCurrentView(item.id)} className="relative flex-1 flex flex-col items-center justify-center h-full transition-colors active:scale-95">
             <div className={`flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-[#0f8b65] -translate-y-1' : 'text-slate-400'}`}>
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-[#0f8b65]/10' : ''}`}>
                   <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                </div>
                <span className={`text-[9px] mt-0.5 ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
             </div>
           </button>
         )
      })}
      </div>
    </div>
  );
};

const GPSButton = ({ gpsStatus, handleGPS, className = "" }) => (
    <button onClick={handleGPS} className={`rounded-full flex items-center justify-center transition-colors border ${gpsStatus === 'green' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'} ${className}`} title="ចាប់ទីតាំង GPS">
        {gpsStatus === 'loading' ? <Loader2 className="w-5 h-5 text-slate-500 animate-spin"/> : <MapPin className={`w-5 h-5 ${gpsStatus === 'green' ? 'text-emerald-500' : 'text-rose-500'}`} />}
    </button>
);

const TopHeader = ({ setCurrentPage, notifications, notificationsOpen, setNotificationsOpen, searchQuery, setSearchQuery, db, appId, user, appLogo, currentView, profile }) => {
    return (
        <div className="bg-white border-b border-slate-200 pt-[calc(env(safe-area-inset-top,10px)+10px)] px-4 md:px-8 pb-3 shadow-sm relative z-40 shrink-0 w-full">
           <div className="flex justify-between items-center mb-3 pt-1">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-200 p-0.5">
                    <img src={appLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-[16px] font-black leading-tight text-slate-800 tracking-wide uppercase">TP Nice</h1>
                    <span className="text-[10px] text-slate-500 font-bold">ស្វែងរកព័ត៌មានបានរហ័ស</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="relative">
                     <button className="p-2 bg-slate-50 rounded-full active:scale-95 transition shadow-sm relative border border-slate-200 hover:bg-slate-100" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-5 h-5 text-slate-600" />
                        {notifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
                     </button>
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in zoom-in-95 pointer-events-auto">
                          <div className="p-3 border-b border-slate-100 font-bold flex justify-between text-xs bg-slate-50 items-center">
                            <span>ការជូនដំណឹង (Notifications)</span><button onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-4 h-4 text-slate-500" /></button>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <p className="p-5 text-center text-xs text-slate-400 font-bold">គ្មានសារថ្មីទេ</p> : 
                              notifications.map(n => (
                                <div key={n.id} className="p-4 border-b border-slate-50 flex justify-between items-start gap-3 hover:bg-slate-50 transition-colors group">
                                  <div className="flex-1">
                                    <p className={`text-[11px] font-black ${n.type === 'error' ? 'text-rose-500' : 'text-[#0f8b65]'}`}>{safeStr(n.title)}</p>
                                    <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">{safeStr(n.msg)}</p>
                                  </div>
                                  <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notifications', n.id)); }} className="text-slate-400 hover:text-rose-500 shrink-0 p-1.5 rounded-full hover:bg-rose-50 transition-all"><X className="w-4 h-4"/></button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                 </div>
                 <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                     <img src={profile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="Profile" className="w-full h-full object-cover"/>
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col gap-2 w-full">
              {currentView !== 'home' && (
                 <div className="md:hidden flex">
                    <button onClick={()=>setCurrentPage('gateway')} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-transform hover:bg-slate-100 w-fit">
                       <ArrowLeft className="w-3.5 h-3.5"/> ត្រឡប់
                    </button>
                 </div>
              )}
              
              {currentView === 'home' && (
                  <div className="relative w-full">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 bg-slate-100 p-1.5 rounded-lg">
                       <Search className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder={"ស្វែងរកសេវាកម្ម..."} 
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl py-3 pl-11 pr-4 outline-none text-[14px] font-bold border border-slate-200 focus:border-[#0f8b65]/50 transition-all m-0" 
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
              )}
           </div>
        </div>
    );
};

const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, setCurrentView }) => {
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
    <div className="space-y-5 animate-in fade-in duration-300 pt-2 w-full flex-1">
      
      {/* BEAUTIFUL GREEN PROMO BANNER with Flower */}
      <div className="bg-7colors premium-card p-4 relative overflow-hidden flex flex-row items-center justify-between w-full min-h-[120px]">
         <div className="absolute top-0 right-0 w-24 h-full bg-white/40 rounded-l-[100px] z-0 pointer-events-none"></div>
         <div className="flex-1 z-10 pr-2">
             <h1 className="text-[16px] md:text-lg font-black text-slate-800 leading-tight mb-1.5 tracking-wide font-khmer">
                 ស្វែងរកព័ត៌មានបានរហ័ស
             </h1>
             <p className="text-[10px] md:text-xs text-slate-600 mb-3 leading-relaxed font-bold">
                 រហ័ស ងាយស្រួល និងអាចទុកចិត្តបាន សម្រាប់អ្នកទាំងអស់គ្នា។
             </p>
             <button onClick={()=>setCurrentView('data')} className="btn-gradient px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-1.5 w-fit shadow-md">
                 ស្វែងយល់បន្ថែម <ArrowRight className="w-3 h-3"/>
             </button>
         </div>
         {/* Circular Image (ផ្កា) */}
         <div className="w-[75px] h-[75px] shrink-0 z-10 overflow-hidden rounded-full shadow-md bg-white border-[2.5px] border-emerald-400 flex items-center justify-center p-0.5">
             <img src="ooop.png" alt="Beautiful Flower" className="w-full h-full object-cover rounded-full" />
         </div>
      </div>

      {/* COMPACT CATEGORY BUTTONS - Smaller Size */}
      <div>
         <div className="flex justify-between items-center mb-3 px-1 border-l-4 border-slate-700 pl-2">
            <h2 className="font-black text-sm text-slate-800 leading-none">ជម្រើសទីតាំង</h2>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm border ${activeHomeFilter==='រតនមណ្ឌល' ? 'border-[#0f8b65] bg-[#0f8b65] text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
               <Map className="w-3.5 h-3.5"/>
               <span className="font-black text-[10px]">ស្រុករតនមណ្ឌល</span>
            </button>
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='ផ្សេងៗ'?'All':'ផ្សេងៗ')} className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm border ${activeHomeFilter==='ផ្សេងៗ' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
               <Globe className="w-3.5 h-3.5"/>
               <span className="font-black text-[10px]">ស្រុកផ្សេងៗ</span>
            </button>
         </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1 border-l-4 border-rose-500 pl-2">
          <h2 className="text-sm font-black text-slate-800 leading-none">ទិន្នន័យដែលបានបញ្ចូល</h2>
          <button onClick={() => setCurrentView('data')} className="text-[10px] font-bold text-slate-600 flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 active:scale-95 hover:bg-slate-200 transition-colors">មើលទាំងអស់ <ArrowRight className="w-3 h-3"/></button>
        </div>
        {filtered.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 font-bold text-xs text-slate-400 shadow-sm">គ្មានទិន្នន័យ (No data found)</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(loc => (
              <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LocationCard = ({ location, isFavorite, onToggleFavorite, onClick }) => {
  const displayTitle = Array.isArray(location.names) && location.names.length > 0 
      ? location.names.join(' • ') 
      : (safeStr(location.title) || 'គ្មានឈ្មោះ');

  return (
    <div className="bg-white rounded-[18px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer" onClick={onClick}>
      <div className="relative h-32 w-full bg-slate-100 overflow-hidden shrink-0">
         {location.image ? <img src={location.image} alt={displayTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-300" /></div>}
         <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-sm text-slate-800 transition-colors z-10 active:scale-95">
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
         </button>
         <div className="absolute bottom-2 left-2 z-10">
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-md text-[9px] font-black text-[#0f8b65] rounded shadow-sm border border-white/50 uppercase tracking-widest">{safeStr(location.category)}</span>
         </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
         <h3 className="font-black text-[13px] text-slate-800 leading-tight mb-1 line-clamp-1">{displayTitle}</h3>
         <p className="text-[10px] text-slate-500 font-bold mb-2 line-clamp-1">{safeStr(location.role || location.institution)}</p>
         <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
               <MapPin className="w-3 h-3 text-slate-400 shrink-0"/> <span className="truncate max-w-[80px]">{safeStr(location.district)}</span>
            </div>
            {location.phone && <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center shrink-0"><Phone className="w-3 h-3 text-indigo-500"/></div>}
         </div>
      </div>
    </div>
  );
};

const DataView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId, setCurrentView, dbRegions, gpsCoords, captureGps }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [form, setForm] = useState({ names: [''], role: '', phone: '', image: '', coords: null, mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);

  const filtered = locations.filter(l => {
    const combinedNames = Array.isArray(l.names) ? l.names.join(' ') : safeStr(l.title);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = combinedNames.toLowerCase().includes(searchLower) || safeStr(l.desc).toLowerCase().includes(searchLower) || safeStr(l.role).toLowerCase().includes(searchLower);
    
    const isRatanak = l.district === 'រតនមណ្ឌល';
    if (activeTab === 'រតនមណ្ឌល' && !isRatanak) return false;
    if (activeTab === 'ស្រុកផ្សេងៗ' && isRatanak) return false;
    
    if (activeFilter !== 'ទាំងអស់' && l.category !== activeFilter) return false;
    return matchesSearch;
  });

  const handleOpenAdd = () => {
    if (!isAdmin && !profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error'); setCurrentView('account'); return; }
    setForm({ names: [''], role: '', phone: '', image: '', coords: null, mapUrl: '', desc: '', category: 'សាលារៀន', province: '', district: '', commune: '', village: '' });
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

  const setGPSForForm = () => {
      if(!gpsCoords) {
          captureGps();
          return;
      }
      setForm({
          ...form, 
          coords: { lat: gpsCoords.lat, lng: gpsCoords.lng },
          mapUrl: `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`
      });
      showToast('បញ្ចូលកូអរដោនេ GPS ជោគជ័យ');
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
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'database_admin'), { ...submitData, status: isAdmin ? 'approved' : 'pending', likes: 0, timestamp: Date.now() });
      
      if (isAdmin) { showToast('ទិន្នន័យត្រូវបានបញ្ចូលជោគជ័យ ✅'); } 
      else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), { title: 'សំណើរជោគជ័យ', msg: `សំណើរដែលអ្នកបានផ្ញើរត្រូវបានបញ្ជូន ហើយកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin។`, type: 'info', timestamp: Date.now() });
        showToast('សំណើររបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin', 'info');
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូន', 'error'); }
    setLoading(false);
  };

  const ratanakCommunes = dbRegions && dbRegions["រតនមណ្ឌល"] ? Object.keys(dbRegions["រតនមណ្ឌល"]) : [];
  const selectedCommuneVillages = form.commune && dbRegions && dbRegions["រតនមណ្ឌល"] && dbRegions["រតនមណ្ឌល"][form.commune] ? dbRegions["រតនមណ្ឌល"][form.commune] : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300 mt-2 flex-1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
         <h1 className="text-base font-black px-1 text-slate-800 border-l-4 border-[#0f8b65] pl-2">ទិន្នន័យទាំងអស់</h1>
         <button onClick={handleOpenAdd} className="w-full sm:w-auto btn-gradient px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-xs active:scale-95 transition-transform"><Plus className="w-4 h-4"/> បន្ថែមទិន្នន័យ</button>
      </div>

      <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm overflow-hidden">
         {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${activeTab === tab ? 'bg-slate-100 text-[#0f8b65] shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
         ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pt-1">
        {['ទាំងអស់', 'សាលារៀន', 'មន្ទីរពេទ្យ', 'ប៉ុស្តិ៍ប៉ូលិស', 'មេភូមិ', 'មេឃុំ', 'ផ្សេងៗ'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap shrink-0 border shadow-sm ${activeFilter === cat ? 'bg-[#0f8b65] text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
             <MapPin className="w-8 h-8 text-slate-300 mb-2" />
             <p className="font-bold text-xs text-slate-500">គ្មានទិន្នន័យ</p>
          </div>
        ) : 
          filtered.map(loc => <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />)
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 px-0 md:px-4 pointer-events-auto">
          <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[90dvh] md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom-full md:zoom-in-95 border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-sm font-black text-slate-800">បន្ថែមទិន្នន័យ: {activeTab}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors active:scale-95"><X className="w-4 h-4 text-slate-500"/></button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 hide-scrollbar bg-white">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner space-y-2.5">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">ឈ្មោះ (Names) *</label>
                      <button type="button" onClick={handleAddNameField} className="text-[#0f8b65] text-[9px] font-black bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center gap-1 active:scale-95"><Plus className="w-3 h-3"/> បន្ថែម</button>
                   </div>
                   {form.names.map((name, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                         <input type="text" required value={name} onChange={e=>handleNameChange(e.target.value, idx)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[14px] outline-none focus:border-[#0f8b65] font-bold shadow-sm m-0 text-slate-800" placeholder={`ឈ្មោះទី ${idx+1}...`} />
                         {form.names.length > 1 && (
                            <button type="button" onClick={()=>handleRemoveNameField(idx)} className="p-2.5 bg-rose-50 text-rose-500 rounded-lg border border-rose-100 active:scale-95 shadow-sm"><Trash2 className="w-4 h-4"/></button>
                         )}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">ប្រភេទ (Category) *</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[14px] outline-none focus:border-[#0f8b65] font-bold shadow-inner appearance-none cursor-pointer m-0 text-slate-800">
                      <option value="សាលារៀន">សាលារៀន</option>
                      <option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option>
                      <option value="ប៉ុស្តិ៍ប៉ូលិស">ប៉ុស្តិ៍ប៉ូលិស</option>
                      <option value="មេភូមិ">មេភូមិ</option>
                      <option value="មេឃុំ">មេឃុំ</option>
                      <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">ស្ថាប័ន/តួនាទី *</label>
                    <input type="text" required value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[14px] outline-none focus:border-[#0f8b65] font-bold shadow-inner m-0 text-slate-800" placeholder="ឧ: នាយកសាលា..." />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-600 block mb-2 border-b border-slate-200 pb-1.5">កំណត់ទីតាំង</label>
                    {activeTab === 'រតនមណ្ឌល' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-0.5 pl-1">ឃុំ</label>
                                <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white rounded-lg p-2 text-[14px] outline-none font-bold border border-slate-200 m-0 shadow-sm appearance-none cursor-pointer text-slate-800">
                                    <option value="">ជ្រើសរើស</option>
                                    {ratanakCommunes.map(c=><option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-0.5 pl-1">ភូមិ</label>
                                <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white rounded-lg p-2 text-[14px] outline-none font-bold border border-slate-200 disabled:opacity-50 m-0 shadow-sm appearance-none cursor-pointer text-slate-800">
                                    <option value="">ជ្រើសរើស</option>
                                    {selectedCommuneVillages.map(v=><option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[14px] outline-none font-bold shadow-sm m-0" placeholder="ខេត្ត..."/>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[14px] outline-none font-bold shadow-sm m-0" placeholder="ស្រុក..."/>
                            <input type="text" value={form.commune} onChange={e=>setForm({...form, commune: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[14px] outline-none font-bold shadow-sm m-0" placeholder="ឃុំ..."/>
                            <input type="text" value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[14px] outline-none font-bold shadow-sm m-0" placeholder="ភូមិ..."/>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">លេខទូរស័ព្ទ *</label>
                      <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[14px] outline-none focus:border-[#0f8b65] font-bold shadow-inner m-0 text-slate-800" placeholder="លេខ..." />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">ទីតាំង (GPS)</label>
                      <button type="button" onClick={setGPSForForm} className={`w-full ${form.coords ? 'bg-[#0f8b65]/10 text-[#0f8b65] border-[#0f8b65]/30' : 'bg-slate-100 text-slate-600 border-slate-300'} border py-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all truncate px-1 m-0 h-[42px]`}>
                         <MapPin className="w-3.5 h-3.5 shrink-0"/>
                         {form.coords ? '✓ ចាប់បានទីតាំង' : 'ចុចទាញយក GPS'}
                      </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">រូបភាព (Upload Picture) *</label>
                  <label className="relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 overflow-hidden transition-colors shadow-inner block m-0">
                     {form.image ? (
                        <React.Fragment>
                           <img src={form.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                              <span className="text-slate-800 font-bold bg-white/95 px-3 py-1.5 rounded-lg text-[10px] backdrop-blur-sm shadow-sm flex gap-1.5 items-center pointer-events-auto">
                                 <Edit3 className="w-3 h-3"/> ប្តូររូបភាព
                              </span>
                           </div>
                        </React.Fragment>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 z-10 pointer-events-none">
                           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-1.5"><ImageIcon className="w-4 h-4 text-slate-400" /></div>
                           <span className="text-[10px] font-bold text-slate-500">ចុច Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>
                
                <div>
                   <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">ការពណ៌នា</label>
                   <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="សរសេរការពណ៌នាខ្លីៗ..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[14px] outline-none focus:border-[#0f8b65] h-20 resize-none font-medium shadow-inner m-0 text-slate-800"></textarea>
                </div>
              </form>
            </div>
            <div className="p-3 border-t border-slate-100 shrink-0 pb-safe bg-slate-50">
               <button type="submit" form="addForm" disabled={loading} className="w-full py-3 rounded-[20px] font-black btn-gradient active:scale-95 disabled:opacity-50 transition shadow-md text-sm flex justify-center items-center gap-2 uppercase tracking-wide">
                   {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> កំពុងផ្ញើរ...</> : 'ផ្ញើរសំណើរ'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsView = ({ locations, usersList }) => {
  const totalUsers = usersList.length;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
  const startOfMonthMs = new Date(currentYear, currentMonth, 1).getTime();
  const startOfYearMs = new Date(currentYear, 0, 1).getTime();

  const usersThisWeek = usersList.filter(u => (u.timestamp || 0) >= startOfWeek.getTime()).length;
  const usersThisMonth = usersList.filter(u => (u.timestamp || 0) >= startOfMonthMs).length;
  const usersThisYear = usersList.filter(u => (u.timestamp || 0) >= startOfYearMs).length;

  const stats = [
    { label: 'អ្នកប្រើសរុប', count: totalUsers, color: 'text-slate-800' },
    { label: 'សប្តាហ៍នេះ', count: usersThisWeek, color: 'text-emerald-600' },
    { label: 'ខែនេះ', count: usersThisMonth, color: 'text-indigo-600' },
    { label: 'ឆ្នាំនេះ', count: usersThisYear, color: 'text-rose-600' },
  ];

  const cats = locations.reduce((acc, l) => { acc[safeStr(l.category)] = (acc[safeStr(l.category)]||0)+1; return acc; }, {});
  const chartColors = ['#0f8b65', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6'];
  const pieChartData = Object.entries(cats).map(([name, value]) => ({name, value}));

  const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const monthlyData = khmerMonths.map((name, index) => {
    const startM = new Date(currentYear, index, 1).getTime();
    const endM = new Date(currentYear, index + 1, 0, 23, 59, 59).getTime();
    const usersInMonth = usersList.filter(u => (u.timestamp || 0) >= startM && (u.timestamp || 0) <= endM).length;
    const entriesInMonth = locations.filter(l => (l.timestamp || 0) >= startM && (l.timestamp || 0) <= endM).length;
    return { name, users: usersInMonth, entries: entriesInMonth };
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pt-2 w-full flex-1">
      <h1 className="text-lg font-black text-slate-800 border-l-4 border-slate-800 pl-2">របាយការណ៍សង្ខេប</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
              <h3 className={`text-2xl font-black ${s.color}`}>{s.count}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-xs font-bold text-slate-700 mb-4 border-l-4 border-indigo-500 pl-2">កំណើនអ្នកប្រើប្រាស់</h3>
           <div className="h-56 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '11px'}} />
                   <Bar dataKey="users" fill="#6366f1" radius={[4,4,0,0]} barSize={16} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full">
                <h3 className="text-xs font-black text-slate-800 mb-2 border-l-4 border-rose-500 pl-2">ចំណាត់ថ្នាក់ទិន្នន័យ</h3>
                <div className="space-y-2 mt-4">
                   {pieChartData.length === 0 ? <p className="text-xs text-slate-400 font-bold">គ្មានទិន្នន័យ</p> : 
                     pieChartData.map((d, i) => (
                       <div key={d.name} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: chartColors[i%chartColors.length]}}></div>
                             <span className="text-[11px] font-bold text-slate-700">{d.name}</span>
                          </div>
                          <span className="text-[11px] font-black">{d.value}</span>
                       </div>
                     ))
                   }
                </div>
            </div>
            <div className="h-48 w-full md:w-1/2">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                       {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize:'11px'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView, isAdmin, chatTargets, dbRegions, gpsStatus, captureGps, gpsCoords }) => {
  const [msgText, setMsgText] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const messagesEndRef = useRef(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chats, activeChatUser]);

  const getMockDistance = () => (Math.random() * 5 + 1).toFixed(1);

  const handleSend = async (e) => {
    if(e) e.preventDefault();
    if (!profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error'); setCurrentView('account'); return; }
    if (!msgText.trim()) return;
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
      text: msgText, 
      msgType: 'text',
      target: activeChatUser.id, 
      userId: user.uid, 
      userName: profile.username, 
      timestamp: Date.now()
    });
    setMsgText('');
  };

  const handleFileChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
            text: '', msgType: 'image', imageUrl: event.target.result, target: activeChatUser.id, userId: user.uid, userName: profile.username, timestamp: Date.now()
         });
         showToast('ផ្ញើរូបភាពជោគជ័យ'); setShowAttachMenu(false);
     };
     reader.readAsDataURL(file);
  };

  const handleSendLocation = () => {
      setShowAttachMenu(false); showToast('កំពុងចាប់យកទីតាំង...', 'info');
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
             async (pos) => {
                 await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
                    msgType: 'location', distance: getMockDistance(), lat: pos.coords.latitude, lng: pos.coords.longitude, targetName: activeChatUser.label, target: activeChatUser.id, userId: user.uid, userName: profile.username, timestamp: Date.now()
                 });
                 showToast('ផ្ញើទីតាំងជោគជ័យ', 'success');
             },
             (err) => showToast('មិនអាចចាប់ទីតាំងបានទេ', 'error'),
             { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
         );
      } else { showToast('ឧបករណ៍មិនគាំទ្រ GPS ទេ', 'error'); }
  };

  const handleMicClick = () => {
     if(isRecording) return;
     setIsRecording(true);
     let secs = 1;
     const interval = setInterval(() => {
        setMsgText(`កំពុងថត... 0:0${secs}`); secs++;
        if(secs > 5) clearInterval(interval);
     }, 1000);

     setTimeout(async () => {
         clearInterval(interval); setIsRecording(false); setMsgText('');
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), { text: '🎤 សារជាសំឡេង (0:05)', msgType: 'audio', target: activeChatUser.id, userId: user.uid, userName: profile.username, timestamp: Date.now() });
         showToast('ផ្ញើសំឡេងជោគជ័យ');
     }, 5000);
  };

  const playSynthesisedAudioMessage = (msgId) => {
      setPlayingMsgId(msgId); playVoiceMelody();
      setTimeout(() => setPlayingMsgId(null), 1500);
  };

  if (!profile.username) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in duration-300">
         <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-200 shadow-sm"><User className="w-8 h-8" /></div>
         <h2 className="text-lg font-black mb-2 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-6 py-2.5 rounded-xl font-bold shadow-md active:scale-95 text-xs transition-transform">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  if (!activeChatUser) {
      return (
          <div className="space-y-4 animate-in fade-in pt-2 px-2 pb-20 md:pb-2">
             <h2 className="text-base font-black border-l-4 border-[#0f8b65] pl-2 mb-4 text-slate-800">សេវាទំនាក់ទំនង</h2>
             <div className="grid gap-3">
                 {chatTargets.map(target => (
                     <button key={target.id} onClick={() => setActiveChatUser(target)} className="w-full bg-white p-3 md:p-4 rounded-[18px] border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all active:scale-95 text-left group">
                         <div className="relative">
                             <img src={target.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-full border border-slate-200 object-cover bg-white group-hover:scale-105 transition-transform" alt="av"/>
                             <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-500"></div>
                         </div>
                         <div className="flex-1 min-w-0">
                             <h3 className="font-black text-[14px] text-slate-800 truncate mb-0.5">{target.label}</h3>
                             <p className="text-[11px] text-slate-500 font-bold truncate flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500"/> {target.role} • <span className="text-[#0f8b65]">{target.district}</span></p>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#0f8b65] group-hover:text-white transition-colors text-slate-400">
                             <ChevronDown className="w-4 h-4 -rotate-90"/>
                         </div>
                     </button>
                 ))}
             </div>
          </div>
      );
  }

  const filteredChats = chats.filter(c => c.target === activeChatUser.id && (isAdmin ? true : c.userId === user?.uid));

  return (
    <div className="flex flex-col h-[100dvh] md:h-full bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover md:rounded-2xl md:border md:border-slate-200 overflow-hidden relative shadow-sm w-full flex-1">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0 pointer-events-none"></div>
      
      {/* HEADER */}
      <div className="p-2 md:p-3 bg-white/95 backdrop-blur-md flex items-center gap-3 shrink-0 z-10 shadow-sm relative border-b border-slate-200/50">
        <button onClick={() => setActiveChatUser(null)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 active:scale-95 transition -ml-1"><ArrowLeft className="w-5 h-5"/></button>
        <div className="relative shrink-0">
           <img src={activeChatUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
           <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
        </div>
        <div className="min-w-0 flex-1">
            <h2 className="font-bold text-[15px] text-slate-800 truncate leading-tight">{safeStr(activeChatUser.label)}</h2>
            <p className="text-[11px] font-medium text-emerald-600">{activeChatUser.district} • Active now</p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 z-10 hide-scrollbar pb-[10px]" onClick={()=>setShowAttachMenu(false)}>
        {filteredChats.length === 0 ? <div className="text-center mt-10"><span className="bg-white/80 backdrop-blur-sm text-slate-600 px-4 py-2 rounded-xl text-[11px] font-bold shadow-sm">ចាប់ផ្តើមការសន្ទនាទីនេះ...</span></div> : 
          filteredChats.map(msg => {
            const isMe = isAdmin ? msg.target === activeChatUser.id : msg.userId === user?.uid;
            
            let msgContent;
            if (msg.msgType === 'location') {
               msgContent = (
                  <div className="flex flex-col gap-3 p-3 bg-blue-50/90 rounded-xl border border-blue-100 min-w-[260px] max-w-[300px]">
                     <div className="flex items-center justify-between gap-2">
                         <div className="flex flex-col items-center">
                             <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm border-2 border-white"><User className="w-5 h-5"/></div>
                             <span className="text-[10px] mt-1 font-black text-slate-700">អ្នក</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center px-1 relative">
                             <span className="text-[10px] text-blue-600 font-black mb-1 bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-sm">{msg.distance} km</span>
                             <div className="w-full flex items-center opacity-70">
                                 <div className="h-[2px] flex-1 border-t-2 border-dashed border-blue-500"></div>
                                 <ArrowRight className="w-4 h-4 text-blue-500 -ml-1 shrink-0"/>
                             </div>
                         </div>
                         <div className="flex flex-col items-center">
                             <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm border-2 border-white"><ShieldCheck className="w-5 h-5"/></div>
                             <span className="text-[10px] mt-1 font-black text-slate-700 line-clamp-1 max-w-[60px] text-center">{msg.targetName || 'ប៉ូលិស'}</span>
                         </div>
                     </div>
                     <a href={`https://www.google.com/maps?q=${msg.lat},${msg.lng}`} target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-blue-600 text-white text-[12px] font-black rounded-lg shadow-sm active:scale-95 transition-transform flex justify-center items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> បើកផែនទី (Map)</a>
                  </div>
               );
            } else if (msg.msgType === 'image') {
               msgContent = <img src={msg.imageUrl} alt="attached" className="max-w-[220px] rounded-lg shadow-sm border border-black/5"/>;
            } else if (msg.msgType === 'audio') {
               const isPlaying = playingMsgId === msg.id;
               msgContent = (
                  <button type="button" onClick={() => playSynthesisedAudioMessage(msg.id)} className="flex items-center gap-2.5 px-3 py-2 bg-slate-100/80 text-slate-800 rounded-xl hover:bg-slate-200 border border-black/5 font-bold text-xs transition-colors w-[180px]">
                     {isPlaying ? <Loader2 className="w-5 h-5 text-theme animate-spin"/> : <Play className="w-5 h-5 text-[#3390ec] fill-current"/>}
                     <span>{isPlaying ? '0:03 / 0:05' : 'សារសំឡេង'}</span>
                  </button>
               );
            } else {
               msgContent = <p className="break-words text-[15px]">{safeStr(msg.text)}</p>;
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`flex max-w-[85%] md:max-w-[75%] flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-700 ml-2 bg-white/50 px-2 rounded backdrop-blur-sm">{safeStr(msg.userName)}</span>}
                  <div className="flex items-end gap-1.5">
                      {isMe && <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_chat', msg.id))} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition"><Trash2 className="w-4 h-4"/></button>}
                      <div className={`px-3 py-2 rounded-[18px] leading-snug shadow-sm border border-black/5 relative ${isMe ? 'bg-[#DCF8C6] text-slate-900 rounded-br-sm' : 'bg-white text-slate-900 rounded-bl-sm'}`}>
                         {msgContent}
                         <span className="text-[9px] text-black/40 font-bold block text-right mt-1 opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* TELEGRAM STYLE INPUT BAR */}
      <div className="bg-[#f0f0f0]/95 backdrop-blur-md shrink-0 z-20 w-full mb-safe flex items-end gap-2 px-2 py-2 md:rounded-b-2xl border-t border-slate-200/50 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] pb-[max(env(safe-area-inset-bottom),8px)]">
        
        {showAttachMenu && (
           <div className="absolute bottom-[60px] left-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col w-56 animate-in slide-in-from-bottom-2 fade-in">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <button type="button" onClick={()=>cameraInputRef.current?.click()} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl text-[14px] font-bold text-slate-700 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Camera className="w-4 h-4"/></div> ថតរូប (Camera)
              </button>
              <button type="button" onClick={()=>fileInputRef.current?.click()} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl text-[14px] font-bold text-slate-700 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><ImageIcon className="w-4 h-4"/> រូបភាព (Gallery)
              </div></button>
              <button type="button" onClick={handleSendLocation} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl text-[14px] font-bold text-slate-700 transition-colors border-t border-slate-100">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><MapPin className="w-4 h-4"/></div> ទីតាំង (Location)
              </button>
           </div>
        )}

        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
        
        <button type="button" onClick={()=>setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition-colors shrink-0 mb-0.5 ${showAttachMenu ? 'bg-slate-300 text-slate-800' : 'text-slate-500 hover:bg-slate-300'}`}>
           <Plus className="w-6 h-6"/>
        </button>
        
        <div className="flex-1 bg-white rounded-3xl flex items-end min-h-[44px] shadow-sm relative border border-slate-200/60 mb-0.5">
            <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter') handleSend();}} disabled={isRecording} placeholder={isRecording ? "កំពុងថតសំឡេង..." : "សារ..."} className={`flex-1 bg-transparent py-3 px-4 text-[15px] outline-none text-slate-800 w-full rounded-3xl ${isRecording ? 'placeholder-rose-500 font-bold text-rose-500 bg-rose-50' : ''}`} />
        </div>
        
        <div className="shrink-0 mb-0.5 ml-0.5">
            {msgText.trim() ? (
                <button type="button" onClick={handleSend} className="w-11 h-11 rounded-full bg-[#3390ec] text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-[#2b7bc6]"><Send className="w-5 h-5 ml-1" /></button>
            ) : (
                <button type="button" onClick={handleMicClick} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#3390ec] text-white hover:bg-[#2b7bc6]'}`}><Mic className="w-5 h-5"/></button>
            )}
        </div>
      </div>
    </div>
  );
};

const AccountView = ({ user, profile, db, appId, showToast, setCurrentPage, isAdmin, setIsAdmin }) => {
  const [username, setUsername] = useState(profile.username || '');
  const [adminCode, setAdminCode] = useState('');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
     if(!username.trim()) return showToast('សូមបញ្ចូលឈ្មោះ', 'error');
     setSaving(true);
     await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), { username: username.trim() }, { merge: true });
     showToast('រក្សាទុកជោគជ័យ');
     setSaving(false);
  };

  const checkAdmin = () => {
      if(adminCode === "ict168mit") { setIsAdmin(true); showToast('ចូលជាអ្នកគ្រប់គ្រងបានជោគជ័យ', 'success'); setAdminCode(''); }
      else showToast('កូដសម្ងាត់មិនត្រឹមត្រូវ', 'error');
  };

  return (
      <div className="space-y-4 animate-in fade-in duration-300 pt-2 w-full flex-1 max-w-md mx-auto">
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-200 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-[#0f8b65] overflow-hidden">
                 <img src={profile.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-full h-full object-cover" alt="Avatar"/>
              </div>
              <h2 className="text-base font-black text-slate-800">{profile.username || 'អ្នកប្រើប្រាស់ថ្មី'}</h2>
              <p className="text-[10px] text-slate-500 font-bold mt-1">ID: {user?.uid.substring(0,8)}...</p>
          </div>

          <div className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-2"><User className="w-4 h-4"/> កំណត់ឈ្មោះ (Username)</h3>
              <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="បញ្ចូលឈ្មោះរបស់អ្នក..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-[#0f8b65] font-bold mb-3" />
              <button onClick={saveProfile} disabled={saving} className="w-full btn-gradient py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'រក្សាទុកការផ្លាស់ប្តូរ'}</button>
          </div>

          {!isAdmin && (
             <div className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-200">
                <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> ចូលគណនី Admin</h3>
                <div className="flex gap-2">
                    <input type="password" value={adminCode} onChange={e=>setAdminCode(e.target.value)} placeholder="កូដសម្ងាត់..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-[#0f8b65]" />
                    <button onClick={checkAdmin} className="bg-slate-800 text-white px-5 rounded-xl font-bold text-xs shadow-md active:scale-95">ចូល</button>
                </div>
             </div>
          )}
      </div>
  );
};

const AdminDashboard = ({ pendingLocations, usersList, db, appId, showToast, chatTargets }) => {
    const [tab, setTab] = useState('targets');
    const [targetName, setTargetName] = useState('');
    const [targetRole, setTargetRole] = useState('Support');
    const [targetDistrict, setTargetDistrict] = useState('រតនមណ្ឌល');
    
    const addTarget = async () => {
        if(!targetName) return showToast('សូមបញ្ចូលឈ្មោះទំនាក់ទំនង', 'error');
        const newId = 'target_' + Date.now();
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', newId), {
            id: newId, 
            label: targetName, 
            role: targetRole, 
            district: targetDistrict, 
            timestamp: Date.now(), 
            isDefault: false, 
            avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
        });
        setTargetName(''); 
        showToast('បានបន្ថែមទំនាក់ទំនងជោគជ័យ');
    };

    const approveLocation = async (id) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id), { status: 'approved' });
        showToast('បានអនុម័ត');
    };
    const rejectLocation = async (id) => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id));
        showToast('បានលុបចោល');
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300 pt-2 w-full flex-1">
            <h1 className="text-base font-black px-1 text-slate-800 border-l-4 border-[#0f8b65] pl-2 mb-2">គ្រប់គ្រងប្រព័ន្ធ</h1>
            
            <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm overflow-x-auto hide-scrollbar">
                {[{id:'targets', label:'គ្រប់គ្រងទំនាក់ទំនង'}, {id:'pending', label:`រង់ចាំអនុម័ត (${pendingLocations.length})`}, {id:'users', label:`អ្នកប្រើ (${usersList.length})`}].map(t => (
                    <button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${tab === t.id ? 'bg-[#0f8b65] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{t.label}</button>
                ))}
            </div>

            {tab === 'targets' && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-700 mb-3">បន្ថែមទំនាក់ទំនងថ្មី</h3>
                        <div className="space-y-3">
                            <input type="text" value={targetName} onChange={e=>setTargetName(e.target.value)} placeholder="ឈ្មោះទំនាក់ទំនង (ឧ. ប៉ូលិសប៉ុស្តិ៍ឃុំ...)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-[#0f8b65] font-bold" />
                            <div className="flex gap-2">
                                <select value={targetRole} onChange={e=>setTargetRole(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none font-bold appearance-none">
                                    <option value="Support">សេវាគាំទ្រ</option>
                                    <option value="Emergency">សង្គ្រោះបន្ទាន់</option>
                                    <option value="Administration">រដ្ឋបាល</option>
                                </select>
                                <select value={targetDistrict} onChange={e=>setTargetDistrict(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none font-bold appearance-none text-[#0f8b65]">
                                    <option value="រតនមណ្ឌល">រតនមណ្ឌល</option>
                                    <option value="ស្រុកផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                                </select>
                            </div>
                            <button onClick={addTarget} className="w-full btn-gradient py-3 rounded-xl font-bold text-xs shadow-md active:scale-95">រក្សាទុកទំនាក់ទំនង</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {chatTargets.map(t => (
                            <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center"><img src={t.avatar} className="w-full h-full object-cover rounded-full" alt="av"/></div>
                                   <div>
                                       <h4 className="font-black text-[13px] text-slate-800">{t.label}</h4>
                                       <p className="text-[10px] text-slate-500 font-bold">{t.role} • <span className="text-[#0f8b65]">{t.district}</span></p>
                                   </div>
                                </div>
                                {!t.isDefault && <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', t.id))} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'pending' && (
                <div className="space-y-3">
                   {pendingLocations.length === 0 ? <p className="text-center text-xs font-bold text-slate-400 py-10 bg-white rounded-xl border border-dashed">គ្មានទិន្នន័យរង់ចាំទេ</p> : 
                      pendingLocations.map(loc => (
                          <div key={loc.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                              {loc.image && <img src={loc.image} className="w-16 h-16 rounded-lg object-cover bg-slate-100" alt="img"/>}
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-[13px] text-slate-800 truncate">{loc.title}</h4>
                                  <p className="text-[10px] text-slate-500 truncate">អ្នកបញ្ចូល: {loc.author}</p>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                  <button onClick={()=>approveLocation(loc.id)} className="px-3 py-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-bold"><Check className="w-3.5 h-3.5 inline mr-1"/> អនុម័ត</button>
                                  <button onClick={()=>rejectLocation(loc.id)} className="px-3 py-1.5 rounded bg-rose-50 text-rose-500 hover:bg-rose-100 text-[10px] font-bold"><X className="w-3.5 h-3.5 inline mr-1"/> លុបចោល</button>
                              </div>
                          </div>
                      ))
                   }
                </div>
            )}
            
            {tab === 'users' && (
                <div className="space-y-2">
                   {usersList.map(u => (
                       <div key={u.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                           <div>
                               <h4 className="font-black text-[13px] text-slate-800">{u.username || 'គ្មានឈ្មោះ'}</h4>
                               <p className="text-[10px] text-slate-500">{u.id}</p>
                           </div>
                           <span className="text-[9px] bg-[#0f8b65]/10 px-2 py-1 rounded font-black text-[#0f8b65] uppercase">{u.status || 'offline'}</span>
                       </div>
                   ))}
                </div>
            )}
        </div>
    );
};

const LocationDetailModal = ({ location, onClose }) => {
  const displayTitle = Array.isArray(location.names) && location.names.length > 0 ? location.names.join(' • ') : (safeStr(location.title) || 'គ្មានឈ្មោះ');

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 pointer-events-auto">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in slide-in-from-bottom-10 md:zoom-in-95 max-h-[92dvh]">
        <div className="relative h-56 shrink-0">
          <img src={location.image} alt={displayTitle} className="w-full h-full object-cover bg-slate-100" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/70 hover:bg-white transition-colors rounded-full text-slate-800 backdrop-blur-md shadow-sm border border-white/50 active:scale-95 z-20"><XCircle className="w-5 h-5" /></button>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-3 left-4 text-white z-10">
             <span className="px-2.5 py-1 bg-[#0f8b65] rounded border border-white/20 text-white text-[10px] font-black shadow-sm uppercase tracking-wider">{safeStr(location.category)}</span>
          </div>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 hide-scrollbar bg-white">
          <div className="flex flex-col mb-5">
             <h2 className="text-2xl font-black leading-tight text-slate-800 mb-1.5">{displayTitle}</h2>
             <p className="text-[11px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded border border-slate-100 w-fit">តួនាទី: {safeStr(location.role || location.institution)}</p>
          </div>
          
          <div className="flex gap-2.5 mb-5">
             {location.phone && <a href={`tel:${location.phone}`} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-[12px] shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform hover:bg-indigo-700"><Phone className="w-4 h-4"/> ខលទាក់ទង</a>}
             {location.coords ? (
                <a href={`https://www.google.com/maps?q=${location.coords.lat},${location.coords.lng}`} target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-[12px] shadow-lg shadow-slate-800/20 active:scale-95 transition-transform hover:bg-slate-900"><MapPin className="w-4 h-4"/> បើកផែនទី</a>
             ) : location.mapUrl ? (
                <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-[12px] shadow-lg shadow-slate-800/20 active:scale-95 transition-transform hover:bg-slate-900"><MapPin className="w-4 h-4"/> បើកផែនទី</a>
             ) : null}
          </div>

          <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ទីតាំងលម្អិត (Location Details)</h4>
                 <div className="space-y-2">
                    <p className="text-[12px] font-bold text-slate-700 flex justify-between"><span>ខេត្ត:</span> <span>{safeStr(location.province) || 'បាត់ដំបង'}</span></p>
                    <p className="text-[12px] font-bold text-slate-700 flex justify-between"><span>ស្រុក:</span> <span>{safeStr(location.district) || 'រតនមណ្ឌល'}</span></p>
                    <p className="text-[12px] font-bold text-slate-700 flex justify-between"><span>ឃុំ:</span> <span>{safeStr(location.commune) || '-'}</span></p>
                    <p className="text-[12px] font-bold text-slate-700 flex justify-between"><span>ភូមិ:</span> <span>{safeStr(location.village) || '-'}</span></p>
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