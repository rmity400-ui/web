import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Plus, XCircle, Trash2, Edit3, 
  Send, LogOut, Settings, 
  LayoutGrid, ShieldAlert, TrendingUp, Phone, CheckCircle, ArrowLeft, 
  Globe, ArrowRight, Loader2, MapPin, Mic, Camera, X, Play, AlertOctagon, 
  Ban, CheckCheck, Hexagon, GraduationCap, Pause, Download, Copy, Check, Radio, Eye, HelpCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

export function safeStr(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => safeStr(v, fallback)).join(', ');
  return fallback;
}

const MapSvgIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const ImageSvgIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const playPingSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.15);

    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1150, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.18, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    }, 100);

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

const parseContactsList = (location) => {
  if (!location) return [];
  if (location.contacts && Array.isArray(location.contacts) && location.contacts.length > 0) return location.contacts;
  if (location.phone) return [{ name: location.role || 'សមាជិក', phone: location.phone }];
  return [];
};

const hashPassword = async (password) => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyAdminPassword = async (inputPwd) => {
  try {
    if (inputPwd === 'ictmit' || inputPwd === 'ict168mit') return true;
    const expectedHash = "d7c43339174e508fb186b595cb2e32f05fa472f8ff66e512410985cc7fb8de75";
    const inputHash = await hashPassword(inputPwd);
    return expectedHash === inputHash;
  } catch(e) {
    return inputPwd === 'ictmit' || inputPwd === 'ict168mit'; 
  }
};

const getClientIP = async () => {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (e) { return 'Unknown IP'; }
};

const getDeviceInfo = () => navigator.userAgent.substring(0, 100);

const firebaseConfig = {
  apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E",
  authDomain: "ramit-7e364.firebaseapp.com",
  projectId: "ramit-7e364",
  storageBucket: "ramit-7e364.firebasestorage.app",
  messagingSenderId: "1036691345731",
  appId: "1:1036691345731:web:df8121852c6137e3b35ff6"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (configError) {}

const appId = 'ramit-7e364';

const injectStyles = () => {
  const styleId = 'khmer-app-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) { 
    styleEl = document.createElement('style'); 
    styleEl.id = styleId; 
    document.head.appendChild(styleEl); 
  }
  styleEl.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap');
    
    :root { 
      --font-khmer: 'Noto Sans Khmer', sans-serif; 
      --theme-dark-blue: #0F2B5C; 
      --theme-blue: #0ea5e9; 
    }
    * { 
      -webkit-tap-highlight-color: transparent; 
      box-sizing: border-box; 
    }
    html, body { 
      overscroll-behavior-y: none; 
      background-color: #f8fafc; 
      color: #0f172a; margin: 0; padding: 0; width: 100%; height: 100%; 
      touch-action: manipulation; 
    }
    .font-khmer { 
      font-family: var(--font-khmer); 
      line-height: 1.65;
    }
    .font-logo { font-family: 'Montserrat', sans-serif; }
    
    input, textarea, select { 
      font-size: 16px !important; 
      outline: none; 
      touch-action: manipulation;
    } 
    
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 0px); }
    .pt-safe { padding-top: max(env(safe-area-inset-top), 0px); }

    .btn-gradient {
       background: linear-gradient(135deg, #0F2B5C, #1e3a8a);
       box-shadow: 0 4px 12px rgba(15, 43, 92, 0.22);
       color: white; border: none; transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-gradient:active { transform: scale(0.96); box-shadow: 0 2px 8px rgba(15, 43, 92, 0.12); }
    
    .premium-card {
       background: white; border-radius: 14px; box-shadow: 0 3px 10px rgba(0,0,0,0.03); border: 1px solid rgba(226, 232, 240, 0.75);
    }
    
    .telegram-bg {
       background-color: #f1f5f9;
       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%230F2B5C' fill-opacity='0.02'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E");
    }

    .audio-waveform-bar {
        width: 3px;
        border-radius: 3px;
        transition: height 0.1s ease, background-color 0.2s ease;
    }
    
    .toggle-checkbox:checked { right: 0; border-color: #10b981; }
    .toggle-checkbox:checked + .toggle-label { background-color: #10b981; }
  `;
};

const PasswordPromptModal = ({ isOpen, title, description, onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await verifyAdminPassword(password);
    if (isValid) {
      setErrorMsg('');
      onConfirm(password);
      setPassword('');
    } else {
      setErrorMsg('លេខសម្ងាត់មិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត។');
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4 animate-in fade-in duration-200 pointer-events-auto font-khmer">
      <div className="bg-white rounded-[20px] shadow-2xl p-6 w-full max-w-sm border border-slate-100 text-center animate-in zoom-in-95">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-[17px] font-black text-[#0F2B5C] mb-2 uppercase leading-normal">{safeStr(title)}</h3>
        <p className="text-slate-500 text-[13.5px] mb-4.5 leading-relaxed font-medium">{safeStr(description)}</p>
        
        {errorMsg && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[13px] font-bold text-center">
             ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => {
              setPassword(e.target.value);
              if (errorMsg) setErrorMsg('');
            }} 
            placeholder="បញ្ចូលលេខសម្ងាត់ Admin..." 
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-[16px] font-black text-center outline-none focus:border-rose-500 transition-colors"
          />
          <div className="flex gap-2.5">
            <button type="button" onClick={() => { onCancel(); setPassword(''); setErrorMsg(''); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[14px] font-black active:scale-95 transition-all">បដិសេធ</button>
            <button type="submit" className="flex-1 py-3 bg-[#0F2B5C] text-white rounded-xl text-[14px] font-black active:scale-95 transition-all shadow-md">យល់ព្រម</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200 pointer-events-auto font-khmer">
      <div className="bg-white rounded-[20px] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 border border-slate-100">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4.5 mx-auto border border-rose-100">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
        </div>
        <h3 className="text-[16px] font-black text-center text-slate-800 mb-2 leading-normal">{safeStr(title)}</h3>
        <p className="text-[13.5px] text-center text-slate-500 mb-6 leading-relaxed font-medium">{safeStr(message)}</p>
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[13.5px] active:scale-95 transition-all">បដិសេធ</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-black text-[13.5px] bg-[#0F2B5C] text-white shadow-md active:scale-95 transition-all">ព្រម</button>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_REGIONS = {
  "រតនមណ្ឌល": {
    "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"],
    "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"],
    "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"]
  }
};

const containsAbuse = (text) => {
  const badWords = ["troll", "fuck", "bad", "spam", "scam", "អាខ្លៅ", "អាឆ្កែ", "ចោរ", "ល្ងង់", "ឡប់", "ឆ្កួត"];
  return badWords.some(word => safeStr(text).toLowerCase().includes(word));
};

const StarryGalaxyCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array(60).fill().map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005
    }));

    const animate = () => {
      ctx.fillStyle = '#090d16'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) star.speed *= -1;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, star.alpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

const LocationRouteMap = ({ senderCoords, receiverCoords }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [localReceiver, setLocalReceiver] = useState(receiverCoords);
  const [computedDist, setComputedDist] = useState(0);

  useEffect(() => {
    if (receiverCoords) {
      setLocalReceiver(receiverCoords);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocalReceiver({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setLocalReceiver({ lat: 13.3622, lng: 103.8590 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [receiverCoords]);

  useEffect(() => {
    if (!senderCoords || !localReceiver) return;
    const dist = calculateDistance(senderCoords.lat, senderCoords.lng, localReceiver.lat, localReceiver.lng);
    setComputedDist(dist);
  }, [senderCoords, localReceiver]);

  useEffect(() => {
    if (!senderCoords || !localReceiver || !mapContainerRef.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(script);

    script.onload = () => {
      const L = window.L;
      if (!L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([senderCoords.lat, senderCoords.lng], 12);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const senderIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-rose-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce"><span class="text-[10px] font-black">A</span></div>`,
        className: '',
        iconSize: [32, 32]
      });

      const receiverIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-[#0F2B5C] rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg"><span class="text-[10px] font-black">B</span></div>`,
        className: '',
        iconSize: [32, 32]
      });

      L.marker([senderCoords.lat, senderCoords.lng], { icon: senderIcon }).addTo(map);
      L.marker([localReceiver.lat, localReceiver.lng], { icon: receiverIcon }).addTo(map);

      const polyline = L.polyline([
        [senderCoords.lat, senderCoords.lng],
        [localReceiver.lat, localReceiver.lng]
      ], {
        color: '#10B981',
        weight: 4,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [35, 35] });
    };

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [senderCoords, localReceiver]);

  return (
    <div className="w-full space-y-2 font-khmer">
      <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-[12px] text-emerald-800 font-bold">
         <span className="flex items-center gap-1">📍 គណនាចម្ងាយសរុប (A → B)</span>
         <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-black">{computedDist || 0} KM</span>
      </div>
      <div ref={mapContainerRef} className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0 relative" />
    </div>
  );
};

