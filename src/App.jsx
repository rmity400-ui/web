import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Plus, XCircle, Trash2, Edit3, 
  Image as ImageIcon, Send, LogOut, Settings, 
  LayoutGrid, ShieldAlert, TrendingUp, Phone, CheckCircle, ArrowLeft, 
  ChevronDown, Globe, ArrowRight, Loader2, MapPin, Copyright, Mic, Users, Camera, X, Play, AlertOctagon, Ban, Check, CheckCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

// Safeguard map icon to prevent compilation issues
const MapIcon = Map;

// Synthesizer for simulated voice playback
const playVoiceMelody = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; 
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle'; osc.frequency.value = freq;
      const startTime = now + index * 0.12; const duration = 0.20;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
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
const ADMIN_PASSWORD = "ict168mit";

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
      background-color: #f8fafc; 
      color: #0f172a; margin: 0; padding: 0; width: 100%; height: 100%; touch-action: pan-x pan-y;
    }
    .font-khmer { font-family: var(--font-khmer); }
    
    input, textarea, select { font-size: 16px !important; outline: none; } 
    input:focus, textarea:focus, select:focus { border-color: var(--theme-color) !important; }
    
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 15px); }
    .pt-safe { padding-top: max(env(safe-area-inset-top), 15px); }

    .btn-gradient {
       background: linear-gradient(135deg, #0f8b65, #059669);
       box-shadow: 0 4px 15px rgba(15, 139, 101, 0.2);
       color: white; border: none; transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-gradient:active { transform: scale(0.96); box-shadow: 0 2px 10px rgba(15, 139, 101, 0.1); }
    
    .premium-card {
       background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(226, 232, 240, 0.8);
    }
    .glass-nav {
       background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid rgba(226, 232, 240, 0.8);
    }
    
    /* Telegram wallpaper pattern */
    .telegram-bg {
       background-color: #eef2f5;
       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%230f8b65' fill-opacity='0.04'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E");
    }
  `;
};

const safeStr = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => safeStr(v)).join(' • ');
  return fallback;
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.5rem] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 border border-slate-100 font-khmer">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4 mx-auto border border-rose-100">
          <ShieldAlert className="w-7 h-7 text-rose-500" />
        </div>
        <h3 className="text-lg font-black text-center text-slate-800 mb-2">{safeStr(title)}</h3>
        <p className="text-[13px] text-center text-slate-500 mb-6 leading-relaxed font-medium">{safeStr(message)}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-slate-100 text-slate-600 active:scale-95 transition-transform">បដិសេធ</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-rose-600 text-white shadow-md active:scale-95 transition-transform">យល់ព្រម</button>
        </div>
      </div>
    </div>
  );
};

// Target Selection Defaults
const DEFAULT_REGIONS = {
  "រតនមណ្ឌល": { "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"], "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"], "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"] }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState('gateway'); 
  const [language, setLanguage] = useState('km'); 
  const [currentView, setCurrentView] = useState('home');
  const [viewHistory, setViewHistory] = useState(['home']); // Interactive navigation back stack
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  
  const [appLogo, setAppLogo] = useState('logo.png'); 
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isBanned: false, warnings: 0 });
  
  // App Data
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

  // Sign up/Registration state on Gateway
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [registering, setRegistering] = useState(false);

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

  const navigateTo = (view) => {
    setViewHistory(prev => [...prev, view]);
    setCurrentView(view);
  };

  const navigateBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop(); // Remove the current view
      const previousView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentView(previousView);
    } else {
      setCurrentView('home');
      setViewHistory(['home']);
    }
  };

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

  const handleGatewayRegister = async (e) => {
    e.preventDefault();
    if (!tempUsername.trim()) {
      showToast('សូមបញ្ជាក់ឈ្មោះគណនីរបស់អ្នក', 'error');
      return;
    }
    setRegistering(true);
    try {
      if (user) {
        const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
        await setDoc(profileRef, { 
          username: tempUsername.trim(), 
          timestamp: Date.now(),
          lastActive: Date.now(),
          status: 'online'
        }, { merge: true });
        showToast('ចុះឈ្មោះគណនីបានជោគជ័យ!');
        setCurrentPage('app');
        setViewHistory(['home']);
        setCurrentView('home');
      } else {
        showToast('មានបញ្ហាប្រព័ន្ធផ្ទៀងផ្ទាត់សិទ្ធិ', 'error');
      }
    } catch (err) {
      showToast('បរាជ័យក្នុងការចុះឈ្មោះ', 'error');
    }
    setRegistering(false);
  };

  const approvedLocations = useMemo(() => locations.filter(l => l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => locations.filter(l => l.status === 'pending'), [locations]);

  if (isAuthLoading) return <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50"><Loader2 className="w-10 h-10 text-[#0f8b65] animate-spin"/></div>;

  // --- BANNED SCREEN ---
  if (profile?.isBanned && !isAdmin) {
      return (
        <div className="fixed inset-0 z-[9999] bg-rose-600 text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 font-khmer">
           <Ban className="w-24 h-24 mb-5 animate-pulse text-white/90" />
           <h1 className="text-3xl font-black mb-3">គណនីត្រូវបានបិទ!</h1>
           <p className="text-sm font-medium leading-relaxed max-w-sm text-rose-100 bg-rose-700/50 p-4 rounded-2xl border border-rose-500/50">
              ឧបករណ៍របស់អ្នកត្រូវបានផ្តាច់ចេញពីប្រព័ន្ធ និងដកសិទ្ធិប្រើប្រាស់ ដោយសារការបំពានច្បាប់ ឬប្រើប្រាស់ពាក្យសម្តីមិនសមរម្យ។
           </p>
        </div>
      );
  }

  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-between font-khmer bg-[#f8fafc] text-slate-800 overflow-y-auto hide-scrollbar relative">
        
        {/* Top Area: Clean educational branding with premium front graphic illustration */}
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 max-w-lg mx-auto w-full">
          {/* Decorative Background Elements */}
          <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/3 right-[-80px] w-72 h-72 bg-[#0f8b65]/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Premium Logo Wrapper */}
          <div className="w-40 h-40 relative flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
              <path d="M50,5 L85,25 L85,65 L50,95 L15,65 L15,25 Z" fill="none" stroke="#0F2B5C" strokeWidth="6" strokeLinejoin="round" />
              <polygon points="50,22 80,32 50,42 20,32" fill="#0F2B5C" />
              <rect x="43" y="38" width="14" height="10" fill="#0F2B5C" />
              <path d="M50,32 L65,40 L65,48" fill="none" stroke="#F39C12" strokeWidth="2.5" />
              <path d="M26,48 Q50,45 50,58 Q50,45 74,48 L69,54 Q50,52 50,64 Q50,52 31,54 Z" fill="#F39C12" />
            </svg>
            <div className="text-center -mt-1 z-10">
              <h2 className="text-[23px] font-black tracking-widest text-[#0F2B5C] font-sans">
                EDU<span className="text-[#38BDF8]">PLAN</span>
              </h2>
            </div>
          </div>

          {/* Front Illustration Representation */}
          <div className="mt-6 w-full max-w-[280px] h-[150px] relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white p-1 animate-in fade-in duration-1000">
             <img 
               src="back.png" 
               alt="Youth Community" 
               className="w-full h-full object-cover rounded-xl"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0F2B5C]/80 via-transparent to-transparent"></div>
             <div className="absolute bottom-2 left-3 right-3 text-white">
                <p className="text-[10px] font-bold tracking-wider uppercase opacity-90">VMC Cambodia Volunteer Group</p>
                <p className="text-xs font-bold leading-tight">ស្វែងរកទិន្នន័យភូមិ-ឃុំ ស្រុករតនមណ្ឌល</p>
             </div>
          </div>
        </div>

        {/* Bottom Curved Area: Dark Navy Curved Sheet with Welcoming Text and objective */}
        <div className="w-full bg-[#0F2B5C] rounded-t-[40px] px-8 pt-9 pb-safe shadow-[0_-10px_30px_rgba(15,43,92,0.3)] flex flex-col items-center text-center relative z-10 shrink-0 border-t border-white/10">
          
          {!showRegisterForm ? (
            <div className="max-w-sm w-full space-y-5 mb-8 animate-in fade-in duration-300">
              <h1 className="text-white font-black text-2xl md:text-3xl leading-snug tracking-wide">
                សូមស្វាគមន៍
              </h1>
              
              <p className="text-slate-300 text-[12px] font-medium leading-relaxed px-1">
                ប្រព័ន្ធគ្រប់គ្រងផែនការអប់រំ និងស្វែងរកទិន្នន័យភូមិ-ឃុំ នៃស្រុករតនមណ្ឌល ដើម្បីជួយសម្រួលដល់ការទំនាក់ទំនង និងផ្ដល់ព័ត៌មានរហ័សទាន់ចិត្ត។
              </p>

              <div className="space-y-3 pt-1 w-full">
                <button 
                  onClick={() => setShowRegisterForm(true)} 
                  className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0F2B5C] font-black py-4 px-6 rounded-[24px] text-[15px] shadow-lg active:scale-95 transition-all"
                >
                  ចុះឈ្មោះចូលប្រើ
                </button>
                
                <button 
                  onClick={() => { setCurrentPage('app'); setViewHistory(['home']); setCurrentView('home'); }} 
                  className="w-full bg-transparent hover:bg-white/5 text-white font-bold py-3.5 px-6 rounded-[24px] text-[14px] border-2 border-white/60 active:scale-95 transition-all"
                >
                  រំលងការចុះឈ្មោះ
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-sm w-full space-y-5 mb-8 animate-in slide-in-from-bottom-5 duration-300">
               <div className="flex items-center gap-2 text-white">
                  <button onClick={() => setShowRegisterForm(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 active:scale-95 transition-colors">
                     <ArrowLeft className="w-4 h-4"/>
                  </button>
                  <span className="text-xs font-bold text-slate-300">ត្រឡប់ក្រោយ (Back)</span>
               </div>

               <div className="text-left">
                  <h3 className="text-white text-lg font-black">ចុះឈ្មោះគណនីរបស់អ្នក</h3>
                  <p className="text-slate-300 text-[11px] mt-1 font-medium">សូមបញ្ចូលឈ្មោះរបស់អ្នកដើម្បីងាយស្រួលក្នុងការប្រាស្រ័យទាក់ទងឆាតសួរព័ត៌មាន។</p>
               </div>

               <form onSubmit={handleGatewayRegister} className="space-y-4 text-left">
                  <input 
                    type="text" 
                    value={tempUsername} 
                    onChange={e => setTempUsername(e.target.value)}
                    required
                    placeholder="បញ្ចូលឈ្មោះរបស់អ្នក..." 
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl p-4 text-[15px] outline-none font-bold focus:border-[#38BDF8]"
                  />

                  <button 
                    type="submit" 
                    disabled={registering}
                    className="w-full bg-[#38BDF8] text-[#0F2B5C] font-black py-4 rounded-[24px] text-[15px] shadow-lg hover:bg-sky-400 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     {registering ? <Loader2 className="w-4 h-4 animate-spin"/> : 'ចុះឈ្មោះ និងចូលប្រព័ន្ធ'}
                  </button>
               </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 font-khmer bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      
      {/* Floating GPS Button */}
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

      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} setCurrentView={navigateTo} isAdmin={isAdmin} appLogo={appLogo} />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header with Back button supporting sequential navigation */}
        <TopHeader 
            setCurrentPage={setCurrentPage} notifications={notifications} notificationsOpen={notificationsOpen} 
            setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            db={db} appId={appId} user={user} appLogo={appLogo} currentView={currentView} 
            viewHistory={viewHistory} navigateBack={navigateBack}
        />

        {/* Dynamic Content Views */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-[#f8fafc] w-full max-w-7xl mx-auto">
           {currentView === 'home' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} setCurrentView={navigateTo} /></div>}
           {currentView === 'data' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={navigateTo} dbRegions={dbRegions} gpsCoords={gpsCoords} captureGps={handleGPS} /></div>}
           {currentView === 'reports' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><ReportsView locations={approvedLocations} usersList={usersList} /></div>}
           {currentView === 'chat' && <div className="flex-1 overflow-hidden p-0"><ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={navigateTo} isAdmin={isAdmin} usersList={usersList} chatTargets={chatTargets} dbRegions={dbRegions} gpsStatus={gpsStatus} captureGps={handleGPS} gpsCoords={gpsCoords} /></div>}
           {currentView === 'account' && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} navigateTo={navigateTo} /></div>}
           {currentView === 'admin' && isAdmin && <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20"><AdminDashboard locations={locations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} dbRegions={dbRegions} db={db} appId={appId} showToast={showToast} setCurrentView={navigateTo} setIsAdmin={setIsAdmin} chatTargets={chatTargets} navigateBack={navigateBack} /></div>}
        </div>
        
        {/* Footer explicitly at bottom */}
        {currentView !== 'chat' && (
           <div className="pb-[75px] md:pb-4 pt-3 border-t border-slate-200 text-center shrink-0 bg-white z-10">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Copyright className="w-3 h-3"/> រក្សាសិទ្ធិដោយ យុវជនស្ម័គ្រចិត្ត VMC © ២០២៧
             </p>
           </div>
        )}
      </main>

      {/* Bottom Nav Bar */}
      <BottomNav currentView={currentView} setCurrentView={navigateTo} isAdmin={isAdmin} />

      {selectedLocation && <LocationDetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} favorites={favorites} toggleFavorite={toggleFavorite} />}
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
          <h1 className="font-black text-[15px] text-[#0f8b65] leading-tight uppercase tracking-wider pb-1">TP Nice វិ.ស.ស</h1>
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

const TopHeader = ({ setCurrentPage, notifications, notificationsOpen, setNotificationsOpen, searchQuery, setSearchQuery, db, appId, user, appLogo, currentView, viewHistory, navigateBack }) => {
    return (
        <div className="bg-white border-b border-slate-200 pt-[calc(env(safe-area-inset-top,10px)+10px)] px-4 md:px-8 pb-3 shadow-sm relative z-40 shrink-0 w-full">
           <div className="flex justify-between items-center mb-3 pt-1">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-sm border border-slate-200">
                    <img src={appLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-[14px] font-black leading-tight text-slate-800 tracking-wide uppercase pb-0.5">TP Nice វិ.ស.ស</h1>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                 {/* Sequential back button displayed only when there is history */}
                 {viewHistory.length > 1 && (
                    <button 
                      onClick={navigateBack} 
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 shadow-sm py-1.5 px-3 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform"
                    >
                       <ArrowLeft className="w-3.5 h-3.5" /> ត្រឡប់
                    </button>
                 )}

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
              </div>
           </div>
           
           <div className="flex flex-col gap-2 w-full">
              {currentView !== 'home' && (
                 <div className="md:hidden flex">
                    <button onClick={()=>setCurrentPage('gateway')} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-transform hover:bg-slate-100 w-fit">
                       <ArrowLeft className="w-3.5 h-3.5"/> ចាកចេញទៅ Gateway
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
                      placeholder={"ស្វែងរកទីតាំង ឬសេវាកម្ម..."} 
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
      
      {/* BEAUTIFUL GREEN PROMO BANNER */}
      <div className="bg-[#eafbf5] premium-card p-4 relative overflow-hidden flex flex-row items-center justify-between w-full min-h-[120px]">
         <div className="absolute top-0 right-0 w-24 h-full bg-[#0f8b65]/10 rounded-l-[100px] z-0 pointer-events-none"></div>
         <div className="flex-1 z-10 pr-2">
             <h1 className="text-[15px] md:text-lg font-black text-[#0f8b65] leading-tight mb-1.5 tracking-wide font-khmer">
                 ទិន្នន័យសំខាន់ៗ នៅទីនេះ!
             </h1>
             <p className="text-[10px] md:text-xs text-slate-600 mb-3 leading-relaxed font-bold">
                 រហ័ស ងាយស្រួល និងអាចទុកចិត្តបាន សម្រាប់អ្នកទាំងអស់គ្នា
             </p>
             <button onClick={()=>setCurrentView('data')} className="btn-gradient px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-1.5 w-fit animate-pulse">
                 ស្វែងយល់ <ArrowRight className="w-3 h-3"/>
             </button>
         </div>
         <div className="w-[75px] h-[75px] shrink-0 z-10 overflow-hidden rounded-full shadow-md bg-white border-[2.5px] border-white flex items-center justify-center p-0.5">
             <img src="ooop.png" alt="Banner Profile" className="w-full h-full object-cover rounded-full" />
         </div>
      </div>

      <div>
         <div className="flex justify-between items-center mb-3 px-1 border-l-4 border-slate-700 pl-2">
            <h2 className="font-black text-sm text-slate-800 leading-none">ជម្រើសទីតាំង</h2>
         </div>
         <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`premium-card p-3 flex flex-col justify-center items-center transition-all active:scale-95 ${activeHomeFilter==='រតនមណ្ឌល' ? 'border-[#0f8b65] bg-[#0f8b65]/5 ring-1 ring-[#0f8b65]' : 'hover:border-[#0f8b65]/50'}`}>
               <div className={`p-2.5 rounded-full mb-1.5 ${activeHomeFilter==='រតនមណ្ឌល' ? 'bg-[#0f8b65] text-white' : 'bg-slate-100 text-[#0f8b65]'}`}><Map className="w-5 h-5 stroke-[2px]"/></div>
               <span className="font-black text-xs text-slate-800">រតនមណ្ឌល</span>
            </button>
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='ផ្សេងៗ'?'All':'ផ្សេងៗ')} className={`premium-card p-3 flex flex-col justify-center items-center transition-all active:scale-95 ${activeHomeFilter==='ផ្សេងៗ' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'hover:border-indigo-300'}`}>
               <div className={`p-2.5 rounded-full mb-1.5 ${activeHomeFilter==='ផ្សេងៗ' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-indigo-500'}`}><Globe className="w-5 h-5 stroke-[2px]"/></div>
               <span className="font-black text-xs text-slate-800">ស្រុកផ្សេងៗ</span>
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

const DataView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId, setCurrentView, dbRegions, gpsCoords, captureGps }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [form, setForm] = useState({ names: [''], role: '', phone: '', image: '', coords: null, mapUrl: '', desc: '', category: 'ឃុំ', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);

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
    if (activeFilter === 'សាលារៀន' && l.category !== 'សាលារៀន') matchesLevel = false;
    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    if (!isAdmin && !profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error'); setCurrentView('account'); return; }
    setForm({ names: [''], role: '', phone: '', image: '', coords: null, mapUrl: '', desc: '', category: 'ឃុំ', province: '', district: '', commune: '', village: '' });
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
      
      if (isAdmin) {
        showToast('ទិន្នន័យត្រូវបានបញ្ចូលជោគជ័យ ✅');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notifications'), { title: 'សំណើរជោគជ័យ', msg: `សំណើរដែលអ្នកបានផ្ញើរត្រូវបានបញ្ជូន ហើយកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin។`, type: 'info', timestamp: Date.now() });
        showToast('សំណើររបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin', 'info');
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូន', 'error'); }
    setLoading(false);
  };

  if (!profile.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in duration-300">
         <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-200 shadow-sm"><User className="w-8 h-8" /></div>
         <h2 className="text-lg font-black mb-2 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-6 text-xs max-w-xs font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះរបស់អ្នកសិន។ បើគ្មានឈ្មោះទេ មិនអាចបញ្ជូលទិន្នន័យបានទេ។</p>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-6 py-2.5 rounded-xl font-bold shadow-md active:scale-95 text-xs transition-transform">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  const ratanakCommunes = dbRegions && dbRegions["រតនមណ្ឌល"] ? Object.keys(dbRegions["រតនមណ្ឌល"]) : [];
  const selectedCommuneVillages = form.commune && dbRegions && dbRegions["រតនមណ្ឌល"] && dbRegions["រតនមណ្ឌល"][form.commune] ? dbRegions["រតនមណ្ឌល"][form.commune] : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300 mt-2 flex-1 font-khmer">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
         <h1 className="text-base font-black px-1 text-slate-800 border-l-4 border-[#0f8b65] pl-2">ទិន្នន័យ</h1>
         <button onClick={handleOpenAdd} className="w-full sm:w-auto btn-gradient px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-xs active:scale-95 transition-transform"><Plus className="w-4 h-4"/> បន្ថែមទិន្នន័យ</button>
      </div>

      <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm overflow-hidden">
         {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${activeTab === tab ? 'bg-slate-100 text-[#0f8b65] shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
         ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pt-1">
        {['ទាំងអស់', 'ឃុំ', 'ភូមិ', 'ប៉ូលីស', 'ពេទ្យ', 'សាលារៀន'].map(cat => (
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
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">ប្រភេទ Category *</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[14px] outline-none focus:border-[#0f8b65] font-bold shadow-inner appearance-none cursor-pointer m-0 text-slate-800">
                      <option value="ឃុំ">ឃុំ</option>
                      <option value="ភូមិ">ភូមិ</option>
                      <option value="ប៉ូលិស">ប៉ូលិស</option>
                      <option value="មន្ទីរពេទ្យ">ពេទ្យ</option>
                      <option value="សាលារៀន">សាលារៀន</option>
                      <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 pl-1">តួនាទី (Role) *</label>
                    <input type="text" required value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[14px] outline-none focus:border-[#0f8b65] font-bold shadow-inner m-0 text-slate-800" placeholder="ឧ: ប្រធានភូមិ..." />
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
               <button type="submit" form="addForm" disabled={loading} className="w-full py-3 rounded-xl font-black btn-gradient active:scale-95 disabled:opacity-50 transition shadow-md text-sm flex justify-center items-center gap-2 uppercase tracking-wide">
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
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const startOfWeekMs = startOfWeek.getTime();
  
  const startOfMonthMs = new Date(currentYear, currentMonth, 1).getTime();
  const startOfYearMs = new Date(currentYear, 0, 1).getTime();

  const usersThisWeek = usersList.filter(u => (u.timestamp || 0) >= startOfWeekMs).length;
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
    <div className="space-y-4 animate-in fade-in duration-300 pt-2 w-full flex-1 font-khmer">
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
        <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-xs font-bold text-slate-700 mb-4 border-l-4 border-indigo-500 pl-2">កំណើនអ្នកប្រើប្រាស់</h3>
           <div className="h-56 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontFamily: 'Noto Sans Khmer'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '11px'}} />
                   <Bar dataKey="users" fill="#6366f1" radius={[4,4,0,0]} barSize={16} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-xs font-bold text-slate-700 mb-4 border-l-4 border-[#0f8b65] pl-2">ទិន្នន័យបញ្ចូល</h3>
           <div className="h-56 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontFamily: 'Noto Sans Khmer'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                   <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '11px'}} />
                   <Line type="monotone" dataKey="entries" stroke="#0f8b65" strokeWidth={2.5} dot={{r: 3, fill: '#0f8b65'}} activeDot={{r: 5}} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

// Calculate geodesic distance safely
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

const ChatView = ({ chats, user, profile, showToast, db, appId, setCurrentView, isAdmin, chatTargets, dbRegions, gpsStatus, captureGps, gpsCoords }) => {
  const [msgText, setMsgText] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const messagesEndRef = useRef(null);
  
  // Edit & Delete Messaging states
  const [editingMessageId, setEditingMessageId] = useState(null);
  
  // Audio playback tracking state
  const [playingMsgId, setPlayingMsgId] = useState(null);

  // File upload and Mic state
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState('រតនមណ្ឌល');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chats, activeChatUser]);

  const handleSend = async (e) => {
    if(e) e.preventDefault();
    if (!profile.username) { showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error'); setCurrentView('account'); return; }
    if (!msgText.trim()) return;
    
    if (editingMessageId) {
      // Handle Edit Action
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_chat', editingMessageId), {
          text: msgText,
          edited: true
        });
        showToast('សារកែប្រែរួចរាល់ ✅');
        setEditingMessageId(null);
      } catch (err) {
        showToast('បរាជ័យក្នុងការកែប្រែសារ', 'error');
      }
    } else {
      // Normal Send Action
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
        text: msgText, 
        msgType: 'text',
        target: activeChatUser.id, 
        userId: user.uid, 
        userName: profile.username, 
        district: selectedDistrict,
        commune: selectedCommune,
        village: selectedVillage,
        timestamp: Date.now()
      });
    }
    setMsgText('');
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setMsgText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMsgText('');
  };

  const handleFileChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
            text: '', 
            msgType: 'image',
            imageUrl: event.target.result,
            target: activeChatUser.id, 
            userId: user.uid, 
            userName: profile.username, 
            district: selectedDistrict,
            commune: selectedCommune,
            village: selectedVillage,
            timestamp: Date.now()
         });
         showToast('ផ្ញើររូបភាពជោគជ័យ');
         setShowAttachMenu(false);
     };
     reader.readAsDataURL(file);
  };

  const handleSendLocation = () => {
      setShowAttachMenu(false);
      showToast('កំពុងចាប់យកទីតាំង...', 'info');
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
             async (pos) => {
                 const lat = pos.coords.latitude;
                 const lng = pos.coords.longitude;
                 const mockTargetLat = lat + 0.01; 
                 const mockTargetLng = lng + 0.01;
                 const distance = calculateDistance(lat, lng, mockTargetLat, mockTargetLng);
                 
                 await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
                    msgType: 'location',
                    distance: distance,
                    targetName: activeChatUser.label,
                    target: activeChatUser.id, 
                    userId: user.uid, 
                    userName: profile.username, 
                    district: selectedDistrict,
                    commune: selectedCommune,
                    village: selectedVillage,
                    timestamp: Date.now()
                 });
                 showToast('ផ្ញើទីតាំងជោគជ័យ', 'success');
             },
             (err) => showToast('មិនអាចចាប់ទីតាំងបានទេ', 'error'),
             { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
         );
      } else {
         showToast('ឧបករណ៍មិនគាំទ្រ GPS ទេ', 'error');
      }
  };

  const handleMicClick = () => {
     if(isRecording) return;
     setIsRecording(true);
     let secs = 1;
     const interval = setInterval(() => {
        setMsgText(`កំពុងថតសំឡេង... 0:0${secs}`);
        secs++;
        if(secs > 4) clearInterval(interval);
     }, 1000);

     setTimeout(async () => {
         clearInterval(interval);
         setIsRecording(false);
         setMsgText('');
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_chat'), {
            text: '🎤 simulated_voice_message.ogg', 
            msgType: 'audio',
            duration: '0:04',
            target: activeChatUser.id, 
            userId: user.uid, 
            userName: profile.username, 
            district: selectedDistrict,
            commune: selectedCommune,
            village: selectedVillage,
            timestamp: Date.now()
         });
         showToast('ផ្ញើសំឡេងជោគជ័យ ✅');
     }, 4000);
  };

  const playSynthesisedAudioMessage = (msgId) => {
      setPlayingMsgId(msgId);
      playVoiceMelody(); 
      setTimeout(() => {
          setPlayingMsgId(null);
      }, 1200);
  };

  const deleteMessage = async (msgId) => {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_chat', msgId));
      showToast('លុបសាររួចរាល់ 🗑️');
  };

  if (!profile.username) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in flex-1 font-khmer">
         <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-200 shadow-sm"><MessageCircle className="w-8 h-8" /></div>
         <h2 className="text-lg font-black mb-2 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-xs mb-6 max-w-xs font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះមុននឹងផ្ញើសារ។</p>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  // Pre-chat Target Selection
  if (!activeChatUser) {
     const communeList = selectedDistrict === 'រតនមណ្ឌល' && dbRegions["រតនមណ្ឌល"] ? Object.keys(dbRegions["រតនមណ្ឌល"]) : [];
     const villageList = selectedCommune && dbRegions["រតនមណ្ឌល"] && dbRegions["រតនមណ្ឌល"][selectedCommune] ? dbRegions["រតនមណ្ឌល"][selectedCommune] : [];

     const filteredContacts = chatTargets.filter(t => {
         if (t.isDefault) return true;
         return t.district === selectedDistrict;
     });

     return (
        <div className="flex flex-col h-full bg-white md:rounded-2xl md:border md:border-slate-200 overflow-hidden md:shadow-sm w-full flex-1 font-khmer">
           <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50 shrink-0">
               <h1 className="text-base font-black text-slate-800 flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-theme"/> ប្រព័ន្ធផ្ញើសារបន្ទាន់</h1>
               <p className="text-[10px] text-slate-500 font-bold mt-1 leading-relaxed">ជ្រើសរើសទីតាំងរស់នៅរបស់អ្នក ដើម្បីទាក់ទងអាជ្ញាធរពាក់ព័ន្ធ។</p>
           </div>
           
           <div className="bg-slate-50 p-3 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0 shadow-inner">
               <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 pl-1">ស្រុក (District)</label>
                  <select value={selectedDistrict} onChange={e=>{
                      const val = e.target.value;
                      if(val === 'ផ្សេងៗ') showToast('សូមទំនាក់ទំនងក្នុងស្រុករតនមណ្ឌលជាចម្បង ឬជ្រើសរើសទំនាក់ទំនងទូទៅ');
                      setSelectedDistrict(val);
                  }} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] font-bold outline-none m-0 cursor-pointer text-slate-800 focus:border-[#0f8b65]">
                      <option value="រតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                      <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                  </select>
               </div>
               <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-0.5 pl-1">ឃុំ (Commune)</label>
                  <select value={selectedCommune} onChange={e=>setSelectedCommune(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] font-bold outline-none m-0 cursor-pointer text-slate-800 focus:border-[#0f8b65]">
                      <option value="">ជ្រើសរើសឃុំ</option>
                      {communeList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-0.5 pl-1">ភូមិ (Village)</label>
                  <select value={selectedVillage} onChange={e=>setSelectedVillage(e.target.value)} disabled={!selectedCommune} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] font-bold outline-none m-0 cursor-pointer disabled:opacity-50 text-slate-800 focus:border-[#0f8b65]">
                      <option value="">ជ្រើសរើសភូមិ</option>
                      {villageList.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
               </div>
           </div>

           <div className="flex-1 overflow-y-auto p-2 md:p-4 hide-scrollbar bg-white pb-[100px] md:pb-4">
              <div className="text-slate-400 text-[10px] font-bold mb-2 pl-2">ទំនាក់ទំនងដែលអាចរាយការណ៍៖</div>
              {filteredContacts.map((contact, i) => (
                  <div key={contact.id || i} onClick={() => setActiveChatUser(contact)} className="flex items-center justify-between p-3 hover:bg-slate-50 bg-white rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-200 mb-2.5 shadow-sm">
                      <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                              <img src={contact.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm bg-white" alt="av"/>
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500`}></div>
                          </div>
                          <div>
                              <h3 className="font-bold text-sm text-slate-800 leading-tight">{safeStr(contact.label)}</h3>
                              <p className="text-[9px] text-[#0f8b65] font-bold bg-[#0f8b65]/5 px-2 py-0.5 rounded border border-emerald-100 w-fit mt-1 line-clamp-1">
                                 {selectedCommune ? `${selectedCommune} • ${selectedVillage || 'គ្រប់ភូមិ'}` : 'ទំនាក់ទំនងទូទៅ'}
                              </p>
                          </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0"><ArrowRight className="w-4 h-4"/></div>
                  </div>
              ))}
           </div>
        </div>
     );
  }

  const filteredChats = chats.filter(c => {
      if(isAdmin) return c.userId === activeChatUser.id;
      return c.userId === user.uid && c.target === activeChatUser.id;
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 md:bg-white md:rounded-2xl md:border md:border-slate-200 overflow-hidden relative shadow-sm w-full flex-1 min-h-0 font-khmer">
      
      {/* Telegram User Header Panel */}
      <div className="p-2.5 md:p-3 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0 z-10 shadow-sm relative">
        <button onClick={() => setActiveChatUser(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 active:scale-95 transition border border-slate-200"><ArrowLeft className="w-4 h-4 text-slate-600"/></button>
        <div className="relative shrink-0">
           <img src={activeChatUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-9 h-9 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
           <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
        </div>
        <div className="min-w-0 flex-1">
            <h2 className="font-black text-xs text-slate-800 truncate">{safeStr(activeChatUser.label)}</h2>
            <p className="text-[9px] font-semibold text-slate-400">Telegram Channel Active</p>
        </div>
      </div>

      {/* Telegram Wallpaper Message Space */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 telegram-bg hide-scrollbar pb-[10px]" onClick={()=>setShowAttachMenu(false)}>
        {filteredChats.length === 0 ? (
          <p className="text-center text-slate-400 py-10 text-[11px] font-bold bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/50 max-w-[200px] mx-auto mt-6 p-4 shadow-sm">
            ចាប់ផ្តើមការសន្ទនា...
          </p>
        ) : 
          filteredChats.map(msg => {
            const isMe = isAdmin ? msg.target === activeChatUser.id : msg.userId === user?.uid;
            
            let msgContent;
            if (msg.msgType === 'location') {
               msgContent = (
                  <div className="flex flex-col gap-2 p-3 bg-rose-50 rounded-2xl border border-rose-100 w-full min-w-[210px]">
                     <div className="flex items-center justify-between">
                         <div className="flex flex-col items-center">
                             <div className="w-7 h-7 rounded-full bg-rose-200 text-rose-600 flex items-center justify-center font-bold text-xs"><User className="w-3.5 h-3.5"/></div>
                             <span className="text-[9px] mt-1 font-bold text-slate-600">អ្នក</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center px-2 relative">
                             <span className="text-[10px] text-rose-600 font-black mb-1 bg-white px-2 py-0.5 rounded-full border border-rose-100 shadow-sm">{msg.distance} km</span>
                             <div className="w-full h-[2px] bg-rose-400 relative rounded-full">
                                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-[2px] border-r-[2px] border-rose-400 rotate-45"></div>
                             </div>
                         </div>
                         <div className="flex flex-col items-center">
                             <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs"><ShieldCheck className="w-3.5 h-3.5"/></div>
                             <span className="text-[9px] mt-1 font-bold text-slate-600 line-clamp-1">{msg.targetName || 'អាជ្ញាធរ'}</span>
                         </div>
                     </div>
                  </div>
               );
            } else if (msg.msgType === 'image') {
               msgContent = <img src={msg.imageUrl} alt="attached" className="max-w-[190px] rounded-xl shadow-sm border border-slate-200/50"/>;
            } else if (msg.msgType === 'audio') {
               const isPlaying = playingMsgId === msg.id;
               msgContent = (
                  <div className="flex flex-col gap-1.5 min-w-[170px] bg-[#e3f2fd]/60 p-2.5 rounded-xl border border-sky-100">
                     <div className="flex items-center gap-3">
                       <button type="button" onClick={() => playSynthesisedAudioMessage(msg.id)} className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 active:scale-90 transition-all shadow-md shrink-0">
                          {isPlaying ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4.5 h-4.5 fill-current ml-0.5"/>}
                       </button>
                       <div className="flex-1">
                          <p className="text-[10px] font-bold text-sky-700">សារជាសំឡេង</p>
                          {/* Cute Animated Waveforms */}
                          <div className="flex items-end gap-0.5 h-4 mt-1 opacity-80">
                             <span className={`w-0.5 bg-sky-500 rounded-full h-2 ${isPlaying ? 'animate-bounce' : ''}`}></span>
                             <span className={`w-0.5 bg-sky-500 rounded-full h-3.5 ${isPlaying ? 'animate-bounce [animation-delay:0.1s]' : ''}`}></span>
                             <span className={`w-0.5 bg-sky-500 rounded-full h-1 ${isPlaying ? 'animate-bounce [animation-delay:0.2s]' : ''}`}></span>
                             <span className={`w-0.5 bg-sky-500 rounded-full h-3 ${isPlaying ? 'animate-bounce [animation-delay:0.3s]' : ''}`}></span>
                             <span className={`w-0.5 bg-sky-500 rounded-full h-2.5 ${isPlaying ? 'animate-bounce [animation-delay:0.15s]' : ''}`}></span>
                             <span className={`w-0.5 bg-sky-500 rounded-full h-4 ${isPlaying ? 'animate-bounce [animation-delay:0.25s]' : ''}`}></span>
                             <span className={`w-0.5 bg-sky-500 rounded-full h-1.5 ${isPlaying ? 'animate-bounce [animation-delay:0.05s]' : ''}`}></span>
                          </div>
                       </div>
                     </div>
                     <span className="text-[8.5px] text-sky-600 text-right pr-1 block font-black">{msg.duration || '0:04'}</span>
                  </div>
               );
            } else {
               msgContent = <p className="break-words text-[13.5px] leading-relaxed">{safeStr(msg.text)}</p>;
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex max-w-[80%] md:max-w-[65%] flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[8.5px] font-black text-slate-400 ml-1.5">{safeStr(msg.userName)}</span>}
                  
                  <div className="flex items-end gap-1.5">
                      {/* Telegram Message bubble design */}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-snug shadow-md border relative transition-all ${
                        isMe 
                          ? 'bg-[#e2f7cb] text-slate-800 rounded-br-sm border-[#d2eba9]' 
                          : 'bg-white text-slate-800 rounded-bl-sm border-slate-200'
                      }`}>
                         {msgContent}
                         
                         {/* Bubble Status bar */}
                         <div className="flex items-center justify-end gap-1 mt-1 opacity-60 text-[8px] font-bold text-slate-500 self-end">
                            {msg.edited && <span>(បានកែ)</span>}
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-sky-600" />}
                         </div>
                      </div>

                      {/* Telegram Context Actions for Self-posted Messages (Edit / Delete) */}
                      {isMe && (
                         <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                            {msg.msgType === 'text' && (
                              <button 
                                type="button" 
                                onClick={()=>handleStartEdit(msg)} 
                                className="p-1.5 bg-white text-slate-600 hover:text-sky-600 border border-slate-200 rounded-full shadow-sm hover:scale-105 active:scale-95 transition"
                                title="កែប្រែសារ"
                              >
                                 <Edit3 className="w-3.5 h-3.5"/>
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={()=>deleteMessage(msg.id)} 
                              className="p-1.5 bg-white text-rose-500 hover:text-rose-600 border border-slate-200 rounded-full shadow-sm hover:scale-105 active:scale-95 transition"
                              title="លុបសារ"
                            >
                               <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                         </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        }
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Action Panel */}
      <div className="p-2 bg-white border-t border-slate-200 shrink-0 z-20 relative w-full mb-safe">
        
        {/* Editing indicator banner */}
        {editingMessageId && (
           <div className="mx-2 mb-2 p-2 bg-sky-50 border border-sky-100 rounded-xl flex justify-between items-center animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-sky-700">
                 <Edit3 className="w-4 h-4" />
                 <span className="text-[11.5px] font-black">កំពុងកែប្រែសាររបស់អ្នក...</span>
              </div>
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
              >
                 <X className="w-4 h-4"/>
              </button>
           </div>
        )}

        {/* Attachment Menu Popup */}
        {showAttachMenu && (
           <div className="absolute bottom-full left-2 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex flex-col gap-1 w-44 animate-in slide-in-from-bottom-2 fade-in">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <button type="button" onClick={()=>fileInputRef.current?.click()} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 text-left"><ImageIcon className="w-4 h-4 text-theme"/> ផ្ញើររូបភាព</button>
              <button type="button" onClick={handleSendLocation} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 text-left border-t border-slate-100"><MapPin className="w-4 h-4 text-rose-500"/> ផ្ញើទីតាំង (GPS)</button>
           </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-1.5 w-full mx-auto relative">
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
          
          <button type="button" onClick={()=>setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition active:scale-95 shrink-0 ${showAttachMenu ? 'bg-slate-200 text-slate-800' : 'text-slate-400 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}><Plus className="w-5 h-5"/></button>
          
          <button type="button" onClick={()=>cameraInputRef.current?.click()} className="p-2 text-slate-400 bg-slate-50 border border-slate-200 rounded-full transition active:scale-95 shrink-0 hover:bg-slate-100"><Camera className="w-4 h-4"/></button>
          
          <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} disabled={isRecording} placeholder={isRecording ? "កំពុងថតសំឡេង..." : "សរសេរសារ..."} className={`flex-1 bg-slate-50 border border-slate-200 rounded-full py-2 px-4 text-[16px] outline-none focus:border-[#0f8b65] focus:bg-white transition-colors m-0 shadow-inner text-slate-800 min-w-0 ${isRecording?'text-rose-500 font-bold placeholder-rose-400 bg-rose-50 border-rose-200':''}`} />
          
          {msgText.trim() ? (
              <button type="submit" className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform">
                 <Send className="w-4 h-4 ml-0.5" />
              </button>
          ) : (
              <button type="button" onClick={handleMicClick} className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm border ${isRecording ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}><Mic className="w-4 h-4"/></button>
          )}
        </form>
      </div>
    </div>
  );
};

const AccountView = ({ user, profile, db, appId, showToast, setIsAdmin, navigateTo }) => {
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
      navigateTo('admin');
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
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-300 pt-2 flex-1 w-full font-khmer">
      <div className="flex items-center gap-2 mb-2 px-1 border-l-4 border-slate-800 pl-2">
         <h1 className="text-lg font-black text-slate-800">គណនី</h1>
      </div>

      <div className="bg-white p-5 rounded-3xl flex flex-col items-center shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-20 bg-slate-100 border-b border-slate-200"></div>
        <div className="w-20 h-20 rounded-full bg-white mb-4 overflow-hidden border-[3px] border-white shadow-md relative group z-10">
             <img src={profile.avatar} className="w-full h-full object-cover bg-slate-100" alt="av"/>
             <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Edit3 className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{avatar:r.result}); r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
        </div>
        <div className="w-full relative z-10">
           <label className="text-[10px] font-bold text-slate-500 pl-1 mb-1.5 block text-center uppercase tracking-wider">ឈ្មោះអ្នកប្រើប្រាស់</label>
           {isEditingName ? (
               <div className="flex flex-col sm:flex-row gap-2.5">
                   <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-[16px] font-bold outline-none focus:border-theme shadow-inner text-center sm:text-left m-0 text-slate-800" placeholder="កំណត់ឈ្មោះរបស់អ្នក..."/>
                   <button onClick={handleSaveName} className="btn-gradient px-6 py-2.5 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform w-full sm:w-auto">រក្សាទុក</button>
               </div>
           ) : (
               <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl shadow-inner">
                   <span className="text-sm font-black text-slate-800">{safeStr(profile.username)}</span>
                   <button onClick={() => setIsEditingName(true)} className="text-slate-600 bg-white border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-[11px] active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm hover:bg-slate-100"><Edit3 className="w-3 h-3"/> កែប្រែ</button>
               </div>
           )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
         <h2 className="text-xs font-black flex items-center gap-1.5 text-slate-800 border-b border-slate-100 pb-2">
            <Settings className="w-4 h-4 text-slate-400"/> ការកំណត់
         </h2>
         
         <div className="pt-1">
            <button onClick={() => setShowAdminLogin(true)} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 text-[11px] transition active:scale-95 shadow-md border border-slate-700">
               <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse"/> Admin Portal របស់ប្រព័ន្ធ
            </button>
         </div>
      </div>

      {/* Sleek, Premium redesigned Admin Password prompt box */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
           <div className="relative w-full max-w-[320px] mx-auto bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 text-center animate-in zoom-in-95">
              <div className="w-14 h-14 bg-gradient-to-tr from-slate-700 to-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md rotate-3">
                 <ShieldCheck className="w-7 h-7 text-emerald-400"/>
              </div>
              
              <h3 className="text-[14px] font-black mb-1 text-slate-800 uppercase tracking-wider">បញ្ជាក់សិទ្ធិជាអភិបាល</h3>
              <p className="text-[10px] text-slate-400 mb-5 font-semibold">សូមវាយបញ្ចូលលេខកូដសម្ងាត់រដ្ឋបាល</p>
              
              <input 
                type="password" 
                value={pwd} 
                onChange={e=>setPwd(e.target.value)} 
                placeholder="••••••••" 
                className="w-full bg-slate-50 px-4 py-3 rounded-2xl mb-5 text-center tracking-[0.4em] outline-none font-black border-2 border-slate-200 text-[18px] focus:border-[#0f8b65] focus:bg-white focus:ring-4 focus:ring-[#0f8b65]/10 shadow-inner m-0 text-slate-800 transition-all"
              />
              
              <div className="flex gap-2.5">
                <button onClick={() => { setShowAdminLogin(false); setPwd(''); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-[11.5px] border border-slate-200 active:scale-95 transition-transform hover:bg-slate-200">បោះបង់</button>
                <button onClick={handleAdminLogin} className="flex-1 btn-gradient py-3 rounded-xl font-bold text-[11.5px] shadow-md active:scale-95 transition-transform">ចូលគណនី</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ locations = [], pendingLocations = [], usersList = [], cyberLogs = [], chats = [], dbRegions, db, appId, showToast, setCurrentView, setIsAdmin, chatTargets, navigateBack }) => {
  const [activeTab, setActiveTab] = useState('data'); 
  const [editingLoc, setEditingLoc] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);
  const openConfirm = (title, message, action) => setConfirmAction({ title, message, action });
  const handleConfirm = async () => {
     if (confirmAction && confirmAction.action) await confirmAction.action();
     setConfirmAction(null);
  };

  const [newCommune, setNewCommune] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  
  const [newChatLabel, setNewChatLabel] = useState('');
  const [newChatRole, setNewChatRole] = useState('');
  const [newChatAvatar, setNewChatAvatar] = useState('');
  const [newChatDistrictType, setNewChatDistrictType] = useState('រតនមណ្ឌល');
  const [newChatCustomDistrict, setNewChatCustomDistrict] = useState('');

  const [viewUserChat, setViewUserChat] = useState(null);

  const ratanakCommunes = dbRegions && dbRegions["រតនមណ្ឌល"] ? dbRegions["រតនមណ្ឌល"] : {};

  const handleApprove = async (id, authorUid) => { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id), { status: 'approved' }); 
      if(authorUid) await addDoc(collection(db, 'artifacts', appId, 'users', authorUid, 'notifications'), { title: 'សំណើរជោគជ័យ ✅', msg: 'Admin បានព្រមលើសំណើររបស់អ្នក។ ទិន្នន័យត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធផ្លូវការ។', type: 'success', timestamp: Date.now() });
      showToast('អនុម័តជោគជ័យ ✅'); 
  };
  
  const handleReject = (id, authorUid) => { 
      openConfirm("បញ្ជាក់ការបដិសេធ", "តើអ្នកពិតជាចង់បដិសេធ និងលុបសំណើរនេះមែនទេ?", async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id)); 
        if(authorUid) await addDoc(collection(db, 'artifacts', appId, 'users', authorUid, 'notifications'), { title: 'បដិសេធ ❌', msg: 'Admin មិនព្រមលើសំណើររបស់អ្នកទេ។ សំណើរត្រូវបានលុបចោល។', type: 'error', timestamp: Date.now() });
        showToast('បានបដិសេធសំណើរ', 'error'); 
      });
  };

  const confirmDeleteLocation = (id) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទិន្នន័យទីតាំងនេះមែនទេ? (ទិន្នន័យនឹងត្រូវលុបពី Firebase ផងដែរ)", async () => {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', id));
         showToast('លុបទិន្នន័យបានជោគជ័យ');
      });
  };

  const clearLog = (id = null) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបកំណត់ត្រាសុវត្ថិភាពនេះមែនទេ?", async () => {
         if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
         else {
             cyberLogs?.forEach(async l => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)));
         }
         showToast('សម្អាតបានជោគជ័យ');
      });
  };
  
  const handleAdminLogout = () => { setIsAdmin(false); setCurrentView('home'); showToast('បានចាកចេញពី Admin'); };
  
  const handleEditSave = async (e) => { 
      e.preventDefault(); 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'database_admin', editingLoc.id), editingLoc); 
      setEditingLoc(null); 
      showToast('កែប្រែជោគជ័យ'); 
  };

  const handleWarnUser = (userObj) => {
      openConfirm("ព្រមាន (Warning)", `តើអ្នកចង់ព្រមានដល់ ${userObj.username}? វានឹងកត់ត្រាកំហុសរបស់គាត់។`, async () => {
         await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { warnings: increment(1) });
         await addDoc(collection(db, 'artifacts', appId, 'users', userObj.uid, 'notifications'), { 
             title: 'ការព្រមានធ្ងន់ធ្ងរ ⚠️', 
             msg: 'សូមគោរពវិន័យ និងប្រើប្រាស់ពាក្យសម្តីឱ្យបានសមរម្យ។ នេះជាការព្រមាន។', 
             type: 'error', 
             timestamp: Date.now() 
         });
         showToast(`បានព្រមាន ${userObj.username} ជោគជ័យ`);
      });
  };

  const handleBanUser = (userObj) => {
      openConfirm("ដក Device (Ban)", `តើអ្នកពិតជាចង់ផ្តាច់ និងដកសិទ្ធិប្រើប្រាស់ពី ${userObj.username} ជារៀងរហូតមែនទេ? (គណនីនឹងត្រូវ Block)`, async () => {
         await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { isBanned: true });
         showToast(`បានដក Device របស់ ${userObj.username} រួចរាល់!`, 'error');
         setViewUserChat(null); 
      });
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
     const districtToSave = newChatDistrictType === 'ផ្សេងៗ' ? newChatCustomDistrict : 'រតនមណ្ឌល';
     
     await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', id), {
        id,
        label: newChatLabel,
        role: newChatRole || 'ភ្នាក់ងារ',
        district: districtToSave,
        avatar: newChatAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        status: 'online',
        isDefault: false,
        timestamp: Date.now()
     });
     setNewChatLabel(''); setNewChatRole(''); setNewChatAvatar(''); setNewChatCustomDistrict('');
     showToast('បន្ថែមទំនាក់ទំនងឆាតថ្មីជោគជ័យ ✅');
  };

  const handleDeleteChatTarget = (id) => {
     openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទំនាក់ទំនងឆាតនេះចេញពី Firebase មែនទេ?", async () => {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', id));
         showToast('លុបជោគជ័យ ✅');
     });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-10 flex-1 font-khmer">
      
      <ConfirmModal 
         isOpen={!!confirmAction} 
         title={confirmAction?.title} 
         message={confirmAction?.message}
         onConfirm={handleConfirm}
         onCancel={() => setConfirmAction(null)}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800 text-white p-4 md:p-5 rounded-3xl shadow-lg border border-slate-700 shrink-0">
        <div>
           <div className="flex items-center gap-2">
              <button onClick={navigateBack} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition shadow-sm border border-slate-600 mr-1"><ArrowLeft className="w-4 h-4 text-white" /></button>
              <h1 className="text-base md:text-lg font-black flex items-center gap-2.5"><ShieldCheck className="w-6 h-6 text-emerald-400"/> Firebase Admin Panel</h1>
           </div>
           <p className="text-[10px] text-slate-400 mt-1 pl-9 font-bold">ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យផ្លូវការ</p>
        </div>
        <button onClick={handleAdminLogout} className="mt-4 sm:mt-0 px-4 py-2 bg-slate-700 hover:bg-rose-600 rounded-xl text-xs font-black flex items-center gap-2 transition-colors shadow-sm active:scale-95"><LogOut className="w-3.5 h-3.5"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 pt-1 shrink-0">
        {[
          {id: 'data', label: 'ទិន្នន័យ & ទីតាំង'}, {id: 'chat_manage', label: 'គ្រប់គ្រងទំនាក់ទំនងឆាត'}, {id: 'chat_monitor', label: 'គ្រប់គ្រងបទល្មើស (Trolls)'}, {id: 'approvals', label: 'អនុម័តសំណើរ'}, {id: 'security', label: 'កំណត់ត្រាសុវត្ថិភាព'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-colors shadow-sm ${activeTab === t.id ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{t.label}</button>
        ))}
      </div>

      <div className="min-h-[500px]">
          {activeTab === 'approvals' && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in duration-200">
               <h3 className="font-black text-sm mb-4 border-l-4 border-amber-500 pl-2 text-slate-800">សំណើររង់ចាំ (Pending: {pendingLocations?.length||0})</h3>
               <div className="space-y-3">
                 {pendingLocations?.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"><p className="text-xs text-slate-400 font-bold">គ្មានសំណើរថ្មីទេ</p></div> : 
                   pendingLocations.map(loc => {
                     const displayTitle = Array.isArray(loc.names) ? loc.names.join(' • ') : safeStr(loc.title);
                     return (
                     <div key={loc.id} className="p-3 bg-slate-50 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-3 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2">
                        <div className="flex items-start gap-3 w-full md:w-auto">
                          <img src={loc.image} className="w-14 h-14 object-cover rounded-xl bg-slate-200 shrink-0 shadow-sm border border-slate-200" alt="loc"/>
                          <div className="flex-1">
                            <p className="font-black text-sm text-slate-800 leading-tight line-clamp-1">{displayTitle}</p>
                            <p className="text-[10px] text-slate-600 font-bold mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">{safeStr(loc.category)}</p>
                            <p className="text-[9px] text-slate-400 mt-1 font-medium">ស្នើដោយ: {safeStr(loc.author)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button onClick={()=>handleApprove(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-[11px] shadow-md active:scale-95 transition-transform hover:bg-emerald-700">ព្រម</button>
                          <button onClick={()=>handleReject(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-rose-50 text-rose-600 border border-rose-200 px-5 py-2.5 rounded-xl font-bold text-[11px] shadow-sm active:scale-95 transition-transform hover:bg-rose-100">មិនព្រម</button>
                        </div>
                     </div>
                   )})
                 }
               </div>
            </div>
          )}

          {activeTab === 'chat_monitor' && (
             <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in duration-200">
                <h3 className="font-black text-sm border-l-4 border-rose-500 pl-2 text-slate-800 mb-4">ការតាមដាន និងគ្រប់គ្រងបទល្មើស (Moderation)</h3>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 hide-scrollbar">
                   {usersList?.length === 0 ? <p className="text-center py-10 text-[11px] font-bold text-slate-400">គ្មាន User</p> :
                     usersList.sort((a,b)=>(b.lastActive||0)-(a.lastActive||0)).map(u => {
                        const isOnline = (Date.now() - (u.lastActive||0)) < 120000;
                        if (u.isBanned) return null;

                        return (
                           <div key={u.id} onClick={() => setViewUserChat(u)} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer active:scale-95 transition-all shadow-sm">
                              <div className="flex items-center gap-3">
                                 <div className="relative">
                                    <img src={u.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-white" alt="av" />
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                       {safeStr(u.username) || 'អ្នកប្រើប្រាស់មិនស្គាល់ឈ្មោះ'}
                                       {u.warnings > 0 && <span className="bg-amber-100 text-amber-600 text-[8px] px-1.5 py-0.5 rounded font-black border border-amber-200">Warnings: {u.warnings}</span>}
                                    </h4>
                                    <p className={`text-[9px] font-bold mt-0.5 ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>{isOnline ? 'Online' : 'Offline'}</p>
                                 </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                 <MessageCircle className="w-4 h-4 text-rose-500" />
                              </div>
                           </div>
                        )
                     })
                   }
                </div>
             </div>
          )}

          {activeTab === 'chat_manage' && (
             <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-5 animate-in fade-in duration-200">
                <h3 className="font-black text-sm border-l-4 border-[#0f8b65] pl-2 text-slate-800">បន្ថែមទំនាក់ទំនងសម្រាប់ Chat</h3>
                
                <form onSubmit={handleAddChatTarget} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">ជ្រើសរើសស្រុក</label>
                         <select value={newChatDistrictType} onChange={e=>setNewChatDistrictType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] font-bold text-slate-800 outline-none focus:border-[#0f8b65] shadow-sm appearance-none cursor-pointer m-0">
                             <option value="រតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                             <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                         </select>
                      </div>
                      {newChatDistrictType === 'ផ្សេងៗ' && (
                         <div className="animate-in fade-in">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">បញ្ចូលឈ្មោះស្រុក</label>
                            <input type="text" value={newChatCustomDistrict} onChange={e=>setNewChatCustomDistrict(e.target.value)} required placeholder="ឧ: ស្រុកបាណន់..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] font-bold text-slate-800 outline-none focus:border-[#0f8b65] shadow-sm m-0" />
                         </div>
                      )}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">ឈ្មោះទំនាក់ទំនង (Label)</label>
                         <input type="text" value={newChatLabel} onChange={e=>setNewChatLabel(e.target.value)} required placeholder="ឧ: ប៉ុស្តិ៍ប៉ូលីសស្តៅ..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] font-bold text-slate-800 outline-none focus:border-[#0f8b65] shadow-sm m-0" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">តួនាទី (Role)</label>
                         <input type="text" value={newChatRole} onChange={e=>setNewChatRole(e.target.value)} required placeholder="ឧ: រដ្ឋបាល ឬ សន្តិសុខ..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] font-bold text-slate-800 outline-none focus:border-[#0f8b65] shadow-sm m-0" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">រូបតំណាងទំនាក់ទំនង (Avatar)</label>
                         <div className="flex items-center gap-2">
                             {newChatAvatar ? <img src={newChatAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" /> : <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400"/></div>}
                             <input type="file" accept="image/*" onChange={e => {
                                 if (e.target.files[0]) {
                                     const r = new FileReader();
                                     r.onload = () => setNewChatAvatar(r.result);
                                     r.readAsDataURL(e.target.files[0]);
                                 }
                             }} className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-2 text-[12px] font-bold text-slate-800 outline-none focus:border-[#0f8b65] shadow-sm m-0" />
                         </div>
                      </div>
                   </div>
                   <button type="submit" className="bg-slate-800 text-white px-5 py-3 rounded-xl text-[12px] font-black shadow active:scale-95 transition-all w-full md:w-auto hover:bg-slate-900 mt-2">
                      + បន្ថែមទំនាក់ទំនង
                   </button>
                </form>

                <div className="space-y-2.5">
                   <h4 className="font-black text-[11px] text-slate-500">បញ្ជីទំនាក់ទំនងបច្ចុប្បន្ន</h4>
                   <div className="space-y-2.5 max-h-[300px] overflow-y-auto hide-scrollbar">
                      {chatTargets && chatTargets.map(t => (
                          <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-3">
                                <img src={t.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-white" alt="avatar" />
                                <div>
                                   <p className="text-xs font-black text-slate-800">{safeStr(t.label)}</p>
                                   <span className="text-[9px] text-slate-500 font-bold">{safeStr(t.district)} • {safeStr(t.role)}</span>
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
             <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                   <h3 className="font-black text-sm mb-4 border-l-4 border-amber-500 pl-2 text-slate-800">រចនាសម្ព័ន្ធទីតាំង (រតនមណ្ឌល)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                           <label className="text-[11px] font-bold text-slate-600 mb-2 block">បន្ថែមឃុំថ្មី</label>
                           <form onSubmit={handleAddCommune} className="flex gap-2">
                               <input type="text" value={newCommune} onChange={e=>setNewCommune(e.target.value)} placeholder="ឈ្មោះឃុំ..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-theme shadow-inner text-slate-800 m-0"/>
                               <button type="submit" className="btn-gradient px-4 rounded-xl text-[12px] font-black shadow-md active:scale-95 transition-transform">បន្ថែម</button>
                           </form>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                           <label className="text-[11px] font-bold text-slate-600 mb-2 block">បន្ថែមភូមិថ្មី</label>
                           <form onSubmit={handleAddVillage} className="space-y-2">
                               <select value={selectedCommune} onChange={e=>setSelectedCommune(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none shadow-inner appearance-none cursor-pointer m-0 text-slate-800">
                                   <option value="">ជ្រើសរើសឃុំ...</option>
                                   {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.keys(dbRegions["រតនមណ្ឌល"]).map(c=><option key={c} value={c}>{c}</option>)}
                               </select>
                               <div className="flex gap-2">
                                   <input type="text" value={newVillage} onChange={e=>setNewVillage(e.target.value)} placeholder="ឈ្មោះភូមិ..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#0f8b65] shadow-inner text-slate-800 m-0"/>
                                   <button type="submit" className="btn-gradient px-4 rounded-xl text-[12px] font-black shadow-md active:scale-95 transition-transform">បន្ថែម</button>
                               </div>
                           </form>
                       </div>
                   </div>
                   
                   <div className="space-y-3">
                       {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.entries(dbRegions["រតនមណ្ឌល"]).map(([cName, villages]) => (
                           <div key={cName} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                               <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200">
                                   <span className="font-bold text-[11px] text-slate-800">ឃុំ: {cName}</span>
                                   <button onClick={()=>handleDeleteCommune(cName)} className="text-rose-500 hover:text-rose-600 p-1 bg-white rounded border border-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                               </div>
                               <div className="p-3 flex flex-wrap gap-1.5">
                                   {villages.length === 0 ? <span className="text-[9px] text-slate-400">គ្មានភូមិ</span> : 
                                     villages.map(vName => (
                                         <div key={vName} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
                                             {vName} <button onClick={()=>handleDeleteVillage(cName, vName)} className="text-slate-400 hover:text-rose-500"><XCircle className="w-3 h-3"/></button>
                                         </div>
                                     ))
                                   }
                               </div>
                           </div>
                       ))}
                   </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-sm mb-4 border-l-4 border-[#0f8b65] pl-2 text-slate-800">ទិន្នន័យដែលបានអនុម័តសរុប ({locations.filter(l=>l.status==='approved').length})</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h4 className="font-black text-[11px] mb-3 text-theme bg-white p-2 rounded-xl shadow-sm w-fit border border-slate-100">១. ស្រុករតនមណ្ឌល</h4>
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                               {locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-4 text-[10px] text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-xl">គ្មានទិន្នន័យ</p> :
                                 locations.filter(l=>l.status==='approved' && l.district === 'រតនមណ្ឌល').map(loc => {
                                   const displayTitle = Array.isArray(loc.names) ? loc.names[0] : safeStr(loc.title);
                                   return (
                                   <div key={loc.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                      <div className="flex items-center gap-2.5">
                                         <img src={loc.image} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"/>
                                         <div>
                                            <p className="text-xs font-black text-slate-800 line-clamp-1">{displayTitle}</p>
                                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{safeStr(loc.commune)} • {safeStr(loc.village)}</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-1.5 shrink-0">
                                         <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 active:scale-95"><Edit3 className="w-3.5 h-3.5"/></button>
                                         <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 active:scale-95"><Trash2 className="w-3.5 h-3.5"/></button>
                                      </div>
                                   </div>
                               )})}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h4 className="font-black text-[11px] mb-3 text-indigo-600 bg-white p-2 rounded-xl shadow-sm w-fit border border-slate-100">២. ស្រុកផ្សេងៗ</h4>
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                               {locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-4 text-[10px] text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-xl">គ្មានទិន្នន័យ</p> :
                                 locations.filter(l=>l.status==='approved' && l.district !== 'រតនមណ្ឌល').map(loc => {
                                   const displayTitle = Array.isArray(loc.names) ? loc.names[0] : safeStr(loc.title);
                                   return (
                                   <div key={loc.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                      <div className="flex items-center gap-2.5">
                                         <img src={loc.image} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"/>
                                         <div>
                                            <p className="text-xs font-black text-slate-800 line-clamp-1">{displayTitle}</p>
                                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{safeStr(loc.district)}</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-1.5 shrink-0">
                                         <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 active:scale-95"><Edit3 className="w-3.5 h-3.5"/></button>
                                         <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 active:scale-95"><Trash2 className="w-3.5 h-3.5"/></button>
                                      </div>
                                   </div>
                               )})}
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-sm border-l-4 border-rose-500 pl-2 text-slate-800">កំណត់ត្រាសុវត្ថិភាព (Cyber Logs)</h3>
                 <button onClick={()=>clearLog()} className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl font-bold shadow-sm active:scale-95 transition-all">លុបទាំងអស់</button>
               </div>
               <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
                 {cyberLogs?.length === 0 ? <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl"><p className="text-[11px] font-bold text-slate-400">ប្រព័ន្ធមានសុវត្ថិភាពល្អ ១០០%</p></div> : 
                   cyberLogs?.map(l => (
                     <div key={l.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] relative shadow-sm animate-in slide-in-from-bottom-2">
                        <p className="font-black text-rose-600 mb-1 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Failed Login Attempt</p>
                        <p className="text-slate-700 font-bold mb-0.5">User: {l.username}</p>
                        <p className="text-slate-500 mb-1">{l.device} ({l.type}) • IP: {l.ip}</p>
                        <p className="text-slate-400 text-[9px] font-medium">{new Date(l.timestamp).toLocaleString()}</p>
                        <button onClick={()=>clearLog(l.id)} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-all"><X className="w-4 h-4"/></button>
                     </div>
                   ))
                 }
               </div>
            </div>
          )}
      </div>

      {editingLoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in pointer-events-auto">
           <div className="bg-white w-full max-w-md mx-auto rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90dvh] flex flex-col pointer-events-auto">
              <h3 className="text-sm font-black mb-4 text-slate-800 border-b border-slate-100 pb-3">កែប្រែទិន្នន័យ (Update Document)</h3>
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                  <form id="editFormAdmin" onSubmit={handleEditSave} className="space-y-4 px-1">
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 mb-1 block">Title / Name</label>
                         <input value={safeStr(editingLoc.title)} onChange={e=>setEditingLoc({...editingLoc, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[15px] font-bold outline-none focus:border-[#0f8b65] m-0 text-slate-800"/>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Role</label>
                             <input value={safeStr(editingLoc.role || editingLoc.category)} onChange={e=>setEditingLoc({...editingLoc, role: e.target.value, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[15px] font-bold outline-none focus:border-[#0f8b65] m-0 text-slate-800"/>
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Phone</label>
                             <input value={safeStr(editingLoc.phone)} onChange={e=>setEditingLoc({...editingLoc, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[15px] font-bold outline-none focus:border-[#0f8b65] m-0 text-slate-800"/>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Commune</label>
                             <input value={safeStr(editingLoc.commune)} onChange={e=>setEditingLoc({...editingLoc, commune: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[15px] font-bold outline-none focus:border-[#0f8b65] m-0 text-slate-800"/>
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Village</label>
                             <input value={safeStr(editingLoc.village)} onChange={e=>setEditingLoc({...editingLoc, village: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[15px] font-bold outline-none focus:border-[#0f8b65] m-0 text-slate-800"/>
                         </div>
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 mb-1 block">Description</label>
                         <textarea value={safeStr(editingLoc.desc)} onChange={e=>setEditingLoc({...editingLoc, desc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[15px] font-medium h-24 outline-none focus:border-[#0f8b65] resize-none m-0 text-slate-800"></textarea>
                     </div>
                  </form>
              </div>
              <div className="flex gap-3 pt-5 mt-auto border-t border-slate-100">
                 <button type="button" onClick={()=>setEditingLoc(null)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-xs border border-slate-200 active:scale-95 transition-transform hover:bg-slate-200">បោះបង់</button>
                 <button type="submit" form="editFormAdmin" className="flex-1 btn-gradient py-3.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform">Update</button>
              </div>
           </div>
        </div>
      )}

      {viewUserChat && (
         <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in pointer-events-auto">
             <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85dvh] border border-slate-200 animate-in zoom-in-95 pointer-events-auto">
                 <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                       <img src={viewUserChat.avatar} className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white"/>
                       <div>
                          <h3 className="font-bold text-sm text-slate-800 leading-tight">{safeStr(viewUserChat.username)}</h3>
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                             ប្រវត្តិការឆាត {viewUserChat.warnings > 0 && <span className="bg-amber-100 text-amber-600 px-1 rounded ml-1">Warnings: {viewUserChat.warnings}</span>}
                          </p>
                       </div>
                    </div>
                    <button onClick={()=>setViewUserChat(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><XCircle className="w-6 h-6"/></button>
                 </div>
                 
                 <div className="bg-rose-50 p-3 flex gap-2 justify-center border-b border-rose-100 shrink-0">
                     <button onClick={() => handleWarnUser(viewUserChat)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5"/> ព្រមាន (Warn)</button>
                     <button onClick={() => handleBanUser(viewUserChat)} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition flex items-center gap-1"><Ban className="w-3.5 h-3.5"/> ដក Device (Ban)</button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 bg-slate-100/50 space-y-4 hide-scrollbar pb-8">
                     {chats.filter(c => c.userId === viewUserChat.uid).length === 0 ? <p className="text-center text-[10px] font-bold text-slate-400 mt-10">គ្មានប្រវត្តិការឆាតទេ</p> : 
                       chats.filter(c => c.userId === viewUserChat.uid).map(msg => (
                          <div key={msg.id} className="flex justify-start">
                             <div className="flex flex-col gap-1 max-w-[85%]">
                                <span className="text-[9px] font-bold text-slate-400 ml-1">ផ្ញើទៅកាន់: {safeStr(msg.target)} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                                <div className="px-4 py-3 rounded-2xl text-[14px] font-medium leading-relaxed bg-white text-slate-800 shadow-sm border border-slate-200 rounded-bl-sm">
                                   {msg.imageUrl && <img src={msg.imageUrl} alt="attached" className="max-w-full rounded-xl mb-1.5 shadow-sm bg-white/20"/>}
                                   {msg.text && <p className="break-words">{safeStr(msg.text)}</p>}
                                </div>
                             </div>
                          </div>
                       ))
                     }
                 </div>
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
    <div onClick={onClick} className="premium-card group rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-white relative font-khmer">
      <div className="relative h-28 md:h-32 overflow-hidden shrink-0">
        <img src={location.image} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-slate-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-70 pointer-events-none"></div>
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-theme rounded border border-white/20 text-white text-[9px] font-black shadow-sm tracking-wider uppercase">{safeStr(location.category)}</span>
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
           <h3 className="font-black text-[13px] md:text-[14px] text-slate-800 line-clamp-2 leading-snug mb-1.5">{displayTitle}</h3>
           <p className="text-[10px] text-slate-600 font-bold flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-theme shrink-0" />
              <span className="line-clamp-1">{location.village ? `${safeStr(location.village)}, ${safeStr(location.commune)}` : (safeStr(location.district) || 'រតនមណ្ឌល')}</span>
           </p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-auto">
           <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="flex items-center gap-1 text-[11px] font-bold p-1 -m-1 rounded-full transition-all">
             <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} /> 
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
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 pointer-events-auto font-khmer">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in slide-in-from-bottom-10 md:zoom-in-95 max-h-[92dvh]">
        <div className="relative h-56 shrink-0">
          <img src={location.image} alt={displayTitle} className="w-full h-full object-cover bg-slate-100" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/70 hover:bg-white transition-colors rounded-full text-slate-800 backdrop-blur-md shadow-sm border border-white/50 active:scale-95 z-20"><XCircle className="w-5 h-5" /></button>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-3 left-4 text-white z-10">
             <span className="px-2.5 py-1 bg-theme rounded border border-white/20 text-white text-[10px] font-black shadow-sm uppercase tracking-wider">{safeStr(location.category)}</span>
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
                <a href={`https://www.google.com/maps?q=${location.coords.lat},${location.coords.lng}`} target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-[12px] shadow-lg shadow-slate-800/20 active:scale-95 transition-transform hover:bg-slate-900"><MapIcon className="w-4 h-4"/> បើកផែនទី</a>
             ) : location.mapUrl ? (
                <a href={location.mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-[12px] shadow-lg shadow-slate-800/20 active:scale-95 transition-transform hover:bg-slate-900"><MapIcon className="w-4 h-4"/> បើកផែនទី</a>
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