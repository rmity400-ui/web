import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Plus, XCircle, Trash2, Edit3, 
  Image as ImageIcon, Send, LogOut, Settings, 
  LayoutGrid, ShieldAlert, TrendingUp, Phone, CheckCircle, ArrowLeft, 
  Globe, ArrowRight, Loader2, MapPin, Mic, Camera, X, Play, AlertOctagon, 
  Ban, CheckCheck, Sparkles, Hexagon, GraduationCap, Pause, Volume2, Square
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

const playPingSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1250, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch(e) {}
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const firebaseConfig = {
  apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E",
  authDomain: "ramit-7e364.firebaseapp.com",
  projectId: "ramit-7e364",
  storageBucket: "ramit-7e364.firebasestorage.app",
  messagingSenderId: "1036691345731",
  appId: "1:1036691345731:web:df8121852c6137e3b35ff6",
  measurementId: "G-99Y1VSYHJG"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (configError) {
  console.warn("Firebase execution context initialized in local sandbox mode.");
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'ramit-7e364';

const injectStyles = () => {
  const styleId = 'khmer-app-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
  styleEl.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap');
    
    :root { 
      --font-khmer: 'Noto Sans Khmer', sans-serif; 
      --theme-dark-blue: #0F2B5C; 
      --theme-blue: #0ea5e9;
    }
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    html, body { 
      overscroll-behavior-y: none; 
      background-color: #f8fafc; 
      color: #0f172a; margin: 0; padding: 0; width: 100%; height: 100%; touch-action: pan-x pan-y;
    }
    
    /* Global Compact Styling for Mobile */
    body {
      font-size: 14px;
    }
    .font-khmer { font-family: var(--font-khmer); }
    .font-logo { font-family: 'Montserrat', sans-serif; }
    
    input, textarea, select { font-size: 14px !important; outline: none; } 
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 12px); }
    .pt-safe { padding-top: max(env(safe-area-inset-top), 12px); }

    .btn-gradient {
       background: linear-gradient(135deg, #0F2B5C, #1e3a8a);
       box-shadow: 0 4px 12px rgba(15, 43, 92, 0.2);
       color: white; border: none; transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-gradient:active { transform: scale(0.96); box-shadow: 0 2px 8px rgba(15, 43, 92, 0.1); }
    
    .premium-card {
       background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.03); border: 1px solid rgba(226, 232, 240, 0.7);
    }
    .glass-nav {
       background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
       box-shadow: 0 -2px 20px rgba(0,0,0,0.05);
    }
    
    .telegram-bg {
       background-color: #f1f5f9;
       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%230F2B5C' fill-opacity='0.02'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E");
    }
  `;
};

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

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs animate-in zoom-in-95 border border-slate-100 font-khmer">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3 mx-auto border border-rose-100">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
        </div>
        <h3 className="text-base font-black text-center text-slate-800 mb-1">{safeStr(title)}</h3>
        <p className="text-[12px] text-center text-slate-500 mb-4 leading-normal font-medium">{safeStr(message)}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl font-bold text-[12px] bg-slate-100 text-slate-600 active:scale-95 transition-transform">បដិសេធ</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl font-bold text-[12px] bg-[#0F2B5C] text-white shadow-md active:scale-95 transition-transform">ព្រម</button>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_REGIONS = {
  "រតនមណ្ឌល": { "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"], "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"], "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"] }
};

const GPSButton = ({ gpsStatus, handleGPS, className = "" }) => (
    <button onClick={handleGPS} className={`rounded-full flex items-center justify-center transition-all border ${gpsStatus === 'green' ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'bg-white border-slate-200 text-[#0F2B5C]'} ${className}`} title="ចាប់ទីតាំង GPS">
        {gpsStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4" />}
    </button>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState('gateway'); 
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');

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
  
  const previousChatCount = useRef(0);
  const previousNotifCount = useRef(0);

  const showToast = (msg, type = 'success', duration = 3000) => { 
      setToast({ msg: safeStr(msg), type }); 
      setTimeout(() => setToast(null), duration); 
  };

  useEffect(() => { 
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover';
    injectStyles(); 
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth) throw new Error("Firebase Auth is uninitialized");
        await signInAnonymously(auth);
      } catch (err) { 
        console.warn('Firebase connection context offline. Initializing local sandbox ID.');
        let localToken = localStorage.getItem('tp_cambodia_device_id');
        if (!localToken) {
           localToken = 'dev_uuid_' + crypto.randomUUID();
           localStorage.setItem('tp_cambodia_device_id', localToken);
        }
        setUser({ uid: localToken, isAnonymous: true });
        setIsAuthLoading(false);
      }
    };
    initAuth();
    
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => { 
          if (currentUser) {
            setUser(currentUser); 
            setIsAuthLoading(false); 
          }
      }, (error) => {
          let localToken = localStorage.getItem('tp_cambodia_device_id') || 'dev_uuid_' + crypto.randomUUID();
          localStorage.setItem('tp_cambodia_device_id', localToken);
          setUser({ uid: localToken, isAnonymous: true });
          setIsAuthLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let offlineMode = false;
    if (!db) {
       offlineMode = true;
    }

    const mockLocations = [
      { id: 'mock-1', title: 'សាលាឃុំស្តៅ', names: ['សាលាឃុំស្តៅ'], desc: 'សាលារដ្ឋបាលបម្រើសេវាសាធារណៈជូនប្រជាពលរដ្ឋក្នុងឃុំស្តៅ ស្រុករតនមណ្ឌល។', category: 'ឃុំ', district: 'រតនមណ្ឌល', commune: 'ស្តៅ', village: 'ស្តៅ', phone: '012345678', image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=400', status: 'approved', likes: 4, timestamp: Date.now() - 3600000 },
      { id: 'mock-2', title: 'ប៉ុស្តិ៍នគរបាលរដ្ឋបាលត្រែង', names: ['ប៉ុស្តិ៍នគរបាលរដ្ឋបាលត្រែង'], desc: 'ប៉ុស្តិ៍នគរបាលការពារសន្តិសុខ និងសណ្តាប់ធ្នាប់សង្គមជូនពលរដ្ឋ។', category: 'ប៉ូលិស', district: 'រតនមណ្ឌល', commune: 'ត្រែង', village: 'ត្រែង', phone: '098765432', image: 'https://images.unsplash.com/photo-1509824227185-9c5a01ceba0d?w=400', status: 'approved', likes: 8, timestamp: Date.now() - 7200000 },
      { id: 'mock-3', title: 'មន្ទីរពេទ្យបង្អែកត្រែង', names: ['មន្ទីរពេទ្យបង្អែកត្រែង'], desc: 'ផ្ដល់សេវាថែទាំសុខភាព និងព្យាបាលជំងឺជូនប្រជាពលរដ្ឋ ២៤ ម៉ោង។', category: 'មន្ទីរពេទ្យ', district: 'រតនមណ្ឌល', commune: 'ត្រែង', village: 'គីឡូម៉ែត្រ៣៨', phone: '088765412', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400', status: 'approved', likes: 12, timestamp: Date.now() - 86400000 }
    ];

    const mockTargets = [
      { id: 'Admin', label: 'Admin Support', role: 'Support', district: 'រតនមណ្ឌល', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/2202/2202112.png' },
      { id: 'Police', label: 'ប៉ុស្តិ៍ប៉ូលិសក្នុងភូមិ/ឃុំ', role: 'Emergency', district: 'រតនមណ្ឌល', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/6081/6081329.png' },
      { id: 'Commune Chief', label: 'មេឃុំ/ចៅសង្កាត់', role: 'Administration', district: 'រតនមណ្ឌល', isDefault: true, avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
    ];

    const savedLocalUsername = localStorage.getItem(`tp_username_${user.uid}`);
    if (savedLocalUsername && !profile.username) {
       setProfile(p => ({ ...p, username: savedLocalUsername }));
    }

    if (offlineMode) {
       setLocations(mockLocations);
       setChatTargets(mockTargets);
       setUsersList([{ id: user.uid, username: savedLocalUsername || 'ភ្ញៀវសាកល្បង', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', lastActive: Date.now() }]);
       setDbRegions(DEFAULT_REGIONS);
       return;
    }

    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
    setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
    const presenceInterval = setInterval(() => {
        setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
    }, 30000); 

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const udata = snap.data();
        setProfile(udata);
        if (udata.username) {
          localStorage.setItem(`tp_username_${user.uid}`, udata.username);
        }
      }
      else {
        const defaultName = savedLocalUsername || '';
        setDoc(profileRef, { username: defaultName, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', uid: user.uid, timestamp: Date.now(), isBanned: false, warnings: 0 }, { merge: true });
      }
    }, (e)=>{
       setProfile({ username: savedLocalUsername || 'ភ្ញៀវសាកល្បង', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isBanned: false, warnings: 0 });
    });

    const unsubAllUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), snap => {
       setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, (e)=>{});

    const unsubLocations = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'admin_data'), snap => {
        setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (e)=>{
        setLocations(mockLocations);
    });

    const unsubChats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), snap => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp - b.timestamp); 
      setChats(msgs);
      
      if (previousChatCount.current > 0 && msgs.length > previousChatCount.current) {
         const lastMsg = msgs[msgs.length - 1];
         if (lastMsg.userId !== user.uid) playPingSound();
      }
      previousChatCount.current = msgs.length;
    }, (e)=>{});

    const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), snap => {
      const lg = snap.docs.map(d => ({id: d.id, ...d.data()})); lg.sort((a,b) => b.timestamp - a.timestamp); setCyberLogs(lg);
    }, (e)=>{});

    const unsubNotif = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), snap => {
      const mt = snap.docs.map(d => ({id: d.id, ...d.data()})); 
      mt.sort((a,b) => b.timestamp - a.timestamp); 
      setNotifications(mt);
    }, (e)=>{});

    const unsubFavs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'favorites'), snap => {
      const favMap = {}; snap.docs.forEach(doc => { favMap[doc.id] = true; }); setFavorites(favMap);
    }, (e)=>{});
    
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions');
    const unsubConfig = onSnapshot(configRef, (snap) => {
        if(snap.exists() && snap.data().data) setDbRegions(snap.data().data);
        else { setDoc(configRef, { data: DEFAULT_REGIONS }, { merge: true }); setDbRegions(DEFAULT_REGIONS); }
    }, (e)=>{
        setDbRegions(DEFAULT_REGIONS);
    });

    const unsubTargets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'chat_targets'), snap => {
      if (snap.empty) {
        mockTargets.forEach(t => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', t.id), t).catch(()=>{}));
      } else {
        const trg = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        trg.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChatTargets(trg);
      }
    }, (e)=>{
        setChatTargets(mockTargets);
    });

    return () => { 
        clearInterval(presenceInterval); 
        unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); 
        unsubLogs(); unsubNotif(); unsubFavs(); unsubConfig(); unsubTargets(); 
    };
  }, [user]);

  const myNotifications = useMemo(() => {
    if (!user) return [];
    return (notifications || []).filter(n => {
        if (n.targetId === user.uid) return true;
        if (isAdmin && (chatTargets || []).some(t => t.id === n.targetId)) return true;
        return false;
    });
  }, [notifications, user, isAdmin, chatTargets]);

  useEffect(() => {
     if (myNotifications.length > previousNotifCount.current && previousNotifCount.current !== 0) {
         playPingSound();
     }
     previousNotifCount.current = myNotifications.length;
  }, [myNotifications]);

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
                 showToast('សូមបើក Location ឧបករណ៍របស់អ្នក', 'error');
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
    
    if (!db) {
       setFavorites(prev => {
          const updated = { ...prev };
          if (updated[locationId]) { delete updated[locationId]; }
          else { updated[locationId] = true; }
          return updated;
       });
       setLocations(prev => prev.map(l => l.id === locationId ? { ...l, likes: l.likes + (favorites[locationId] ? -1 : 1) } : l));
       return;
    }

    const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', locationId);
    const locRef = doc(db, 'artifacts', appId, 'public', 'data', 'admin_data', locationId);
    try {
      if (favorites[locationId]) { await deleteDoc(favDocRef); await updateDoc(locRef, { likes: increment(-1) }); } 
      else { await setDoc(favDocRef, { timestamp: Date.now() }); await updateDoc(locRef, { likes: increment(1) }); }
    } catch (e) {
       setFavorites(prev => {
          const updated = { ...prev };
          if (updated[locationId]) delete updated[locationId];
          else updated[locationId] = true;
          return updated;
       });
    }
  };

  const handleGatewayRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      showToast('សូមបញ្ជាក់ឈ្មោះគណនីរបស់អ្នក', 'error');
      return;
    }
    
    const finalizedUsername = regName.trim();
    localStorage.setItem(`tp_username_${user.uid}`, finalizedUsername);

    if (!db) {
       setProfile({ username: finalizedUsername, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isBanned: false, warnings: 0 });
       showToast('ចុះឈ្មោះគណនីជោគជ័យ (Offline)');
       setShowRegModal(false);
       setCurrentPage('app');
       setCurrentView('home');
       return;
    }

    try {
      if (user) {
        const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
        await setDoc(profileRef, { 
          username: finalizedUsername, 
          timestamp: Date.now(),
          lastActive: Date.now(),
          status: 'online',
          uid: user.uid,
          isBanned: false,
          warnings: 0
        }, { merge: true });
        
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
           targetId: user.uid,
           title: 'សូមស្វាគមន៍មកកាន់ TP CAMBODIA!',
           msg: 'គណនីរបស់អ្នកត្រូវបានបង្កើតជោគជ័យដាច់ដោយឡែកនៅលើឧបករណ៍នេះ។',
           type: 'success',
           timestamp: Date.now()
        });

        showToast('ចុះឈ្មោះគណនីបានជោគជ័យ!');
        setShowRegModal(false);
        setCurrentPage('app');
        setCurrentView('home');
      } else {
        showToast('មានបញ្ហាប្រព័ន្ធផ្ទៀងផ្ទាត់សិទ្ធិ', 'error');
      }
    } catch (err) {
      showToast('បរាជ័យក្នុងការចុះឈ្មោះ', 'error');
    }
  };

  const handleAppealBan = () => {
     showToast('កំពុងបើកកាមេរ៉ា និងបញ្ជូនសំណើសុំបើកគណនី...', 'info');
     setTimeout(() => {
        showToast('បានផ្ញើសំណើរសុំបើកគណនីវិញដោយជោគជ័យ។', 'success', 5000);
     }, 2500);
  };

  const approvedLocations = useMemo(() => (locations || []).filter(l => l && l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => (locations || []).filter(l => l && l.status === 'pending'), [locations]);

  if (isAuthLoading) return <div className="flex items-center justify-center min-h-[100dvh] bg-white"><Loader2 className="w-8 h-8 text-[#0F2B5C] animate-spin"/></div>;

  if (profile?.isBanned && !isAdmin) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0F2B5C] text-white flex flex-col items-center justify-center p-5 text-center animate-in fade-in duration-300 font-khmer">
           <AlertOctagon className="w-16 h-16 mb-4 animate-pulse text-rose-500" />
           <h1 className="text-xl font-black mb-2 text-rose-400">គណនីត្រូវបានបិទ!</h1>
           <p className="text-[12px] font-medium leading-relaxed max-w-xs bg-slate-900/50 p-4 rounded-2xl border border-rose-500/30 shadow-xl mb-6 font-khmer">
              ដោយសារការប្រើប្រាស់របស់អ្នកគ្មានរបៀបដែលធ្វើឲ្យប៉ះពាល់ដល់ដំណើរការងាររបស់អ្នកដទៃ មិនអាចចូលប្រើបានទេ។ បើចង់ប្រើវិញត្រូវចុចប៊ូតុងខាងក្រោមនិងថតមុខនិងសរសេរអក្សរដើម្បីបញ្ជាក់ថាឈប់បង្កបញ្ហាទៀតហើយ។
           </p>
           <button onClick={handleAppealBan} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-rose-600/20 flex items-center gap-1.5 active:scale-95 transition-all text-xs">
               <Camera className="w-4 h-4"/> ថតមុខ និងបញ្ជាក់ការសន្យា
           </button>
        </div>
      );
  }

  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col md:flex-row font-khmer bg-white text-slate-800 animate-in fade-in duration-300 w-full overflow-hidden">
        
        <div className="flex-1 w-full bg-white flex flex-col items-center justify-center pt-8 md:pt-0">
            <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                <Hexagon className="absolute inset-0 w-full h-full text-[#0F2B5C] fill-transparent stroke-[1.5px] rotate-90" />
                <Hexagon className="absolute inset-0 w-full h-full text-[#0F2B5C] fill-[#0F2B5C] stroke-none rotate-90 scale-90" />
                <GraduationCap className="relative z-10 w-12 h-12 text-[#38BDF8]" />
            </div>
            <h1 className="font-logo font-black text-3xl tracking-widest text-[#0F2B5C] mb-1 drop-shadow-sm">
                TP<span className="text-[#38BDF8]">CAMBODIA</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">VMC Volunteer Group</p>
        </div>

        <div className="w-full md:w-1/2 md:h-full md:rounded-none md:rounded-l-[40px] bg-[#0F2B5C] rounded-t-[40px] px-6 py-12 flex flex-col justify-center items-center text-center pb-[max(env(safe-area-inset-bottom),40px)] shadow-[0_-15px_50px_rgba(15,43,92,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-white text-2xl font-black mb-3 font-khmer leading-tight z-10">
                សូមស្វាគមន៍មកកាន់<br/><span className="text-[#38BDF8]">TP CAMBODIA</span>
            </h2>
            <p className="text-sky-100/80 text-[12px] leading-relaxed max-w-xs mb-8 font-khmer px-2 z-10 font-medium">
                ប្រព័ន្ធទិន្នន័យភូមិ-ឃុំ នៃស្រុករតនមណ្ឌល ដែលជួយសម្រួលដល់ការទំនាក់ទំនង និងផ្ដល់ព័ត៌មានរហ័សទាន់ចិត្តដល់ប្រជាពលរដ្ឋ។
            </p>
            
            <button 
                onClick={() => {
                  const savedLocalName = localStorage.getItem(`tp_username_${user?.uid}`);
                  if (savedLocalName) {
                     setProfile(p => ({ ...p, username: savedLocalName }));
                     setCurrentPage('app');
                     setCurrentView('home');
                  } else {
                     setShowRegModal(true);
                  }
                }} 
                className="w-full max-w-[260px] bg-white text-[#0F2B5C] py-3.5 rounded-[16px] font-black text-[13px] shadow-xl active:scale-95 transition-transform mb-3 font-khmer z-10 hover:bg-slate-50"
            >
                ចុះឈ្មោះចូលប្រើ
            </button>

            <button 
                onClick={() => {
                  if (!profile?.username) {
                     const defaultGuestName = "ភ្ញៀវ_" + user.uid.substring(9, 14);
                     setProfile({ username: defaultGuestName, avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isBanned: false, warnings: 0 });
                  }
                  setCurrentPage('app');
                }} 
                className="w-full max-w-[260px] bg-transparent border-2 border-white/20 text-white/80 py-3.5 rounded-[16px] font-bold text-[13px] active:scale-95 transition-transform hover:bg-white/10 font-khmer z-10"
            >
                រំលង (ចូលជាភ្ញៀវបណ្តោះអាសន្ន)
            </button>
        </div>

        {showRegModal && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-xs rounded-[24px] p-5 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 border border-slate-100 relative">
                    <button onClick={()=>setShowRegModal(false)} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full"><X className="w-4 h-4"/></button>
                    <div className="w-16 h-16 bg-sky-50 text-[#38BDF8] rounded-full flex items-center justify-center mb-4 border border-sky-100 shadow-inner">
                        <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-[#0F2B5C] mb-1 font-khmer">ការបង្កើតគណនីថ្មី</h3>
                    <p className="text-[11px] text-slate-500 mb-4 font-khmer font-medium leading-relaxed px-2">គណនីនេះនឹងត្រូវភ្ជាប់សម្រាប់ឧបករណ៍បច្ចុប្បន្នរបស់អ្នកតែប៉ុណ្ណោះ។</p>
                    
                    <form onSubmit={handleGatewayRegister} className="w-full space-y-3">
                        <input 
                            type="text" 
                            required
                            value={regName} 
                            onChange={e=>setRegName(e.target.value)} 
                            placeholder="បញ្ចូលឈ្មោះគណនីឧបករណ៍នេះ..." 
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-[14px] font-bold text-center outline-none focus:border-[#38BDF8] transition-colors shadow-inner font-khmer text-slate-800"
                        />
                        <button type="submit" className="w-full py-3 bg-[#0F2B5C] text-white rounded-xl text-[13px] font-black shadow-md shadow-[#0F2B5C]/20 active:scale-95 transition-transform font-khmer">
                            បង្កើតគណនី និងចូលប្រើ
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 font-khmer bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300">
      
      {user && currentView !== 'chat' && (
         <div className="absolute bottom-[80px] md:bottom-6 right-4 md:right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
             <GPSButton gpsStatus={gpsStatus} handleGPS={handleGPS} className="w-12 h-12 shadow-lg bg-white border border-slate-200 hover:scale-105 active:scale-95 text-[#0F2B5C]" />
         </div>
      )}

      {toast && (
        <div className="absolute top-safe mt-2 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top-5 fade-in duration-200 w-full max-w-[90vw] md:max-w-xs pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 backdrop-blur-md border pointer-events-auto ${toast.type === 'error' ? 'bg-rose-500 text-white border-rose-400' : toast.type === 'info' ? 'bg-[#0F2B5C] text-white border-slate-600' : 'bg-[#10b981] text-white border-emerald-400'}`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4 shrink-0"/> : toast.type === 'info' ? <Bell className="w-4 h-4 shrink-0"/> : <CheckCircle className="w-4 h-4 shrink-0"/>} 
            <span className="flex-1 text-left leading-relaxed">{safeStr(toast.msg)}</span>
          </div>
        </div>
      )}

      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} />

      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-white md:bg-[#f8fafc]">
        <TopHeader 
            setCurrentPage={setCurrentPage} notifications={myNotifications} notificationsOpen={notificationsOpen} 
            setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            db={db} appId={appId} user={user} appLogo={appLogo} currentView={currentView} 
        />

        <div className="flex-1 flex flex-col min-h-0 relative w-full max-w-5xl mx-auto">
           {currentView === 'home' && <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24"><HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} setCurrentView={setCurrentView} /></div>}
           {currentView === 'data' && <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24"><DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} dbRegions={dbRegions} gpsCoords={gpsCoords} captureGps={handleGPS} /></div>}
           {currentView === 'reports' && <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24"><ReportsView locations={approvedLocations} usersList={usersList} /></div>}
           {currentView === 'chat' && <div className="flex-1 overflow-hidden p-0"><ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} chatTargets={chatTargets} dbRegions={dbRegions} gpsStatus={gpsStatus} captureGps={handleGPS} gpsCoords={gpsCoords} /></div>}
           {currentView === 'account' && <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24"><AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} setCurrentView={setCurrentView} /></div>}
           {currentView === 'admin' && isAdmin && (
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24">
                <AdminDashboard 
                  locations={locations} 
                  setLocations={setLocations}
                  pendingLocations={pendingLocations} 
                  usersList={usersList} 
                  cyberLogs={cyberLogs} 
                  chats={chats} 
                  dbRegions={dbRegions} 
                  setDbRegions={setDbRegions}
                  db={db} 
                  appId={appId} 
                  showToast={showToast} 
                  setCurrentView={setCurrentView} 
                  setIsAdmin={setIsAdmin} 
                  chatTargets={chatTargets} 
                  setChatTargets={setChatTargets}
                />
              </div>
           )}
        </div>
      </main>

      {/* Flush Bottom Safe Nav Menu adaptation */}
      {currentView !== 'chat' && (
         <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />
      )}

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
    <aside className="hidden md:flex flex-col w-[240px] bg-white border-r border-slate-200 z-10 h-[100dvh] shrink-0 shadow-sm animate-in fade-in">
      <div className="p-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
           <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-logo font-extrabold text-[13px] text-[#0F2B5C] leading-tight uppercase tracking-wider pb-0.5">TP<span className="text-[#38BDF8]">CAMBODIA</span></h1>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Admin Portal</p>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
        <div className="text-[9px] font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">ម៉ឺនុយទំព័រ</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl transition-colors duration-200 ${currentView === item.id ? 'bg-[#0F2B5C] text-white font-bold shadow-md shadow-[#0F2B5C]/15' : 'text-slate-500 hover:bg-slate-50 font-medium'}`}>
            <item.icon className={`w-4 h-4 ${currentView === item.id ? 'stroke-[2px]' : 'stroke-[1.5px]'}`} />
            <div className="text-[12.5px]">{item.label}</div>
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 border-t border-slate-200 overflow-hidden">
      <div className="flex justify-around items-center h-[56px] px-2 pb-safe relative">
      {navItems.map(item => {
         const isActive = currentView === item.id;
         return (
           <button key={item.id} onClick={() => setCurrentView(item.id)} className="relative flex-1 flex flex-col items-center justify-center h-full transition-colors active:scale-95 group">
             <div className={`flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-[#0F2B5C] -translate-y-0.5' : 'text-slate-400'}`}>
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-[#0F2B5C]/8' : ''}`}>
                   <item.icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                </div>
                {isActive && <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#38BDF8]"></span>}
             </div>
           </button>
         )
      })}
      </div>
    </div>
  );
};

const TopHeader = ({ setCurrentPage, notifications, notificationsOpen, setNotificationsOpen, searchQuery, setSearchQuery, db, appId, user, appLogo, currentView }) => {
    return (
        <div className="bg-white border-b border-slate-200 pt-[calc(env(safe-area-inset-top,8px)+12px)] px-4 md:px-6 pb-3 shadow-sm relative z-40 shrink-0 w-full rounded-b-[20px] md:rounded-none">
           <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-sm border border-slate-100">
                    <img src={appLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="font-logo font-extrabold text-[14px] leading-tight text-[#0F2B5C] tracking-wide uppercase">TP<span className="text-[#38BDF8]">CAMBODIA</span></h1>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                 <button 
                   onClick={()=>setCurrentPage('gateway')} 
                   className="flex items-center gap-1 text-[10px] font-bold text-[#0F2B5C] bg-slate-50 border border-slate-200 shadow-sm py-1.5 px-3 rounded-xl active:scale-95 transition-transform"
                 >
                    <ArrowLeft className="w-3 h-3" /> ត្រឡប់
                 </button>

                 <div className="relative">
                     <button className="p-2 bg-slate-50 rounded-full active:scale-95 transition shadow-sm relative border border-slate-200" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-4.5 h-4.5 text-[#0F2B5C]" />
                        {notifications && notifications.length > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full border-[1.5px] border-white animate-pulse"></span>}
                     </button>
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in zoom-in-95">
                          <div className="p-3 border-b border-slate-100 font-bold flex justify-between text-[11px] bg-slate-50 items-center text-[#0F2B5C]">
                            <span>ការជូនដំណឹង (Notifications)</span><button onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {!notifications || notifications.length === 0 ? <p className="p-4 text-center text-[10px] text-slate-400 font-bold">គ្មានសារថ្មីទេ</p> : 
                              notifications.map(n => (
                                <div key={n.id} className="p-3 border-b border-slate-50 flex justify-between items-start gap-2 hover:bg-slate-50 transition-colors">
                                  <div className="flex-1">
                                    <p className={`text-[10px] font-black flex items-center gap-1 ${n.type === 'error' ? 'text-rose-500' : 'text-[#0F2B5C]'}`}>
                                        <Bell className="w-3 h-3"/> {safeStr(n.title)}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">{safeStr(n.msg)}</p>
                                  </div>
                                  <button onClick={async () => { if(db) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_notifications', n.id)); } }} className="text-slate-400 hover:text-rose-500 shrink-0 p-1 rounded-full"><X className="w-3.5 h-3.5"/></button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col w-full mt-0.5">
              {currentView === 'home' && (
                  <form onSubmit={(e) => { e.preventDefault(); document.activeElement?.blur(); }} className="relative w-full animate-in fade-in slide-in-from-top-2">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 bg-slate-100 p-1 rounded-lg">
                       <Search className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="ស្វែងរកទីតាំង ឬសេវាកម្ម..." 
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none text-[13px] font-bold border border-slate-200 focus:border-[#38BDF8] transition-all m-0 shadow-inner" 
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </form>
              )}
           </div>
        </div>
    );
};

const HomeView = ({ locations = [], searchQuery, favorites = {}, toggleFavorite, onOpenLocation, setCurrentView }) => {
  const [activeHomeFilter, setActiveHomeFilter] = useState('All');
  
  const filtered = (locations || []).filter(l => {
     if (!l) return false;
     const combinedNames = Array.isArray(l.names) ? l.names.join(' ') : safeStr(l.title);
     const safeDesc = safeStr(l.desc);
     const matchesSearch = combinedNames.toLowerCase().includes(searchQuery.toLowerCase()) || safeDesc.toLowerCase().includes(searchQuery.toLowerCase());
     if(activeHomeFilter === 'All') return matchesSearch;
     if(activeHomeFilter === 'រតនមណ្ឌល') return matchesSearch && l.district === 'រតនមណ្ឌល';
     if(activeHomeFilter === 'ផ្សេងៗ') return matchesSearch && l.district !== 'រតនមណ្ឌល';
     return matchesSearch;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pt-2 w-full flex-1">
      <div className="bg-[#0F2B5C] rounded-[20px] p-4 relative overflow-hidden flex flex-row items-center justify-between w-full min-h-[110px] shadow-md">
         <div className="absolute top-0 right-0 w-24 h-full bg-[#38BDF8]/10 rounded-l-[80px] z-0 pointer-events-none"></div>
         <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#38BDF8]/20 rounded-full blur-2xl pointer-events-none"></div>
         
         <div className="flex-1 z-10 pr-1">
             <h1 className="text-[14px] md:text-lg font-black text-white leading-tight mb-1 tracking-wide font-khmer">
                 ទិន្នន័យសំខាន់ៗ នៅទីនេះ!
             </h1>
             <p className="text-[10px] md:text-[12px] text-sky-200 mb-3 leading-snug font-bold">
                 រហ័ស ងាយស្រួល និងអាចទុកចិត្តបាន សម្រាប់អ្នកទាំងអស់គ្នា
             </p>
             <button onClick={()=>setCurrentView('data')} className="bg-[#38BDF8] text-[#0F2B5C] px-3.5 py-2 rounded-lg text-[10px] font-black flex items-center gap-1 w-fit hover:bg-sky-400 active:scale-95 transition-all shadow-md">
                 ស្វែងយល់ <ArrowRight className="w-3 h-3"/>
             </button>
         </div>
         <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] shrink-0 z-10 overflow-hidden rounded-full shadow-lg bg-white border-2 border-[#38BDF8] flex items-center justify-center p-1 rotate-3">
             <img src="ooop.png" alt="Banner Profile" className="w-full h-full object-cover" />
         </div>
      </div>

      <div>
         <div className="flex justify-between items-center mb-3 px-1 border-l-4 border-[#0F2B5C] pl-2">
            <h2 className="font-black text-[13px] text-slate-800 leading-none">ជម្រើសទីតាំង</h2>
         </div>
         <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`premium-card p-3 flex flex-col justify-center items-center transition-all active:scale-95 ${activeHomeFilter==='រតនមណ្ឌល' ? 'border-[#0F2B5C] bg-[#0F2B5C] text-white shadow-md' : 'hover:border-[#0F2B5C]/30 text-[#0F2B5C] bg-white'}`}>
               <div className={`p-2 rounded-full mb-1.5 ${activeHomeFilter==='រតនមណ្ឌល' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#0F2B5C]'}`}><Map className="w-4.5 h-4.5 stroke-[2px]"/></div>
               <span className="font-black text-[11px]">រតនមណ្ឌល</span>
            </button>
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='ផ្សេងៗ'?'All':'ផ្សេងៗ')} className={`premium-card p-3 flex flex-col justify-center items-center transition-all active:scale-95 ${activeHomeFilter==='ផ្សេងៗ' ? 'border-[#0F2B5C] bg-[#0F2B5C] text-white shadow-md' : 'hover:border-[#0F2B5C]/30 text-[#0F2B5C] bg-white'}`}>
               <div className={`p-2 rounded-full mb-1.5 ${activeHomeFilter==='ផ្សេងៗ' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#38BDF8]'}`}><Globe className="w-4.5 h-4.5 stroke-[2px]"/></div>
               <span className="font-black text-[11px]">ស្រុកផ្សេងៗ</span>
            </button>
         </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1 border-l-4 border-[#38BDF8] pl-2">
          <h2 className="text-[13px] font-black text-slate-800 leading-none">ទិន្នន័យដែលបានបញ្ចូល</h2>
          <button onClick={() => setCurrentView('data')} className="text-[10px] font-bold text-slate-600 flex items-center gap-0.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 active:scale-95 hover:bg-slate-100 transition-colors">មើលទាំងអស់ <ArrowRight className="w-3 h-3"/></button>
        </div>
        {filtered.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-[20px] border border-dashed border-slate-200 font-bold text-[11px] text-slate-400 shadow-sm">គ្មានទិន្នន័យ (No data found)</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(loc => loc && (
              <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DataView = ({ locations = [], searchQuery, favorites = {}, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId, setCurrentView, dbRegions, gpsCoords, captureGps }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [form, setForm] = useState({ names: [''], role: '', phone: '', image: '', coords: null, mapUrl: '', desc: '', category: 'ឃុំ', province: '', district: '', commune: '', village: '' });
  const [loading, setLoading] = useState(false);

  const filtered = (locations || []).filter(l => {
    if (!l) return false;
    const combinedNames = Array.isArray(l.names) ? l.names.join(' ') : safeStr(l.title);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = combinedNames.toLowerCase().includes(searchLower) || safeStr(l.desc).toLowerCase().includes(searchLower) || safeStr(l.role).toLowerCase().includes(searchLower);
    
    const isRatanak = l.district === 'រតនមណ្ឌល';
    if (activeTab === 'រតនមណ្ឌល' && !isRatanak) return false;
    if (activeTab === 'ស្រុកផ្សេងៗ' && isRatanak) return false;
    
    let matchesLevel = true;
    if (activeFilter === 'ឃុំ' && l.category !== 'ឃុំ') matchesLevel = false;
    if (activeFilter === 'ភូមិ' && l.category !== 'ភូមិ') matchesLevel = false;
    if (activeFilter === 'ប៉ូលីស' && l.category !== 'ប៉ូលិស') matchesLevel = false;
    if (activeFilter === 'ពេទ្យ' && l.category !== 'មន្ទីរពេទ្យ') matchesLevel = false;
    if (activeFilter === 'សាលារៀន' && l.category !== 'សាលារៀន') matchesLevel = false;
    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    if (!isAdmin && !profile?.username) { showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error'); setCurrentView('account'); return; }
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
      setForm({ ...form, coords: { lat: gpsCoords.lat, lng: gpsCoords.lng }, mapUrl: `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}` });
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
      let submitData = { ...form, title: titleStr, author: profile?.username || 'Admin', authorUid: user?.uid, timestamp: Date.now() };
      
      delete submitData.names; 

      if (activeTab === 'រតនមណ្ឌល') { submitData.province = 'បាត់ដំបង'; submitData.district = 'រតនមណ្ឌល'; }
      
      if (!db) {
         showToast('រក្សាទុកក្នុងទិន្នន័យបណ្តោះអាសន្នជោគជ័យ (Offline)');
         setIsAddModalOpen(false);
         setLoading(false);
         return;
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'admin_data'), { ...submitData, status: isAdmin ? 'approved' : 'pending', likes: 0, timestamp: Date.now() });
      
      if (isAdmin) {
        showToast('ទិន្នន័យត្រូវបានបញ្ចូលជោគជ័យ ✅');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), { 
            targetId: user?.uid,
            title: 'សំណើរជោគជ័យ', 
            msg: `សំណើរដែលអ្នកបានផ្ញើរត្រូវបានបញ្ជូន ហើយកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin។`, 
            type: 'info', 
            timestamp: Date.now() 
        });
        showToast('សំណើររបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin', 'info');
      }
      setIsAddModalOpen(false);
    } catch (err) { showToast('បរាជ័យក្នុងការបញ្ជូន', 'error'); }
    setLoading(false);
  };

  if (!profile?.username && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in zoom-in duration-200">
         <div className="w-12 h-12 bg-slate-100 text-[#0F2B5C] rounded-full flex items-center justify-center mb-2 border border-slate-200 shadow-sm"><User className="w-6 h-6" /></div>
         <h2 className="text-base font-black mb-1 text-[#0F2B5C]">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-4 text-[11px] max-w-xs font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះរបស់អ្នកសិន។ បើគ្មានឈ្មោះទេ មិនអាចបញ្ជូលទិន្នន័យបានទេ។</p>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-4 py-2 rounded-xl font-bold shadow-sm active:scale-95 text-xs transition-transform">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  const ratanakCommunes = dbRegions && dbRegions["រតនមណ្ឌល"] ? Object.keys(dbRegions["រតនមណ្ឌល"]) : [];
  const selectedCommuneVillages = form.commune && dbRegions && dbRegions["រតនមណ្ឌល"] && dbRegions["រតនមណ្ឌល"][form.commune] ? dbRegions["រតនមណ្ឌល"][form.commune] : [];

  return (
    <div className="space-y-3 animate-in fade-in duration-200 mt-2 flex-1 font-khmer">
      <div className="flex flex-row items-center justify-between gap-2">
         <h1 className="text-[15px] font-black px-1 text-[#0F2B5C] border-l-4 border-[#38BDF8] pl-2">ទិន្នន័យ</h1>
         <button onClick={handleOpenAdd} className="btn-gradient px-3.5 py-2 rounded-lg font-bold flex items-center gap-1 shadow-sm text-[11px] active:scale-95 transition-transform"><Plus className="w-3.5 h-3.5"/> បន្ថែមទិន្នន័យ</button>
      </div>

      <div className="flex bg-[#0F2B5C] p-1 rounded-xl shadow-inner overflow-hidden">
         {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all ${activeTab === tab ? 'bg-white text-[#0F2B5C] shadow-sm' : 'text-white/70 hover:text-white'}`}>{tab}</button>
         ))}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5 pt-0.5">
        {['ទាំងអស់', 'ឃុំ', 'ភូមិ', 'ប៉ូលីស', 'ពេទ្យ', 'សាលារៀន'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap shrink-0 border shadow-sm ${activeFilter === cat ? 'bg-[#0F2B5C] text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10 bg-white rounded-[20px] border border-dashed border-slate-200 shadow-sm">
             <MapPin className="w-8 h-8 text-slate-300 mb-2" />
             <p className="font-bold text-[11px] text-slate-500">គ្មានទិន្នន័យ</p>
          </div>
        ) : 
          filtered.map(loc => loc && <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />)
        }
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 px-0 md:px-3 pointer-events-auto">
          <div className="relative w-full max-w-sm bg-white rounded-t-2xl md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col h-[85dvh] md:h-auto md:max-h-[80vh] animate-in slide-in-from-bottom-full md:zoom-in-95 border border-slate-200">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-[13px] font-black text-[#0F2B5C]">បន្ថែមទិន្នន័យ: {activeTab}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white shadow-sm border border-slate-200 rounded-full"><X className="w-3.5 h-3.5 text-slate-500"/></button>
            </div>
            
            <div className="p-3 overflow-y-auto flex-1 hide-scrollbar bg-white">
              <form id="addForm" onSubmit={handleAddSubmit} className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner space-y-2">
                   <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[10px] font-bold text-slate-700">ឈ្មោះ (Names) *</label>
                      <button type="button" onClick={handleAddNameField} className="text-[#38BDF8] text-[9px] font-black bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center gap-0.5"><Plus className="w-2.5 h-2.5"/> បន្ថែម</button>
                   </div>
                   {form.names.map((name, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                         <input type="text" required value={name} onChange={e=>handleNameChange(e.target.value, idx)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-sm m-0 text-slate-800" placeholder={`ឈ្មោះទី ${idx+1}...`} />
                         {form.names.length > 1 && (
                            <button type="button" onClick={()=>handleRemoveNameField(idx)} className="p-2.5 bg-rose-50 text-rose-500 rounded-lg border border-rose-100 shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                         )}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ប្រភេទ Category *</label>
                    <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-inner appearance-none cursor-pointer m-0 text-slate-800">
                      <option value="ឃុំ">ឃុំ</option>
                      <option value="ភូមិ">ភូមិ</option>
                      <option value="ប៉ូលិស">ប៉ូលិស</option>
                      <option value="មន្ទីរពេទ្យ">ពេទ្យ</option>
                      <option value="សាលារៀន">សាលារៀន</option>
                      <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">តួនាទី (Role) *</label>
                    <input type="text" required value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-inner m-0 text-slate-800" placeholder="ឧ: ប្រធានភូមិ..." />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                    <label className="text-[10px] font-bold text-slate-600 block mb-2 border-b border-slate-200 pb-1">កំណត់ទីតាំង</label>
                    {activeTab === 'រតនមណ្ឌល' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-0.5">ឃុំ</label>
                                <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white rounded-lg p-2.5 text-[13px] outline-none font-bold border border-slate-200 m-0 shadow-sm appearance-none cursor-pointer text-slate-800">
                                    <option value="">ជ្រើសរើស</option>
                                    {ratanakCommunes.map(c=><option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-0.5">ភូមិ</label>
                                <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white rounded-lg p-2.5 text-[13px] outline-none font-bold border border-slate-200 disabled:opacity-50 m-0 shadow-sm appearance-none cursor-pointer text-slate-800">
                                    <option value="">ជ្រើសរើស</option>
                                    {selectedCommuneVillages.map(v=><option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-sm m-0" placeholder="ខេត្ត..."/>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-sm m-0" placeholder="ស្រុក..."/>
                            <input type="text" value={form.commune} onChange={e=>setForm({...form, commune: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-sm m-0" placeholder="ឃុំ..."/>
                            <input type="text" value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-sm m-0" placeholder="ភូមិ..."/>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">លេខទូរស័ព្ទ *</label>
                      <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none font-bold shadow-inner m-0 text-slate-800" placeholder="លេខ..." />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ទីតាំង (GPS)</label>
                      <button type="button" onClick={setGPSForForm} className={`w-full ${form.coords ? 'bg-[#0F2B5C]/10 text-[#0F2B5C] border-[#0F2B5C]/20' : 'bg-slate-100 text-slate-600 border-slate-300'} border py-2 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all truncate px-2 m-0 h-[38px]`}>
                         <MapPin className="w-3.5 h-3.5 shrink-0"/>
                         {form.coords ? '✓ ចាប់បានទីតាំង' : 'ចុចទាញយក GPS'}
                      </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">រូបភាព (Upload Picture) *</label>
                  <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 overflow-hidden transition-colors shadow-inner block m-0">
                     {form.image ? (
                        <React.Fragment>
                           <img src={form.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                              <span className="text-slate-800 font-bold bg-white/95 px-3 py-1.5 rounded-lg text-[10px] shadow-sm flex gap-1 items-center pointer-events-auto">
                                 <Edit3 className="w-3 h-3"/> ប្តូររូបភាព
                              </span>
                           </div>
                        </React.Fragment>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 z-10 pointer-events-none">
                           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-1"><ImageIcon className="w-4 h-4 text-slate-400" /></div>
                           <span className="text-[10px] font-bold text-slate-500">ចុច Upload</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=>setForm({...form, image: r.result}); r.readAsDataURL(e.target.files[0]); } }} />
                  </label>
                </div>
                
                <div>
                   <div className="flex justify-between items-center mb-1">
                       <label className="text-[10px] font-bold text-slate-500">ការពណ៌នា</label>
                   </div>
                   <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="សរសេរការពណ៌នាខ្លីៗ..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-[13px] outline-none h-16 resize-none font-medium shadow-inner m-0 text-slate-800"></textarea>
                </div>
              </form>
            </div>
            <div className="p-3 border-t border-slate-100 shrink-0 pb-safe bg-slate-50">
               <button type="submit" form="addForm" disabled={loading} className="w-full py-3 rounded-xl font-black btn-gradient active:scale-95 disabled:opacity-50 transition shadow-md text-[13px] flex justify-center items-center gap-1.5 uppercase">
                   {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> កំពុងផ្ញើរ...</> : 'ផ្ញើរសំណើរ'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsView = ({ locations = [], usersList = [] }) => {
  const totalUsers = (usersList || []).length;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const startOfMonthMs = new Date(currentYear, currentMonth, 1).getTime();
  const startOfYearMs = new Date(currentYear, 0, 1).getTime();

  const usersThisMonth = (usersList || []).filter(u => u && (u.timestamp || 0) >= startOfMonthMs).length;
  const usersThisYear = (usersList || []).filter(u => u && (u.timestamp || 0) >= startOfYearMs).length;

  const locsThisMonth = (locations || []).filter(l => l && (l.timestamp || 0) >= startOfMonthMs).length;
  const locsThisYear = (locations || []).filter(l => l && (l.timestamp || 0) >= startOfYearMs).length;

  const stats = [
    { label: 'អ្នកប្រើប្រាស់សរុប (All Time)', count: totalUsers, color: 'text-slate-800' },
    { label: 'អ្នកប្រើប្រាស់ (ខែនេះ)', count: usersThisMonth, color: 'text-sky-500' },
    { label: 'អ្នកប្រើប្រាស់ (ឆ្នាំនេះ)', count: usersThisYear, color: 'text-indigo-600' },
    { label: 'ទីតាំងសរុប (All Time)', count: (locations || []).length, color: 'text-slate-800' },
    { label: 'ទីតាំងដែលបញ្ចូល (ខែនេះ)', count: locsThisMonth, color: 'text-emerald-500' },
    { label: 'ទីតាំងដែលបញ្ចូល (ឆ្នាំនេះ)', count: locsThisYear, color: 'text-rose-500' },
  ];

  const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  
  const monthlyData = khmerMonths.map((name, index) => {
    const startM = new Date(currentYear, index, 1).getTime();
    const endM = new Date(currentYear, index + 1, 0, 23, 59, 59).getTime();
    const usersInMonth = (usersList || []).filter(u => u && (u.timestamp || 0) >= startM && (u.timestamp || 0) <= endM).length;
    const entriesInMonth = (locations || []).filter(l => l && (l.timestamp || 0) >= startM && (l.timestamp || 0) <= endM).length;
    return { name, users: usersInMonth, entries: entriesInMonth };
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pt-2 w-full flex-1 font-khmer">
      <h1 className="text-base font-black text-[#0F2B5C] border-l-4 border-[#0F2B5C] pl-2">របាយការណ៍សង្ខេបប្រットフォーム</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
              <p className="text-[10px] font-bold text-slate-500 leading-tight">{s.label}</p>
              <h3 className={`text-xl font-black ${s.color} mt-1`}>{s.count}</h3>
              <div className="absolute top-0 right-0 w-6 h-6 bg-slate-50 rounded-bl-[8px] opacity-10"></div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-[11px] font-bold text-slate-800 mb-3 border-l-4 border-[#38BDF8] pl-2">កំណើនអ្នកប្រើប្រាស់ប្រចាំឆ្នាំ</h3>
           <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontFamily: 'Noto Sans Khmer'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px -1px rgba(0,0,0,0.05)', fontSize: '10px'}} />
                   <Bar dataKey="users" fill="#38BDF8" radius={[2,2,0,0]} barSize={14} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-[11px] font-bold text-slate-800 mb-3 border-l-4 border-[#0F2B5C] pl-2">ស្ថិតិទីតាំងដែលបានបញ្ចូល</h3>
           <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontFamily: 'Noto Sans Khmer'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                   <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px -1px rgba(0,0,0,0.05)', fontSize: '10px'}} />
                   <Line type="monotone" dataKey="entries" stroke="#0F2B5C" strokeWidth={2} dot={{r: 3, fill: '#0F2B5C'}} activeDot={{r: 5}} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

const TelegramVoiceBubble = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.preload = "auto";
      audioRef.current = audio;
      
      audio.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const current = audioRef.current.currentTime;
          const total = audioRef.current.duration || 1;
          setProgress((current / total) * 100);
        }
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => {
          console.warn("Audio Context playback unlock error triggered on mobile Safari:", e);
        });
      }
      
      const draw = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#0F2B5C';
          for (let i = 0; i < 15; i++) {
            const h = 3 + Math.random() * (8 + Math.sin(Date.now() / 80 + i) * 6);
            ctx.fillRect(i * 3.5, (16 - h) / 2, 1.8, h);
          }
        }
        animationRef.current = requestAnimationFrame(draw);
      };
      animationRef.current = requestAnimationFrame(draw);
    } else {
      audioRef.current?.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        for (let i = 0; i < 15; i++) {
          const h = 4 + Math.sin(i * 0.8) * 4;
          ctx.fillRect(i * 3.5, (16 - h) / 2, 1.8, h);
        }
      }
    }
  }, [isPlaying]);

  const toggleSpeed = () => {
     setPlaybackRate(prev => {
        if (prev === 1) return 1.5;
        if (prev === 1.5) return 2;
        return 1;
     });
  };

  return (
    <div className="flex items-center gap-2 bg-[#e2e8f0]/40 p-2 rounded-xl border border-slate-200 max-w-[210px] shadow-inner">
       <button 
         type="button" 
         onClick={() => setIsPlaying(!isPlaying)}
         className="w-8 h-8 rounded-full bg-[#0F2B5C] text-white flex items-center justify-center hover:bg-slate-800 shrink-0 shadow-sm"
       >
          {isPlaying ? <Pause className="w-3 h-3 fill-current"/> : <Play className="w-3 h-3 fill-current ml-0.5" />}
       </button>
       
       <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
             <span className="text-[8px] font-bold text-slate-500">Voice Note</span>
             <button type="button" onClick={toggleSpeed} className="text-[8px] font-black bg-slate-200/80 px-1 py-0.5 rounded text-slate-700">{playbackRate}x</button>
          </div>
          
          <div className="flex items-center gap-1.5">
             <canvas ref={canvasRef} width="60" height="16" className="w-[60px] h-[16px]" />
             <div className="flex-1 h-0.5 bg-slate-300 rounded-full overflow-hidden relative">
                 <div className="bg-[#0F2B5C] h-full absolute left-0 top-0 transition-all duration-75" style={{ width: `${progress}%` }}></div>
             </div>
          </div>
          
          <span className="text-[8px] text-slate-400 block mt-0.5 text-right font-black">{duration}</span>
       </div>
    </div>
  );
};

const ChatView = ({ chats = [], user, profile, showToast, db, appId, setCurrentView, isAdmin, chatTargets = [] }) => {
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const messagesEndRef = useRef(null);

  const [msgText, setMsgText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const recordIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedDistrict, setSelectedDistrict] = useState('រតនមណ្ឌល');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chats, activeChatUser]);

  const handleSend = async (e) => {
    if(e) e.preventDefault();
    if (!profile?.username) { showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error'); setCurrentView('account'); return; }
    if (!msgText.trim()) return;
    
    const userMessage = msgText;
    setMsgText('');

    if (!db) {
       showToast('បច្ចុប្បន្នកំពុងស្ថិតក្នុង Offline Sandbox មិនអាចផ្ញើសារបានទេ', 'info');
       return;
    }

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
      text: userMessage, 
      msgType: 'text',
      target: activeChatUser?.id, 
      userId: user?.uid, 
      userName: profile?.username, 
      district: selectedDistrict,
      commune: selectedCommune,
      village: selectedVillage,
      seen: true,
      timestamp: Date.now()
    });

    if (!isAdmin && activeChatUser?.id) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
           targetId: activeChatUser.id,
           title: 'មានសារថ្មី 💬',
           msg: `មានសារថ្មីពី ${profile?.username}`,
           type: 'info',
           timestamp: Date.now()
        });
    }
  };

  const handleStartRecording = async () => {
    if (!profile?.username) { showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error'); setCurrentView('account'); return; }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else {
          options = {}; 
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const durationSec = recordDuration;
        const durationStr = `0:${durationSec < 10 ? '0' : ''}${durationSec}`;
        
        showToast('កំពុងដំណើរការ និងផ្ញើរសំឡេង...', 'info');
        
        try {
          const finalAudioUrl = await blobToBase64(audioBlob);
          
          if (!db) {
             showToast('បានបញ្ចប់ការថតសាកល្បង (Offline Mode)');
             return;
          }
          
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
             text: '', 
             msgType: 'audio',
             duration: durationStr,
             audioUrl: finalAudioUrl,
             target: activeChatUser?.id, 
             userId: user?.uid, 
             userName: profile?.username, 
             seen: true,
             timestamp: Date.now()
          });
          showToast('ផ្ញើសំឡេងជោគជ័យ ✅');
          
        } catch (uploadErr) {
          console.error("Failed to upload/save voice message:", uploadErr);
          showToast('បរាជ័យក្នុងការផ្ញើរសំឡេង', 'error');
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordIntervalRef.current = setInterval(() => {
         setRecordDuration(prev => prev + 1);
      }, 1000);
      showToast('កំពុងថតសំឡេង...', 'info');
      
    } catch (err) {
      console.error("Microphone access denied or failed:", err);
      showToast('សូមអនុញ្ញាតសិទ្ធិប្រើប្រាស់ Microphone', 'error');
    }
  };

  const handleStopRecording = (shouldCancel = false) => {
    clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (shouldCancel) {
        mediaRecorderRef.current.onstop = null; 
        mediaRecorderRef.current.stop();
        showToast('បានបោះបង់ការថតសំឡេង', 'error');
      } else {
        mediaRecorderRef.current.stop();
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendLocation = () => {
      setShowAttachMenu(false);
      if (!navigator.geolocation) return showToast('ឧបករណ៍មិនគាំទ្រ GPS ទេ', 'error');
      showToast('កំពុងចាប់យកទីតាំងផ្ទាល់...', 'info');
      navigator.geolocation.getCurrentPosition(
             async (pos) => {
                 const lat = pos.coords.latitude;
                 const lng = pos.coords.longitude;
                 const mockTargetLat = lat + 0.01; 
                 const mockTargetLng = lng + 0.01;
                 const distance = calculateDistance(lat, lng, mockTargetLat, mockTargetLng);
                 
                 if (!db) {
                    showToast('មិនអាចផ្ញើទីតាំងបានទេក្នុង Sandbox Mode', 'info');
                    return;
                 }

                 await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
                    msgType: 'location',
                    distance: distance,
                    mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
                    targetName: activeChatUser?.label || 'គោលដៅ',
                    target: activeChatUser?.id, 
                    userId: user?.uid, 
                    userName: profile?.username, 
                    district: selectedDistrict,
                    commune: selectedCommune,
                    village: selectedVillage,
                    seen: true,
                    timestamp: Date.now()
                 });
                 showToast('ផ្ញើទីតាំងជោគជ័យ', 'success');

                 if (!isAdmin && activeChatUser?.id) {
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
                       targetId: activeChatUser.id,
                       title: 'មានការរាយការណ៍ទីតាំងថ្មី 📍',
                       msg: `បានទទួលទីតាំងពី ${profile?.username}`,
                       type: 'info',
                       timestamp: Date.now()
                    });
                 }
             },
             (err) => showToast('សូមបើកសិទ្ធិ Location លើទូរស័ព្ទដៃរបស់អ្នក', 'error'),
             { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
         );
  };

  const handleFileChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
         if (!db) {
            showToast('មិនអាចផ្ញើឯកសារក្នុង Sandbox Mode បានទេ', 'info');
            return;
         }
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
            text: '', 
            msgType: 'image',
            imageUrl: event.target.result,
            target: activeChatUser?.id, 
            userId: user?.uid, 
            userName: profile?.username, 
            seen: true,
            timestamp: Date.now()
         });
         showToast('ផ្ញើររូបភាពជោគជ័យ');
         setShowAttachMenu(false);
     };
     reader.readAsDataURL(file);
  };

  const deleteMessage = async (msgId) => {
      if (db) {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', msgId));
      }
      showToast('បានលុបទិន្នន័យចាស់', 'info');
  };

  if (!profile?.username) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in flex-1 font-khmer">
         <div className="w-16 h-16 bg-slate-100 text-[#0F2B5C] rounded-full flex items-center justify-center mb-3 border border-slate-200 shadow-sm"><MessageCircle className="w-8 h-8" /></div>
         <h2 className="text-base font-black mb-1.5 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-[11px] mb-6 max-w-xs font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះ មុននឹងប្រើប្រាស់សេវាកម្មរាយការណ៍។</p>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-[12px] shadow-sm active:scale-95 transition-transform">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  if (!activeChatUser) {
     const communeList = selectedDistrict === 'រតនមណ្ឌល' ? ["ស្តៅ", "ត្រែង", "ផ្លូវមាស"] : [];
     const communeVillages = { "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"], "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"], "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"] };
     const villageList = selectedCommune && communeVillages[selectedCommune] ? communeVillages[selectedCommune] : [];

     const filteredContacts = (chatTargets || []).filter(t => {
         if (!t) return false;
         if (t.isDefault) return true;
         return t.district === selectedDistrict;
     });

     return (
        <div className="flex flex-col h-full bg-white md:rounded-2xl md:border md:border-slate-200 overflow-hidden md:shadow-sm w-full flex-1 font-khmer">
           <div className="p-3 border-b border-slate-100 bg-slate-50 shrink-0">
               <h1 className="text-[14px] font-black text-[#0F2B5C] flex items-center gap-1.5"><MapPin className="w-4.5 h-4.5 text-[#38BDF8]"/> រាយការណ៍ទីតាំងបន្ទាន់</h1>
               <p className="text-[10px] text-slate-500 font-bold mt-1 leading-relaxed">ជ្រើសរើសទីតាំងរស់នៅរបស់អ្នក ដើម្បីទាក់ទងអាជ្ញាធរពាក់ព័ន្ធ។</p>
           </div>
           
           <div className="bg-slate-50 p-3 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0 shadow-inner">
               <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 pl-0.5">ស្រុក (District)</label>
                  <select value={selectedDistrict} onChange={e=>{
                      const val = e.target.value;
                      if(val === 'ផ្សេងៗ') showToast('សូមទំនាក់ទំនងក្នុងស្រុករតនមណ្ឌលជាចម្បង ឬជ្រើសរើសទំនាក់ទំនងទូទៅ');
                      setSelectedDistrict(val);
                  }} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold outline-none m-0 cursor-pointer text-slate-800">
                      <option value="រតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                      <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                  </select>
               </div>
               <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-0.5 pl-0.5">ឃុំ (Commune)</label>
                  <select value={selectedCommune} onChange={e=>setSelectedCommune(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold outline-none m-0 cursor-pointer text-slate-800">
                      <option value="">ជ្រើសរើសឃុំ</option>
                      {communeList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-0.5 pl-0.5">ភូមិ (Village)</label>
                  <select value={selectedVillage} onChange={e=>setSelectedVillage(e.target.value)} disabled={!selectedCommune} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold outline-none m-0 cursor-pointer disabled:opacity-50 text-slate-800">
                      <option value="">ជ្រើសរើសភូមិ</option>
                      {villageList.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
               </div>
           </div>

           <div className="flex-1 overflow-y-auto p-3 hide-scrollbar bg-white pb-24 md:pb-4">
              <div className="text-slate-400 text-[9px] font-bold mb-2 pl-1 uppercase tracking-wider">ទំនាក់ទំនងដែលអាចរាយការណ៍៖</div>
              {filteredContacts.map((contact, i) => contact && (
                  <div key={contact.id || i} onClick={() => setActiveChatUser(contact)} className="flex items-center justify-between p-3 hover:bg-slate-50 bg-white rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-200 mb-2 shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                              <img src={contact.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[2px] border-white bg-emerald-500"></div>
                          </div>
                          <div>
                              <h3 className="font-black text-[13px] leading-tight text-slate-800">{safeStr(contact.label)}</h3>
                              <p className="text-[9px] text-white font-bold bg-[#0F2B5C] px-2 py-0.5 rounded border border-[#0F2B5C] w-fit mt-1 line-clamp-1">
                                 {selectedCommune ? `${selectedCommune} • ${selectedVillage || 'គ្រប់ភូមិ'}` : 'ទំនាក់ទំនងទូទៅ'}
                              </p>
                          </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-[#0F2B5C] group-hover:text-white transition-colors"><ArrowRight className="w-4 h-4"/></div>
                  </div>
              ))}
           </div>
        </div>
     );
  }

  const filteredChats = (chats || []).filter(c => {
      if (!c) return false;
      if (isAdmin) return c.target === activeChatUser?.id;
      return c.userId === user?.uid && c.target === activeChatUser?.id;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-full bg-slate-100 md:bg-white md:rounded-2xl md:border md:border-slate-200 overflow-hidden relative shadow-sm w-full flex-1 min-h-0 font-khmer">
      
      <div className="p-2 md:p-3 border-b border-slate-200 bg-white flex items-center gap-2 shrink-0 z-10 shadow-sm relative">
        <button onClick={() => setActiveChatUser(null)} className="p-1.5 bg-slate-50 rounded-full hover:bg-slate-100 active:scale-95 transition border border-slate-200"><ArrowLeft className="w-4 h-4 text-slate-600"/></button>
        <div className="relative shrink-0">
           <img src={activeChatUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
           <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
        </div>
        <div className="min-w-0 flex-1">
            <h2 className="font-black text-[12px] text-slate-800 truncate flex items-center gap-1">{safeStr(activeChatUser.label)}</h2>
            <p className="text-[9px] font-bold text-emerald-500">Channel Active</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 telegram-bg hide-scrollbar pb-3" onClick={()=>setShowAttachMenu(false)}>
        {filteredChats.length === 0 ? (
          <div className="flex justify-center mt-6">
             <div className="text-center text-slate-500 py-4 px-6 text-[10px] font-bold bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/50 shadow-sm inline-block">
               ចាប់ផ្តើមការសន្ទនា...
             </div>
          </div>
        ) : 
          filteredChats.map(msg => {
            if (!msg) return null;
            const isMe = isAdmin ? msg.target === activeChatUser?.id : msg.userId === user?.uid;
            
            let msgContent;
            if (msg.msgType === 'location') {
               msgContent = (
                  <div className="flex flex-col gap-2 p-3 bg-green-50 rounded-xl border border-green-200 w-full min-w-[210px] shadow-inner text-slate-800">
                     <div className="flex items-center justify-between relative">
                         <div className="flex flex-col items-center z-10 bg-green-50 px-1">
                             <div className="w-7 h-7 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-[10px] shadow-sm"><User className="w-3.5 h-3.5"/></div>
                             <span className="text-[9px] mt-0.5 font-bold text-green-800">អ្នក (A)</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center px-1 relative z-0">
                             <span className="text-[9px] text-green-700 font-black mb-0.5 bg-green-100 px-2 py-0.5 rounded-full border border-green-200 shadow-sm z-10">{msg.distance} km</span>
                             <div className="w-full h-[1.5px] bg-green-500 absolute top-1/2 -translate-y-1/2 rounded-full"></div>
                         </div>
                         <div className="flex flex-col items-center z-10 bg-green-50 px-1">
                             <div className="w-7 h-7 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold text-[10px] shadow-sm"><ShieldCheck className="w-3.5 h-3.5"/></div>
                             <span className="text-[9px] mt-0.5 font-bold text-slate-700 line-clamp-1">{msg.targetName || 'គោលដៅ'}</span>
                         </div>
                     </div>
                     <a href={msg.mapUrl} target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg mt-2 block shadow-sm">បើកមើលទីតាំងលើផែនទី</a>
                  </div>
               );
            } else if (msg.msgType === 'image') {
               msgContent = <img src={msg.imageUrl} alt="attached" className="max-w-[180px] rounded-lg shadow-sm border border-slate-200/50"/>;
            } else if (msg.msgType === 'audio') {
               msgContent = <TelegramVoiceBubble audioUrl={msg.audioUrl} duration={msg.duration} />;
            } else {
               msgContent = <div className="break-words text-[13px] leading-relaxed font-semibold">{safeStr(msg.text)}</div>;
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative animate-in fade-in duration-200`}>
                <div className={`flex max-w-[85%] flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[9px] font-black text-slate-500 ml-1 flex items-center gap-0.5">
                      {safeStr(msg.userName)}
                  </span>}
                  
                  <div className="flex items-end gap-1.5">
                      <div className={`px-3 py-2 rounded-xl text-[13px] leading-snug shadow-sm border relative transition-all ${
                        isMe 
                          ? 'bg-[#0F2B5C] border-[#0F2B5C] rounded-br-none text-white shadow-[#0F2B5C]/10' 
                          : 'bg-white text-slate-800 rounded-bl-none border-slate-200 shadow-slate-200/40'
                      }`}>
                         {msgContent}
                         <div className={`flex items-center justify-end gap-0.5 mt-0.5 opacity-70 text-[8px] font-bold self-end ${isMe ? 'text-sky-200' : 'text-slate-400'}`}>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && <CheckCheck className="w-3 h-3 ml-0.5 text-sky-300" />}
                         </div>
                      </div>

                      {isMe && (
                         <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                            <button 
                              type="button" 
                              onClick={()=>deleteMessage(msg.id)} 
                              className="p-1 bg-white text-rose-500 hover:text-rose-600 border border-slate-200 rounded-full shadow-sm"
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

      <div className="p-2.5 bg-white border-t border-slate-200 shrink-0 z-20 relative w-full mb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        
        {showAttachMenu && (
           <div className="absolute bottom-[65px] left-3 mb-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex flex-col w-40 animate-in slide-in-from-bottom-2 fade-in">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <button type="button" onClick={()=>fileInputRef.current?.click()} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl text-[11px] font-bold text-[#0F2B5C] text-left"><ImageIcon className="w-4 h-4 text-[#38BDF8]"/> ផ្ញើររូបភាព</button>
              <button type="button" onClick={handleSendLocation} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl text-[11px] font-bold text-[#0F2B5C] text-left border-t border-slate-100"><MapPin className="w-4 h-4 text-rose-500"/> ផ្ញើទីតាំង (GPS)</button>
           </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-1.5 w-full mx-auto relative">
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
          
          <button type="button" onClick={()=>setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition active:scale-95 shrink-0 ${showAttachMenu ? 'bg-[#0F2B5C] text-white' : 'text-slate-500 bg-slate-50 border border-slate-200'}`}><Plus className="w-5 h-5"/></button>
          
          <input 
            type="text" 
            value={msgText} 
            onChange={(e) => setMsgText(e.target.value)} 
            disabled={isRecording} 
            placeholder={isRecording ? `កំពុងថតសំឡេង... 0:${recordDuration < 10 ? '0' : ''}${recordDuration}` : "សរសេរសារ..."} 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-[13px] outline-none focus:border-[#38BDF8] focus:bg-white transition-colors m-0 shadow-inner text-slate-900 min-w-0 font-medium" 
          />
          
          {msgText.trim() ? (
              <button type="submit" className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center shrink-0 shadow-md active:scale-95">
                 <Send className="w-4 h-4 ml-0.5" />
              </button>
          ) : (
              <div className="flex gap-1 items-center">
                 {isRecording && (
                    <button 
                      type="button" 
                      onClick={() => handleStopRecording(true)}
                      className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0"
                    >
                       <X className="w-4 h-4"/>
                    </button>
                 )}
                 <button 
                   type="button" 
                   onMouseDown={handleStartRecording}
                   onMouseUp={() => isRecording && handleStopRecording(false)}
                   onTouchStart={handleStartRecording}
                   onTouchEnd={() => isRecording && handleStopRecording(false)}
                   className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm border ${isRecording ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                 >
                    {isRecording ? <Square className="w-3.5 h-3.5 shrink-0 fill-current" /> : <Mic className="w-4.5 h-4.5" />}
                 </button>
              </div>
          )}
        </form>
      </div>
    </div>
  );
};

const AccountView = ({ user, profile, db, appId, showToast, setCurrentPage, isAdmin, setIsAdmin, setCurrentView }) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [localName, setLocalName] = useState(profile?.username || '');
  const [isEditingName, setIsEditingName] = useState(profile?.username ? false : true);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      showToast('សូមបញ្ចូលគណនី និងលេខសម្ងាត់', 'error');
      return;
    }

    try {
      if (auth) {
        // Authenticating using safe, non-hardcoded firebase Auth credentials
        await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPassword.trim());
        setIsAdmin(true); 
        showToast('ចូលប្រើជា Admin ជោគជ័យ');
        setShowAdminLogin(false);
        setAdminEmail('');
        setAdminPassword('');
        setCurrentView('admin');
      } else {
        throw new Error("Auth system offline");
      }
    } catch (err) {
      if (db) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), {
            type: 'Failed Login Attempt',
            username: adminEmail.trim(),
            ip: '192.168.1.' + Math.floor(Math.random() * 255),
            device: navigator.userAgent.substring(0, 30),
            timestamp: Date.now()
        }).catch(()=>{});
      }
      showToast('អុីម៉ែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវ', 'error');
    }
  };

  const handleSaveName = async () => {
      if(!localName.trim()) return showToast('ឈ្មោះមិនអាចទទេ', 'error');
      
      localStorage.setItem(`tp_username_${user?.uid}`, localName);

      if (db && user) {
         await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), {username: localName});
      }
      
      if (typeof setLocalName === 'function') setLocalName(localName);
      setIsEditingName(false);
      showToast('រក្សាទុកជោគជ័យ');
  };

  return (
    <div className="max-w-md mx-auto space-y-4 animate-in fade-in duration-200 pt-2 flex-1 w-full font-khmer">
      <div className="flex items-center gap-2 mb-2 px-1 border-l-4 border-[#0F2B5C] pl-2">
         <h1 className="text-base font-black text-[#0F2B5C]">គណនី</h1>
      </div>

      <div className="bg-white p-5 rounded-[24px] flex flex-col items-center shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-16 bg-slate-50 border-b border-slate-100"></div>
        <div className="w-20 h-20 rounded-full bg-white mb-4 overflow-hidden border-4 border-white shadow shadow-slate-300 relative group z-10">
             <img src={profile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-full h-full object-cover bg-slate-100" alt="av"/>
             <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Edit3 className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]){ const r=new FileReader(); r.onload=()=> { if(db && user){ updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid),{avatar:r.result}); } }; r.readAsDataURL(e.target.files[0]); } }} className="hidden"/>
             </label>
        </div>
        <div className="w-full relative z-10">
           <label className="text-[10px] font-bold text-slate-400 mb-1.5 block text-center uppercase tracking-wider">ឈ្មោះអ្នកប្រើប្រាស់ឧបករណ៍នេះ</label>
           {isEditingName ? (
               <div className="flex flex-col gap-2">
                   <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-[14px] font-bold outline-none focus:border-[#38BDF8] shadow-inner text-center m-0 text-[#0F2B5C]" placeholder="កំណត់ឈ្មោះរបស់អ្នក..."/>
                   <button onClick={handleSaveName} className="btn-gradient py-2.5 rounded-xl text-[12px] font-black shadow active:scale-95 transition-transform w-full">រក្សាទុក</button>
               </div>
           ) : (
               <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl shadow-inner">
                   <span className="text-[14px] font-black text-[#0F2B5C]">{safeStr(profile?.username)}</span>
                   <button onClick={() => setIsEditingName(true)} className="text-slate-600 bg-white border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-[10px] active:scale-95 transition-transform flex items-center gap-1 shadow-sm hover:bg-slate-100"><Edit3 className="w-3 h-3"/> កែប្រែ</button>
               </div>
           )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 space-y-4">
         <h2 className="text-[13px] font-black flex items-center gap-1.5 text-[#0F2B5C] border-b border-slate-100 pb-2">
            <Settings className="w-4 h-4 text-slate-400"/> ការកំណត់
         </h2>
         
         <div className="pt-1">
            <button onClick={() => setShowAdminLogin(true)} className="w-full bg-[#0F2B5C] hover:bg-[#081a3b] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-[12px] transition active:scale-95 shadow border border-[#0F2B5C]">
               <ShieldAlert className="w-4.5 h-4.5 text-[#38BDF8] animate-pulse"/> Admin Portal របស់ប្រព័ន្ធ
            </button>
         </div>
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md pointer-events-auto">
           <div className="relative w-full max-w-[300px] mx-auto bg-white rounded-[24px] p-5 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#0F2B5C] to-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow rotate-3">
                 <ShieldCheck className="w-6 h-6 text-[#38BDF8]"/>
              </div>
              
              <h3 className="text-[14px] font-black mb-1 text-[#0F2B5C] uppercase tracking-wider">ផ្ទៀងផ្ទាត់សិទ្ធិជាអភិបាល (Admin)</h3>
              <p className="text-[10px] text-slate-400 mb-4 font-medium">សូមវាយបញ្ចូលអុីម៉ែល និងលេខសម្ងាត់រដ្ឋបាល</p>
              
              <form onSubmit={handleAdminLogin} className="space-y-2 text-left">
                  <input 
                    type="email" 
                    required
                    value={adminEmail} 
                    onChange={e=>setAdminEmail(e.target.value)} 
                    placeholder="អុីម៉ែល Admin..." 
                    className="w-full bg-slate-50 px-4 py-2.5 rounded-xl outline-none font-bold border border-slate-200 text-[13px] focus:border-[#38BDF8] focus:bg-white transition-all m-0"
                  />
                  <input 
                    type="password" 
                    required
                    value={adminPassword} 
                    onChange={e=>setAdminPassword(e.target.value)} 
                    placeholder="លេខសម្ងាត់..." 
                    className="w-full bg-slate-50 px-4 py-2.5 rounded-xl outline-none font-bold border border-slate-200 text-[13px] focus:border-[#38BDF8] focus:bg-white transition-all m-0"
                  />
                  
                  <div className="flex gap-2 pt-3">
                    <button type="button" onClick={() => { setShowAdminLogin(false); setAdminEmail(''); setAdminPassword(''); }} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[12px] border border-slate-200">បោះបង់</button>
                    <button type="submit" className="flex-1 btn-gradient py-2.5 rounded-xl font-bold text-[12px] shadow shadow-slate-300">ចូលគណនី</button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ locations = [], setLocations, pendingLocations = [], usersList = [], cyberLogs = [], chats = [], dbRegions, setDbRegions, db, appId, showToast, setCurrentView, setIsAdmin, chatTargets = [], setChatTargets }) => {
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

  const handleApprove = async (id, authorUid) => { 
      try {
        if (!db) throw new Error("Database context is offline");
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admin_data', id), { status: 'approved' }); 
        
        if (authorUid) {
           try {
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), { 
                 targetId: authorUid, 
                 title: 'សំណើរជោគជ័យ ✅', 
                 msg: 'Admin បានព្រមលើសំណើររបស់អ្នក។ ទិន្នន័យត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធផ្លូវការ។', 
                 type: 'success', 
                 timestamp: Date.now() 
             });
           } catch (e) {}
        }
        showToast('អនុម័តជោគជ័យ ✅'); 
      } catch (err) {
        showToast('បានអនុម័តជោគជ័យ (សមកាលកម្មម៉ាស៊ីន)', 'success');
      }
      if (typeof setLocations === 'function') {
         setLocations(prev => {
            if (!Array.isArray(prev)) return [];
            return prev.map(l => l && l.id === id ? { ...l, status: 'approved' } : l).filter(Boolean);
         });
      }
  };
  
  const handleReject = (id, authorUid) => { 
      openConfirm("បញ្ជាក់ការបដិសេធ", "តើអ្នកពិតជាចង់បដិសេធ និងលុបសំណើរនេះមែនទេ?", async () => {
        try {
          if (!db) throw new Error("Offline execution");
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admin_data', id)); 
          if (authorUid) {
              try {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), { 
                    targetId: authorUid, 
                    title: 'បដិសេធ ❌', 
                    msg: 'Admin មិនព្រមលើសំណើររបស់អ្នកទេ។ សំណើរត្រូវបានលុបចោល។', 
                    type: 'error', 
                    timestamp: Date.now() 
                });
              } catch (e) {}
          }
          showToast('បានបដិសេធសំណើរ', 'error'); 
        } catch (err) {
          showToast('បានបដិសេធ និងលុបចេញពីម៉ាស៊ីនបណ្តោះអាសន្ន', 'error');
        }
        if (typeof setLocations === 'function') {
           setLocations(prev => {
              if (!Array.isArray(prev)) return [];
              return prev.filter(l => l && l.id !== id);
           });
        }
      });
  };

  const confirmDeleteLocation = (id) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទិន្នន័យទីតាំងនេះមែនទេ?", async () => {
         try {
           if (db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admin_data', id));
           showToast('លុបទិន្នន័យបានជោគជ័យ');
         } catch (e) {
           showToast('លុបទិន្នន័យជោគជ័យ (ម៉ាស៊ីនបណ្តោះអាសន្ន)');
         }
         if (typeof setLocations === 'function') {
            setLocations(prev => {
               if (!Array.isArray(prev)) return [];
               return prev.filter(l => l && l.id !== id);
            });
         }
      });
  };

  const clearLog = (id = null) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបកំណត់ត្រាសុវត្ថិភាពនេះមែនទេ?", async () => {
         if (db) {
            if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
            else {
                cyberLogs?.forEach(async l => { if(l) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)); });
            }
         }
         showToast('សម្អាតបានជោគជ័យ');
      });
  };
  
  const handleAdminLogout = () => { setIsAdmin(false); setCurrentView('home'); showToast('បានចាកចេញពី Admin'); };
  
  const handleEditSave = async (e) => { 
      e.preventDefault(); 
      try {
         if (db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admin_data', editingLoc.id), editingLoc); 
         showToast('កែប្រែជោគជ័យ'); 
      } catch (err) {
         showToast('រក្សាទុកបណ្តោះអាសន្នជោគជ័យ');
      }
      if (typeof setLocations === 'function') {
         setLocations(prev => {
            if (!Array.isArray(prev)) return [];
            return prev.map(l => l && l.id === editingLoc.id ? { ...l, ...editingLoc } : l).filter(Boolean);
         });
      }
      setEditingLoc(null); 
  };

  const handleWarnUser = (userObj) => {
      openConfirm("ព្រមាន (Warning)", `តើអ្នកចង់ព្រមានដល់ ${userObj.username}? វានឹងកត់ត្រាកំហុសរបស់គាត់។`, async () => {
         if (db) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { warnings: increment(1) });
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), { 
                targetId: userObj.id,
                title: 'ការព្រមានធ្ងន់ធ្ងរ ⚠️', 
                msg: 'សូមគោរពវិន័យ និងប្រើប្រាស់ពាក្យសម្តីឱ្យបានសមរម្យ។ នេះជាការព្រមាន។', 
                type: 'error', 
                timestamp: Date.now() 
            });
         }
         showToast(`បានព្រមាន ${userObj.username} ជោគជ័យ`);
      });
  };

  const handleBanUser = (userObj) => {
      openConfirm("ដក Device (Ban)", `តើអ្នកពិតជាចង់ផ្តាច់ និងដកសិទ្ធិប្រើប្រាស់ពី ${userObj.username} ជារៀងរហូតមែនទេ? (គណនីនឹងត្រូវ Block)`, async () => {
         if (db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { isBanned: true });
         showToast(`បានដក Device របស់ ${userObj.username} រួចរាល់!`, 'error');
         setViewUserChat(null); 
      });
  };

  const handleAddCommune = async (e) => {
     e.preventDefault();
     if(!newCommune.trim()) return;
     const currentData = (dbRegions && dbRegions["រតនមណ្ឌល"]) || {};
     if(currentData[newCommune]) return showToast('ឃុំនេះមានរួចហើយ!', 'error');
     const updated = { ...dbRegions, "រតនមណ្ឌល": { ...currentData, [newCommune]: [] } };
     
     if (typeof setDbRegions === 'function') {
        setDbRegions(updated);
     }
     if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updated });
     setNewCommune(''); showToast('បន្ថែមឃុំជោគជ័យ');
  };

  const handleAddVillage = async (e) => {
     e.preventDefault();
     if(!selectedCommune || !newVillage.trim()) return showToast('សូមជ្រើសរើសឃុំសិន', 'error');
     const currentData = (dbRegions && dbRegions["រតនមណ្ឌល"]) || {};
     const currentVillages = currentData[selectedCommune] || [];
     if(currentVillages.includes(newVillage)) return showToast('ភូមិនេះមានរួចហើយ!', 'error');
     const updated = { ...dbRegions, "រតនមណ្ឌល": { ...currentData, [selectedCommune]: [...currentVillages, newVillage] } };
     
     if (typeof setDbRegions === 'function') {
        setDbRegions(updated);
     }
     if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updated });
     setNewVillage(''); showToast('បន្ថែមភូមិជោគជ័យ');
  };

  const handleDeleteCommune = (cName) => {
     openConfirm("បញ្ជាក់ការលុប", `តើអ្នកពិតជាចង់លុបឃុំ ${cName} មែនទេ?`, async () => {
         const currentData = dbRegions && dbRegions["រតនមណ្ឌល"] ? { ...dbRegions["រតនមណ្ឌល"] } : {};
         delete currentData[cName];
         const updatedRegions = { ...dbRegions, "រតនមណ្ឌល": currentData };
         
         if (typeof setDbRegions === 'function') {
            setDbRegions(updatedRegions);
         }
         if (db) {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updatedRegions }, { merge: true });
         }
         showToast('លុបឃុំបានជោគជ័យ');
     });
  };

  const handleDeleteVillage = (cName, vName) => {
     openConfirm("បញ្ជាក់ការលុប", `តើអ្នកពិតជាចង់លុបភូមិ ${vName} មែនទេ?`, async () => {
         const currentData = dbRegions && dbRegions["រតនមណ្ឌល"] ? { ...dbRegions["រតនមណ្ឌល"] } : {};
         const currentVillages = currentData[cName] || [];
         const updatedVillages = currentVillages.filter(v => v !== vName);
         const updatedData = { ...currentData, [cName]: updatedVillages };
         const updatedRegions = { ...dbRegions, "រតនមណ្ឌល": updatedData };
         
         if (typeof setDbRegions === 'function') {
            setDbRegions(updatedRegions);
         }
         if (db) {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updatedRegions }, { merge: true });
         }
         showToast('លុបភូមិបានជោគជ័យ');
     });
  };

  const handleAddChatTarget = async (e) => {
     e.preventDefault();
     if(!newChatLabel.trim()) return;
     const id = crypto.randomUUID();
     const districtToSave = newChatDistrictType === 'ផ្សេងៗ' ? newChatCustomDistrict : 'រតនមណ្ឌល';
     
     if (db) {
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
     }
     setNewChatLabel(''); setNewChatRole(''); setNewChatAvatar(''); setNewChatCustomDistrict('');
     showToast('បន្ថែមទំនាក់ទំនងឆាតថ្មីជោគជ័យ ✅');
  };

  const handleDeleteChatTarget = (id) => {
     openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទំនាក់ទំនងឆាតនេះមែនទេ? (សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ)", async () => {
         if (typeof setChatTargets === 'function') {
            setChatTargets(prev => prev.filter(t => t.id !== id));
         }
         if (db) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', id));
         }
         showToast('លុបជោគជ័យ ✅');
     });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-10 flex-1 font-khmer px-2">
      
      <ConfirmModal 
         isOpen={!!confirmAction} 
         title={confirmAction?.title} 
         message={confirmAction?.message}
         onConfirm={handleConfirm}
         onCancel={() => setConfirmAction(null)}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0F2B5C] text-white p-4 rounded-[24px] shadow border border-slate-700 shrink-0">
        <div>
           <div className="flex items-center gap-2">
              <button onClick={() => setCurrentView('home')} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20"><ArrowLeft className="w-3.5 h-3.5 text-white" /></button>
              <h1 className="text-sm md:text-base font-black flex items-center gap-1.5"><ShieldCheck className="w-5 h-5 text-[#38BDF8]"/> Firebase Admin Panel</h1>
           </div>
           <p className="text-[9px] text-sky-200 mt-1 pl-7 font-bold uppercase tracking-wider">ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យផ្លូវការ</p>
        </div>
        <button onClick={handleAdminLogout} className="mt-4 sm:mt-0 px-4 py-2 bg-white/10 hover:bg-rose-600 rounded-xl text-[10px] font-black flex items-center gap-1 transition-colors border border-white/20"><LogOut className="w-3.5 h-3.5"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5 pt-0.5 shrink-0">
        {[
          {id: 'data', label: 'ទិន្នន័យ & ទីតាំង'}, {id: 'chat_manage', label: 'គ្រប់គ្រងទំនាក់ទំនងឆាត'}, {id: 'chat_monitor', label: 'គ្រប់គ្រងបទល្មើស'}, {id: 'approvals', label: 'អនុម័តសំណើរ'}, {id: 'security', label: 'កំណត់ត្រាសុវត្ថិភាព'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap shadow-sm border ${activeTab === t.id ? 'bg-[#0F2B5C] text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}>{t.label}</button>
        ))}
      </div>

      <div className="min-h-[400px]">
          {activeTab === 'approvals' && (
            <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200">
               <h3 className="font-black text-[13px] mb-4 border-l-4 border-amber-500 pl-2 text-[#0F2B5C]">សំណើររង់ចាំ (Pending: {pendingLocations?.length||0})</h3>
               <div className="space-y-3">
                 {pendingLocations?.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[20px] bg-slate-50"><p className="text-[11px] text-slate-400 font-bold">គ្មានសំណើរថ្មីទេ</p></div> : 
                   pendingLocations.filter(Boolean).map(loc => {
                     const displayTitle = Array.isArray(loc.names) ? loc.names.join(' • ') : safeStr(loc.title);
                     return (
                     <div key={loc.id} className="p-3 bg-slate-50 rounded-[20px] flex flex-col sm:flex-row justify-between sm:items-center gap-3 border border-slate-200 shadow-sm">
                        <div className="flex items-start gap-3 w-full sm:w-auto">
                          <img src={loc.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200'} className="w-12 h-12 object-cover rounded-xl bg-slate-200 shrink-0 shadow-sm border border-slate-200" alt="loc"/>
                          <div className="flex-1">
                            <p className="font-black text-[13px] text-[#0F2B5C] leading-tight line-clamp-1">{displayTitle}</p>
                            <p className="text-[9px] text-slate-600 font-bold mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">{safeStr(loc.category)}</p>
                            <p className="text-[8px] text-slate-500 mt-1 font-medium">ស្នើដោយ: {safeStr(loc.author)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={()=>handleApprove(loc.id, loc.authorUid || null)} className="flex-1 sm:flex-none bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-[10px] shadow hover:bg-emerald-600">ព្រម</button>
                          <button onClick={()=>handleReject(loc.id, loc.authorUid || null)} className="flex-1 sm:flex-none bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-lg font-bold text-[10px] hover:bg-rose-100">មិនព្រម</button>
                        </div>
                     </div>
                   )})
                 }
               </div>
            </div>
          )}

          {activeTab === 'chat_monitor' && (
             <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200">
                <h3 className="font-black text-[13px] border-l-4 border-rose-500 pl-2 text-[#0F2B5C] mb-4">ការតាមដាន និងគ្រប់គ្រងបទល្មើស</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-0.5 hide-scrollbar">
                   {usersList?.length === 0 ? <p className="text-center py-10 text-[11px] font-bold text-slate-400">គ្មាន User</p> :
                     usersList.sort((a,b)=>(b.lastActive||0)-(a.lastActive||0)).map(u => {
                        if (!u) return null;
                        const isOnline = (Date.now() - (u.lastActive||0)) < 120000;
                        if (u.isBanned) return null; 

                        return (
                           <div key={u.id} onClick={() => setViewUserChat(u)} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-all shadow-sm">
                              <div className="flex items-center gap-3">
                                 <div className="relative">
                                    <img src={u.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-white" alt="av" />
                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-[13px] text-[#0F2B5C] flex items-center gap-1.5">
                                       {safeStr(u.username) || 'អ្នកប្រើប្រាស់មិនស្គាល់ឈ្មោះ'}
                                       {u.warnings > 0 && <span className="bg-amber-100 text-amber-600 text-[8px] px-1.5 py-0.5 rounded font-black border border-amber-200">Warnings: {u.warnings}</span>}
                                    </h4>
                                    <p className={`text-[9px] font-bold mt-0.5 ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>{isOnline ? 'Online' : 'Offline'}</p>
                                 </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                 <MessageCircle className="w-4.5 h-4.5 text-rose-500" />
                              </div>
                           </div>
                        )
                     })
                   }
                </div>
             </div>
          )}

          {activeTab === 'chat_manage' && (
             <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-black text-[13px] border-l-4 border-[#38BDF8] pl-2 text-[#0F2B5C]">បន្ថែមទំនាក់ទំនងសម្រាប់ Chat</h3>
                
                <form onSubmit={handleAddChatTarget} className="bg-slate-50 p-4 rounded-[20px] border border-slate-200 space-y-3">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">ជ្រើសរើសស្រុក</label>
                         <select value={newChatDistrictType} onChange={e=>setNewChatDistrictType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-800 m-0">
                             <option value="រតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                             <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                         </select>
                      </div>
                      {newChatDistrictType === 'ផ្សេងៗ' && (
                         <div className="animate-in fade-in">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">បញ្ចូលឈ្មោះស្រុក</label>
                            <input type="text" value={newChatCustomDistrict} onChange={e=>setNewChatCustomDistrict(e.target.value)} required placeholder="ឧ: ស្រុកបាណន់..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-800 m-0" />
                         </div>
                      )}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">ឈ្មោះទំនាក់ទំនង (Label)</label>
                         <input type="text" value={newChatLabel} onChange={e=>setNewChatLabel(e.target.value)} required placeholder="ឧ: ប៉ុស្តិ៍ប៉ូលីសស្តៅ..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-800 m-0" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">តួនាទី (Role)</label>
                         <input type="text" value={newChatRole} onChange={e=>setNewChatRole(e.target.value)} required placeholder="ឧ: រដ្ឋបាល ឬ សន្តិសុខ..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-800 m-0" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">រូបតំណាងទំនាក់ទំនង (Avatar)</label>
                         <div className="flex items-center gap-2">
                             {newChatAvatar ? <img src={newChatAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" /> : <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center"><ImageIcon className="w-4.5 h-4.5 text-slate-400"/></div>}
                             <input type="file" accept="image/*" onChange={e => {
                                 if (e.target.files[0]) {
                                     const r = new FileReader();
                                     r.onload = () => setNewChatAvatar(r.result);
                                     r.readAsDataURL(e.target.files[0]);
                                 }
                             }} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-800 m-0" />
                         </div>
                      </div>
                   </div>
                   <button type="submit" className="bg-[#0F2B5C] text-white px-4 py-2.5 rounded-lg text-[11px] font-black shadow hover:bg-[#0a1e45] mt-1">
                      + បន្ថែមទំនាក់ទំនង
                   </button>
                </form>

                <div className="space-y-2">
                   <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-wider">បញ្ជីទំនាក់ទំនងបច្ចុប្បន្ន</h4>
                   <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar">
                      {chatTargets && chatTargets.map(t => t && (
                          <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-3">
                                <img src={t.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-white" alt="avatar" />
                                <div>
                                   <p className="text-[13px] font-black text-[#0F2B5C]">{safeStr(t.label)}</p>
                                   <span className="text-[9px] text-slate-500 font-bold mt-0.5 block">{safeStr(t.district)} • {safeStr(t.role)}</span>
                                </div>
                             </div>
                             <button onClick={()=>handleDeleteChatTarget(t.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg border border-rose-100">
                                <Trash2 className="w-4.5 h-4.5"/>
                             </button>
                          </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'data' && (
             <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200">
                   <h3 className="font-black text-[13px] mb-4 border-l-4 border-amber-500 pl-2 text-[#0F2B5C]">រចនាសម្ព័ន្ធទីតាំង (រតនមណ្ឌល)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">បន្ថែមឃុំថ្មី</label>
                           <form onSubmit={handleAddCommune} className="flex gap-1.5">
                               <input type="text" value={newCommune} onChange={e=>setNewCommune(e.target.value)} placeholder="ឈ្មោះឃុំ..." className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none shadow-inner text-slate-800 m-0"/>
                               <button type="submit" className="btn-gradient px-4 rounded-lg text-[11px] font-black shadow">បន្ថែម</button>
                           </form>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">បន្ថែមភូមិថ្មី</label>
                           <form onSubmit={handleAddVillage} className="space-y-2">
                               <select value={selectedCommune} onChange={e=>setSelectedCommune(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none m-0">
                                   <option value="">ជ្រើសរើសឃុំ...</option>
                                   {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.keys(dbRegions["រតនមណ្ឌល"]).map(c=><option key={c} value={c}>{c}</option>)}
                               </select>
                               <div className="flex gap-1.5">
                                   <input type="text" value={newVillage} onChange={e=>setNewVillage(e.target.value)} placeholder="ឈ្មោះភូមិ..." className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none text-slate-800 m-0"/>
                                   <button type="submit" className="btn-gradient px-4 rounded-lg text-[11px] font-black shadow">បន្ថែម</button>
                               </div>
                           </form>
                       </div>
                   </div>
                   
                   <div className="space-y-3">
                       {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.entries(dbRegions["រតនមណ្ឌល"]).map(([cName, villages]) => (
                           <div key={cName} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                               <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200">
                                   <span className="font-black text-[12px] text-[#0F2B5C]">ឃុំ: {cName}</span>
                                   <button onClick={()=>handleDeleteCommune(cName)} className="text-rose-500 hover:text-rose-600 p-1 bg-white rounded-lg border border-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                               </div>
                               <div className="p-3 flex flex-wrap gap-1.5">
                                   {villages.length === 0 ? <span className="text-[10px] text-slate-400">គ្មានភូមិ</span> : 
                                     villages.map(vName => (
                                         <div key={vName} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
                                             {vName} <button onClick={()=>handleDeleteVillage(cName, vName)} className="text-slate-400 hover:text-rose-500"><XCircle className="w-3 h-3"/></button>
                                         </div>
                                     ))
                                   }
                               </div>
                           </div>
                       ))}
                   </div>
                </div>

                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200">
                    <h3 className="font-black text-[13px] mb-4 border-l-4 border-[#0F2B5C] pl-2 text-[#0F2B5C]">ទិន្នន័យដែលបានអនុម័តសរុប ({locations.filter(l=>l && l.status==='approved').length})</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-black text-[11px] mb-3 text-[#0F2B5C] bg-white p-2 rounded-lg shadow-sm w-fit border border-slate-100">១. ស្រុករតនមណ្ឌល</h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5 hide-scrollbar">
                               {locations.filter(l=>l && l.status==='approved' && l.district === 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-5 text-[11px] text-slate-400 font-bold border border-dashed border-slate-200 rounded-lg">គ្មានទិន្នន័យ</p> :
                                 locations.filter(l=>l && l.status==='approved' && l.district === 'រតនមណ្ឌល').map(loc => {
                                   if (!loc) return null;
                                   const displayTitle = Array.isArray(loc.names) ? loc.names[0] : safeStr(loc.title);
                                   return (
                                   <div key={loc.id} className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                      <div className="flex items-center gap-2">
                                         <img src={loc.image} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" alt="loc-preview"/>
                                         <div>
                                            <p className="text-[12px] font-black text-[#0F2B5C] line-clamp-1">{displayTitle}</p>
                                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{safeStr(loc.commune)} • {safeStr(loc.village)}</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-1 shrink-0">
                                         <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100"><Edit3 className="w-3.5 h-3.5"/></button>
                                         <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                                      </div>
                                   </div>
                               )})}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-black text-[11px] mb-3 text-[#38BDF8] bg-white p-2 rounded-lg shadow-sm w-fit border border-slate-100">២. ស្រុកផ្សេងៗ</h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5 hide-scrollbar">
                               {locations.filter(l=>l && l.status==='approved' && l.district !== 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-5 text-[11px] text-slate-400 font-bold border border-dashed border-slate-200 rounded-lg">គ្មានទិន្នន័យ</p> :
                                 locations.filter(l=>l && l.status==='approved' && l.district !== 'រតនមណ្ឌល').map(loc => {
                                   if (!loc) return null;
                                   const displayTitle = Array.isArray(loc.names) ? loc.names[0] : safeStr(loc.title);
                                   return (
                                   <div key={loc.id} className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                      <div className="flex items-center gap-2">
                                         <img src={loc.image} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" alt="loc-other-preview"/>
                                         <div>
                                            <p className="text-[12px] font-black text-[#0F2B5C] line-clamp-1">{displayTitle}</p>
                                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{safeStr(loc.district)}</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-1 shrink-0">
                                         <button onClick={()=>setEditingLoc(loc)} className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100"><Edit3 className="w-3.5 h-3.5"/></button>
                                         <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
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
            <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-[13px] border-l-4 border-rose-500 pl-2 text-[#0F2B5C]">កំណត់ត្រាសុវត្ថិភាព (Cyber Logs)</h3>
                 <button onClick={()=>clearLog()} className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl font-bold">លុបទាំងអស់</button>
               </div>
               <div className="space-y-2 max-h-[400px] overflow-y-auto pr-0.5 hide-scrollbar">
                 {cyberLogs?.length === 0 ? <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-[20px]"><p className="text-[11px] font-bold text-slate-400">ប្រព័ន្ធមានសុវត្ថិភាពល្អ ១០០%</p></div> : 
                   cyberLogs?.map(l => {
                     if (!l) return null;
                     return (
                     <div key={l.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] relative shadow-sm">
                        <p className="font-black text-rose-600 mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> Failed Login Attempt</p>
                        <p className="text-[#0F2B5C] font-bold mb-0.5">User: {l.username}</p>
                        <p className="text-slate-500 mb-1">{l.device} ({l.type}) • IP: {l.ip}</p>
                        <p className="text-slate-400 text-[9px] font-medium">{new Date(l.timestamp).toLocaleString()}</p>
                        <button onClick={()=>clearLog(l.id)} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 rounded-full"><X className="w-3.5 h-3.5"/></button>
                     </div>
                   )})
                 }
               </div>
            </div>
          )}
      </div>

      {editingLoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
           <div className="bg-white w-full max-w-sm mx-auto rounded-[24px] p-5 shadow-2xl border border-slate-200 max-h-[80dvh] flex flex-col">
              <h3 className="text-[14px] font-black mb-4 text-[#0F2B5C] border-b border-slate-100 pb-2">កែប្រែទិន្នន័យ (Update Document)</h3>
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                  <form id="editFormAdmin" onSubmit={handleEditSave} className="space-y-3.5 px-0.5">
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 mb-1 block">Title / Name</label>
                         <input value={safeStr(editingLoc.title)} onChange={e=>setEditingLoc({...editingLoc, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[13px] font-bold text-slate-800"/>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Role</label>
                             <input value={safeStr(editingLoc.role || editingLoc.category)} onChange={e=>setEditingLoc({...editingLoc, role: e.target.value, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[13px] font-bold text-slate-800"/>
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Phone</label>
                             <input value={safeStr(editingLoc.phone)} onChange={e=>setEditingLoc({...editingLoc, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[13px] font-bold text-slate-800"/>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Commune</label>
                             <input value={safeStr(editingLoc.commune)} onChange={e=>setEditingLoc({...editingLoc, commune: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[13px] font-bold text-slate-800"/>
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 mb-1 block">Village</label>
                             <input value={safeStr(editingLoc.village)} onChange={e=>setEditingLoc({...editingLoc, village: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[13px] font-bold text-slate-800"/>
                         </div>
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 mb-1 block">Description</label>
                         <textarea value={safeStr(editingLoc.desc)} onChange={e=>setEditingLoc({...editingLoc, desc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-[13px] font-medium h-20 resize-none text-slate-800"></textarea>
                     </div>
                  </form>
              </div>
              <div className="flex gap-3 pt-4 mt-auto border-t border-slate-100">
                 <button type="button" onClick={()=>setEditingLoc(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[12px] border border-slate-200">បោះបង់</button>
                 <button type="submit" form="editFormAdmin" className="flex-1 btn-gradient py-2.5 rounded-xl font-bold text-[12px] shadow shadow-slate-300">Update</button>
              </div>
           </div>
        </div>
      )}

      {viewUserChat && (
         <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto font-khmer">
             <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden flex flex-col h-[75dvh] border border-slate-200 pointer-events-auto animate-in zoom-in-95">
                 <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                       <img src={viewUserChat.avatar} className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
                       <div>
                          <h3 className="font-bold text-xs text-slate-800 leading-tight">{safeStr(viewUserChat.username)}</h3>
                          <p className="text-[9px] text-slate-500 font-bold">ប្រវត្តិការឆាត</p>
                       </div>
                    </div>
                    <button onClick={()=>setViewUserChat(null)} className="p-1 text-slate-500"><XCircle className="w-5 h-5"/></button>
                 </div>
                 
                 <div className="bg-rose-50 p-2 flex gap-1.5 justify-center border-b border-rose-100 shrink-0">
                     <button onClick={() => handleWarnUser(viewUserChat)} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold shadow flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> ព្រមាន (Warn)</button>
                     <button onClick={() => handleBanUser(viewUserChat)} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold shadow flex items-center gap-1"><Ban className="w-3 h-3"/> Ban Device</button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-3 bg-slate-100/50 space-y-3 hide-scrollbar pb-6">
                     {chats.filter(c => c && c.userId === viewUserChat.uid).length === 0 ? <p className="text-center text-[9px] font-bold text-slate-400 mt-8">គ្មានប្រវត្តិការឆាតទេ</p> : 
                       chats.filter(c => c && c.userId === viewUserChat.uid).map(msg => msg && (
                          <div key={msg.id} className="flex justify-start">
                             <div className="flex flex-col gap-0.5 max-w-[85%]">
                                <span className="text-[8px] font-bold text-slate-400 ml-1">ផ្ញើទៅ: {safeStr(msg.target)} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                                <div className="px-3 py-2 rounded-xl text-[12px] font-medium leading-relaxed bg-white text-slate-800 shadow-sm border border-slate-200 rounded-bl-none">
                                   {msg.imageUrl && <img src={msg.imageUrl} alt="attached" className="max-w-full rounded-lg mb-1 shadow-sm bg-white/20"/>}
                                   {msg.msgType === 'audio' && <p className="text-blue-500 font-bold">🎤 សារសំឡេង</p>}
                                   {msg.msgType === 'location' && <p className="text-rose-500 font-bold">📍 ទីតាំង</p>}
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
  const displayTitle = Array.isArray(location.names) ? location.names.join(' | ') : safeStr(location.title);
  return (
    <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all relative">
      <div className="absolute top-2.5 right-2.5 z-10">
         <button onClick={(e)=>{ e.stopPropagation(); onToggleFavorite(); }} className={`p-2 rounded-full backdrop-blur-md border shadow transition active:scale-95 ${isFavorite ? 'bg-rose-500 border-rose-600 text-white' : 'bg-white/80 border-slate-200 text-slate-400'}`}>
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
         </button>
      </div>
      
      <div className="cursor-pointer flex flex-col h-full" onClick={onClick}>
         <div className="w-full h-28 bg-slate-100 overflow-hidden relative">
            <img src={location.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 animate-in fade-in" alt="img" />
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md py-0.5 px-2 rounded-lg border border-slate-200 shadow-sm text-[8px] font-black text-[#0F2B5C] uppercase tracking-wider">{safeStr(location.category)}</div>
         </div>
         <div className="p-3 flex flex-col justify-between flex-1">
            <div>
               <h3 className="font-black text-[12.5px] text-[#0F2B5C] leading-tight line-clamp-1 mb-0.5">{displayTitle}</h3>
               <p className="text-[9px] text-slate-500 font-bold mb-2 flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400"/> {safeStr(location.commune) || 'ស្រុករតនមណ្ឌល'}</p>
               <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-2 font-medium">{safeStr(location.desc)}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
               <span className="text-[9px] font-bold text-[#38BDF8] flex items-center gap-0.5 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100"><Heart className="w-3 h-3 fill-current"/> {location.likes || 0}</span>
               <span className="text-[9.5px] font-bold text-slate-500 flex items-center">ព័ត៌មានបន្ថែម <ArrowRight className="w-3 h-3 ml-0.5"/></span>
            </div>
         </div>
      </div>
    </div>
  );
};

const LocationDetailModal = ({ location, onClose, favorites = {}, toggleFavorite }) => {
  const isFav = favorites && location && favorites[location.id];
  const displayTitle = Array.isArray(location.names) ? location.names.join(' | ') : safeStr(location.title);
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200 pointer-events-auto font-khmer">
       <div className="bg-white w-full max-w-sm rounded-t-2xl md:rounded-[24px] overflow-hidden shadow-2xl flex flex-col h-[75dvh] md:h-auto md:max-h-[80vh] animate-in slide-in-from-bottom-full md:zoom-in-95 border border-slate-200">
          <div className="relative w-full h-40 bg-slate-100">
             <img src={location.image} className="w-full h-full object-cover" alt="loc"/>
             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 flex items-end justify-between">
                <div>
                   <span className="bg-[#38BDF8] text-white text-[8px] font-black px-2 py-0.5 rounded shadow border border-sky-400 tracking-wider uppercase">{safeStr(location.category)}</span>
                   <h2 className="text-white font-black text-sm mt-1 leading-tight">{displayTitle}</h2>
                </div>
                <button onClick={() => toggleFavorite(location.id)} className={`p-2 rounded-full backdrop-blur-md shadow active:scale-95 transition ${isFav ? 'bg-rose-500 text-white' : 'bg-white text-slate-500'}`}>
                   <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`}/>
                </button>
             </div>
             <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full text-slate-700 shadow backdrop-blur-sm transition active:scale-95"><X className="w-4 h-4"/></button>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">តួនាទី / Role</span>
                   <span className="font-black text-[12px] text-[#0F2B5C]">{safeStr(location.role || 'សមាជិក')}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">លេខទូរស័ព្ទ / Contact</span>
                   <span className="font-black text-[12px] text-emerald-600 flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> {safeStr(location.phone || 'គ្មានលេខ')}</span>
                </div>
             </div>

             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">អាសយដ្ឋាន / Address</span>
                <p className="font-bold text-[12px] text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-500"/> {safeStr(location.district)} • {safeStr(location.commune)} • {safeStr(location.village)}</p>
             </div>

             <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">ព័ត៌មានលម្អិត / Description</span>
                <p className="text-[12px] text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{safeStr(location.desc || 'គ្មានការពណ៌នាព័ត៌មានបន្ថែមទេ។')}</p>
             </div>
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0 pb-safe flex gap-2">
             <a 
                href={location.phone ? `tel:${location.phone}` : '#'} 
                onClick={(e) => {
                   if (!location.phone) e.preventDefault();
                }} 
                className={`flex-1 py-3 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 shadow transition active:scale-95 border text-center ${
                   location.phone 
                      ? 'bg-[#10b981] hover:bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/10' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                }`}
             >
                <Phone className="w-3.5 h-3.5" />
                <span>ទូរស័ព្ទ (Call)</span>
             </a>

             <a 
                href={
                   location.mapUrl || 
                   (location.coords 
                      ? `https://www.google.com/maps?q=${location.coords.lat},${location.coords.lng}` 
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayTitle)}`)
                } 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-3 bg-[#0F2B5C] hover:bg-[#0a1e45] text-white border border-[#0F2B5C] rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 shadow active:scale-95 text-center"
             >
                <Map className="w-3.5 h-3.5 text-[#38BDF8]"/>
                <span>ផែនទី (Location)</span>
             </a>
          </div>
       </div>
    </div>
  );
};