const CallPickerModal = ({ isOpen, title, contacts, onClose }) => {
  if (!isOpen || !contacts || contacts.length === 0) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm px-0 pointer-events-auto font-khmer">
      <div className="bg-white rounded-t-[24px] shadow-2xl p-5 w-full max-w-md animate-in slide-in-from-bottom duration-300 border-t border-slate-200">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-[14px] font-black text-slate-800 leading-tight">ជ្រើសរើសលេខទូរស័ព្ទ</h3>
            <p className="text-[12px] text-slate-400 font-bold mt-1">{safeStr(title)}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2.5 max-h-[40vh] overflow-y-auto hide-scrollbar pb-safe">
          {contacts.map((contact, idx) => (
            <a 
              key={idx} 
              href={`tel:${contact.phone}`} 
              onClick={onClose}
              className="flex items-center justify-between p-3.5 hover:bg-emerald-50 border border-slate-100 bg-slate-50/50 rounded-xl cursor-pointer transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-[13px] text-[#0F2B5C]">{safeStr(contact.name)}</h4>
                  <p className="text-[12px] text-slate-500 font-bold tracking-wider mt-0.5">{safeStr(contact.phone)}</p>
                </div>
              </div>
              <div className="bg-emerald-500 text-white font-black text-[11px] px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1">
                Call <ArrowRight className="w-3.5 h-3.5"/>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  
  const [appLogo] = useState('logo.png');
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isBanned: false, warnings: 0 });
  
  const [locations, setLocations] = useState([]);  
  const [usersList, setUsersList] = useState([]);  
  const [chats, setChats] = useState([]);          
  const [chatTargets, setChatTargets] = useState([]);
  const [myContacts, setMyContacts] = useState([]); 
  const [cyberLogs, setCyberLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [dbRegions, setDbRegions] = useState(DEFAULT_REGIONS);
  const [appeals, setAppeals] = useState([]);
  const [cosmicTheme, setCosmicTheme] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('red'); 
  const [gpsCoords, setGpsCoords] = useState(null);
  
  const previousChatCount = useRef(0);
  const [activeChatUser, setActiveChatUser] = useState(null);

  const [appealText, setAppealText] = useState('');
  const [appealPhoto, setAppealPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const streamObjectRef = useRef(null);

  const [callPickerState, setCallPickerState] = useState({ isOpen: false, title: '', contacts: [] });

  const triggerCallFlow = (location) => {
    const parsed = parseContactsList(location);
    if (parsed.length === 0) return showToast('គ្មានលេខទូរស័ព្ទសម្រាប់ទំនាក់ទំនងឡើយ', 'error');
    if (parsed.length === 1) {
      window.location.href = `tel:${parsed[0].phone}`;
    } else {
      setCallPickerState({ isOpen: true, title: location.title || 'ស្ថាប័ន', contacts: parsed });
    }
  };

  const showToast = (msg, type = 'success', duration = 3000) => { 
      setToast({ msg: safeStr(msg), type }); 
      setTimeout(() => setToast(null), duration); 
  };

  useEffect(() => { 
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { 
      meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); 
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover';
    injectStyles(); 
  }, []);

  useEffect(() => {
    const handleVisitorStats = async () => {
      if (!db) return;
      try {
        const isAlreadyCounted = localStorage.getItem('tp_visitor_counted');
        if (!isAlreadyCounted) {
          const statsRef = doc(db, 'artifacts', appId, 'public', 'stats');
          await setDoc(statsRef, { visitorCount: increment(1) }, { merge: true });
          localStorage.setItem('tp_visitor_counted', 'true');
        }
      } catch (e) {}
    };
    handleVisitorStats();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth) throw new Error("Auth module not initialized");
        await signInAnonymously(auth);
      } catch (err) { 
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
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkRouting = () => {
       const isGuest = sessionStorage.getItem('tp_is_guest') === 'true';
       const savedLocalUsername = localStorage.getItem(`tp_username_${user.uid}`);
       
       if (savedLocalUsername && savedLocalUsername !== 'ភ្ញៀវ' && !isGuest) {
          setCurrentPage('app');
          setCurrentView('home');
       } else {
          setCurrentPage('gateway');
       }
    };
    checkRouting();

    if (!db) return;

    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
    setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
    const presenceInterval = setInterval(() => {
      setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
    }, 30000); 

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const udata = snap.data();
        setProfile(udata);
        
        if (udata.forceLogout === true) {
           updateDoc(profileRef, { forceLogout: false }).catch(()=>{});
           localStorage.clear();
           sessionStorage.clear();
           showToast('គណនីរបស់អ្នកត្រូវបានលុបចេញពីប្រព័ន្ធទាំងស្រុង!', 'error', 6000);
           signOut(auth).catch(()=>{});
           setUser(null);
           setCurrentPage('gateway');
        }

        if (udata.username && udata.username !== 'ភ្ញៀវ') {
          localStorage.setItem(`tp_username_${user.uid}`, udata.username);
        }
      } else {
        const savedName = localStorage.getItem(`tp_username_${user.uid}`) || '';
        setDoc(profileRef, {
          username: savedName,
          avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          uid: user.uid,
          timestamp: Date.now(),
          isBanned: false,
          warnings: 0
        }, { merge: true });
      }
    }, () => {});

    const unsubAllUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), snap => {
       setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});

    const unsubLocations = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_admin_data'), snap => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});
    
    const unsubChats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), snap => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp - b.timestamp); 
      setChats(msgs);
      if (previousChatCount.current > 0 && msgs.length > previousChatCount.current) {
         const lastMsg = msgs[msgs.length - 1];
         if (lastMsg.userId !== user.uid) playPingSound();
      }
      previousChatCount.current = msgs.length;
    }, () => {});

    const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), snap => {
      const lg = snap.docs.map(d => ({id: d.id, ...d.data()}));
      lg.sort((a,b) => b.timestamp - a.timestamp);
      setCyberLogs(lg);
    }, () => {});

    const unsubAppeals = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'appeals'), snap => {
      setAppeals(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});
    
    const unsubNotif = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), snap => {
      const mt = snap.docs.map(d => ({id: d.id, ...d.data()}));
      mt.sort((a,b) => b.timestamp - a.timestamp);
      setNotifications(mt);
    }, () => {});

    const unsubFavs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'favorites'), snap => {
      const favMap = {};
      snap.docs.forEach(doc => { favMap[doc.id] = true; });
      setFavorites(favMap);
    }, () => {});
    
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions');
    const unsubConfig = onSnapshot(configRef, (snap) => {
        if(snap.exists() && snap.data().data) setDbRegions(snap.data().data);
        else {
           setDoc(configRef, { data: DEFAULT_REGIONS }, { merge: true });
           setDbRegions(DEFAULT_REGIONS);
        }
    }, () => { setDbRegions(DEFAULT_REGIONS); });

    const themeRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'theme');
    const unsubTheme = onSnapshot(themeRef, (snap) => {
        if (snap.exists() && snap.data().cosmicTheme !== undefined) {
           setCosmicTheme(snap.data().cosmicTheme);
        }
    }, () => {});

    const unsubTargets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'chat_targets'), snap => {
      if (!snap.empty) {
        const trg = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        trg.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChatTargets(trg);
      }
    }, () => {});

    const unsubMyContacts = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'contacts'), snap => {
       setMyContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => { 
        clearInterval(presenceInterval); 
        unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); 
        unsubLogs(); unsubNotif(); unsubFavs(); unsubConfig(); unsubTheme(); unsubTargets(); unsubMyContacts(); unsubAppeals();
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

  const handleGPS = () => {
     setGpsStatus('loading');
     if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
             (pos) => {
                 setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                 setGpsStatus('green');
                 showToast('ចាប់ទីតាំងបានជោគជ័យ', 'success');
             },
             () => {
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
    if (!user || !db) return;
    const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', locationId);
    const locRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_admin_data', locationId);
    try {
      if (favorites[locationId]) {
         await deleteDoc(favDocRef);
         await updateDoc(locRef, { likes: increment(-1) });
      } else {
         await setDoc(favDocRef, { timestamp: Date.now() });
         await updateDoc(locRef, { likes: increment(1) });
      }
    } catch (e) {}
  };

  const handleGatewayRegister = async (e) => {
    e.preventDefault();
    const finalizedUsername = regName.trim();
    if (!finalizedUsername) return showToast('សូមបញ្ជាក់ឈ្មោះគណនីរបស់អ្នក', 'error');

    if (finalizedUsername.length < 2 || /(.)\1{2,}/.test(finalizedUsername)) {
        return showToast('ឈ្មោះមិនត្រឹមត្រូវ! (សូមប្រើឈ្មោះពិត ត្រកូល និងនាមឲ្យបានត្រឹមត្រូវ)', 'error');
    }
    
    sessionStorage.removeItem('tp_is_guest');
    localStorage.setItem(`tp_username_${user.uid}`, finalizedUsername);

    if (db && user) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), {
          username: finalizedUsername,
          timestamp: Date.now(),
          lastActive: Date.now(),
          status: 'online',
          uid: user.uid,
          isBanned: false,
          warnings: 0
        }, { merge: true });
    }
    showToast('ចុះឈ្មោះគណនីបានជោគជ័យ!');
    setShowRegModal(false);
    setCurrentPage('app');
    setCurrentView('home');
  };

  const handleGuestEntry = () => {
     sessionStorage.setItem('tp_is_guest', 'true');
     if (!profile?.username || profile?.username !== 'ភ្ញៀវ') {
        setProfile({
           username: 'ភ្ញៀវ',
           avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
           isBanned: false,
           warnings: 0
        });
     }
     setCurrentPage('app');
     setCurrentView('home');
  };

  const startCamera = async () => {
    setIsCapturing(true);
    setAppealPhoto(null);
    try {
      const constraints = { video: { facingMode: 'user', width: 320, height: 240 } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamObjectRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      showToast('កំពុងបើកកាមេរ៉ាស្កែនផ្ទៃមុខ...', 'info');
    } catch (e) {
      showToast('បរាជ័យក្នុងការបើកកាមេរ៉ាពិតប្រាកដ', 'error');
      setIsCapturing(false);
    }
  };

  const capturePhotoSnapshot = () => {
    if (!videoRef.current || !streamObjectRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setAppealPhoto(dataUrl);
      
      if (streamObjectRef.current) {
        streamObjectRef.current.getTracks().forEach(track => track.stop());
      }
      streamObjectRef.current = null;
      setIsCapturing(false);
      showToast('ថតរូបបញ្ជាក់អត្តសញ្ញាណបានជោគជ័យ ✅');
    } catch (err) {
      showToast('មានបញ្ហាក្នុងការថតរូប', 'error');
    }
  };

  const cancelCameraStream = () => {
    if (streamObjectRef.current) {
      streamObjectRef.current.getTracks().forEach(track => track.stop());
    }
    streamObjectRef.current = null;
    setIsCapturing(false);
    setAppealPhoto(null);
  };

  const submitAppeal = async () => {
     if (!appealText.trim()) return showToast('សូមសរសេរព័រណានៃការសន្យារបស់អ្នក', 'error');
     if (!appealPhoto) return showToast('សូមថតរូបមុខដើម្បីបញ្ជាក់អត្តសញ្ញាណជាមុនសិន', 'error');
     
     showToast('កំពុងផ្ញើសំណើរសុំបើកគណនី...', 'info');
     try {
        if (db && user) {
           await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appeals', user.uid), {
              userId: user.uid,
              username: profile.username || 'Unspecified User',
              text: appealText.trim(),
              photo: appealPhoto,
              timestamp: Date.now()
           });
        }
        showToast('បានផ្ញើសំណើរសុំបើកគណនីវិញដោយជោគជ័យ។', 'success', 5000);
        setAppealText('');
        setAppealPhoto(null);
     } catch (err) {
        showToast('មានបញ្ហាក្នុងការផ្ញើសំណើរ', 'error');
     }
  };

  const approvedLocations = useMemo(() => (locations || []).filter(l => l && l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => (locations || []).filter(l => l && l.status === 'pending'), [locations]);

  if (isAuthLoading) return <div className="flex items-center justify-center min-h-[100dvh] bg-white"><Loader2 className="w-10 h-10 text-[#0F2B5C] animate-spin"/></div>;

  if (profile?.isBanned && !isAdmin) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0F2B5C] text-white flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-500 font-khmer overflow-y-auto">
           <AlertOctagon className="w-10 h-10 mb-3 animate-pulse text-rose-500 shrink-0" />
           <h1 className="text-lg md:text-xl font-black mb-2 text-rose-400">គណនីត្រូវបានបិទ! (Device Blocked)</h1>
           <p className="text-[12px] md:text-[13.5px] font-medium leading-relaxed max-w-sm text-slate-200 bg-slate-900/50 p-4 rounded-2xl border border-rose-500/30 shadow-xl mb-6">
              ដោយសារតែទង្វើរនិងសកម្មភាពអវិជ្ជមានរបស់អ្នកដែលធ្វើឱ្យប៉ះពាល់ដល់ការងាររបស់អ្នកដទៃ ចឹងមិនអាចចូលប្រើបានទេ ប្រសិនបើអ្នកចង់ប្រើត្រូវធ្វើតាមនីតិវិធីដូចខាងក្រោម បើមានលើកទីពីរនោះប្រព័ន្ធនឹងដក web app ចេញពីទូរស័ព្ទដៃរបស់ user និងមិនអាចចូលប្រើបានជារៀងរហូត។
           </p>

           <div className="w-full max-w-xs bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3.5 mb-4">
               <div>
                  <label className="text-[11px] uppercase font-bold text-slate-300 block mb-1 text-left">១. ថតរូបមុខបញ្ជាក់អត្តសញ្ញាណ *</label>
                  
                  {isCapturing && (
                    <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden relative mb-2">
                       <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                       <button onClick={capturePhotoSnapshot} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-rose-600 px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-lg"><Camera className="w-3.5 h-3.5" /> ថតយក (Capture)</button>
                       <button onClick={cancelCameraStream} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full shadow-md"><X className="w-3.5 h-3.5"/></button>
                    </div>
                  )}

                  {!isCapturing && appealPhoto && (
                     <div className="relative w-full aspect-[16/10] bg-black/20 rounded-xl overflow-hidden border border-white/10 mb-2">
                        <img src={appealPhoto} alt="Snapshot" className="w-full h-full object-cover" />
                        <button onClick={startCamera} className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-lg text-[10px] font-bold backdrop-blur-sm">ថតម្តងទៀត</button>
                     </div>
                  )}

                  {!isCapturing && !appealPhoto && (
                     <button onClick={startCamera} className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[12px] flex items-center justify-center gap-1 transition-all shadow-md active:scale-95">
                        <Camera className="w-3.5 h-3.5"/> ថតរូបមុខផ្ទាល់ (Open Camera)
                     </button>
                  )}
               </div>
               <div>
                  <label className="text-[11px] uppercase font-bold text-slate-300 block mb-1 text-left">២. លិខិតបញ្ជាក់សេចក្តីសន្យា *</label>
                  <textarea 
                     value={appealText}
                     onChange={e => setAppealText(e.target.value)}
                     placeholder="សរសេរការសន្យារបស់អ្នកនៅទីនេះ..."
                     className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-400 p-2.5 rounded-xl text-[13px] h-16 resize-none font-medium focus:border-white/30 transition-all outline-none"
                  />
               </div>
           </div>

           <div className="flex gap-2 w-full max-w-xs mt-1">
              <button onClick={() => setCurrentPage('gateway')} className="flex-1 bg-white/10 hover:bg-white/20 px-3 py-2.5 rounded-lg font-bold text-[12px] transition-all active:scale-95">ត្រឡប់ក្រោយ</button>
              <button onClick={submitAppeal} className="flex-1 bg-rose-600 hover:bg-rose-700 px-3 py-2.5 rounded-lg font-black text-[12px] shadow-lg transition-all active:scale-95 border border-rose-500">ផ្ញើសំណើ</button>
           </div>
        </div>
      );
  }

  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col md:flex-row font-khmer bg-white text-slate-800 animate-in fade-in duration-500 w-full overflow-hidden">
        {cosmicTheme && <StarryGalaxyCanvas />}

        <div className="flex-1 w-full bg-transparent flex flex-col items-center justify-center pt-10 md:pt-0 z-10">
            <div className="relative w-24 h-24 flex items-center justify-center mb-4 hover:scale-105 transition-transform duration-500">
                <Hexagon className="absolute inset-0 w-full h-full text-[#0F2B5C] fill-transparent stroke-[1.5px] rotate-90" />
                <Hexagon className="absolute inset-0 w-full h-full text-[#0F2B5C] fill-[#0F2B5C] stroke-none rotate-90 scale-90" />
                <GraduationCap className="relative z-10 w-12 h-12 text-[#38BDF8] " />
            </div>
            <h1 className={`font-logo font-black text-3xl tracking-widest ${cosmicTheme ? 'text-white' : 'text-[#0F2B5C]'} mb-1 drop-shadow-sm`}>
                TP<span className="text-[#38BDF8]">CAMBODIA</span>
            </h1>
            <p className={`text-[11px] ${cosmicTheme ? 'text-sky-300' : 'text-slate-400'} font-bold uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm`}>VMC Volunteer Group</p>
        </div>

        <div className="w-full md:w-1/2 md:h-full md:rounded-none md:rounded-l-[40px] bg-[#0F2B5C] rounded-t-[40px] px-6 py-10 flex flex-col justify-center items-center text-center pb-[max(env(safe-area-inset-bottom),40px)] shadow-[0_-10px_30px_rgba(15,43,92,0.15)] relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-white text-2xl font-black mb-4 font-khmer leading-tight z-10">
                សូមស្វាគមន៍មកកាន់ TP CAMBODIA
            </h2>
            <p className="text-sky-100/80 text-[13px] leading-relaxed max-w-sm mb-8 font-khmer px-2 z-10 font-medium">
                ប្រព័ន្ធទិន្នន័យភូមិ-ឃុំ នៃស្រុករតនមណ្ឌល ដែលជួយសម្រួលដល់ការទំនាក់ទំនង និងផ្ដល់ព័ត៌មានរហ័សទាន់ចិត្តដល់ប្រជាពលរដ្ឋ។
            </p>
            
            <button 
                onClick={() => setShowRegModal(true)} 
                className="w-full max-w-[260px] bg-white text-[#0F2B5C] py-3.5 rounded-xl font-black text-[13.5px] shadow-lg active:scale-95 transition-transform mb-3 font-khmer z-10 hover:bg-slate-50 flex justify-center items-center gap-1.5"
            >
                ចុះឈ្មោះចូលប្រើ <ArrowRight className="w-4 h-4"/>
            </button>

            <button 
                onClick={handleGuestEntry} 
                className="w-full max-w-[260px] bg-transparent border-2 border-white/20 text-white/80 py-3.5 rounded-xl font-bold text-[13px] active:scale-95 transition-transform hover:bg-white/10 font-khmer z-10"
            >
                រំលង (ចូលជាភ្ញៀវ)
            </button>
        </div>

        {showRegModal && (
            <div className="absolute inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center border border-slate-100 relative">
                    <button onClick={()=>setShowRegModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full"><X className="w-4 h-4"/></button>
                    <div className="w-16 h-16 bg-sky-50 text-[#38BDF8] rounded-full flex items-center justify-center mb-4 border border-sky-100">
                        <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-[#0F2B5C] mb-1 font-khmer">ការបង្កើតគណនីថ្មី</h3>
                    <p className="text-[12px] text-slate-500 mb-4 font-khmer font-medium">គណនីនេះនឹងត្រូវភ្ជាប់សម្រាប់ឧបករណ៍បច្ចុប្បន្នរបស់អ្នកតែប៉ុណ្ណោះ។</p>
                    
                    <form onSubmit={handleGatewayRegister} className="w-full space-y-3">
                        <input 
                            type="text" 
                            required
                            value={regName} 
                            onChange={e=>setRegName(e.target.value)} 
                            placeholder="បញ្ចូលឈ្មោះគណនីឧបករណ៍នេះ..." 
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-[14px] font-bold text-center outline-none focus:border-[#38BDF8] font-khmer text-slate-800"
                        />
                        <button type="submit" className="w-full py-3 bg-[#0F2B5C] text-white rounded-xl text-[13.5px] font-black active:scale-95 transition-transform font-khmer flex items-center justify-center gap-1.5">
                            បង្កើតគណនី <CheckCircle className="w-4.5 h-4.5"/>
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 font-khmer bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row overflow-hidden animate-in fade-in">
      
      {toast && (
        <div className="absolute top-safe mt-2 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top-5 fade-in duration-300 w-full max-w-[90vw] md:max-w-sm pointer-events-none">
          <div className={`px-4 py-3 rounded-xl shadow-2xl font-bold text-[12px] flex items-center gap-2.5 backdrop-blur-xl border pointer-events-auto ${toast.type === 'error' ? 'bg-rose-600/90 text-white border-rose-500' : toast.type === 'info' ? 'bg-[#0F2B5C]/90 text-white border-slate-700' : 'bg-emerald-600/90 text-white border-emerald-500'}`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4 shrink-0"/> : toast.type === 'info' ? <Bell className="w-4 h-4 shrink-0"/> : <CheckCircle className="w-4 h-4 shrink-0"/>} 
            <span className="flex-1 text-left leading-relaxed drop-shadow-sm">{safeStr(toast.msg)}</span>
          </div>
        </div>
      )}

      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} />

      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-white md:bg-[#f8fafc] shadow-inner z-20">
        <TopHeader 
            setCurrentPage={setCurrentPage} notifications={myNotifications} notificationsOpen={notificationsOpen} 
            setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            db={db} appId={appId} user={user} appLogo={appLogo} currentView={currentView} 
        />

        <div className="flex-1 flex flex-col min-h-0 relative w-full max-w-7xl mx-auto overflow-hidden">
           {currentView === 'home' && <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2"><HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} setCurrentView={setCurrentView} /></div>}
           {currentView === 'data' && <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2"><DataView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} dbRegions={dbRegions} gpsCoords={gpsCoords} captureGps={handleGPS} /></div>}
           {currentView === 'reports' && <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2"><ReportsView locations={approvedLocations} usersList={usersList} /></div>}
           {currentView === 'chat' && <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-0"><ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} chatTargets={chatTargets} myContacts={myContacts} dbRegions={dbRegions} gpsStatus={gpsStatus} captureGps={handleGPS} gpsCoords={gpsCoords} usersList={usersList} activeChatUser={activeChatUser} setActiveChatUser={setActiveChatUser} /></div>}
           {currentView === 'account' && <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2"><AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} setCurrentView={setCurrentView} /></div>}
           {currentView === 'admin' && isAdmin && (
              <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2">
                <AdminDashboard 
                  locations={locations} setLocations={setLocations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} dbRegions={dbRegions} setDbRegions={setDbRegions} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} setIsAdmin={setIsAdmin} chatTargets={chatTargets} setChatTargets={setChatTargets} appeals={appeals} setAppeals={setAppeals} cosmicTheme={cosmicTheme} setCosmicTheme={setCosmicTheme}
                />
              </div>
           )}
        </div>
      </main>

      {/* Hide bottom menu when actively chatting to prevent viewport overlapping and cutoff issues (Fixes photo_6253720894538715129_y.jpg) */}
      {!(currentView === 'chat' && activeChatUser) && (
        <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />
      )}

      {selectedLocation && (
        <LocationDetailModal 
          location={selectedLocation} onClose={() => setSelectedLocation(null)} favorites={favorites} toggleFavorite={toggleFavorite} gpsCoords={gpsCoords} onCallTrigger={triggerCallFlow}
        />
      )}
      {callPickerState.isOpen && (
        <CallPickerModal isOpen={callPickerState.isOpen} title={callPickerState.title} contacts={callPickerState.contacts} onClose={() => setCallPickerState({ isOpen: false, title: '', contacts: [] })} />
      )}
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
      <div className="p-4 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
           <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-logo font-extrabold text-[13px] text-[#0F2B5C] leading-none uppercase tracking-wide">TP<span className="text-[#38BDF8]">CAMBODIA</span></h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Admin Portal</p>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
        <div className="text-[10px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">ម៉ឺនុយទំព័រ</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 ${currentView === item.id ? 'bg-[#0F2B5C] text-white font-bold shadow-md' : 'text-slate-500 hover:bg-slate-50 font-medium hover:text-[#0F2B5C]'}`}>
            <item.icon className="w-5 h-5" />
            <div className="text-[13.5px]">{item.label}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const BottomNav = ({ currentView, setCurrentView, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម' },
    { id: 'data', icon: LayoutGrid, label: 'មុខងារ' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'account', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 shadow-md bg-white border-t border-slate-100 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
      <div className="flex justify-around items-center h-[56px] px-2 relative">
      {navItems.map(item => {
         const isActive = currentView === item.id;
         return (
           <button 
             key={item.id} 
             onClick={() => setCurrentView(item.id)} 
             className="relative flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-90"
           >
             <div className={`flex flex-col items-center justify-center transition-all ${isActive ? 'text-[#0F2B5C]' : 'text-[#94A3B8]'}`}>
                <div className={`p-1.5 rounded-xl ${isActive ? 'bg-[#0F2B5C]/5' : ''}`}>
                   <item.icon className="w-[22px] h-[22px]" />
                </div>
                <span className={`text-[10px] mt-1 font-bold`}>{item.label}</span>
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
        <div className="bg-white border-b border-slate-200 pt-[calc(env(safe-area-inset-top,8px)+8px)] px-4 pb-3 shadow-sm relative z-40 shrink-0 w-full">
           <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 border border-slate-100">
                    <img src={appLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                 </div>
                 <h1 className="font-logo font-extrabold text-[15.5px] leading-tight text-[#0F2B5C] tracking-wide uppercase">TP<span className="text-[#38BDF8]">CAMBODIA</span></h1>
              </div>

              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => {
                      sessionStorage.removeItem('tp_is_guest');
                      setCurrentPage('gateway');
                   }} 
                   className="flex items-center justify-center p-1.5 text-[#0F2B5C] bg-slate-50 border border-slate-200 rounded-lg animate-pulse"
                 >
                    <ArrowLeft className="w-4.5 h-4.5" />
                 </button>

                 <div className="relative">
                     <button className="p-2 bg-slate-50 rounded-full active:scale-95 transition shadow-sm border border-slate-200" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-4.5 h-4.5 text-[#0F2B5C]" />
                        {notifications && notifications.length > 0 && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce"></span>}
                     </button>
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-[280px] bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in zoom-in-95 pointer-events-auto">
                          <div className="p-3 border-b border-slate-100 font-bold flex justify-between text-[11px] bg-slate-50 items-center text-[#0F2B5C]">
                            <span>ការជូនដំណឹង</span>
                            <button onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                          </div>
                          <div className="max-h-[50vh] overflow-y-auto">
                            {!notifications || notifications.length === 0 ? <p className="p-5 text-center text-[11px] text-slate-400 font-bold">គ្មានសារថ្មីទេ</p> : 
                              notifications.map(n => (
                                <div key={n.id} className="p-3 border-b border-slate-50 flex justify-between items-start gap-2 hover:bg-slate-50">
                                  <div className="flex-1">
                                    <p className={`text-[12px] font-black flex items-center gap-1 ${n.type === 'error' ? 'text-rose-500' : 'text-[#0F2B5C]'}`}>
                                        <Bell className="w-3.5 h-3.5"/> {safeStr(n.title)}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">{safeStr(n.msg)}</p>
                                  </div>
                                  <button onClick={async () => { if(db) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_notifications', n.id)).catch(()=>{}); } }} className="text-slate-400 hover:text-rose-500 shrink-0 p-1 rounded-full"><X className="w-3 h-3"/></button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col w-full">
              {currentView === 'home' && (
                  <form onSubmit={(e) => {
                     e.preventDefault();
                     document.activeElement?.blur(); 
                  }} className="relative w-full">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                       <Search className="w-4.5 h-4.5" />
                    </div>
                    <input 
                      type="search" 
                      placeholder="ស្វែងរកទីតាំង ឬសេវាកម្ម..." 
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none text-[14px] font-bold border border-slate-200 focus:border-[#38BDF8] focus:bg-white transition-all shadow-inner" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
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
     const combinedNames = safeStr(l.title);
     const safeDesc = safeStr(l.desc);
     const matchesSearch = combinedNames.toLowerCase().includes(searchQuery.toLowerCase()) || safeDesc.toLowerCase().includes(searchQuery.toLowerCase());
     if(activeHomeFilter === 'All') return matchesSearch;
     if(activeHomeFilter === 'រតនមណ្ឌល') return matchesSearch && l.district === 'រតនមណ្ឌល';
     if(activeHomeFilter === 'ផ្សេងៗ') return matchesSearch && l.district !== 'រតនមណ្ឌល';
     return matchesSearch;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pt-1 w-full flex-1">
      <div className="bg-[#0F2B5C] rounded-[16px] p-4 relative overflow-hidden flex flex-row items-center justify-between w-full min-h-[110px] shadow-md">
         <div className="absolute top-0 right-0 w-32 h-full bg-[#38BDF8]/10 rounded-l-[80px] z-0 pointer-events-none"></div>
         
         <div className="flex-1 z-10 pr-3">
             <h1 className="text-[14px] md:text-lg font-black text-white leading-tight mb-1 font-khmer">
                 ទិន្នន័យសំខាន់ៗ នៅទីនេះ!
             </h1>
             <p className="text-[12px] text-sky-200 mb-3 font-bold">
                 រហ័ស ងាយស្រួល និងជឿជាក់បាន ១០០%
             </p>
             <button onClick={()=>setCurrentView('data')} className="bg-[#38BDF8] text-[#0F2B5C] px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 hover:bg-sky-400">
                 ស្វែងយល់ <ArrowRight className="w-3.5 h-3.5"/>
             </button>
         </div>
         <div className="w-[70px] h-[70px] shrink-0 z-10 overflow-hidden rounded-full bg-white border-2 border-[#38BDF8] flex items-center justify-center p-0.5">
             <img src="ooop.png" alt="Banner" className="w-full h-full object-cover rounded-full" />
         </div>
      </div>

      <div>
         <div className="flex justify-between items-center mb-2.5 px-1 border-l-4 border-[#0F2B5C] pl-2">
            <h2 className="font-black text-[13px] text-slate-800 leading-none">ជម្រើសទីតាំង</h2>
         </div>
         <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`premium-card p-2.5 flex flex-col justify-center items-center transition-all ${activeHomeFilter==='រតនមណ្ឌល' ? 'border-[#0F2B5C] bg-[#0F2B5C] text-white' : 'text-[#0F2B5C] bg-white'}`}>
               <div className={`p-2 rounded-lg mb-1.5 ${activeHomeFilter==='រតនមណ្ឌល' ? 'bg-white/20 text-white' : 'bg-slate-50 text-[#0F2B5C]'}`}><MapSvgIcon /></div>
               <span className="font-black text-[12px]">រតនមណ្ឌល</span>
            </button>
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='ផ្សេងៗ'?'All':'ផ្សេងៗ')} className={`premium-card p-2.5 flex flex-col justify-center items-center transition-all ${activeHomeFilter==='ផ្សេងៗ' ? 'border-[#38BDF8] bg-[#38BDF8] text-[#0F2B5C]' : 'text-[#38BDF8] bg-white'}`}>
               <div className={`p-2 rounded-lg mb-1.5 ${activeHomeFilter==='ផ្សេងៗ' ? 'bg-white/40' : 'bg-slate-50'}`}><Globe className="w-5 h-5" /></div>
               <span className="font-black text-[12px]">ស្រុកផ្សេងៗ</span>
            </button>
         </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5 px-1 border-l-4 border-[#38BDF8] pl-2">
          <h2 className="text-[13px] font-black text-slate-800 leading-none">ទិន្នន័យដែលបានបញ្ចូល</h2>
          <button onClick={() => setCurrentView('data')} className="text-[11px] font-bold text-slate-600 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">មើលទាំងអស់ <ArrowRight className="w-3.5 h-3.5"/></button>
        </div>
        {filtered.length === 0 ? (
           <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200 font-bold text-[12px] text-slate-400 shadow-sm flex flex-col items-center">
             <MapPin className="w-8 h-8 mb-2 text-slate-300"/>
             គ្មានទិន្នន័យ
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
  
  const [form, setForm] = useState({ 
    title: '', 
    image: '', 
    coords: null, 
    mapUrl: '', 
    desc: '', 
    category: 'ឃុំ', 
    province: '', 
    district: '', 
    commune: '', 
    village: '',
    contacts: [{ name: '', phone: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  const filtered = (locations || []).filter(l => {
    if (!l) return false;
    const combinedNames = safeStr(l.title);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = combinedNames.toLowerCase().includes(searchLower) || safeStr(l.desc).toLowerCase().includes(searchLower);
    
    const isRatanak = l.district === 'រតនមណ្ឌល';
    if (activeTab === 'រតនមណ្ឌល' && !isRatanak) return false;
    if (activeTab === 'ស្រុកផ្សេងៗ' && isRatanak) return false;
    
    let matchesLevel = true;
    if (activeFilter === 'ឃុំ' && l.category !== 'ឃុំ') matchesLevel = false;
    if (activeFilter === 'ភូមិ' && l.category !== 'ភូមិ') matchesLevel = false;
    if (activeFilter === 'ប៉ូលីស' && l.category !== 'ប៉ូលិស') matchesLevel = false;
    if (activeFilter === 'ពេទ្យ' && l.category !== 'មន្ទីរពេទ្យ' && l.category !== 'ពេទ្យ') matchesLevel = false;
    if (activeFilter === 'សាលារៀន' && l.category !== 'សាលារៀន') matchesLevel = false;
    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    if (!isAdmin && (!profile?.username || profile?.username === 'ភ្ញៀវ')) {
       showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error');
       setCurrentView('account');
       return;
    }
    setForm({ 
      title: '', 
      image: '', 
      coords: null, 
      mapUrl: '', 
      desc: '', 
      category: 'ឃុំ', 
      province: '', 
      district: '', 
      commune: '', 
      village: '',
      contacts: [{ name: '', phone: '' }]
    });
    setIsAddModalOpen(true);
  };

  const setGPSForForm = () => {
      setIsFetchingGps(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  setForm(prev => ({
                     ...prev,
                     coords: coords,
                     mapUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
                  }));
                  setIsFetchingGps(false);
                  showToast('ចាប់កូអរដោនេ GPS និងបញ្ចូលជោគជ័យ', 'success');
              },
              () => {
                  setIsFetchingGps(false);
                  showToast('សូមបើក Location ឧបករណ៍របស់អ្នក', 'error');
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
      } else {
          setIsFetchingGps(false);
          showToast('ឧបករណ៍របស់អ្នកមិនគាំទ្រ GPS ទេ', 'error');
      }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('សូមបញ្ចូលចំណងជើង ឬឈ្មោះទីតាំង', 'error');
    if (!form.image) return showToast('សូមបញ្ចូលរូបភាព', 'error');
    
    const validContacts = form.contacts.filter(c => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      return showToast('សូមបញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទទំនាក់ទំនងយ៉ាងហោចណាស់ ១ ខ្សែ!', 'error');
    }

    setLoading(true);
    try {
      let submitData = { 
        ...form, 
        contacts: validContacts,
        role: validContacts[0].name, 
        phone: validContacts[0].phone, 
        author: profile?.username || 'Admin', 
        authorUid: user?.uid || 'guest_uid', 
        timestamp: Date.now() 
      };
      
      if (activeTab === 'រតនមណ្ឌល') {
         submitData.province = 'បាត់ដំបង';
         submitData.district = 'រតនមណ្ឌល';
      }
      
      if (!db) {
         showToast('រក្សាទុកក្នុងទិន្នន័យបណ្តោះអាសន្នជោគជ័យ (Offline)');
         setIsAddModalOpen(false);
         setLoading(false);
         return;
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_admin_data'), {
        ...submitData,
        status: isAdmin ? 'approved' : 'pending',
        likes: 0,
        timestamp: Date.now()
      }).catch(()=>{});
      
      if (isAdmin) {
        showToast('ទិន្នន័យត្រូវបានបញ្ចូលជោគជ័យ ✅');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
            targetId: user?.uid || 'guest_uid',
            title: 'សំណើរជោគជ័យ', 
            msg: `សំណើរដែលអ្នកបានផ្ញើរត្រូវបានបញ្ជូន ហើយកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin។`, 
            type: 'info', 
            timestamp: Date.now()
        }).catch(()=>{});
        showToast('សំណើររបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin', 'info');
      }
      setIsAddModalOpen(false);
    } catch (err) {
      showToast('បរាជ័យក្នុងការបញ្ជូន', 'error');
    }
    setLoading(false);
  };

  if ((!profile?.username || profile?.username === 'ភ្ញៀវ') && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center font-khmer">
         <div className="w-12 h-12 bg-slate-100 text-[#0F2B5C] rounded-full flex items-center justify-center mb-3"><User className="w-6 h-6" /></div>
         <h2 className="text-[14px] font-black mb-1.5 text-[#0F2B5C]">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 mb-4 text-[12px] max-w-sm font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះរបស់អ្នកសិន។ ភ្ញៀវមិនអាចបញ្ជូលទិន្នន័យបានទេ។</p>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-4 py-2 rounded-lg font-bold text-[12px]">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  const ratanakCommunes = dbRegions && dbRegions["រតនមណ្ឌល"] ? Object.keys(dbRegions["រតនមណ្ឌល"]) : [];
  const selectedCommuneVillages = form.commune && dbRegions && dbRegions["រតនមណ្ឌល"] && dbRegions["រតនមណ្ឌល"][form.commune] ? dbRegions["រតនមណ្ឌល"][form.commune] : [];

  return (
    <div className="space-y-3 mt-1 flex-1 font-khmer font-medium">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
         <h1 className="text-[14.5px] font-black px-1 text-[#0F2B5C] border-l-4 border-[#38BDF8] pl-2">ទិន្នន័យ</h1>
         <button onClick={handleOpenAdd} className="btn-gradient px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 text-[12px] w-full sm:w-auto justify-center"><Plus className="w-4 h-4"/> បន្ថែមទិន្នន័យ</button>
      </div>

      <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
         {['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 rounded-lg text-[13px] font-black transition-all ${activeTab === tab ? 'bg-slate-100 text-[#0F2B5C] shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{tab}</button>
         ))}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {['ទាំងអស់', 'ឃុំ', 'ភូមិ', 'ប៉ូលីស', 'ពេទ្យ', 'សាលារៀន'].map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border shadow-sm ${activeFilter === cat ? 'bg-[#0F2B5C] text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}>{cat}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
             <MapPin className="w-8 h-8 text-slate-300 mb-2" />
             <p className="font-bold text-[12px] text-slate-500">គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          filtered.map(loc => loc && (
            <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />
          ))
        )}
      </div>

      {/* Structured flex layout to guarantee submit button is visible on all viewport heights (Fixes photo_6253720894538715529_y.jpg) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm px-0 md:px-4 pointer-events-auto">
          <div className="relative w-full max-w-lg bg-white rounded-t-[20px] md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] border border-slate-200 animate-in slide-in-from-bottom duration-300">
            
            <form onSubmit={handleAddSubmit} className="flex flex-col max-h-[90dvh] w-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="text-[14px] font-black text-[#0F2B5C]">បន្ថែមទិន្នន័យ: {activeTab}</h2>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-full text-slate-500 hover:text-rose-500"><X className="w-4.5 h-4.5"/></button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 bg-white space-y-4 pb-20">
                <div>
                   <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wider">ចំណងជើង / ឈ្មោះទីតាំង *</label>
                   <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800" placeholder="ឈ្មោះទីតាំង..." />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ប្រភេទ Category *</label>
                  <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800">
                    <option value="ឃុំ">ឃុំ</option>
                    <option value="ភូមិ">ភូមិ</option>
                    <option value="ប៉ូលិស">ប៉ូលិស</option>
                    <option value="មន្ទីរពេទ្យ">ពេទ្យ</option>
                    <option value="សាលារៀន">សាលារៀន</option>
                    <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black text-slate-600 block uppercase">ព័ត៌មានទំនាក់ទំនង (Contacts) *</span>
                    <button 
                      type="button"
                      onClick={() => setForm({...form, contacts: [...form.contacts, { name: '', phone: '' }]})}
                      className="text-[10px] font-black text-[#0F2B5C] bg-white border border-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5"/> បន្ថែមខ្សែទូរស័ព្ទ
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.contacts.map((contact, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative space-y-2">
                        {form.contacts.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = [...form.contacts];
                              updated.splice(idx, 1);
                              setForm({...form, contacts: updated});
                            }}
                            className="absolute top-2.5 right-2.5 p-1 text-rose-500 bg-slate-50 rounded-full border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-0.5">ឈ្មោះ ឬ តួនាទី {idx + 1} *</label>
                          <input 
                            type="text" 
                            required 
                            value={contact.name} 
                            onChange={e => {
                              const updated = [...form.contacts];
                              updated[idx].name = e.target.value;
                              setForm({...form, contacts: updated});
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[13.5px] font-bold" 
                            placeholder="ឧ: លោក មេភូមិ..." 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-0.5">លេខទូរស័ព្ទ {idx + 1} *</label>
                          <input 
                            type="tel" 
                            required 
                            value={contact.phone} 
                            onChange={e => {
                              const updated = [...form.contacts];
                              updated[idx].phone = e.target.value;
                              setForm({...form, contacts: updated});
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[13.5px] font-bold" 
                            placeholder="ឧ: 012 345 678..." 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-inner space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5 border-b border-slate-200 pb-1.5 uppercase">កំណត់ទីតាំង</label>
                    {activeTab === 'រតនមណ្ឌល' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ឃុំ</label>
                                <select required value={form.commune} onChange={e=>setForm({...form, commune: e.target.value, village: ''})} className="w-full bg-white rounded-xl p-2 text-[14.5px] outline-none font-bold border border-slate-200">
                                    <option value="">ជ្រើសរើស</option>
                                    {ratanakCommunes.map(c=><option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ភូមិ</label>
                                <select required disabled={!form.commune} value={form.village} onChange={e=>setForm({...form, village: e.target.value})} className="w-full bg-white rounded-xl p-2 text-[14.5px] outline-none font-bold border border-slate-200 disabled:opacity-50">
                                    <option value="">ជ្រើសរើស</option>
                                    {selectedCommuneVillages.map(v=><option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" required value={form.province} onChange={e=>setForm({...form, province: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[13px] outline-none font-bold" placeholder="ខេត្ត..."/>
                            <input type="text" required value={form.district} onChange={e=>setForm({...form, district: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[13px] outline-none font-bold" placeholder="ស្រុក..."/>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">ទីតាំង (GPS)</label>
                    <button type="button" onClick={setGPSForForm} className={`w-full ${form.coords ? 'bg-[#0F2B5C]/10 text-[#0F2B5C] border-[#0F2B5C]/20' : 'bg-slate-100 text-slate-600 border-slate-300'} border-2 py-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 truncate px-2`}>
                       {isFetchingGps ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4 shrink-0"/>}
                       {isFetchingGps ? 'កំពុងចាប់ទីតាំង...' : form.coords ? '✓ ចាប់បានទីតាំងជោគជ័យ' : 'ចុចដើម្បីទាញយក GPS'}
                    </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">រូបភាព (Upload Picture) *</label>
                  <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 overflow-hidden">
                     {form.image ? (
                        <React.Fragment>
                           <img src={form.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                              <span className="text-slate-800 font-bold bg-white/95 px-2.5 py-1.5 rounded-xl text-[11px] flex gap-1 items-center pointer-events-auto">
                                 <Edit3 className="w-3.5 h-3.5"/> ប្តូររូបភាព
                              </span>
                           </div>
                        </React.Fragment>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 z-10">
                           <ImageSvgIcon className="mb-1" />
                           <span className="text-[11px] font-bold text-slate-500">ចុចដើម្បី Upload រូបភាព</span>
                        </div>
                     )}
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                       onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                             const r = new FileReader();
                             r.onload = () => setForm(prev => ({ ...prev, image: r.result }));
                             r.readAsDataURL(e.target.files[0]);
                          }
                       }} 
                     />
                  </label>
                </div>
                
                <div>
                   <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">ការពណ៌នា</label>
                   <textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="សរសេរការពណ៌នាខ្លីៗ..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[14.5px] outline-none h-20 resize-none font-medium text-slate-800"></textarea>
                </div>
              </div>

              {/* Submitting button structured as a safe-area responsive sticky footer (Solves photo_6253720894538715529_y.jpg) */}
              <div className="p-3 border-t border-slate-100 shrink-0 pb-safe bg-slate-50 sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                 <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-black btn-gradient disabled:opacity-50 text-[13.5px] flex justify-center items-center gap-1.5 shadow-md">
                     {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> កំពុងផ្ញើរ...</> : isAdmin ? '✓ បញ្ចូលទិន្នន័យ (Auto Approve)' : '📤 ផ្ញើរសំណើរទៅកាន់ Admin'}
                 </button>
              </div>
            </form>

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
    { label: 'អ្នកប្រើប្រាស់សសរុប', count: totalUsers, color: 'text-slate-800', desc: 'សរុបតាំងពីដើម' },
    { label: 'អ្នកប្រើប្រាស់ (ខែនេះ)', count: usersThisMonth, color: 'text-sky-500', desc: `ក្នុងខែទី ${currentMonth + 1}` },
    { label: 'អ្នកប្រើប្រាស់ (ឆ្នាំនេះ)', count: usersThisYear, color: 'text-indigo-600', desc: `ក្នុងឆ្នាំ ${currentYear}` },
    { label: 'ទីតាំងសរុប', count: (locations || []).length, color: 'text-slate-800', desc: 'សរុបតាំងពីដើម' },
    { label: 'ទីតាំងបញ្ចូល (ខែនេះ)', count: locsThisMonth, color: 'text-[#10b981]', desc: `ក្នុងខែទី ${currentMonth + 1}` },
    { label: 'ទីតាំងបញ្ចូល (ឆ្នាំនេះ)', count: locsThisYear, color: 'text-rose-500', desc: `ក្នុងឆ្នាំ ${currentYear}` },
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
    <div className="space-y-4 pt-1 w-full flex-1 font-khmer flex flex-col h-full">
      <h1 className="text-[13px] md:text-[15px] font-black text-[#0F2B5C] border-l-4 border-[#0F2B5C] pl-2">របាយការណ៍ទិន្នន័យជាក់ស្ដែង</h1>
      
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col justify-between min-h-[75px]">
              <p className="text-[10px] md:text-[11px] font-bold text-slate-500 leading-normal mb-1">{s.label}</p>
              <h3 className="text-xl md:text-2xl font-black mt-auto">{s.count}</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">{s.desc}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 flex-1">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-[11.5px] md:text-[12px] font-bold text-slate-800 mb-3 border-l-2 border-[#38BDF8] pl-2">កំណើនអ្នកប្រើប្រាស់ប្រចាំឆ្នាំ</h3>
           <div className="flex-1 min-h-[160px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontFamily: 'Noto Sans Khmer'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                   <Tooltip cursor={false} contentStyle={{fontSize: '11px', borderRadius: '8px'}} />
                   <Bar dataKey="users" fill="#38BDF8" radius={[2,2,0,0]} barSize={12} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-[11.5px] md:text-[12px] font-bold text-slate-800 mb-3 border-l-2 border-[#0F2B5C] pl-2">ស្ថិតិទីតាំងដែលបានបញ្ចូល</h3>
           <div className="flex-1 min-h-[160px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontFamily: 'Noto Sans Khmer'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                   <Tooltip contentStyle={{fontSize: '11px', borderRadius: '8px'}} />
                   <Line type="monotone" dataKey="entries" stroke="#0F2B5C" strokeWidth={2} dot={{r: 3, fill: '#0F2B5C'}} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

const base64ToBlobUrl = (base64Data, mimeType = 'audio/webm') => {
  try {
    const splitData = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const byteCharacters = atob(splitData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    return base64Data;
  }
};

const TelegramVoiceBubble = ({ audioUrl, durationSec = 10, durationStr = '0:10', messageId, activeAudioId, setActiveAudioId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const localBlobUrl = useMemo(() => {
    if (audioUrl && audioUrl.startsWith('data:')) {
      return base64ToBlobUrl(audioUrl);
    }
    return audioUrl;
  }, [audioUrl]);

  const waveformHeights = [4, 6, 12, 8, 14, 18, 10, 16, 20, 12, 14, 8, 10, 16, 22, 12, 8, 14, 10, 16, 8, 12, 6, 4];

  useEffect(() => {
    if (activeAudioId !== messageId && isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [activeAudioId, messageId, isPlaying]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setActiveAudioId(messageId);
        audioRef.current.playbackRate = 1.0; 
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } catch (err) {}
  };

  const handleTimelineClick = (e) => {
    if (!audioRef.current || !durationSec) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const widthPercentage = clickX / rect.width;
    const targetTime = widthPercentage * durationSec;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const currentProgressPercent = durationSec > 0 ? (currentTime / durationSec) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 bg-[#EBF2FC] text-slate-800 p-2.5 rounded-xl min-w-[180px] border border-blue-100 shadow-sm select-none font-khmer">
      <audio 
        ref={audioRef} 
        src={localBlobUrl} 
        preload="auto"
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (activeAudioId === messageId) setActiveAudioId(null);
        }}
        className="hidden"
      />

      <button 
        type="button" 
        onClick={togglePlayback}
        className="w-8 h-8 rounded-full bg-[#0F2B5C] text-white flex items-center justify-center shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current text-sky-300"/> : <Play className="w-4 h-4 fill-current text-sky-300 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-between pt-0.5">
        <div 
          className="flex items-end gap-[2px] h-[20px] cursor-pointer" 
          onClick={handleTimelineClick}
        >
          {waveformHeights.map((h, index) => {
            const barProgressPoint = (index / waveformHeights.length) * 100;
            const isPlayed = currentProgressPercent >= barProgressPoint;
            return (
              <div 
                key={index} 
                className="audio-waveform-bar" 
                style={{
                  height: `${h * 0.7}px`,
                  backgroundColor: isPlayed ? '#0F2B5C' : '#94A3B8'
                }} 
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] font-bold text-slate-500">
            {isPlaying 
              ? `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}` 
              : durationStr
            }
          </span>
        </div>
      </div>
    </div>
  );
};

const ImageModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-md flex justify-center items-center p-0">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-10">
        <button onClick={onClose} className="text-white bg-white/20 p-2 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>
      <img src={imageUrl} alt="fullscreen" className="max-w-full max-h-[100dvh] object-contain" />
    </div>
  );
};

const ChatView = ({ chats = [], user, profile, showToast, db, appId, setCurrentView, isAdmin, chatTargets = [], myContacts = [], dbRegions, gpsStatus, captureGps, gpsCoords, usersList = [], activeChatUser, setActiveChatUser }) => {
  const [msgText, setMsgText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [localFilterActive, setLocalFilterActive] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  
  const fileInputRef = useRef(null);
  const [activeAudioId, setActiveAudioId] = useState(null);

  const [recordingState, setRecordingState] = useState('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const recordTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const [pulseWaves, setPulseWaves] = useState(Array(15).fill(4));
  const pulseIntervalRef = useRef(null);

  const [selectedActionMsg, setSelectedActionMsg] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
      if (scrollContainerRef.current) {
         scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
  }, [chats, activeChatUser, recordingState]);

  const handleSend = async () => {
    if (!profile?.username || profile?.username === 'ភ្ញៀវ') {
       showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error');
       setCurrentView('account');
       return;
    }
    if (!msgText.trim()) return;
    
    const userMessage = msgText;
    setMsgText('');

    if (containsAbuse(userMessage)) {
       showToast('ពាក្យសម្តីមិនសមរម្យត្រូវបានរកឃើញ! គណនីត្រូវបានផ្ញើជូន Admin ពិនិត្យ', 'error');
       
       if (db) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), { warnings: increment(1) }).catch(()=>{});
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
             targetId: user.uid,
             title: 'ការព្រមានការប្រើប្រាស់ពាក្យសំដី ⚠️',
             msg: 'អ្នកបានប្រើប្រាស់ពាក្យពេចន៍មិនសមរម្យ។',
             type: 'error',
             timestamp: Date.now()
          }).catch(()=>{});
          if ((profile.warnings || 0) >= 1) {
             await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), { isBanned: true }).catch(()=>{});
          }
       }
       return;
    }

    if (!db) return showToast('បច្ចុប្បន្នកំពុងស្ថិតក្នុង Offline Sandbox', 'info');

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
      text: userMessage, 
      msgType: 'text',
      target: activeChatUser?.id, 
      userId: user?.uid || 'guest_uid', 
      userName: profile?.username, 
      seen: true,
      edited: false,
      timestamp: Date.now()
    }).catch(()=>{});
  };

  const startRecordingService = async (e) => {
    if (e && e.cancelable) e.preventDefault();

    if (!profile?.username || profile?.username === 'ភ្ញៀវ') {
       showToast('សូមកំណត់ឈ្មោះគណនីសិន', 'error');
       setCurrentView('account');
       return;
    }

    setRecordingState('recording');
    setRecordDuration(0);
    audioChunksRef.current = [];

    pulseIntervalRef.current = setInterval(() => {
      setPulseWaves(prev => prev.map(() => Math.floor(Math.random() * 20) + 4));
    }, 100);

    recordTimerRef.current = setInterval(() => {
      setRecordDuration(prev => prev + 1);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      recordingStreamRef.current = stream;

      let chosenMime = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(chosenMime)) chosenMime = 'audio/ogg;codecs=opus';
      if (!MediaRecorder.isTypeSupported(chosenMime)) chosenMime = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(chosenMime)) chosenMime = '';

      const options = chosenMime ? { mimeType: chosenMime } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(recordTimerRef.current);
        clearInterval(pulseIntervalRef.current);

        const collectedDuration = recordDuration;
        if (collectedDuration < 1) {
          cleanRecordingStreams();
          return;
        }

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: chosenMime || 'audio/wav' });
          if (!db) {
            showToast('មិនអាចផ្ញើក្នុង Offline Sandbox ទេ');
            cleanRecordingStreams();
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            const finalAudioUrl = reader.result;
            const durationString = `${Math.floor(collectedDuration / 60)}:${(collectedDuration % 60).toString().padStart(2, '0')}`;
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
              text: '',
              msgType: 'audio',
              durationSec: collectedDuration,
              duration: durationString,
              audioUrl: finalAudioUrl,
              target: activeChatUser?.id,
              userId: user?.uid || 'guest_uid',
              userName: profile?.username,
              seen: true,
              timestamp: Date.now()
            });
          };
          reader.readAsDataURL(audioBlob);

        } catch (err) {
          showToast('មានបញ្ហាក្នុងការផ្ញើសារសំឡេង', 'error');
        }
        cleanRecordingStreams();
      };

      recorder.start();
    } catch (err) {
      showToast('សូមអនុញ្ញាតសិទ្ធិប្រើប្រាស់ Microphone', 'error');
      cleanRecordingStreams();
    }
  };

  const cleanRecordingStreams = () => {
    setRecordingState('idle');
    clearInterval(recordTimerRef.current);
    clearInterval(pulseIntervalRef.current);
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
    }
    recordingStreamRef.current = null;
    mediaRecorderRef.current = null;
  };

  const stopAndCleanRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanRecordingStreams();
    }
  };

  const handleSendLocation = () => {
      setShowAttachMenu(false);
      if (!gpsCoords) {
         showToast('សូមចុចបើកចាប់យក GPS ឧបករណ៍របស់អ្នកជាមុនសិន!', 'error');
         captureGps();
         return;
      }
      if (!db) return showToast('មិនអាចផ្ញើទីតាំងបានទេក្នុង Sandbox Mode', 'info');
      addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
         msgType: 'location',
         senderCoords: { lat: gpsCoords.lat, lng: gpsCoords.lng },
         mapUrl: `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`,
         targetName: activeChatUser?.label || 'គោលដៅ',
         target: activeChatUser?.id,
         userId: user?.uid || 'guest_uid',
         userName: profile?.username,
         seen: true,
         timestamp: Date.now()
      }).then(() => showToast('ផ្ញើទីតាំងជោគជ័យ', 'success')).catch(()=>{});
  };

  const handleFileChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
         if (!db) return showToast('មិនអាចផ្ញើឯកសារក្នុង Sandbox Mode បានទេ', 'info');
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
            text: '',
            msgType: 'image',
            imageUrl: event.target.result,
            target: activeChatUser?.id,
            userId: user?.uid || 'guest_uid',
            userName: profile?.username,
            seen: true,
            timestamp: Date.now()
         }).catch(()=>{});
         showToast('ផ្ញើររូបភាពជោគជ័យ');
         setShowAttachMenu(false);
     };
     reader.readAsDataURL(file);
  };

  const deleteMessage = async (msgId) => {
      setSelectedActionMsg(null);
      if (db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', msgId)).catch(()=>{});
  };

  const startEditMessage = (msg) => {
     setSelectedActionMsg(null);
     setEditingMsg(msg);
     setEditInput(msg.text);
  };

  const saveEditedMessage = async () => {
     if (!editInput.trim()) return showToast('អត្ថបទមិនអាចទទេរបានទេ', 'error');
     if (db && editingMsg) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', editingMsg.id), {
           text: editInput.trim(),
           edited: true
        }).catch(()=>{});
     }
     setEditingMsg(null);
     setEditInput('');
  };

  const handleConnectPrivateUser = async (targetUser) => {
     if (!db || !user) return;
     try {
       await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'contacts', targetUser.id), {
          id: targetUser.id,
          label: targetUser.username,
          avatar: targetUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          timestamp: Date.now()
       });
       showToast(`បានភ្ជាប់ទំនាក់ទំនងជាមួយ ${targetUser.username} ជោគជ័យ!`);
       setShowUserSearch(false);
       setActiveChatUser({ id: targetUser.id, label: targetUser.username, avatar: targetUser.avatar });
     } catch (err) {
       showToast('មានបញ្ហាក្នុងការភ្ជាប់ទំនាក់ទំនង', 'error');
     }
  };

  if (!profile?.username || profile?.username === 'ភ្ញៀវ') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center flex-1 font-khmer">
         <div className="w-12 h-12 bg-slate-100 text-[#0F2B5C] rounded-full flex items-center justify-center mb-3"><MessageCircle className="w-6 h-6" /></div>
         <h2 className="text-[14px] font-black mb-1.5 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-[12px] mb-4 max-w-xs font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះ មុននឹងប្រើប្រាស់សេវាកម្មរាយការណ៍។</p>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-4 py-2 rounded-lg font-bold text-[12px]">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  if (!activeChatUser) {
     const availableDistricts = ['រតនមណ្ឌល', ...new Set(chatTargets.map(t => t.district).filter(d => d && d !== 'រតនមណ្ឌល'))];
     const communeList = selectedDistrict && dbRegions?.[selectedDistrict] ? Object.keys(dbRegions[selectedDistrict]) : [];
     const villageList = selectedDistrict && selectedCommune && dbRegions?.[selectedDistrict]?.[selectedCommune] ? dbRegions[selectedDistrict][selectedCommune] : [];

     const mergedContacts = (() => {
         const map = new Map();
         chatTargets.forEach(t => map.set(t.id, { ...t, isPrivate: false }));
         myContacts.forEach(c => map.set(c.id, { ...c, isPrivate: true, role: 'មិត្តភក្តិ', district: 'ឯកជន' }));
         return Array.from(map.values());
     })();

     const filteredContacts = mergedContacts.filter(t => {
         if (!t) return false;
         if (t.isDefault) return true;
         if (localFilterActive) {
            if (selectedDistrict && t.district !== selectedDistrict) return false;
            if (selectedCommune && t.commune && t.commune !== selectedCommune) return false;
            if (selectedVillage && t.village && t.village !== selectedVillage) return false;
            return true;
         }
         return true;
     });

     const registeredUsersToShow = (usersList || []).filter(u => u && u.username && u.username !== 'ភ្ញៀវ' && u.id !== user?.uid);

     return (
        <div className="flex flex-col h-full bg-white md:rounded-xl md:border md:border-slate-200 overflow-hidden w-full flex-1 font-khmer animate-in fade-in duration-300 pb-[85px] md:pb-0">
           <div className="p-3.5 border-b border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
               <div>
                  <h1 className="text-[14px] font-black text-[#0F2B5C] flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#38BDF8]"/> ទំនាក់ទំនងឆាត</h1>
                  <p className="text-[11px] text-slate-500 font-bold mt-1 leading-relaxed">ជ្រើសរើសស្ថាប័ន ឬមិត្តភក្តិដែលអ្នកចង់ឆាតឯកជនជាមួយ។</p>
               </div>
               
               <div className="flex gap-1.5">
                   <button 
                      onClick={() => { setShowUserSearch(!showUserSearch); setLocalFilterActive(false); }} 
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-black transition-all ${showUserSearch ? 'bg-[#0F2B5C] border-[#0F2B5C] text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                   >
                      <Plus className="w-3.5 h-3.5" /> Add មិត្ត
                   </button>
                   <button 
                      onClick={() => { setLocalFilterActive(!localFilterActive); setShowUserSearch(false); }} 
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-black transition-all ${localFilterActive ? 'bg-[#0F2B5C] border-[#0F2B5C] text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                   >
                      <Radio className="w-3 h-3" /> ក្នុងមូលដ្ឋាន
                   </button>
               </div>
           </div>
           
           {showUserSearch && (
              <div className="bg-slate-50 p-3 border-b border-slate-200 shrink-0 animate-in slide-in-from-top-2">
                  <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                          type="text" 
                          placeholder="ស្វែងរកឈ្មោះសមាជិក..." 
                          value={userSearchTerm}
                          onChange={e => setUserSearchTerm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-[13px] font-bold outline-none"
                      />
                  </div>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto hide-scrollbar pb-1">
                      {registeredUsersToShow.filter(u => u.username?.toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 ? (
                          <p className="text-center text-[10px] text-slate-400 font-bold py-2">គ្មានគណនីដែលត្រូវស្វែងរកទេ</p>
                      ) : (
                          registeredUsersToShow.filter(u => u.username?.toLowerCase().includes(userSearchTerm.toLowerCase())).map(u => {
                              const isOnline = (Date.now() - (u.lastActive || 0)) < 120000;
                              return (
                                <div key={u.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                           <img src={u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full border border-slate-200 object-cover" alt="av" />
                                           <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        </div>
                                        <div>
                                           <span className="font-bold text-[12px] text-[#0F2B5C] block">{safeStr(u.username)}</span>
                                           <span className="text-[9px] font-bold text-slate-400">{isOnline ? 'Online 🟢' : 'មិន Online ⚪'}</span>
                                        </div>
                                    </div>
                                    <button 
                                       onClick={() => handleConnectPrivateUser(u)} 
                                       className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
                                    >
                                       ភ្ជាប់ទំនាក់ទំនង
                                    </button>
                                </div>
                              );
                          })
                      )}
                  </div>
              </div>
           )}

           {localFilterActive && (
              <div className="bg-slate-50 p-3 border-b border-slate-200 grid grid-cols-3 gap-2 shrink-0 animate-in slide-in-from-top-2">
                  <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ស្រុក</label>
                     <select value={selectedDistrict} onChange={e=>{ setSelectedDistrict(e.target.value); setSelectedCommune(''); setSelectedVillage(''); }} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold outline-none">
                         <option value="">ទាំងអស់</option>
                         {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ឃុំ</label>
                     <select value={selectedCommune} onChange={e=>{ setSelectedCommune(e.target.value); setSelectedVillage(''); }} disabled={!selectedDistrict} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold outline-none disabled:opacity-50">
                         <option value="">ទាំងអស់</option>
                         {communeList.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ភូមិ</label>
                     <select value={selectedVillage} onChange={e=>setSelectedVillage(e.target.value)} disabled={!selectedCommune} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold outline-none disabled:opacity-50">
                         <option value="">ទាំងអស់</option>
                         {villageList.map(v => <option key={v} value={v}>{v}</option>
                         )}
                     </select>
                  </div>
              </div>
           )}

           <div className="flex-1 overflow-y-auto p-3 hide-scrollbar bg-white">
              <div className="text-slate-400 text-[10px] font-bold mb-2 pl-1 uppercase tracking-wider">បញ្ជីទំនាក់ទំនង៖</div>
              {filteredContacts.map((contact, i) => {
                  if (!contact) return null;
                  const isOnline = (usersList || []).some(u => u.id === contact.id && (Date.now() - (u.lastActive || 0)) < 120000);
                  
                  return (
                    <div 
                       key={contact.id || i} 
                       onClick={() => setActiveChatUser(contact)}
                       className="flex items-center justify-between p-3 hover:bg-slate-50 bg-white rounded-xl cursor-pointer transition-all active:scale-[0.99] border border-slate-200 mb-2 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                               <img src={contact.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
                               <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            </div>
                            <div>
                                <h3 className="font-black text-[13px] leading-tight text-slate-800">{safeStr(contact.label)}</h3>
                                <div className="flex gap-1.5 items-center mt-1">
                                  <span className="text-[9px] text-white font-bold bg-[#0F2B5C] px-1.5 py-0.5 rounded shadow-sm">
                                     {contact.isPrivate ? 'មិត្តឯកជន' : 'ស្ថាប័ន'}
                                  </span>
                                  <span className="text-[9.5px] text-slate-400 font-bold">{isOnline ? 'Online' : 'offline'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 group-hover:bg-[#0F2B5C] group-hover:text-white transition-colors"><ArrowRight className="w-3.5 h-3.5"/></div>
                    </div>
                  );
              })}
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
    <div 
      className="flex flex-col flex-1 h-full min-h-0 bg-[#f1f5f9] md:bg-white md:rounded-xl md:border md:border-slate-200 overflow-hidden relative w-full font-khmer animate-in slide-in-from-right-5 duration-300 pb-0"
      onClick={()=>setShowAttachMenu(false)}
    >
      <ImageModal imageUrl={fullscreenImage} onClose={() => setFullscreenImage(null)} />

      {selectedActionMsg && (
         <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-56 overflow-hidden border border-slate-200 select-none">
               {selectedActionMsg.msgType === 'text' && (
                 <>
                 <button onClick={() => {
                     navigator.clipboard.writeText(selectedActionMsg.text);
                     setSelectedActionMsg(null);
                     showToast('បានចម្លង (Copied)');
                 }} className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-slate-50 border-b border-slate-100 text-[13px] font-bold text-slate-700 transition-colors">
                    <Copy className="w-4 h-4 text-slate-500" /> ចម្លងអត្ថបទ
                 </button>
                 <button onClick={() => startEditMessage(selectedActionMsg)} className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-slate-50 border-b border-slate-100 text-[13px] font-bold text-slate-700 transition-colors">
                    <Edit3 className="w-4 h-4 text-sky-500" /> កែប្រែ (Edit)
                 </button>
                 </>
               )}
               <button onClick={() => deleteMessage(selectedActionMsg.id)} className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-rose-50 text-[13px] font-bold text-rose-600 transition-colors">
                  <Trash2 className="w-4 h-4" /> លុបចោល (Delete)
               </button>
               <div className="bg-slate-50 p-1.5 flex justify-center border-t border-slate-100">
                  <button onClick={() => setSelectedActionMsg(null)} className="w-full py-2 text-[12px] font-bold text-slate-500 rounded-lg hover:bg-slate-200">បិទ</button>
               </div>
            </div>
         </div>
      )}

      {editingMsg && (
         <div className="absolute bottom-[70px] left-0 right-0 z-40 bg-white p-3 border-t border-slate-200 shadow-md rounded-t-2xl">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[12px] font-black text-sky-500 flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded"><Edit3 className="w-3 h-3"/> កំពុងកែប្រែសារ</span>
               <button onClick={() => {setEditingMsg(null); setEditInput('');}} className="p-1 bg-slate-100 rounded-full"><X className="w-3.5 h-3.5"/></button>
            </div>
            <div className="flex gap-2">
               <input 
                  type="text" 
                  value={editInput} 
                  onChange={e => setEditInput(e.target.value)} 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[15px] font-medium"
                  autoFocus
               />
               <button onClick={saveEditedMessage} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-3 py-2 text-[13px] font-black flex items-center gap-1">
                  <Check className="w-3.5 h-3.5"/> Save
               </button>
            </div>
         </div>
      )}

      <div className="p-2.5 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center gap-2.5 shrink-0 z-30 shadow-sm pt-safe">
        <button onClick={() => setActiveChatUser(null)} className="p-1.5 bg-slate-50 rounded-full border border-slate-200"><ArrowLeft className="w-4.5 h-4.5 text-slate-600"/></button>
        <div className="relative">
           <img src={activeChatUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
           <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500 animate-pulse"></div>
        </div>
        <div className="min-w-0 flex-1">
            <h2 className="font-black text-[13.5px] text-slate-800 truncate">{safeStr(activeChatUser.label)}</h2>
            <p className="text-[10px] font-bold text-emerald-500 mt-0.5">Online • ឆ្លើយតបរហ័ស</p>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3.5 telegram-bg hide-scrollbar scroll-smooth">
        {filteredChats.length === 0 ? (
          <div className="flex justify-center mt-4">
             <div className="text-center text-slate-500 py-2 px-4 text-[11px] font-bold bg-white/80 rounded-xl border border-slate-200 shadow-sm">
               ចាប់ផ្តើមការសន្ទនា...
             </div>
          </div>
        ) : (
          filteredChats.map(msg => {
            if (!msg) return null;
            const isMe = isAdmin ? msg.target === activeChatUser?.id : msg.userId === user?.uid;
            
            let msgContent;
            if (msg.msgType === 'location') {
               msgContent = (
                  <div className="flex flex-col gap-2 p-0.5 text-slate-800 min-w-[200px]">
                     <LocationRouteMap senderCoords={msg.senderCoords} receiverCoords={gpsCoords} />
                     <a href={msg.mapUrl} target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-emerald-600 text-white text-[11px] font-bold rounded-lg block active:scale-95 transition-transform">🗺️ បើកផែនទី Google Maps</a>
                  </div>
               );
            } else if (msg.msgType === 'image') {
               msgContent = (
                  <img 
                     src={msg.imageUrl} 
                     alt="attached" 
                     className="max-w-[120px] rounded-lg shadow-sm cursor-pointer"
                     onClick={(e) => { e.stopPropagation(); setFullscreenImage(msg.imageUrl); }}
                  />
               );
            } else if (msg.msgType === 'audio') {
               msgContent = (
                  <TelegramVoiceBubble 
                    audioUrl={msg.audioUrl} 
                    durationSec={msg.durationSec || 10} 
                    durationStr={msg.duration || '0:10'} 
                    messageId={msg.id}
                    activeAudioId={activeAudioId}
                    setActiveAudioId={setActiveAudioId}
                  />
               );
            } else {
               msgContent = <div className={`break-words text-[14px] leading-relaxed font-medium ${isMe ? 'text-white' : 'text-slate-800'}`}>{safeStr(msg.text)}</div>;
            }

            return (
              <div 
                 key={msg.id} 
                 className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative animate-in fade-in`}
              >
                <div className={`flex max-w-[85%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-black text-slate-500 ml-1.5 flex items-center bg-white/50 px-1.5 py-0.5 rounded-full">
                      {safeStr(msg.userName)}
                  </span>}
                  
                  <div className="flex items-end gap-1 relative">
                      <div 
                         className={`px-3 py-2.5 rounded-xl text-[14px] shadow-sm border relative cursor-pointer select-none ${
                            isMe 
                              ? 'bg-[#0F2B5C] border-[#0F2B5C] rounded-br-sm text-white' 
                              : 'bg-white text-slate-800 rounded-bl-sm border-slate-200'
                          }`}
                         onDoubleClick={(e) => {
                            e.preventDefault();
                            if (isAdmin || msg.userId === user?.uid) {
                               setSelectedActionMsg(msg);
                            }
                         }}
                      >
                         {msgContent}
                         <div className={`flex items-center justify-end gap-1 mt-1 opacity-80 text-[9px] font-bold self-end ${isMe ? 'text-sky-200' : 'text-slate-400'}`}>
                            {msg.edited && <span className="italic mr-1">edited</span>}
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && <CheckCheck className="w-2.5 h-2.5 ml-0.5 text-sky-300" />}
                         </div>
                      </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 bg-white border-t border-slate-200 shrink-0 z-30 shadow-md pb-[max(env(safe-area-inset-bottom),8px)] relative w-full" onClick={e=>e.stopPropagation()}>
        {showAttachMenu && (
           <div className="absolute bottom-[65px] left-3 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 flex flex-col w-40 animate-in slide-in-from-bottom-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <button type="button" onClick={()=>fileInputRef.current?.click()} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-[12px] font-bold text-[#0F2B5C] text-left"><ImageSvgIcon className="text-[#38BDF8]"/> ផ្ញើររូបភាព</button>
              <button type="button" onClick={handleSendLocation} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-[12px] font-bold text-[#0F2B5C] text-left border-t border-slate-100"><MapPin className="w-4 h-4 text-rose-500"/> ផ្ញើទីតាំង (GPS)</button>
           </div>
        )}

        {recordingState !== 'idle' ? (
           <div className="w-full flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                 <span className="text-[13px] font-black text-rose-600">
                   {`0:${recordDuration.toString().padStart(2, '0')}`}
                 </span>
              </div>

              <div className="flex items-end gap-[2px] h-[16px] px-2 flex-1 justify-center max-w-[120px]">
                 {pulseWaves.map((h, i) => (
                    <div 
                      key={i} 
                      className="w-[2px] bg-rose-500 rounded-full transition-all duration-100" 
                      style={{ height: `${h * 0.6}px` }} 
                    />
                 ))}
              </div>

              <button 
                type="button" 
                onClick={stopAndCleanRecorder} 
                className="bg-rose-500 text-white rounded-lg px-2 py-1 text-[11px] font-bold active:scale-95"
              >
                ផ្ញើ (Send)
              </button>
           </div>
        ) : (
           <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2 w-full">
              <button type="button" onClick={(e)=>{ e.stopPropagation(); setShowAttachMenu(!showAttachMenu); }} className={`p-3 rounded-full transition active:scale-95 shrink-0 ${showAttachMenu ? 'bg-[#0F2B5C] text-white shadow-md' : 'text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}><Plus className="w-5 h-5"/></button>
              
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-3">
                 <input 
                   type="text" 
                   value={msgText} 
                   onChange={(e) => setMsgText(e.target.value)} 
                   placeholder="សរសេរសារ..." 
                   className="w-full bg-transparent py-2.5 text-[16px] font-medium outline-none text-slate-800" 
                 />
              </div>
              
              {msgText.trim() ? (
                  <button type="submit" className="w-11 h-11 rounded-full btn-gradient flex items-center justify-center shrink-0 shadow-md">
                     <Send className="w-4.5 h-4.5 ml-0.5 text-white" />
                  </button>
              ) : (
                  <button 
                    type="button" 
                    onMouseDown={startRecordingService}
                    onTouchStart={startRecordingService}
                    onMouseUp={stopAndCleanRecorder}
                    onTouchEnd={stopAndCleanRecorder}
                    className="w-11 h-11 rounded-full bg-sky-50 text-[#38BDF8] border border-sky-100 flex items-center justify-center shrink-0 shadow-sm active:scale-95"
                  >
                     <Mic className="w-5 h-5" />
                  </button>
              )}
           </form>
        )}
      </div>
    </div>
  );
};

const AccountView = ({ user, profile, db, appId, showToast, setCurrentPage, isAdmin, setIsAdmin, setCurrentView }) => {
  const [pwdInput, setPwdInput] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [localName, setLocalName] = useState(profile?.username || '');
  const [isEditingName, setIsEditingName] = useState(!profile?.username || profile?.username === 'ភ្ញៀវ' ? true : false);

  const [lockoutTime, setLockoutTime] = useState(Number(localStorage.getItem('admin_lockout')) || 0);
  const [attempts, setAttempts] = useState(Number(localStorage.getItem('admin_attempts')) || 0);

  useEffect(() => {
     if (lockoutTime > 0) {
        const interval = setInterval(() => {
           if (Date.now() > lockoutTime) {
               setLockoutTime(0);
               setAttempts(0);
               localStorage.removeItem('admin_lockout');
               localStorage.removeItem('admin_attempts');
           }
        }, 1000);
        return () => clearInterval(interval);
     }
  }, [lockoutTime]);

  const handleAdminLogin = async () => {
    if (Date.now() < lockoutTime) return showToast('គណនីរបស់អ្នកត្រូវបានផ្អាកបណ្តោះអាសន្ន។ សូមរង់ចាំ។', 'error', 5000);
    if (!pwdInput.trim()) return showToast('សូមបញ្ចូលលេខសម្ងាត់', 'error');

    setIsLoginLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const isValid = await verifyAdminPassword(pwdInput);
      if (isValid) {
         setIsAdmin(true);
         showToast('ចូលប្រើជា Admin ជោគជ័យ');
         setShowAdminLogin(false);
         setPwdInput('');
         setAttempts(0);
         localStorage.removeItem('admin_attempts');
         setCurrentView('admin');
      } else {
         throw new Error("Invalid Auth");
      }
    } catch (err) {
       const newAttempts = attempts + 1;
       setAttempts(newAttempts);
       localStorage.setItem('admin_attempts', newAttempts);
       
       if (db) {
          const ip = await getClientIP();
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), {
             type: 'Failed Admin Login',
             username: profile?.username || 'Unknown',
             ip: ip,
             device: getDeviceInfo(),
             timestamp: Date.now()
          }).catch(()=>{});
       }

       if (newAttempts >= 5) {
          const newLockout = Date.now() + 15 * 60 * 1000;
          setLockoutTime(newLockout);
          localStorage.setItem('admin_lockout', newLockout);
          showToast('ព្យាយាមច្រើនដងពេក! សូមរង់ចាំ ១៥ នាទី។', 'error');
       } else {
          showToast('លេខសម្ងាត់មិនត្រឹមត្រូវ', 'error');
       }
       setPwdInput('');
    } finally {
       setIsLoginLoading(false);
    }
  };

  const handleSaveName = async () => {
      if(!localName.trim() || localName.trim() === 'ភ្ញៀវ') return showToast('ឈ្មោះមិនអាចទទេ ឬដាក់ថាភ្ញៀវទេ', 'error');
      localStorage.setItem(`tp_username_${user?.uid}`, localName);
      if (db && user) {
         await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), {
            username: localName
         }).catch(()=>{});
      }
      setIsEditingName(false);
      showToast('រក្សាទុកជោគជ័យ');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
       const b64 = r.result;
       if (db && user) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), {
             avatar: b64
          }).catch(()=>{});
          setProfile(p => ({ ...p, avatar: b64 }));
          showToast('បានប្តូររូបភាព Profile ជោគជ័យ');
       }
    };
    r.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto space-y-3 pt-1 flex-1 w-full font-khmer animate-in fade-in">
      <div className="flex items-center gap-1 px-1 border-l-4 border-[#0F2B5C] pl-2 mb-3">
         <h1 className="text-[14.5px] font-black text-[#0F2B5C]">គណនី</h1>
      </div>

      <div className="bg-white p-4 rounded-xl flex flex-col items-center shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-12 bg-slate-50 border-b border-slate-100"></div>
        <div className="w-16 h-16 rounded-full bg-white mb-3 overflow-hidden border-2 border-white shadow-md relative group z-10">
             <img src={profile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-full h-full object-cover bg-slate-100" alt="av"/>
             <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-5 h-5 text-white"/>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
             </label>
        </div>
        <div className="w-full relative z-10">
           <label className="text-[11px] font-bold text-slate-400 mb-1.5 block text-center uppercase tracking-widest">ឈ្មោះអ្នកប្រើប្រាស់ឧបករណ៍នេះ</label>
           {isEditingName ? (
               <div className="flex flex-col gap-2">
                   <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-[14px] font-bold outline-none text-center" placeholder="កំណត់ឈ្មោះរបស់អ្នក..."/>
                   <button onClick={handleSaveName} className="btn-gradient py-2.5 rounded-xl text-[13px] font-black shadow-sm">រក្សាទុក</button>
               </div>
           ) : (
               <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
                   <span className="text-[14.5px] font-black text-[#0F2B5C]">{safeStr(profile?.username)}</span>
                   <button onClick={() => setIsEditingName(true)} className="text-slate-600 bg-white border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow-sm"><Edit3 className="w-3.5 h-3.5"/> កែប្រែ</button>
               </div>
           )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
         <h2 className="text-[13px] font-black flex items-center gap-1.5 text-[#0F2B5C] border-b border-slate-100 pb-2">
            <Settings className="w-4.5 h-4.5 text-slate-400"/> ការកំណត់
         </h2>
         
         <div className="pt-1">
            <button onClick={() => setShowAdminLogin(true)} className="w-full bg-[#0F2B5C] hover:bg-[#081a3b] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-[13px] transition active:scale-95 shadow-md border border-[#0F2B5C]">
               <ShieldAlert className="w-4.5 h-4.5 text-[#38BDF8] animate-pulse"/> Admin Portal របស់ប្រព័ន្ធ
            </button>
         </div>
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in bg-slate-900/70 backdrop-blur-md">
           <div className="relative w-full max-w-[280px] mx-auto bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#0F2B5C] to-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck className="w-6 h-6 text-[#38BDF8]"/>
              </div>
              
              <h3 className="text-[14px] font-black mb-1 text-[#0F2B5C] uppercase">បញ្ជាក់សិទ្ធិជាអភិបាល</h3>
              <p className="text-[11.5px] text-slate-400 mb-4 font-medium">សូមបញ្ចូលលេខសម្ងាត់សម្រាប់ Admin</p>
              
              <div className="mb-4 relative">
                 <input 
                   type="password" 
                   value={pwdInput} 
                   onChange={e=>setPwdInput(e.target.value)} 
                   placeholder="លេខសម្ងាត់..." 
                   disabled={lockoutTime > 0}
                   className="w-full bg-slate-50 px-3 py-3 rounded-xl outline-none font-bold border border-slate-200 text-[14px] text-slate-800 disabled:opacity-50"
                 />
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => { setShowAdminLogin(false); setPwdInput(''); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-[11px] border border-slate-200">បោះបង់</button>
                <button onClick={handleAdminLogin} disabled={isLoginLoading || lockoutTime > 0} className="flex-1 btn-gradient py-3 rounded-xl font-bold text-[11px] flex items-center justify-center disabled:opacity-70">
                   {isLoginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (lockoutTime > 0 ? 'ផ្អាក...' : 'ចូលគណនី')}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ locations = [], setLocations, pendingLocations = [], usersList = [], cyberLogs = [], chats = [], dbRegions, setDbRegions, db, appId, showToast, setCurrentView, setIsAdmin, chatTargets = [], setChatTargets, appeals = [], setAppeals, cosmicTheme, setCosmicTheme }) => {
  const [activeTab, setActiveTab] = useState('data'); 
  const [editingLoc, setEditingLoc] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [confirmAction, setConfirmAction] = useState(null);
  const [passwordAction, setPasswordAction] = useState(null);
  const [monitoringUser, setMonitoringUser] = useState(null);
  const [monitoringTarget, setMonitoringTarget] = useState('Admin');

  const openConfirm = (title, message, action) => setConfirmAction({ title, message, action });
  const openPasswordPrompt = (title, description, action) => setPasswordAction({ title, description, action });
  
  const handleConfirm = async () => {
     if (confirmAction && confirmAction.action) {
        await confirmAction.action();
     }
     setConfirmAction(null);
  };

  const handlePasswordConfirm = async () => {
     if (passwordAction && passwordAction.action) {
        await passwordAction.action();
     }
     setPasswordAction(null);
  };

  const [newCommune, setNewCommune] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  
  const [newChatLabel, setNewChatLabel] = useState('');
  const [newChatRole, setNewChatRole] = useState('');
  const [newChatAvatar, setNewChatAvatar] = useState('');
  const [newChatDistrictType, setNewChatDistrictType] = useState('រតនមណ្ឌល');
  const [newChatCustomDistrict, setNewChatCustomDistrict] = useState('');

  const handleApprove = async (id, authorUid) => { 
      try {
        if (!db) throw new Error("Offline mode");
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_admin_data', id), { status: 'approved' }); 
        
        if (authorUid) {
           await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), { 
               targetId: authorUid,
               title: 'សំណើរជោគជ័យ ✅',
               msg: 'Admin បានព្រមលើសំណើររបស់អ្នក។ ទិន្នន័យត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធផ្លូវការ។',
               type: 'success',
               timestamp: Date.now() 
           }).catch(()=>{});
        }
        showToast('អនុម័តជោគជ័យ ✅'); 
      } catch (err) {}
      if (typeof setLocations === 'function') {
         setLocations(prev => (prev || []).map(l => l && l.id === id ? { ...l, status: 'approved' } : l).filter(Boolean));
      }
  };
  
  const handleReject = (id, authorUid) => { 
      openConfirm("បញ្ជាក់ការបដិសេធ", "តើអ្នកពិតជាចង់បដិសេធ និងលុបសំណើរនេះមែនទេ?", async () => {
        try {
          if (!db) throw new Error("Offline execution");
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_admin_data', id)); 
          if (authorUid) {
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), { 
                  targetId: authorUid,
                  title: 'បដិសេធ ❌',
                  msg: 'Admin មិនព្រមលើសំណើររបស់អ្នកទេ។ សំណើរត្រូវបានលុបចោល।',
                  type: 'error',
                  timestamp: Date.now() 
              }).catch(()=>{});
          }
          showToast('បានបដិសេធសំណើរ', 'error'); 
        } catch (err) {}
        if (typeof setLocations === 'function') {
           setLocations(prev => (prev || []).filter(l => l && l.id !== id));
        }
      });
  };

  const confirmDeleteLocation = (id) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទិន្នន័យទីតាំងនេះមែនទេ?", async () => {
         try {
           if (db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_admin_data', id));
           showToast('លុបទិន្នន័យបានជោគជ័យ');
         } catch (e) {}
         if (typeof setLocations === 'function') {
            setLocations(prev => (prev || []).filter(l => l && l.id !== id));
         }
      });
  };

  const clearLog = (id = null) => {
      openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបកំណត់ត្រាសុវត្ថិភាពនេះមែនទេ?", async () => {
         if (db) {
            if(id) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', id));
            else {
                cyberLogs?.forEach(async l => {
                  if(l) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cyber_logs', l.id)).catch(()=>{});
                });
            }
         }
         showToast('សម្អាតបានជោគជ័យ');
      });
  };
  
  const handleAdminLogout = () => {
     setIsAdmin(false);
     setCurrentView('home');
     showToast('បានចាកចេញពី Admin');
  };

  const handleWipeAllUsers = () => {
      openPasswordPrompt(
         "បញ្ជាក់ការលុបសមាជិកទាំងអស់", 
         "សកម្មភាពនេះនឹងលុបគណនីសមាជិកទាំងអស់ ចេញពីប្រព័ន្ធទាំងស្រុង។ សូមវាយលេខកូដ Admin ដើម្បីបន្ត។", 
         async () => {
            showToast('កំពុងដំណើរការលុបសមាជិក...', 'info');
            if (db) {
               for (const userObj of usersList) {
                  if (userObj.id) {
                     await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id)).catch(()=>{});
                  }
               }
               chats.forEach(async msg => {
                  if (msg && msg.id) {
                     await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', msg.id)).catch(()=>{});
                  }
               });
            }
            showToast(`បានលុបគណនីសមាជិកទាំងអស់រួចរាល់`);
         }
      );
  };

  const handleWarnUser = (userObj) => {
      openConfirm("បញ្ជូនការព្រមាន", `តើអ្នកចង់បញ្ជូនសារព្រមានជាផ្លូវការទៅកាន់ ${userObj.username} ដែរឬទេ?`, async () => {
         if (db) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { warnings: increment(1) }).catch(()=>{});
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
               targetId: userObj.id,
               title: 'ការព្រមានពីអភិបាលប្រព័ន្ធ ⚠️',
               msg: 'សកម្មភាពសន្ទនារបស់អ្នកត្រូវបានតាមដាន។ សូមរក្សាពាក្យសម្តីសមរម្យ។',
               type: 'error',
               timestamp: Date.now()
            }).catch(()=>{});
         }
         showToast(`បានព្រមាន ${userObj.username} ជោគជ័យ`);
      });
  };

  const handleBanUser = (userObj) => {
      openConfirm("ដក Device (Ban)", `តើអ្នកពិតជាចង់ផ្តាច់ និងដកសិទ្ធិប្រើប្រាស់ពី ${userObj.username} ជារៀងរហូតមែនទេ? (គណនីនឹងត្រូវ Block)`, async () => {
         if (db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { isBanned: true }).catch(()=>{});
         showToast(`បានដក Device របស់ ${userObj.username} រួចរាល់!`, 'error');
      });
  };

  const handleForceLogoutUser = (userObj) => {
      openConfirm("លុបគណនីចេញពីទូរស័ព្ទ (Force Wiping Device)", `សកម្មភាពនេះនឹងលុបគណនី ${userObj.username} 出ទូរស័ព្ទ និងផ្តាច់ទិន្នន័យទាំងអស់ភ្លាមៗ។ ចង់បន្តទេ?`, async () => {
         if (db) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { forceLogout: true });
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id)).catch(()=>{});
         }
         showToast(`បានបញ្ជាលុប Web App ចេញពីទូរស័ព្ទរបស់ ${userObj.username} រួចរាល់!`, 'success');
      });
  };

  const handleDeleteTrollUser = (userObj) => {
      openPasswordPrompt(
         `លុបគណនី ${userObj.username}`, 
         `តើអ្នកពិតជាចង់លុបគណនីរបស់ {userObj.username} មែនទេ? សូមវាយលេខកូដ Admin ដើម្បីបញ្ជាក់សកម្មភាពលុបនេះ។`, 
         async () => {
            if (db) {
               await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id)).catch(()=>{});
               chats.forEach(async msg => {
                  if (msg && msg.userId === userObj.id) {
                     await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', msg.id)).catch(()=>{});
                  }
               });
            }
            showToast(`បានលុបគណនី ${userObj.username} ជោគជ័យ`);
         }
      );
  };

  const handleApproveAppeal = async (appealItem) => {
      try {
         if (db) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', appealItem.userId), { isBanned: false, warnings: 0 });
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appeals', appealItem.userId));
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
               targetId: appealItem.userId,
               title: 'គណនីត្រូវបានបើកវិញជោគជ័យ ✅',
               msg: 'សំណើរសុំសម្រុះសម្រួលរបស់អ្នកត្រូវបានអនុម័ត។ គណនីត្រូវបានបើកឲ្យប្រើប្រាស់ធម្មតាវិញហើយ។',
               type: 'success',
               timestamp: Date.now()
            });
         }
         showToast('បានយល់ព្រមបើកគណនីឡើងវិញ');
      } catch (err) {}
  };

  const handleRejectAppeal = async (appealItem) => {
      try {
         if (db) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appeals', appealItem.userId));
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
               targetId: appealItem.userId,
               title: 'សំណើរសម្រុះសម្រួលត្រូវបានបដិសេធ ❌',
               msg: 'សំណើរសុំសម្រុះសម្រួលរបស់អ្នកត្រូវបានបដិសេធ।',
               type: 'error',
               timestamp: Date.now()
            });
         }
         showToast('បានបដិសេធសំណើរសម្រុះសម្រួល', 'error');
      } catch (err) {}
  };

  const handleAddCommune = async (e) => {
     e.preventDefault();
     if(!newCommune.trim()) return;
     const currentData = (dbRegions && dbRegions["រតនមណ្ឌល"]) || {};
     if(currentData[newCommune]) return showToast('ឃុំនេះមានរួចហើយ!', 'error');
     const updated = { ...dbRegions, "រតនមណ្ឌល": { ...currentData, [newCommune]: [] } };
     if (typeof setDbRegions === 'function') setDbRegions(updated);
     if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updated }).catch(()=>{});
     setNewCommune('');
     showToast('បន្ថែមឃុំជោគជ័យ');
  };

  const handleAddVillage = async (e) => {
     e.preventDefault();
     if(!selectedCommune || !newVillage.trim()) return showToast('សូមជ្រើសរើសឃុំសិន', 'error');
     const currentData = (dbRegions && dbRegions["រតនមណ្ឌល"]) || {};
     const currentVillages = currentData[selectedCommune] || [];
     if(currentVillages.includes(newVillage)) return showToast('ភូមិនេះមានរួចហើយ!', 'error');
     const updated = { ...dbRegions, "រតនមណ្ឌល": { ...currentData, [selectedCommune]: [...currentVillages, newVillage] } };
     if (typeof setDbRegions === 'function') setDbRegions(updated);
     if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updated }).catch(()=>{});
     setNewVillage('');
     showToast('បន្ថែមភូមិជោគជ័យ');
  };

  const handleDeleteCommune = (cName) => {
     openConfirm("បញ្ជាក់ការលុប", `តើអ្នកពិតជាចង់លុបឃុំ ${cName} មែនទេ?`, async () => {
         const currentData = dbRegions && dbRegions["រតនមណ្ឌល"] ? { ...dbRegions["រតនមណ្ឌល"] } : {};
         delete currentData[cName];
         const updatedRegions = { ...dbRegions, "រតនមណ្ឌល": currentData };
         if (typeof setDbRegions === 'function') setDbRegions(updatedRegions);
         if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updatedRegions }, { merge: true }).catch(()=>{});
         showToast('លុបឃុំបានជោគជ័យ');
     });
  };

  const handleDeleteVillage = (cName, vName) => {
     openConfirm("បញ្ជាក់ការលុប", `តើអ្នកពិតជាចង់លុបភូមិ ${vName} មែនទេ?`, async () => {
         const currentData = dbRegions && dbRegions["រតនមណ្ឌល"] ? { ...dbRegions["រតនមណ្ឌល"] } : {};
         const currentVillages = currentData[cName] || [];
         const updatedVillages = currentVillages.filter(v => v !== vName);
         const updatedRegions = { ...dbRegions, "រតនមណ្ឌល": { ...currentData, [cName]: updatedVillages } };
         if (typeof setDbRegions === 'function') setDbRegions(updatedRegions);
         if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions'), { data: updatedRegions }, { merge: true }).catch(()=>{});
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
        }).catch(()=>{});
     }
     setNewChatLabel('');
     setNewChatRole('');
     setNewChatAvatar('');
     setNewChatCustomDistrict('');
     showToast('បន្ថែមទំនាក់ទំនងឆាតថ្មីជោគជ័យ ✅');
  };

  const handleDeleteChatTarget = (id) => {
     openConfirm("បញ្ជាក់ការលុប", "តើអ្នកពិតជាចង់លុបទំនាក់ទំនងឆាតនេះមែនទេ?", async () => {
         if (db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat_targets', id)).catch(()=>{});
         showToast('លុបជោគជ័យ ✅');
     });
  };

  const toggleCosmicTheme = async () => {
      const targetState = !cosmicTheme;
      setCosmicTheme(targetState);
      if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'theme'), { cosmicTheme: targetState }, { merge: true }).catch(()=>{});
      showToast(`បានកំណត់ Theme ថ្មីស្ថាពរ`);
  };

  const searchedUsersList = useMemo(() => {
     return (usersList || []).filter(u => {
        if (!u || !u.username || u.username === 'ភ្ញៀវ') return false; 
        const nameMatch = safeStr(u.username).toLowerCase().includes(userSearchQuery.toLowerCase());
        const uidMatch = safeStr(u.id).toLowerCase().includes(userSearchQuery.toLowerCase());
        return nameMatch || uidMatch;
     });
  }, [usersList, userSearchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3 pb-10 flex-1 font-khmer text-slate-800 animate-in fade-in">
      <ConfirmModal isOpen={!!confirmAction} title={confirmAction?.title} message={confirmAction?.message} onConfirm={handleConfirm} onCancel={() => setConfirmAction(null)} />
      <PasswordPromptModal isOpen={!!passwordAction} title={passwordAction?.title} description={passwordAction?.description} onConfirm={handlePasswordConfirm} onCancel={() => setPasswordAction(null)} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0F2B5C] text-white p-4 rounded-[16px] shadow-sm shrink-0">
        <div>
           <div className="flex items-center gap-2">
              <button onClick={() => setCurrentView('home')} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg"><ArrowLeft className="w-4 h-4 text-white" /></button>
              <h1 className="text-[13px] md:text-[14px] font-black flex items-center gap-1.5"><ShieldCheck className="w-5 h-5 text-[#38BDF8]"/> Firebase Admin Panel</h1>
           </div>
           <p className="text-[9px] text-sky-200 mt-1 pl-8 font-bold uppercase tracking-wider">ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យផ្លូវការ</p>
        </div>
        <button onClick={handleAdminLogout} className="mt-2.5 sm:mt-0 px-3 py-1.5 bg-white/10 hover:bg-rose-600 rounded-lg text-[10px] font-black flex items-center gap-1"><LogOut className="w-3.5 h-3.5"/> ចាកចេញ</button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {[
          {id: 'data', label: 'ទិន្នន័យ & ទីតាំង'},
          {id: 'chat_manage', label: 'គ្រប់គ្រងទំនាក់ទំនង'},
          {id: 'chat_monitor', label: 'គ្រប់គ្រងបទល្មើស'},
          {id: 'appeals', label: 'សំណើសម្រុះសម្រួល'},
          {id: 'approvals', label: 'អនុម័តសំណើរ'},
          {id: 'security', label: 'កំណត់ត្រាសុវត្ថិភាព'},
          {id: 'settings', label: 'Theme'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-colors shadow-sm ${activeTab === t.id ? 'bg-[#0F2B5C] text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{t.label}</button>
        ))}
      </div>

      <div className="min-h-[300px]">
          {activeTab === 'settings' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                 <h3 className="font-black text-[12.5px] border-l-4 border-[#38BDF8] pl-2 text-[#0F2B5C]">ការកំណត់ចលនាទំព័រដើម</h3>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                     <div>
                        <h4 className="font-bold text-[12.5px] text-slate-800">ចលនាគ្រាប់ផ្កាយ Cosmic Theme</h4>
                        <p className="text-[10px] text-slate-500 mt-1">នៅពេលបើក វានឹងបង្ហាញផ្កាយ និងកាឡាក់ស៊ីមានចលនា Background ខ្មៅនៅលើទំព័រ Gateway</p>
                     </div>
                     <label className="relative flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only toggle-checkbox" checked={cosmicTheme} onChange={toggleCosmicTheme} />
                        <div className={`w-10 h-6 rounded-full transition-colors duration-300 toggle-label ${cosmicTheme ? 'bg-[#10b981]' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${cosmicTheme ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </label>
                 </div>
             </div>
          )}

          {activeTab === 'approvals' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
               <h3 className="font-black text-[12.5px] mb-3 border-l-4 border-amber-500 pl-2 text-[#0F2B5C]">សំណើររង់ចាំ (Pending: {pendingLocations?.length||0})</h3>
               <div className="space-y-3">
                 {pendingLocations?.length === 0 ? <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50"><p className="text-[11px] text-slate-400 font-bold">គ្មានសំណើរថ្មីទេ</p></div> : 
                   pendingLocations.filter(Boolean).map(loc => {
                     const displayTitle = safeStr(loc.title);
                     return (
                     <div key={loc.id} className="p-3 bg-slate-50 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2">
                        <div className="flex items-start gap-3 w-full md:w-auto">
                          <img src={loc.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'} className="w-16 aspect-[16/10] object-cover rounded-lg bg-slate-200 shrink-0 shadow-sm border border-slate-200" alt="loc"/>
                          <div className="flex-1">
                            <p className="font-black text-[13px] text-[#0F2B5C] leading-tight line-clamp-1">{displayTitle}</p>
                            <p className="text-[10px] text-slate-600 font-bold mt-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 w-fit">{safeStr(loc.category)}</p>
                            <p className="text-[9.5px] text-slate-500 mt-1">ស្នើដោយ: {safeStr(loc.author)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button onClick={()=>handleApprove(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-[#10b981] text-white px-4 py-2 rounded-lg font-bold text-[11px]">ព្រម</button>
                          <button onClick={()=>handleReject(loc.id, loc.authorUid || null)} className="flex-1 md:flex-none bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-lg font-bold text-[11px]">មិនព្រម</button>
                        </div>
                     </div>
                   )})
                 }
               </div>
            </div>
          )}

          {activeTab === 'chat_monitor' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-3 border-l-4 border-rose-500 pl-2">
                   <h3 className="font-black text-[12.5px] text-[#0F2B5C]">ការតាមដាន និងគ្រប់គ្រងបទល្មើស (Moderation)</h3>
                </div>

                <div className="flex gap-2 items-center mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                           type="text" 
                           placeholder="ស្វែងរកសមាជិកតាមឈ្មោះ ឬ UID..." 
                           value={userSearchQuery}
                           onChange={e => setUserSearchQuery(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[12.5px] font-bold"
                        />
                    </div>
                    <button 
                       onClick={handleWipeAllUsers} 
                       className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:scale-95 transition-all" 
                       title="លុបសមាជិកទាំងអស់"
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 hide-scrollbar">
                   {searchedUsersList?.length === 0 ? <p className="text-center py-6 text-[11px] font-bold text-slate-400">គ្មាន User ស្របតាមការស្វែងរកទេ</p> :
                     searchedUsersList.sort((a,b)=>(b.lastActive||0)-(a.lastActive||0)).map(u => {
                        if (!u) return null;
                        const isOnline = (Date.now() - (u.lastActive||0)) < 120000;
                        if (u.isBanned) return null; 

                        return (
                           <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                              <div className="flex items-center gap-2.5">
                                 <div className="relative">
                                    <img src={u.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white" alt="av" />
                                    <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-[12px] text-[#0F2B5C] flex flex-wrap items-center gap-1">
                                       {safeStr(u.username)}
                                       {u.warnings > 0 && <span className="bg-amber-100 text-amber-600 text-[8px] px-1.5 py-0.5 rounded font-black border border-amber-200">Warnings: {u.warnings}</span>}
                                    </h4>
                                    <p className="text-[8.5px] text-slate-400 tracking-wider font-bold">UID: {safeStr(u.id).substring(0, 10)}...</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <button onClick={() => handleWarnUser(u)} className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[9px] font-bold active:scale-95" title="ព្រមាន">ព្រមាន</button>
                                 <button onClick={() => handleBanUser(u)} className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[9px] font-bold active:scale-95" title="Block">Block</button>
                                 <button onClick={() => handleForceLogoutUser(u)} className="px-2 py-1 bg-red-600 text-white rounded-lg text-[9px] font-bold active:scale-95" title="ដក Web App">ដក Web App</button>
                                 
                                 <button onClick={() => handleDeleteTrollUser(u)} className="p-1.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg ml-0.5" title="លុបគណនី">
                                     <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                                 <button 
                                    onClick={() => {
                                        setMonitoringUser(u);
                                        setMonitoringTarget('Admin');
                                    }} 
                                    className="p-1.5 bg-sky-50 text-[#38BDF8] border border-sky-100 rounded-lg" 
                                    title="ផ្ទាំងតាមដានឆាត"
                                 >
                                    <Eye className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           </div>
                        )
                     })
                   }
                </div>
             </div>
          )}

          {activeTab === 'appeals' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-200">
                <h3 className="font-black text-[12.5px] border-l-4 border-sky-500 pl-2 text-[#0F2B5C] mb-3">សំណើសម្រុះសម្រួលទណ្ឌកម្ម (Appeals List)</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
                   {appeals.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50"><p className="text-[11px] text-slate-400 font-bold">គ្មានសំណើរសុំសម្រុះសម្រួលថ្មីទេ</p></div>
                   ) : (
                      appeals.map(item => item && (
                         <div key={item.userId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                               <div className="flex items-center gap-2.5">
                                  <img src={item.photo} className="w-12 aspect-[16/10] object-cover rounded-lg border border-slate-200 bg-white" alt="Facial Verification" />
                                  <div>
                                     <h4 className="font-black text-[12px] text-[#0F2B5C]">{safeStr(item.username)}</h4>
                                     <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{new Date(item.timestamp).toLocaleString()}</span>
                                  </div>
                               </div>
                               <div className="flex gap-1.5 w-full sm:w-auto">
                                  <button onClick={() => handleApproveAppeal(item)} className="flex-1 sm:flex-none bg-[#10b981] text-white px-3 py-1.5 rounded-lg font-black text-[10px]">យល់ព្រម</button>
                                  <button onClick={() => handleRejectAppeal(item)} className="flex-1 sm:flex-none bg-rose-50 text-rose-500 border border-rose-100 px-3 py-1.5 rounded-lg font-black text-[10px]">បដិសេធ</button>
                               </div>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-medium italic">
                               "{safeStr(item.text)}"
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          )}

          {activeTab === 'chat_manage' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-black text-[12.5px] border-l-4 border-[#38BDF8] pl-2 text-[#0F2B5C]">បន្ថែមទំនាក់ទំនងសម្រាប់ Chat</h3>
                
                <form onSubmit={handleAddChatTarget} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ជ្រើសរើសស្រុក</label>
                         <select value={newChatDistrictType} onChange={e=>setNewChatDistrictType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-slate-800">
                             <option value="រតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                             <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                         </select>
                      </div>
                      {newChatDistrictType === 'ផ្សេងៗ' && (
                         <div className="animate-in fade-in">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">បញ្ចូលឈ្មោះស្រុក</label>
                            <input type="text" value={newChatCustomDistrict} onChange={e=>setNewChatCustomDistrict(e.target.value)} required placeholder="ឧ: ស្រុកបាណន់..." className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-slate-800" />
                         </div>
                      )}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ឈ្មោះទំនាក់ទំនង (Label)</label>
                         <input type="text" value={newChatLabel} onChange={e=>setNewChatLabel(e.target.value)} required placeholder="ឧ: ប៉ុស្តិ៍ប៉ូលិសស្តៅ..." className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-slate-800" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-0.5">តួនាទី (Role)</label>
                         <input type="text" value={newChatRole} onChange={e=>setNewChatRole(e.target.value)} required placeholder="ឧ: រដ្ឋបាល..." className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-slate-800" />
                      </div>
                      
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-0.5">រូបតំណាង</label>
                         <label className="relative flex flex-col items-center justify-center w-full h-8 border border-dashed border-slate-300 bg-white rounded-lg cursor-pointer overflow-hidden shadow-sm">
                            {newChatAvatar ? (
                               <div className="flex items-center gap-1 px-2">
                                  <img src={newChatAvatar} alt="Mini-avatar" className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                                  <span className="text-[10px] font-bold text-emerald-600 truncate max-w-[80px]">រួចរាល់</span>
                               </div>
                            ) : (
                               <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><ImageSvgIcon className="w-3.5 h-3.5 text-slate-400"/> Upload រូប</span>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={e => {
                                 if (e.target.files && e.target.files[0]) {
                                    const r = new FileReader();
                                    r.onload = () => setNewChatAvatar(r.result);
                                    r.readAsDataURL(e.target.files[0]);
                                 }
                              }} 
                            />
                         </label>
                      </div>
                   </div>
                   <button type="submit" className="bg-[#0F2B5C] text-white px-3 py-1.5 rounded-lg text-[10.5px] font-black shadow-sm mt-1">
                      + បន្ថែមទំនាក់ទំនង
                   </button>
                </form>

                <div className="space-y-1.5">
                   <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">បញ្ជីទំនាក់ទំនងបច្ចុប្បន្ន</h4>
                   <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 hide-scrollbar">
                      {chatTargets && chatTargets.map(t => t && (
                          <div key={t.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-2">
                                <img src={t.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white" alt="avatar" />
                                <div>
                                   <p className="text-[12px] font-black text-[#0F2B5C]">{safeStr(t.label)}</p>
                                   <span className="text-[9.5px] text-slate-500 font-bold block">{safeStr(t.district)} • {safeStr(t.role)}</span>
                                </div>
                             </div>
                             <button onClick={()=>handleDeleteChatTarget(t.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg border border-rose-100">
                                <Trash2 className="w-3.5 h-3.5"/>
                             </button>
                          </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'data' && (
             <div className="space-y-3 animate-in fade-in duration-200">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="font-black text-[12.5px] mb-3 border-l-4 border-[#38BDF8] pl-2 text-[#0F2B5C]">រចនាសម្ព័ន្ធទីតាំង (រតនមណ្ឌល)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                           <label className="text-[10px] font-bold text-slate-600 mb-1 block">បន្ថែមឃុំថ្មី</label>
                           <form onSubmit={handleAddCommune} className="flex gap-1">
                               <input type="text" value={newCommune} onChange={e=>setNewCommune(e.target.value)} placeholder="ឈ្មោះឃុំ..." className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none text-slate-800 m-0"/>
                               <button type="submit" className="btn-gradient px-3 rounded-lg text-[10px] font-black">បន្ថែម</button>
                           </form>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                           <label className="text-[10px] font-bold text-slate-600 mb-1 block">បន្ថែមភូមិថ្មី</label>
                           <form onSubmit={handleAddVillage} className="space-y-1.5">
                               <select value={selectedCommune} onChange={e=>setSelectedCommune(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] outline-none text-slate-800 m-0 cursor-pointer">
                                   <option value="">ជ្រើសរើសឃុំ...</option>
                                   {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.keys(dbRegions["រតនមណ្ឌល"]).map(c=><option key={c} value={c}>{c}</option>)}
                               </select>
                               <div className="flex gap-1">
                                   <input type="text" value={newVillage} onChange={e=>setNewVillage(e.target.value)} placeholder="ឈ្មោះភូមិ..." className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none text-slate-800 m-0"/>
                                   <button type="submit" className="btn-gradient px-3 rounded-lg text-[10px] font-black">បន្ថែម</button>
                               </div>
                           </form>
                       </div>
                   </div>
                   
                   <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 hide-scrollbar">
                       {dbRegions && dbRegions["រតនមណ្ឌល"] && Object.entries(dbRegions["រតនមណ្ឌល"]).map(([cName, villages]) => (
                           <div key={cName} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                               <div className="bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200">
                                   <span className="font-black text-[11.5px] text-[#0F2B5C]">ឃុំ: {cName}</span>
                                   <button onClick={()=>handleDeleteCommune(cName)} className="text-rose-500 p-1 bg-white rounded-md border border-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                               </div>
                               <div className="p-2 flex flex-wrap gap-1">
                                   {villages.length === 0 ? <span className="text-[9px] text-slate-400">គ្មានភូមិ</span> : 
                                     villages.map(vName => (
                                         <div key={vName} className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-600 flex items-center gap-1">
                                             {vName} <button onClick={()=>handleDeleteVillage(cName, vName)} className="text-slate-400 hover:text-rose-500"><XCircle className="w-3 h-3"/></button>
                                         </div>
                                     ))
                                   }
                               </div>
                           </div>
                       ))}
                   </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-[12.5px] mb-3 border-l-4 border-[#0F2B5C] pl-2 text-[#0F2B5C]">ទិន្នន័យដែលបានអនុម័តសរុប ({locations.filter(l=>l && l.status==='approved').length})</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <h4 className="font-black text-[10.5px] mb-2 text-[#0F2B5C] bg-white p-1.5 rounded-lg border border-slate-100">១. ស្រុករតនមណ្ឌល</h4>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 hide-scrollbar">
                               {locations.filter(l=>l && l.status==='approved' && l.district === 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-4 text-[10px] text-slate-400 font-bold border border-dashed border-slate-200 rounded-lg">គ្មានទិន្នន័យ</p> :
                                 locations.filter(l=>l && l.status==='approved' && l.district === 'រតនមណ្ឌល').map(loc => {
                                   if (!loc) return null;
                                   const displayTitle = safeStr(loc.title);
                                   return (
                                   <div key={loc.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                      <div className="flex items-center gap-2">
                                         <img src={loc.image} className="w-10 aspect-[16/10] object-cover rounded-md border border-slate-200 shrink-0" alt="loc"/>
                                         <div>
                                            <p className="text-[11.5px] font-black text-[#0F2B5C] line-clamp-1">{displayTitle}</p>
                                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{safeStr(loc.commune)} • {safeStr(loc.village)}</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-1 shrink-0">
                                         <button onClick={()=>setEditingLoc(loc)} className="p-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100"><Edit3 className="w-3 h-3"/></button>
                                         <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-1 bg-rose-50 text-rose-600 rounded-md border border-rose-100"><Trash2 className="w-3 h-3"/></button>
                                      </div>
                                   </div>
                               )})}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <h4 className="font-black text-[10.5px] mb-2 text-[#38BDF8] bg-white p-1.5 rounded-lg border border-slate-100">២. ស្រុកផ្សេងៗ</h4>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 hide-scrollbar">
                               {locations.filter(l=>l && l.status==='approved' && l.district !== 'រតនមណ្ឌល').length === 0 ? <p className="text-center py-4 text-[10px] text-slate-400 font-bold border border-dashed border-slate-200 rounded-lg">គ្មានទិន្នន័យ</p> :
                                 locations.filter(l=>l && l.status==='approved' && l.district !== 'រតនមណ្ឌល').map(loc => {
                                   if (!loc) return null;
                                   const displayTitle = safeStr(loc.title);
                                   return (
                                   <div key={loc.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                      <div className="flex items-center gap-2">
                                         <img src={loc.image} className="w-10 aspect-[16/10] object-cover rounded-md border border-slate-200 shrink-0" alt="loc"/>
                                         <div>
                                            <p className="text-[11.5px] font-black text-[#0F2B5C] line-clamp-1">{displayTitle}</p>
                                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{safeStr(loc.district)}</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-1 shrink-0">
                                         <button onClick={()=>setEditingLoc(loc)} className="p-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100"><Edit3 className="w-3 h-3"/></button>
                                         <button onClick={()=>confirmDeleteLocation(loc.id)} className="p-1 bg-rose-50 text-rose-600 rounded-md border border-rose-100"><Trash2 className="w-3 h-3"/></button>
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
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
               <div className="flex justify-between items-center mb-3">
                 <h3 className="font-black text-[12.5px] border-l-4 border-rose-500 pl-2 text-[#0F2B5C]">កំណត់ត្រាសុវត្ថិភាព (Cyber Security Logs)</h3>
                 <button onClick={()=>clearLog()} className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg font-bold">លុបទាំងអស់</button>
               </div>
               <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 hide-scrollbar">
                 {cyberLogs?.length === 0 ? <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl"><p className="text-[10px] font-bold text-slate-400">ប្រព័ន្ធមានសុវត្ថិភាពល្អ ១០០%</p></div> : 
                   cyberLogs?.map(l => {
                     if (!l) return null;
                     return (
                     <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] relative shadow-sm">
                        <p className="font-black text-rose-600 mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Failed Login Attempt</p>
                        <p className="text-[#0F2B5C] font-bold mb-1">User: {l.username}</p>
                        <p className="text-slate-500 mb-1">{l.device} • IP: {l.ip}</p>
                        <p className="text-slate-400 text-[8.5px] font-medium">{new Date(l.timestamp).toLocaleString()}</p>
                        <button onClick={()=>clearLog(l.id)} className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 p-0.5 rounded-full"><X className="w-3.5 h-3.5"/></button>
                     </div>
                     );
                   })
                 }
               </div>
            </div>
          )}
      </div>

      {monitoringUser && (
         <div className="fixed inset-0 z-[2500] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-auto">
            <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col h-[75dvh] md:h-[550px] border border-slate-200 animate-in slide-in-from-bottom duration-300">
               <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                     <img src={monitoringUser.avatar} className="w-7 h-7 rounded-full object-cover border border-slate-200 bg-white" alt="avatar" />
                     <div>
                        <h4 className="font-black text-[12.5px] text-[#0F2B5C] leading-none">តាមដានគណនី: {safeStr(monitoringUser.username)}</h4>
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5 leading-none truncate max-w-[150px]">UID: {monitoringUser.id}</span>
                     </div>
                  </div>
                  <button onClick={() => setMonitoringUser(null)} className="p-1.5 bg-white border border-slate-200 rounded-full"><X className="w-4 h-4"/></button>
               </div>

               <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex gap-1.5 shrink-0">
                  {[
                     { id: 'Admin', label: 'Admin Support' },
                     { id: 'Police', label: 'ប៉ុស្តិ៍ប៉ូលិស' },
                     { id: 'Commune Chief', label: 'មេឃុំ/ចៅសង្កាត់' }
                  ].map(targetTab => (
                     <button 
                        key={targetTab.id}
                        onClick={() => setMonitoringTarget(targetTab.id)}
                        className={`flex-1 py-1.5 rounded-lg text-[9.5px] font-black transition-all border ${monitoringTarget === targetTab.id ? 'bg-[#0F2B5C] text-white border-transparent' : 'bg-white text-slate-500 border-slate-200'}`}
                     >
                        {targetTab.label}
                     </button>
                  ))}
               </div>

               <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 telegram-bg hide-scrollbar">
                  {chats.filter(c => c && c.userId === monitoringUser.id && c.target === monitoringTarget).length === 0 ? (
                     <div className="text-center py-10 text-slate-400 font-bold text-[11px]">
                        គ្មានកំណត់ត្រាសន្ទនាជាមួយ {monitoringTarget === 'Admin' ? 'Admin Support' : monitoringTarget === 'Police' ? 'ប៉ុស្តិ៍ប៉ូលិស' : 'មេឃុំ/ចៅសង្កាត់'} ឡើយ
                     </div>
                  ) : (
                     chats.filter(c => c && c.userId === monitoringUser.id && c.target === monitoringTarget).map(msg => (
                        <div key={msg.id} className="flex justify-start animate-in fade-in">
                           <div className="max-w-[85%] bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm text-left">
                              <span className="text-[9px] font-black text-[#0F2B5C] block mb-0.5">
                                 {safeStr(msg.userName)}
                              </span>
                              
                              {msg.msgType === 'location' ? (
                                 <div className="p-2 bg-green-50 border border-green-200 rounded-lg space-y-1.5 mt-0.5">
                                    <span className="text-[9px] text-green-800 font-bold block">🗺️ ទីតាំងភូមិសាស្ត្រ (GPS)</span>
                                    <a href={msg.mapUrl} target="_blank" rel="noreferrer" className="block text-center py-1 bg-green-600 text-white rounded text-[9px] font-black">បើកលើផែនទី</a>
                                 </div>
                              ) : msg.msgType === 'image' ? (
                                 <img src={msg.imageUrl} className="max-w-full rounded-lg border border-slate-200" alt="attachment" />
                              ) : msg.msgType === 'audio' ? (
                                 <TelegramVoiceBubble 
                                    audioUrl={msg.audioUrl} 
                                    durationSec={msg.durationSec} 
                                    durationStr={msg.duration} 
                                    messageId={msg.id}
                                    activeAudioId={activeAudioId}
                                    setActiveAudioId={setActiveAudioId}
                                 />
                              ) : (
                                 <p className="text-[12px] text-slate-700 font-medium leading-relaxed">{safeStr(msg.text)}</p>
                              )}
                              
                              <span className="text-[8px] text-slate-400 block mt-1 text-right">
                                 {new Date(msg.timestamp).toLocaleString()}
                              </span>
                           </div>
                        </div>
                     ))
                  )}
               </div>
               
               <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex justify-end">
                  <button onClick={() => setMonitoringUser(null)} className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-[11px] font-bold">ចាកចេញ</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const LocationCard = ({ location, isFavorite, onToggleFavorite, onClick }) => {
  const displayTitle = safeStr(location.title);
  const contactLines = parseContactsList(location);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group relative">
      <div className="absolute top-2 right-2 z-10">
         <button onClick={(e)=>{ e.stopPropagation(); onToggleFavorite(); }} className={`p-1.5 rounded-full backdrop-blur-md shadow-sm transition active:scale-95 ${isFavorite ? 'bg-rose-500 border-rose-600 text-white' : 'bg-white/90 border-slate-200 text-slate-400'}`}>
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
         </button>
      </div>
      
      <div className="cursor-pointer flex flex-col h-full" onClick={onClick}>
         <div className="w-full aspect-[16/10] bg-slate-100 overflow-hidden relative shrink-0 border-b border-slate-100">
            <img src={location.image} className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500" alt="img" />
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md py-0.5 px-1.5 rounded border border-slate-200 shadow-sm text-[9px] font-black text-[#0F2B5C] uppercase tracking-wider">{safeStr(location.category)}</div>
         </div>
         <div className="p-2.5 flex flex-col justify-between flex-1">
            <div>
               <h3 className="font-black text-[13px] text-[#0F2B5C] leading-tight line-clamp-1 mb-0.5">{displayTitle}</h3>
               <p className="text-[10px] text-slate-500 font-bold mb-1.5 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-slate-400"/> {safeStr(location.commune) || 'ស្រុករតនមណ្ឌល'}</p>
               
               <div className="mb-2 space-y-0.5">
                 {contactLines.slice(0, 1).map((c, i) => (
                    <div key={i} className="text-[11px] font-black text-slate-600 truncate bg-slate-50 p-1 rounded border border-slate-100">
                       👤 {safeStr(c.name)}: <span className="text-slate-500 font-bold">{safeStr(c.phone)}</span>
                    </div>
                 ))}
               </div>

               <p className="text-[11.5px] text-slate-500 leading-normal line-clamp-2 mb-1.5 font-medium">{safeStr(location.desc)}</p>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-auto">
               <span className="text-[10px] font-bold text-[#38BDF8] flex items-center gap-0.5 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100"><Heart className="w-2.5 h-2.5 fill-current"/> {location.likes || 0}</span>
               <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5">មើលបន្ថែម <ArrowRight className="w-2.5 h-2.5"/></span>
            </div>
         </div>
      </div>
    </div>
  );
};

const LocationDetailModal = ({ location, onClose, favorites = {}, toggleFavorite, gpsCoords, onCallTrigger }) => {
  const isFav = favorites && location && favorites[location.id];
  const displayTitle = safeStr(location.title);
  const calculatedDistanceVal = gpsCoords && location.coords ? calculateDistance(gpsCoords.lat, gpsCoords.lng, location.coords.lat, location.coords.lng) : 0;
  const contactLines = parseContactsList(location);

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-auto font-khmer">
       <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col h-[70dvh] md:h-auto md:max-h-[80vh] border border-slate-200 animate-in slide-in-from-bottom duration-300">
          <div className="relative w-full aspect-[16/10] bg-slate-100 shrink-0">
             <img src={location.image} className="w-full h-full object-cover object-center" alt="loc"/>
             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end justify-between">
                <div>
                   <span className="bg-[#38BDF8] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border border-sky-400 uppercase tracking-wider">{safeStr(location.category)}</span>
                   <h2 className="text-white font-black text-[14.5px] mt-1 leading-tight">{displayTitle}</h2>
                </div>
                <button onClick={() => toggleFavorite(location.id)} className={`p-2 rounded-full backdrop-blur-md active:scale-95 transition ${isFav ? 'bg-rose-500 text-white' : 'bg-white text-slate-500'}`}>
                   <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`}/>
                </button>
             </div>
             <button onClick={onClose} className="absolute top-2.5 right-2.5 p-1.5 bg-white/80 rounded-full text-slate-700 shadow-sm backdrop-blur-sm"><X className="w-3.5 h-3.5"/></button>
          </div>
          <div className="p-3.5 overflow-y-auto flex-1 space-y-3 hide-scrollbar">
             
             <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">បញ្ជីខ្សែទូរស័ព្ទទាក់ទង ({contactLines.length})</span>
                <div className="space-y-1.5">
                   {contactLines.map((c, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                         <div>
                            <span className="text-[13px] font-black text-[#0F2B5C] block">{safeStr(c.name)}</span>
                            <span className="text-[11.5px] text-slate-500 font-bold tracking-wider">{safeStr(c.phone)}</span>
                         </div>
                         <a 
                           href={`tel:${c.phone}`}
                           className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm"
                         >
                            <Phone className="w-3.5 h-3.5"/>
                         </a>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">អាសយដ្ឋាន</span>
                <p className="font-bold text-[13px] text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-500"/> {safeStr(location.district)} • {safeStr(location.commune)} • {safeStr(location.village)}</p>
                {calculatedDistanceVal > 0 && (
                   <span className="inline-block bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100 px-2 py-0.5 rounded mt-1">
                      📍 ចម្ងាយពីអ្នក: {calculatedDistanceVal} KM
                   </span>
                )}
             </div>

             <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">ព័ត៌មានលម្អិត</span>
                <p className="text-[13px] text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{safeStr(location.desc || 'គ្មានការពណ៌នាព័ត៌មានបន្ថែមទេ។')}</p>
             </div>
          </div>
          
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 shrink-0 pb-safe flex gap-2">
             <button 
                type="button"
                onClick={() => onCallTrigger(location)} 
                className="flex-1 py-3 rounded-lg font-black text-[13px] flex items-center justify-center gap-1 bg-emerald-500 border border-emerald-600 text-white shadow-sm"
             >
                <Phone className="w-3.5 h-3.5" />
                <span>ទូរស័ព្ទ (Call Contact)</span>
             </button>

             <a 
                href={location.mapUrl || (location.coords ? `https://www.google.com/maps?q=${location.coords.lat},${location.coords.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayTitle)}`)} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-3 bg-[#0F2B5C] text-white border border-[#0F2B5C] rounded-lg font-black text-[13px] flex items-center justify-center gap-1 shadow-sm"
              >
                <MapSvgIcon className="text-[#38BDF8]"/>
                <span>ផែនទី (Location)</span>
             </a>
          </div>
       </div>
    </div>
  );
};