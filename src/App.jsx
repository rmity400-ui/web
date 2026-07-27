import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, MessageCircle, ShieldCheck, User, Bell, 
  Search, Plus, XCircle, Trash2, Edit3, 
  Send, LogOut, Settings, Pin,
  LayoutGrid, ShieldAlert, TrendingUp, Phone, CheckCircle, ArrowLeft, 
  Globe, ArrowRight, Loader2, MapPin, Mic, Camera, X, Play, AlertOctagon, 
  CheckCheck, Hexagon, GraduationCap, Pause, Copy, Check, Radio, Eye, Shield, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  increment 
} from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Volume2, VolumeX, Megaphone } from 'lucide-react';
// Safe string casting utility to prevent null-pointers
export function safeStr(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => safeStr(v, fallback)).join(', ');
  return fallback;
}

// Inline custom SVG Icons
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

// High-fidelity standard audio context notifier ("Ping" sound)
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

// Calculate geodesic distance between coordinates using the Haversine formula
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

// SHA-256 Password hashing mechanism
const hashPasswordPureJS = (s) => {
  const rotateRight = (n, x) => (x >>> n) | (x << (32 - n));
  const words = [];
  const strLen = s.length;
  for (let i = 0; i < strLen * 8; i += 8) {
    words[i >> 5] |= (s.charCodeAt(i / 8) & 255) << (24 - i % 32);
  }
  words[strLen >> 2] |= 128 << (24 - (strLen % 4) * 8);
  const blocks = ((strLen + 8) >> 6) + 1;
  const wordsLen = blocks * 16;
  while (words.length < wordsLen) words.push(0);
  words[wordsLen - 1] = strLen * 8;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(64);
    for (let t = 0; t < 16; t++) w[t] = words[i + t];
    for (let t = 16; t < 64; t++) {
      const s0 = rotateRight(7, w[t - 15]) ^ rotateRight(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotateRight(17, w[t - 2]) ^ rotateRight(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotateRight(6, e) ^ rotateRight(11, e) ^ rotateRight(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotateRight(2, a) ^ rotateRight(13, a) ^ rotateRight(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map(h => {
    const hex = (h >>> 0).toString(16);
    return '00000000'.substring(hex.length) + hex;
  }).join('');
};

const hashPassword = async (string) => {
  return hashPasswordPureJS(string);
};

// Secure password verification method avoiding raw plain-text storage
const verifyAdminPassword = async (inputPwd) => {
  try {
    const expectedHash = "a99b16c162b84ac06fee88eba49fa43ab305a56ef9d71469173c1fa45555040d";
    const inputHash = await hashPassword(inputPwd);
    return expectedHash === inputHash;
  } catch(e) {
    return false;
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

// Safely parses phone/contact structure from location items
const parseContactsList = (location) => {
  if (!location) return [];
  if (location.contacts && Array.isArray(location.contacts) && location.contacts.length > 0) return location.contacts;
  if (location.phone) return [{ name: location.role || 'សមាជិក', phone: location.phone }];
  return [];
};

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
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true
  });
} catch (configError) {
  try {
    db = getFirestore(app);
  } catch (err) {}
}

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
       background-image: url("'ooop.png' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%230F2B5C' fill-opacity='0.02'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E");
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

// EXECUTE IMMEDIATELY: ការពារកុំឲ្យបាត់ Style លោតញាក់ពេលចូលដំបូង (Prevent FOUC)
injectStyles();

// Generic system confirmation popup
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

// Default database settings for Region filtering
const DEFAULT_REGIONS = {
  "រតនមណ្ឌល": {
    "ស្តៅ": ["ស្តៅ", "បាណង់", "ស្នឹង"],
    "ត្រែង": ["ត្រែង", "គីឡូម៉ែត្រ៣៨", "ជាម"],
    "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប"]
  }
};

// Simple anti-abuse text analysis tool
const containsAbuse = (text) => {
  const badWords = ["troll", "fuck", "bad", "spam", "scam", "អាខ្លៅ", "អាឆ្កែ", "ចោរ", "ល្ងង់", "ឡប់", "ឆ្កួត"];
  return badWords.some(word => safeStr(text).toLowerCase().includes(word));
};

// High-performance canvas galaxy rendering
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

// Leaflet router drawing component
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
          // Default backup to Siem Reap coordinates if denied
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
        html: `<div class="w-8 h-8 bg-slate-900 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg"><span class="text-[10px] font-black">B</span></div>`,
        className: '',
        iconSize: [32, 32]
      });

      L.marker([senderCoords.lat, senderCoords.lng], { icon: senderIcon }).addTo(map);
      L.marker([localReceiver.lat, localReceiver.lng], { icon: receiverIcon }).addTo(map);

      // Connect route A and B with a high-visibility green line
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
         <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-black">
           {computedDist < 1 ? `${Math.round(computedDist * 1000)} m` : `${computedDist} KM`}
         </span>
      </div>
      <div ref={mapContainerRef} className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0 relative" />
    </div>
  );
};

const HowToUseModal = ({ onClose, data }) => {
  const [activeTab, setActiveTab] = useState('guide'); 

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 pointer-events-auto font-khmer">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[75vh] md:h-[600px] border border-slate-200 animate-in zoom-in-95">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-[14px] font-black text-[#0F2B5C] flex items-center gap-1.5"><Info className="w-4 h-4 text-[#38BDF8]"/> របៀបប្រើប្រាស់ Web App</h2>
          <button onClick={onClose} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-full text-slate-500 hover:text-rose-500 transition-colors"><X className="w-4 h-4"/></button>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 border-b border-slate-200 shrink-0">
           <button onClick={() => setActiveTab('guide')} className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all ${activeTab === 'guide' ? 'bg-[#0F2B5C] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>មើលការណែនាំ</button>
           <button onClick={() => setActiveTab('video')} className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all ${activeTab === 'video' ? 'bg-[#0F2B5C] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>មើលជា Video</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar bg-white">
            {activeTab === 'guide' ? (
                (!data || !data.guides || data.guides.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Info className="w-10 h-10 text-slate-300 mb-2"/>
                        <p className="text-[13px] font-bold text-slate-500">កំពុងអភិវឌ្ឍ</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.guides.map((g, idx) => (
                            <div key={idx} className="space-y-2">
                                {g.title && <h3 className="font-black text-[14px] text-[#0F2B5C]">{idx + 1}. {g.title}</h3>}
                                {g.text && <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{g.text}</p>}
                                {g.image && <img src={g.image} alt="Guide" className="w-full rounded-xl border border-slate-200 shadow-sm mt-2" />}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                (!data || !data.videoUrl) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Play className="w-10 h-10 text-slate-300 mb-2"/>
                        <p className="text-[13px] font-bold text-slate-500">កំពុងអភិវឌ្ឍ</p>
                    </div>
                ) : (
                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={data.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                            title="YouTube video player" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen>
                        </iframe>
                    </div>
                )
            )}
        </div>
      </div>
    </div>
  );
};

// Multi-contact Phone Dial Picker Modal
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
                  <h4 className="font-black text-[13px] text-slate-800">{safeStr(contact.name)}</h4>
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
  
  const [language, setLanguage] = useState('kh');
  const [currentPage, setCurrentPage] = useState('gateway'); 
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');

  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // FIXED: Changed isAdmin to use sessionStorage so it only affects the local device
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('tp_admin_session') === 'true');
  
  /* Customized logo and background states */
  const [appLogo, setAppLogo] = useState('logo.png');
  // FIXED: Update session when isAdmin changes
  useEffect(() => {
     sessionStorage.setItem('tp_admin_session', isAdmin);
  }, [isAdmin]);

  const [customBg, setCustomBg] = useState('#f8fafc');
  const [gatewayBg, setGatewayBg] = useState('');
  const [profile, setProfile] = useState({ username: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isBanned: false, warnings: 0, role: 'user' });
  
  const [locations, setLocations] = useState([]);  
  const [usersList, setUsersList] = useState([]);  
  const [chats, setChats] = useState([]);          
  const [chatTargets, setChatTargets] = useState([]);
  const [myContacts, setMyContacts] = useState([]); 
  const [friendRequests, setFriendRequests] = useState([]);
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
  
  const [isSoundMuted, setIsSoundMuted] = useState(() => localStorage.getItem('tp_sound_muted') === 'true');
  const [appealText, setAppealText] = useState('');
  const [appealPhoto, setAppealPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showAppealConfirm, setShowAppealConfirm] = useState(false);
  const videoRef = useRef(null);
  const streamObjectRef = useRef(null);

  const [callPickerState, setCallPickerState] = useState({ isOpen: false, title: '', contacts: [] });

  /* Form modal states */
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ 
    title: '', 
    image: '', 
    coords: null, 
    mapUrl: '', 
    desc: '', 
    category: 'ឃុំ', 
    province: '', 
    district: 'រតនមណ្ឌល', 
    commune: '', 
    village: '',
    contacts: [{ name: '', phone: '' }]
  });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isFormFetchingGps, setIsFormFetchingGps] = useState(false);

  // Trigger call flow based on amount of phone lines
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
        
        const isGuest = sessionStorage.getItem('tp_is_guest') === 'true';
        const savedLocalUsername = localStorage.getItem(`tp_username_${localToken}`);
        if (savedLocalUsername && savedLocalUsername !== 'ភ្ញៀវ' && !isGuest) {
           setCurrentPage('app');
        }

        setUser({ uid: localToken, isAnonymous: true });
        setIsAuthLoading(false);
      }
    };
    initAuth();
    
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => { 
          if (currentUser) {
            const isGuest = sessionStorage.getItem('tp_is_guest') === 'true';
            const savedLocalUsername = localStorage.getItem(`tp_username_${currentUser.uid}`);
            if (savedLocalUsername && savedLocalUsername !== 'ភ្ញៀវ' && !isGuest) {
               setCurrentPage('app');
            }
            
            setUser(currentUser);
            setIsAuthLoading(false);
          }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!db) return;

    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid);
    
    // Presence update routine
    const updatePresenceIfReal = () => {
       const isG = sessionStorage.getItem('tp_is_guest') === 'true';
       const uName = localStorage.getItem(`tp_username_${user.uid}`);
       if (!isG && uName && uName !== 'ភ្ញៀវ') {
          setDoc(profileRef, { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
       }
       if (sessionStorage.getItem('tp_admin_session') === 'true') {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', 'admin_ramit_fixed_uid'), { lastActive: Date.now(), status: 'online' }, { merge: true }).catch(()=>{});
       }
    };
    
    updatePresenceIfReal();
    const presenceInterval = setInterval(updatePresenceIfReal, 30000); 

    // Subscribe to active user profile
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const udata = snap.data();
        setProfile(udata);
        
        // Dynamic secure role-based administrative check
        if (udata.role === 'admin') {
          setIsAdmin(true);
        } else if (sessionStorage.getItem('tp_admin_session') !== 'true') {
          setIsAdmin(false);
        }
        
        // Handle Device Wiping / Forced Logout triggered by Admin
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
        const isG = sessionStorage.getItem('tp_is_guest') === 'true';
        if (savedName && savedName !== 'ភ្ញៀវ' && !isG) {
          // Optimistic local state update to prevent UI flickering on mobile
          setProfile(prev => ({
             ...prev,
             username: savedName,
             uid: user.uid,
             isBanned: false,
             warnings: 0,
             role: 'user'
          }));
          setDoc(profileRef, {
            username: savedName,
            avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            uid: user.uid,
            timestamp: Date.now(),
            isBanned: false,
            warnings: 0,
            role: 'user'
          }, { merge: true });
        }
      }
    }, () => {});

    // Listen to registered profiles
    const unsubAllUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), snap => {
       setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});

    // Listen to location items
    const unsubLocations = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_admin_data'), snap => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});
    
    // Listen to universal chat channels
    const unsubChats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), snap => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp - b.timestamp); 
      setChats(msgs);
      
      const amIAdmin = sessionStorage.getItem('tp_admin_session') === 'true';
      const myCheckId = amIAdmin ? 'admin_ramit_fixed_uid' : user.uid;
      const isMuted = localStorage.getItem('tp_sound_muted') === 'true';

      if (previousChatCount.current > 0 && msgs.length > previousChatCount.current) {
         const lastMsg = msgs[msgs.length - 1];
         // Messenger-like behavior: Play ping on incoming unread messages targeting the current user
         // Check if target is 'all' (Broadcast) or specifically the user. And not sent by me.
         if (lastMsg.userId !== myCheckId && (lastMsg.target === myCheckId || lastMsg.target === user.uid || lastMsg.target === 'all')) {
             if (!isMuted) {
                 playPingSound();
             }
         }
      }
      previousChatCount.current = msgs.length;
    }, () => {});

    // Subscribe to security logs
    const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), snap => {
      const lg = snap.docs.map(d => ({id: d.id, ...d.data()}));
      lg.sort((a,b) => b.timestamp - a.timestamp);
      setCyberLogs(lg);
    }, () => {});

    // Subscribe to block appeal list
    const unsubAppeals = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'appeals'), snap => {
      setAppeals(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});
    
    // Subscribe to system notifications
    const unsubNotif = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), snap => {
      const mt = snap.docs.map(d => ({id: d.id, ...d.data()}));
      mt.sort((a,b) => b.timestamp - a.timestamp);
      setNotifications(mt);
    }, () => {});

    // Subscribe to user local Pinned Bookmarks
    const unsubFavs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'favorites'), snap => {
      const favMap = {};
      snap.docs.forEach(doc => { favMap[doc.id] = true; });
      setFavorites(favMap);
    }, () => {});
    
    // Fetch regions map
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'regions');
    const unsubConfig = onSnapshot(configRef, (snap) => {
        if(snap.exists() && snap.data().data) setDbRegions(snap.data().data);
        else {
           setDoc(configRef, { data: DEFAULT_REGIONS }, { merge: true });
           setDbRegions(DEFAULT_REGIONS);
        }
    }, () => { setDbRegions(DEFAULT_REGIONS); });

    /* Load Dynamic Settings & Custom Theme/Logo configuration from Firestore */
    const themeRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'theme');
    const unsubTheme = onSnapshot(themeRef, (snap) => {
        if (snap.exists()) {
           const sdata = snap.data();
           if (sdata.cosmicTheme !== undefined) setCosmicTheme(sdata.cosmicTheme);
           if (sdata.customBg !== undefined) setCustomBg(sdata.customBg || '#f8fafc');
           if (sdata.appLogo !== undefined) setAppLogo(sdata.appLogo || '');
           if (sdata.gatewayBg !== undefined) setGatewayBg(sdata.gatewayBg || '');
        }
    }, () => {});

    // Get Chat Contacts
    const unsubTargets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'chat_targets'), snap => {
      if (!snap.empty) {
        const trg = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        trg.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChatTargets(trg);
      }
    }, () => {});

    return () => { 
        clearInterval(presenceInterval); 
        unsubProfile(); unsubAllUsers(); unsubLocations(); unsubChats(); 
        unsubLogs(); unsubNotif(); unsubFavs(); unsubConfig(); unsubTheme(); unsubTargets(); unsubAppeals();
    };
  }, [user]);

  // Handle Contacts and Friend Requests Separately based on isAdmin Role
  useEffect(() => {
    if (!user || !db) return;
    const targetRefId = isAdmin ? 'admin_ramit_fixed_uid' : user.uid;
    
    const unsubMyContacts = onSnapshot(collection(db, 'artifacts', appId, 'users', targetRefId, 'contacts'), snap => {
       setMyContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    const unsubFriendRequests = onSnapshot(collection(db, 'artifacts', appId, 'users', targetRefId, 'friend_requests'), snap => {
       setFriendRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    
    return () => { unsubMyContacts(); unsubFriendRequests(); };
  }, [user, isAdmin, db, appId]);

  // Compute unread badge counts targeting user or admin
  const myNotifications = useMemo(() => {
    if (!user) return [];
    return (notifications || []).filter(n => {
        if (n.targetId === user.uid) return true;
        if (isAdmin && (chatTargets || []).some(t => t.id === n.targetId)) return true;
        return false;
    });
  }, [notifications, user, isAdmin, chatTargets]);

  // Handle live geolocation capture
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

  // Toggle Pinned Location shortcut
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

  // Profile signup processor
  const handleGatewayRegister = async (e) => {
    e.preventDefault();
    const finalizedUsername = regName.trim();
    if (!finalizedUsername) return showToast('សូមបញ្ជាក់ឈ្មោះគណនីរបស់អ្នក', 'error');

    // Prevent anyone from manually registering the reserved admin names
    if (finalizedUsername.toLowerCase() === 'admin') {
        return showToast('ហាមឃាត់! ឈ្មោះ ADMIN ត្រូវបានរក្សាទុកសម្រាប់អភិបាលប្រព័ន្ធតែប៉ុណ្ណោះ។', 'error');
    }

    if (finalizedUsername.length < 2 || /(.)\1{2,}/.test(finalizedUsername)) {
        return showToast('ឈ្មោះមិនត្រឹមត្រូវ! (សូមប្រើឈ្មោះពិត ត្រកូល និងនាមឲ្យបានត្រឹមត្រូវ)', 'error');
    }
    
    sessionStorage.removeItem('tp_is_guest');
    localStorage.setItem(`tp_username_${user.uid}`, finalizedUsername);

    // Optimistic local state update to prevent UI flickering before database syncs
    setProfile(prev => ({
       ...prev,
       username: finalizedUsername,
       uid: user.uid,
       isBanned: false,
       warnings: 0,
       role: 'user'
    }));

    if (db && user) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), {
          username: finalizedUsername,
          timestamp: Date.now(),
          lastActive: Date.now(),
          status: 'online',
          uid: user.uid,
          isBanned: false,
          warnings: 0,
          role: 'user'
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
           warnings: 0,
           role: 'user'
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
      
      // Fix left/right mirror issue (ថតស្តាំកុំដាក់ឆ្វេង)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
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

  const handleAppealClick = () => {
     if (!appealText.trim()) return showToast('សូមសរសេរព័រណានៃការសន្យារបស់អ្នក', 'error');
     if (!appealPhoto) return showToast('សូមថតរូបមុខដើម្បីបញ្ជាក់អត្តសញ្ញាណជាមុនសិន', 'error');
     setShowAppealConfirm(true);
  };

  const confirmAndSubmitAppeal = async () => {
     setShowAppealConfirm(false);
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.title.trim()) return showToast('សូមបញ្ចូលចំណងជើង ឬឈ្មោះទីតាំង', 'error');
    if (!addForm.image) return showToast('សូមបញ្ចូលរូបភាព', 'error');
    
    const validContacts = addForm.contacts.filter(c => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      return showToast('សូមបញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទទំនាក់ទំនងយ៉ាងហោចណាស់ ១ ខ្សែ!', 'error');
    }

    setIsFormSubmitting(true);
    try {
      let submitData = { 
        ...addForm, 
        contacts: validContacts,
        role: validContacts[0].name, 
        phone: validContacts[0].phone, 
        author: profile?.username || 'Admin', 
        authorUid: user?.uid || 'guest_uid', 
        timestamp: Date.now() 
      };
      
      if (addForm.district === 'រតនមណ្ឌល' || !addForm.district) {
         submitData.province = 'បាត់ដំបង';
         submitData.district = 'រតនមណ្ឌល';
      }
      
      if (!db) {
         showToast('រក្សាទុកក្នុងទិន្នន័យបណ្តោះអាសន្នជោគជ័យ (Offline)');
         setIsAddModalOpen(false);
         setIsFormSubmitting(false);
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
            msg: `សំណើរដែលអ្នកបានផ្ញើរត្រូវបានបញ្ជូន ហើយកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin।`, 
            type: 'info', 
            timestamp: Date.now()
        }).catch(()=>{});
        showToast('សំណើររបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យពី Admin', 'info');
      }
      setIsAddModalOpen(false);
    } catch (err) {
      showToast('បរាជ័យក្នុងការបញ្ជូន', 'error');
    }
    setIsFormSubmitting(false);
  };

  const setGPSForForm = () => {
      setIsFormFetchingGps(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  setAddForm(prev => ({
                     ...prev,
                     coords: coords,
                     mapUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
                  }));
                  setIsFormFetchingGps(false);
                  showToast('ចាប់កូអរដោនេ GPS និងបញ្ចូលជោគជ័យ', 'success');
              },
              () => {
                  setIsFormFetchingGps(false);
                  showToast('សូមបើក Location ឧបករណ៍របស់អ្នក', 'error');
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
      } else {
          setIsFormFetchingGps(false);
          showToast('ឧបករណ៍របស់អ្នកមិនគាំទ្រ GPS ទេ', 'error');
      }
  };

  const approvedLocations = useMemo(() => (locations || []).filter(l => l && l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => (locations || []).filter(l => l && l.status === 'pending'), [locations]);

  // Premium Splash Screen Loading Design (ការពារកុំឲ្យឃើញ UI រញ៉េរញ៉ៃពេលចូលដំបូង)
  if (isAuthLoading) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0F2B5C] z-[9999] animate-in fade-in font-khmer">
       <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
          <Hexagon className="absolute inset-0 w-full h-full text-[#38BDF8] fill-transparent stroke-[2px] rotate-90 animate-pulse" />
          <GraduationCap className="relative z-10 w-10 h-10 text-white animate-bounce" />
       </div>
       <h1 className="text-white font-black text-[18px] tracking-widest font-khmer mb-3">វិ.ស្តៅសន្តិភាព</h1>
       <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#38BDF8] rounded-full animate-[progress_1.5s_ease-in-out_infinite] w-1/2"></div>
       </div>
       <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
    </div>
  );

  // Strict Device Block & Account Ban Appeal interface overlay screen
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
                       <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
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
              <button onClick={handleAppealClick} className="flex-1 bg-rose-600 hover:bg-rose-700 px-3 py-2.5 rounded-lg font-black text-[12px] shadow-lg transition-all active:scale-95 border border-rose-500">ផ្ញើសំណើ</button>
           </div>

           {showAppealConfirm && (
              <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
                 <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-xs p-5 text-center animate-in zoom-in-95 border border-slate-200">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                       <AlertOctagon className="w-6 h-6" />
                    </div>
                    <h3 className="text-[14px] font-black mb-2 text-[#0F2B5C]">បញ្ជាក់ការផ្ញើសំណើរ</h3>
                    <p className="text-[12.5px] font-medium text-slate-600 mb-5 leading-relaxed">
                       សំណើរនេះនិងផ្ញើរទៅកាន់ admin page (អ្នកគ្រប់គ្រង) ដើម្បីពិនិត្យមើលកំហុសរបស់អ្នកសូមរងចាំរយះពេល 2-3នាទី។
                    </p>
                    <div className="flex gap-2">
                       <button onClick={() => setShowAppealConfirm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-xl font-bold text-[12px] transition-all active:scale-95">Back (កែតម្រូវ)</button>
                       <button onClick={confirmAndSubmitAppeal} className="flex-1 bg-[#0F2B5C] text-white px-3 py-2.5 rounded-xl font-black text-[12px] transition-all active:scale-95 shadow-md">យល់ព្រមផ្ញើ</button>
                    </div>
                 </div>
              </div>
           )}
        </div>
      );
  }

  if (currentPage === 'gateway') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col md:flex-row font-khmer bg-white text-slate-800 animate-in fade-in duration-500 w-full overflow-hidden">
        {cosmicTheme && <StarryGalaxyCanvas />}

        <div className="absolute top-[70px] right-5 z-[200] flex gap-1 bg-white/40 backdrop-blur-md p-1.5 rounded-xl border border-white/50 shadow-sm pointer-events-auto">
            <button onClick={() => setLanguage('kh')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${language === 'kh' ? 'bg-[#0F2B5C] text-white shadow-md' : 'text-[#0F2B5C] hover:bg-white/60'}`}>KH</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${language === 'en' ? 'bg-[#0F2B5C] text-white shadow-md' : 'text-[#0F2B5C] hover:bg-white/60'}`}>EN</button>
        </div>

        <div 
          className="flex-1 w-full bg-transparent flex flex-col items-center justify-center pt-10 md:pt-0 z-10"
          style={gatewayBg ? { backgroundImage: `url(${gatewayBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
            <div className="relative w-24 h-24 flex items-center justify-center mb-4 hover:scale-105 transition-transform duration-500">
                <Hexagon className="absolute inset-0 w-full h-full text-[#0F2B5C] fill-transparent stroke-[1.5px] rotate-90" />
                <Hexagon className="absolute inset-0 w-full h-full text-[#0F2B5C] fill-[#0F2B5C] stroke-none rotate-90 scale-90" />
                {appLogo ? (
                   <img src={appLogo} alt="Logo" className="relative z-10 w-12 h-12 object-cover rounded-full" />
                ) : (
                   <GraduationCap className="relative z-10 w-12 h-12 text-[#38BDF8]" />
                )}
            </div>
            <h1 className={`font-logo font-black text-2xl md:text-3xl tracking-wide text-center px-4 ${cosmicTheme || gatewayBg ? 'text-[#0F2B5C] drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]' : 'text-[#0F2B5C]'} mb-1`}>
                {language === 'en' ? 'Sdao Santepheap High School' : 'វិទ្យាល័យស្តៅសន្តិភាព'}
            </h1>
            <p className={`text-[11px] ${cosmicTheme || gatewayBg ? 'text-[#0F2B5C] bg-white/80' : 'text-[#0F2B5C] bg-white/10'} font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm mt-1`}>
                {language === 'en' ? 'VMC Youth Sdao Santepheap 2026' : 'យុវជន vmc វិ.ស្តៅសន្តិភាព 2026'}
            </p>
        </div>

        <div className="w-full md:w-1/2 md:h-full md:rounded-none md:rounded-l-[40px] bg-[#0F2B5C] rounded-t-[40px] px-6 py-10 flex flex-col justify-center items-center text-center pb-[max(env(safe-area-inset-bottom),40px)] shadow-[0_-10px_30px_rgba(15,43,92,0.15)] relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-white text-xl md:text-2xl font-black mb-4 font-khmer leading-tight z-10">
                {language === 'en' ? 'Welcome to the High School Info System' : 'ស្វាគមន៍មកកាន់ប្រព័ន្ធព័ត៌មានវិទ្យាល័យ'}
            </h2>
            <p className="text-sky-100/80 text-[13px] leading-relaxed max-w-sm mb-8 font-khmer px-2 z-10 font-medium">
                {language === 'en' ? "Ratanak Mondol district's commune-village database system facilitating communication and providing fast information to citizens and youth." : 'ប្រព័ន្ធទិន្នន័យភូមិ-ឃុំ នៃស្រុករតនមណ្ឌល ដែលជួយសម្រួលដល់ការទំនាក់ទំនង និងផ្ដល់ព័ត៌មានរហ័សទាន់ចិត្តដល់ប្រជាពលរដ្ឋ និងយុវជន។'}
            </p>
            
            <button 
                onClick={() => setShowRegModal(true)} 
                className="w-full max-w-[260px] bg-white text-[#0F2B5C] py-3.5 rounded-xl font-black text-[13.5px] shadow-lg active:scale-95 transition-transform mb-3 font-khmer z-10 hover:bg-slate-50 flex justify-center items-center gap-1.5"
            >
                {language === 'en' ? 'Register / Login' : 'ចុះឈ្មោះចូលប្រើ'} <ArrowRight className="w-4 h-4"/>
            </button>

            <button 
                onClick={handleGuestEntry} 
                className="w-full max-w-[260px] bg-transparent border-2 border-white/20 text-white/80 py-3.5 rounded-xl font-bold text-[13px] active:scale-95 transition-transform hover:bg-white/10 font-khmer z-10"
            >
                {language === 'en' ? 'Skip (Guest)' : 'រំលង (ចូលជាភ្ញៀវ)'}
            </button>
        </div>

        {showRegModal && (
            <div className="absolute inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center border border-slate-100 relative">
                    <button onClick={()=>setShowRegModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full"><X className="w-4 h-4"/></button>
                    <div className="w-16 h-16 bg-sky-50 text-[#38BDF8] rounded-full flex items-center justify-center mb-4 border border-sky-100">
                        <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-[#0F2B5C] mb-1 font-khmer">{language === 'en' ? 'Create New Account' : 'ការបង្កើតគណនីថ្មី'}</h3>
                    <p className="text-[12px] text-slate-500 mb-4 font-khmer font-medium">{language === 'en' ? 'This account will be linked to your current device only.' : 'គណនីនេះនឹងត្រូវភ្ជាប់សម្រាប់ឧបករណ៍បច្ចុប្បន្នរបស់អ្នកតែប៉ុណ្ណោះ។'}</p>
                    
                    <form onSubmit={handleGatewayRegister} className="w-full space-y-3">
                        <input 
                            type="text" 
                            required
                            value={regName} 
                            onChange={e=>setRegName(e.target.value)} 
                            placeholder={language === 'en' ? "Enter your account name..." : "បញ្ចូលឈ្មោះគណនីឧបករណ៍នេះ..."} 
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-[14px] font-bold text-center outline-none focus:border-[#38BDF8] font-khmer text-slate-800"
                        />
                        <button type="submit" className="w-full py-3 bg-[#0F2B5C] text-white rounded-xl text-[13.5px] font-black active:scale-95 transition-transform font-khmer flex items-center justify-center gap-1.5">
                            {language === 'en' ? 'Create Account' : 'បង្កើតគណនី'} <CheckCircle className="w-4.5 h-4.5"/>
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 font-khmer flex flex-col md:flex-row overflow-hidden animate-in fade-in" 
      style={{ backgroundColor: customBg }}
    >
      
      {toast && (
        <div className="fixed top-safe mt-2 left-1/2 -translate-x-1/2 z-[5000] animate-in slide-in-from-top-5 fade-in duration-300 w-full max-w-[90vw] md:max-w-sm pointer-events-none">
          <div className={`px-4 py-3 rounded-xl shadow-2xl font-bold text-[12px] flex items-center gap-2.5 backdrop-blur-xl border pointer-events-auto ${toast.type === 'error' ? 'bg-rose-600/90 text-white border-rose-500' : toast.type === 'info' ? 'bg-[#0F2B5C]/90 text-white border-slate-700' : 'bg-emerald-600/90 text-white border-emerald-500'}`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4 shrink-0"/> : toast.type === 'info' ? <Bell className="w-4 h-4 shrink-0"/> : <CheckCircle className="w-4 h-4 shrink-0"/>} 
            <span className="flex-1 text-left leading-relaxed drop-shadow-sm">{safeStr(toast.msg)}</span>
          </div>
        </div>
      )}

      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} appLogo={appLogo} />

      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-transparent md:bg-black/5 shadow-inner z-20">
        <TopHeader 
            setCurrentPage={setCurrentPage} notifications={myNotifications} notificationsOpen={notificationsOpen} 
            setNotificationsOpen={setNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            db={db} appId={appId} user={user} appLogo={appLogo} currentView={currentView} 
        />

        <div className="flex-1 flex flex-col min-h-0 relative w-full max-w-7xl mx-auto overflow-hidden">
           {currentView === 'home' && <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2"><HomeView locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} onOpenLocation={setSelectedLocation} setCurrentView={setCurrentView} profile={profile} showToast={showToast} /></div>}
           {currentView === 'info' && (
             <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2">
               <InfoView 
                 locations={approvedLocations} searchQuery={searchQuery} favorites={favorites} toggleFavorite={toggleFavorite} 
                 onOpenLocation={setSelectedLocation} user={user} profile={profile} isAdmin={isAdmin} showToast={showToast} 
                 db={db} appId={appId} setCurrentView={setCurrentView} dbRegions={dbRegions} gpsCoords={gpsCoords} 
                 captureGps={handleGPS} 
                 onOpenAddModal={() => {
                   setAddForm({ 
                     title: '', 
                     image: '', 
                     coords: null, 
                     mapUrl: '', 
                     desc: '', 
                     category: 'ឃុំ', 
                     province: '', 
                     district: 'រតនមណ្ឌល', 
                     commune: '', 
                     village: '',
                     contacts: [{ name: '', phone: '' }]
                   });
                   setIsAddModalOpen(true);
                 }}
               />
             </div>
           )}
           {currentView === 'reports' && <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2"><ReportsView locations={approvedLocations} usersList={usersList} /></div>}
           {currentView === 'chat' && <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-0"><ChatView chats={chats} user={user} profile={profile} showToast={showToast} db={db} appId={appId} setCurrentView={setCurrentView} isAdmin={isAdmin} chatTargets={chatTargets} myContacts={myContacts} friendRequests={friendRequests} dbRegions={dbRegions} gpsStatus={gpsStatus} captureGps={handleGPS} gpsCoords={gpsCoords} usersList={usersList} activeChatUser={activeChatUser} setActiveChatUser={setActiveChatUser} isSoundMuted={isSoundMuted} setIsSoundMuted={setIsSoundMuted} /></div>}
           {currentView === 'account' && <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2"><AccountView user={user} profile={profile} db={db} appId={appId} showToast={showToast} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} setCurrentView={setCurrentView} usersList={usersList} isSoundMuted={isSoundMuted} setIsSoundMuted={setIsSoundMuted} /></div>}
           {currentView === 'admin' && isAdmin && (
              <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pb-20 hide-scrollbar pt-2">
                <AdminDashboard 
                  locations={locations} setLocations={setLocations} pendingLocations={pendingLocations} usersList={usersList} cyberLogs={cyberLogs} chats={chats} dbRegions={dbRegions} setDbRegions={setDbRegions} db={db} appId={appId} showToast={showToast} setCurrentView={setCurrentView} setIsAdmin={setIsAdmin} chatTargets={chatTargets} setChatTargets={setChatTargets} appeals={appeals} setAppeals={setAppeals} cosmicTheme={cosmicTheme} setCosmicTheme={setCosmicTheme} customBg={customBg} setCustomBg={setCustomBg} appLogo={appLogo} setAppLogo={setAppLogo} gatewayBg={gatewayBg} setGatewayBg={setGatewayBg}
                />
              </div>
           )}
        </div>
      </main>

      {/* Hide bottom menu navigation during an active chat interaction context to save screen real estate */}
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

      {/* 
         CRITICAL MOBILE RESOLUTION: Lifting the Add Location form modal out of children contexts to root level
         with full width slide-up sheets and high-visibility scrollable dimensions!
      */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm px-0 md:px-4 pointer-events-auto">
          <div className="relative w-full max-w-lg bg-white rounded-t-[20px] md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] border border-slate-200 animate-in slide-in-from-bottom duration-300">
            
            <form onSubmit={handleAddSubmit} className="flex flex-col max-h-[90dvh] w-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="text-[14px] font-black text-[#0F2B5C]">
                   {addForm.district === 'រតនមណ្ឌល' ? 'បន្ថែមទិន្នន័យ៖ ស្រុករតនមណ្ឌល' : 'បន្ថែមទិន្នន័យ៖ ស្រុកផ្សេងៗ'}
                </h2>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-full text-slate-500 hover:text-rose-500">
                   <X className="w-4.5 h-4.5"/>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 bg-white space-y-4 pb-20 font-khmer">
                <div>
                   <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wider">ចំណងជើង / ឈ្មោះទីតាំង *</label>
                   <input type="text" required value={addForm.title} onChange={e=>setAddForm({...addForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800" placeholder="ឈ្មោះទីតាំង..." />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ប្រភេទ Category *</label>
                  <select value={addForm.category} onChange={e=>setAddForm({...addForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800">
                    <option value="ឃុំ">ឃុំ</option>
                    <option value="ភូមិ">ភូមិ</option>
                    <option value="ប៉ូលិស">ប៉ូលិស</option>
                    <option value="មន្ទីរពេទ្យ">ពេទ្យ</option>
                    <option value="សាលារៀន">សាលារៀន</option>
                    <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                  </select>
                </div>

                {/* Contacts Form List */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black text-slate-600 block uppercase">ព័ត៌មានទំនាក់ទំនង (Contacts) *</span>
                    <button 
                      type="button"
                      onClick={() => setAddForm({...addForm, contacts: [...addForm.contacts, { name: '', phone: '' }]})}
                      className="text-[10px] font-black text-[#0F2B5C] bg-white border border-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5"/> បន្ថែមខ្សែទូរស័ព្ទ
                    </button>
                  </div>

                  <div className="space-y-2">
                    {addForm.contacts.map((contact, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative space-y-2">
                        {addForm.contacts.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = [...addForm.contacts];
                              updated.splice(idx, 1);
                              setAddForm({...addForm, contacts: updated});
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
                              const updated = [...addForm.contacts];
                              updated[idx].name = e.target.value;
                              setAddForm({...addForm, contacts: updated});
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
                              const updated = [...addForm.contacts];
                              updated[idx].phone = e.target.value;
                              setAddForm({...addForm, contacts: updated});
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[13.5px] font-bold" 
                            placeholder="ឧ: 012 345 678..." 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Selection Block */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-inner space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5 border-b border-slate-200 pb-1.5 uppercase">កំណត់ទីតាំង</label>
                    {addForm.district === 'រតនមណ្ឌល' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ឃុំ</label>
                                <select 
                                  required 
                                  value={addForm.commune} 
                                  onChange={e=>setAddForm({...addForm, commune: e.target.value, village: ''})} 
                                  className="w-full bg-white rounded-xl p-2 text-[14.5px] outline-none font-bold border border-slate-200"
                                >
                                    <option value="">ជ្រើសរើស</option>
                                    {dbRegions && dbRegions["រតនមណ្ឌល"] ? Object.keys(dbRegions["រតនមណ្ឌល"]).map(c=><option key={c} value={c}>{c}</option>) : null}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ភូមិ</label>
                                <select 
                                  required 
                                  disabled={!addForm.commune} 
                                  value={addForm.village} 
                                  onChange={e=>setAddForm({...addForm, village: e.target.value})} 
                                  className="w-full bg-white rounded-xl p-2 text-[14.5px] outline-none font-bold border border-slate-200 disabled:opacity-50"
                                >
                                    <option value="">ជ្រើសរើស</option>
                                    {addForm.commune && dbRegions && dbRegions["រតនមណ្ឌល"] && dbRegions["រតនមណ្ឌល"][addForm.commune] 
                                      ? dbRegions["រតនមណ្ឌល"][addForm.commune].map(v=><option key={v} value={v}>{v}</option>) 
                                      : null
                                    }
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" required value={addForm.province} onChange={e=>setAddForm({...addForm, province: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[13px] outline-none font-bold" placeholder="ខេត្ត..."/>
                            <input type="text" required value={addForm.district} onChange={e=>setAddForm({...addForm, district: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[13px] outline-none font-bold" placeholder="ស្រុក..."/>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">ទីតាំង (GPS)</label>
                    <button type="button" onClick={setGPSForForm} className={`w-full ${addForm.coords ? 'bg-[#0F2B5C]/10 text-[#0F2B5C] border-[#0F2B5C]/20' : 'bg-slate-100 text-slate-600 border-slate-300'} border-2 py-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 truncate px-2`}>
                       {isFormFetchingGps ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4 shrink-0"/>}
                       {isFormFetchingGps ? 'កំពុងចាប់ទីតាំង...' : addForm.coords ? '✓ ចាប់បានទីតាំងជោគជ័យ' : 'ចុចដើម្បីទាញយក GPS'}
                    </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">រូបភាព (Upload Picture) *</label>
                  <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 overflow-hidden">
                     {addForm.image ? (
                        <React.Fragment>
                           <img src={addForm.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
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
                             r.onload = () => setAddForm(prev => ({ ...prev, image: r.result }));
                             r.readAsDataURL(e.target.files[0]);
                          }
                       }} 
                     />
                  </label>
                </div>
                
                <div>
                   <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">ការពណ៌នា</label>
                   <textarea value={addForm.desc} onChange={e=>setAddForm({...addForm, desc: e.target.value})} placeholder="សរសេរការពណ៌នាខ្លីៗ..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[14.5px] outline-none h-20 resize-none font-medium text-slate-800"></textarea>
                </div>
              </div>

              {/* STICKY FOOTER SUBMIT BUTTON */}
              <div className="p-3 border-t border-slate-100 shrink-0 pb-safe bg-slate-50 sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                 <button type="submit" disabled={isFormSubmitting} className="w-full py-3.5 rounded-xl font-black btn-gradient disabled:opacity-50 text-[13.5px] flex justify-center items-center gap-1.5 shadow-md">
                     {isFormSubmitting ? <><Loader2 className="w-4 h-4 animate-spin"/> កំពុងផ្ញើរ...</> : isAdmin ? '✓ បញ្ចូលទិន្នន័យ (Auto Approve)' : '📤 ផ្ញើរសំណើរទៅកាន់ Admin'}
                 </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

const Sidebar = ({ currentView, setCurrentView, isAdmin, appLogo }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម' },
    { id: 'info', icon: Info, label: 'ព័ត៌មាន' },
    { id: 'reports', icon: TrendingUp, label: 'របាយការណ៍' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'account', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'អ្នកគ្រប់គ្រង' });

  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-white border-r border-slate-200 z-10 h-[100dvh] shrink-0 shadow-sm animate-in fade-in">
      <div className="p-4 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
           {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
           ) : (
              <GraduationCap className="w-6 h-6 text-[#0F2B5C]" />
           )}
        </div>
        <div className="min-w-0">
          <h1 className="font-logo font-extrabold text-[12.5px] text-[#0F2B5C] leading-none uppercase tracking-wide truncate">វិ.ស្តៅសន្តិភាព</h1>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Admin Portal</p>
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
    { id: 'info', icon: Info, label: 'ព័ត៌មាន' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'account', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] shadow-[0_-4px_15px_rgba(0,0,0,0.04)] bg-white border-t border-slate-100 pb-0 mb-0 pt-1">
      <div className="flex justify-around items-center h-[58px] px-2 relative">
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
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
      const updateStatus = () => setIsOnline(navigator.onLine);
      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
      return () => {
        window.removeEventListener('online', updateStatus);
        window.removeEventListener('offline', updateStatus);
      };
    }, []);

    return (
        <div className="bg-white border-b border-slate-200 pt-[calc(env(safe-area-inset-top,16px)+16px)] px-4 pb-4 shadow-sm relative z-40 shrink-0 w-full">
           <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 border border-slate-100">
                    {appLogo ? (
                       <img src={appLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                    ) : (
                       <GraduationCap className="w-5 h-5 text-[#0F2B5C]" />
                    )}
                 </div>
                 <div>
                    <h1 className="font-logo font-extrabold text-[13.5px] leading-tight text-[#0F2B5C] tracking-wide uppercase">វិ.ស្តៅសន្តិភាព</h1>
                    {!isOnline && <span className="text-[9px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 inline-block"> Offline Mode ⚠️</span>}
                 </div>
              </div>

              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => {
                      sessionStorage.removeItem('tp_is_guest');
                      setCurrentPage('gateway');
                   }} 
                   className="flex items-center justify-center p-1.5 text-[#0F2B5C] bg-slate-50 border border-slate-200 rounded-lg"
                 >
                    <ArrowLeft className="w-4 h-4 text-[#0F2B5C]" />
                 </button>

                 <div className="relative">
                     <button className="p-2 bg-slate-50 rounded-full active:scale-95 transition shadow-sm border border-slate-200" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                        <Bell className="w-4.5 h-4.5 text-[#0F2B5C]" />
                        {notifications && notifications.length > 0 && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce"></span>}
                     </button>
                     {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-[280px] bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden z-[450] text-slate-800 animate-in fade-in zoom-in-95 pointer-events-auto">
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

const HomeView = ({ locations = [], searchQuery, favorites = {}, toggleFavorite, onOpenLocation, setCurrentView, profile, showToast }) => {
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

  const sortedFiltered = [...filtered].sort((a, b) => {
     const aFav = favorites[a.id] ? 1 : 0;
     const bFav = favorites[b.id] ? 1 : 0;
     if (aFav !== bFav) return bFav - aFav;
     return (b.timestamp || 0) - (a.timestamp || 0);
  });

  const handleOtherDistricts = () => {
    if (!profile?.username || profile?.username === 'ភ្ញៀវ') {
       showToast('សូមចុះឈ្មោះកំណត់អត្តសញ្ញាណជាមុនសិន!', 'error');
       setCurrentView('account');
    } else {
       showToast('មុខងារកំពុងអភិវឌ្ឍ (Under Development) ⚠️', 'info');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pt-1 w-full flex-1 font-khmer">
      <div className="bg-[#0F2B5C] rounded-[16px] p-4 relative overflow-hidden flex flex-row items-center justify-between w-full min-h-[110px] shadow-md">
         <div className="absolute top-0 right-0 w-32 h-full bg-[#38BDF8]/10 rounded-l-[80px] z-0 pointer-events-none"></div>
         
         <div className="flex-1 z-10 pr-3">
             <h1 className="text-[14px] md:text-lg font-black text-white leading-tight mb-1 font-khmer">
                 ទិន្នន័យសំខាន់ៗ នៅទីនេះ!
             </h1>
             <p className="text-[12px] text-sky-200 mb-3 font-bold">
                 រហ័ស ងាយស្រួល និងជឿជាក់បាន ១០០%
             </p>
             <button onClick={()=>setCurrentView('info')} className="bg-[#38BDF8] text-[#0F2B5C] px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 hover:bg-sky-400">
                 ស្វែងយល់ <ArrowRight className="w-3.5 h-3.5"/>
             </button>
         </div>
         <div className="w-[70px] h-[70px] shrink-0 z-10 overflow-hidden rounded-full bg-white border-2 border-[#38BDF8] flex items-center justify-center p-0.5">
             <GraduationCap className="w-10 h-10 text-[#0F2B5C]" />
         </div>
      </div>

      <div>
         <div className="flex justify-between items-center mb-2.5 px-1 border-l-4 border-[#0F2B5C] pl-2">
            <h2 className="font-black text-[13px] text-slate-800 leading-none">ជម្រើសទីតាំង</h2>
         </div>
         <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveHomeFilter(activeHomeFilter==='រតនមណ្ឌល'?'All':'រតនមណ្ឌល')} className={`p-2.5 flex flex-col justify-center items-center transition-all rounded-[14px] shadow-sm border ${activeHomeFilter==='រតនមណ្ឌល' ? 'border-[#0F2B5C] bg-[#0F2B5C] text-white' : 'border-slate-200 bg-white text-[#0F2B5C]'}`}>
               <div className={`p-2 rounded-lg mb-1.5 ${activeHomeFilter==='រតនមណ្ឌល' ? 'bg-white/20 text-white' : 'bg-slate-50 text-[#0F2B5C]'}`}><MapSvgIcon /></div>
               <span className="font-black text-[12px]">រតនមណ្ឌល</span>
            </button>
            <button onClick={handleOtherDistricts} className={`p-2.5 flex flex-col justify-center items-center transition-all rounded-[14px] shadow-sm border border-slate-200 bg-white text-[#38BDF8]`}>
               <div className="p-2 rounded-lg mb-1.5 bg-slate-50"><Globe className="w-5 h-5" /></div>
               <span className="font-black text-[12px]">ស្រុកផ្សេងៗ</span>
            </button>
         </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5 px-1 border-l-4 border-[#38BDF8] pl-2">
          <h2 className="text-[13px] font-black text-slate-800 leading-none">ទិន្នន័យដែលបានបញ្ចូល</h2>
          <button onClick={() => setCurrentView('info')} className="text-[11px] font-bold text-slate-600 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">មើលទាំងអស់ <ArrowRight className="w-3.5 h-3.5"/></button>
        </div>
        {sortedFiltered.length === 0 ? (
           <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200 font-bold text-[12px] text-slate-400 shadow-sm flex flex-col items-center">
             <MapPin className="w-8 h-8 mb-2 text-slate-300"/>
             គ្មានទិន្នន័យ
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {sortedFiltered.map(loc => loc && (
              <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoView = ({ locations = [], searchQuery, favorites = {}, toggleFavorite, onOpenLocation, user, profile, isAdmin, showToast, db, appId, setCurrentView, dbRegions, gpsCoords, captureGps, onOpenAddModal }) => {
  const [activeTab, setActiveTab] = useState('រតនមណ្ឌល');
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');

  const [isHowToModalOpen, setIsHowToModalOpen] = useState(false);
  const [howToData, setHowToData] = useState(null);

  useEffect(() => {
     if(db && appId) {
         const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'how_to_use'), (docSnap) => {
             if(docSnap.exists()) {
                 setHowToData(docSnap.data());
             } else {
                 setHowToData(null);
             }
         });
         return () => unsub();
     }
  }, [db, appId]);

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

  const sortedFiltered = [...filtered].sort((a, b) => {
     const aFav = favorites[a.id] ? 1 : 0;
     const bFav = favorites[b.id] ? 1 : 0;
     if (aFav !== bFav) return bFav - aFav;
     return (b.timestamp || 0) - (a.timestamp || 0);
  });

  const handleOpenAdd = () => {
    if (!isAdmin && (!profile?.username || profile?.username === 'ភ្ញៀវ')) {
       showToast('សូមកំណត់ឈ្មោះគណនីជាមុនសិន', 'error');
       setCurrentView('account');
       return;
    }
    onOpenAddModal();
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

  return (
    <div className="space-y-3 mt-1 flex-1 font-khmer font-medium">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
         <h1 className="text-[14.5px] font-black px-1 text-[#0F2B5C] border-l-4 border-[#38BDF8] pl-2">ព័ត៌មាន</h1>
         <div className="flex w-full sm:w-auto gap-2">
            <button onClick={() => setIsHowToModalOpen(true)} className="bg-white text-[#0F2B5C] border border-slate-200 px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 text-[12px] flex-1 sm:flex-none justify-center shadow-sm hover:bg-slate-50 transition-colors">
                <Info className="w-4 h-4"/> របៀបប្រើប្រាស់
            </button>
            <button onClick={handleOpenAdd} className="btn-gradient px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 text-[12px] flex-1 sm:flex-none justify-center shadow-sm">
                <Plus className="w-4 h-4"/> បន្ថែមទិន្នន័យ
            </button>
         </div>
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
        {sortedFiltered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
             <MapPin className="w-8 h-8 text-slate-300 mb-2" />
             <p className="font-bold text-[12px] text-slate-500">គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          sortedFiltered.map(loc => loc && (
            <LocationCard key={loc.id} location={loc} isFavorite={!!favorites[loc.id]} onToggleFavorite={() => toggleFavorite(loc.id)} onClick={() => onOpenLocation(loc)} />
          ))
        )}
      </div>

      {isHowToModalOpen && (
         <HowToUseModal onClose={() => setIsHowToModalOpen(false)} data={howToData} />
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
    { label: 'អ្នកប្រើប្រាស់សសរុប', count: totalUsers + 1, color: 'text-slate-800', desc: 'សរុបតាំងពីដើម' },
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

// Telegram-styled Voice Note Player UI component (Premium Design)
const TelegramVoiceBubble = ({ audioUrl, durationSec = 10, durationStr = '0:10', messageId, activeAudioId, setActiveAudioId, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const localBlobUrl = useMemo(() => {
    if (audioUrl && audioUrl.startsWith('data:')) {
      return base64ToBlobUrl(audioUrl);
    }
    return audioUrl;
  }, [audioUrl]);

  // Realistic Telegram Waveform Pattern (Centered bars)
  const waveformHeights = [
    15, 25, 40, 60, 45, 30, 20, 35, 55, 80, 100, 75, 45, 30, 
    40, 70, 90, 60, 40, 25, 45, 65, 85, 50, 30, 20, 15, 10
  ];

  useEffect(() => {
    if (activeAudioId !== messageId && isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [activeAudioId, messageId, isPlaying]);

  const togglePlayback = (e) => {
    e.stopPropagation();
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
    e.stopPropagation();
    if (!audioRef.current || !durationSec) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const widthPercentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = widthPercentage * durationSec;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const currentProgressPercent = durationSec > 0 ? (currentTime / durationSec) * 100 : 0;

  // Adaptive Colors based on Sender/Receiver
  const playBtnBg = isMe ? 'bg-white text-[#0F2B5C]' : 'bg-[#38BDF8] text-white';
  const playedColor = isMe ? '#ffffff' : '#38BDF8';
  const unplayedColor = isMe ? 'rgba(255,255,255,0.3)' : '#CBD5E1';
  const textColor = isMe ? 'text-sky-100' : 'text-slate-400';

  return (
    <div className="flex items-center gap-3 select-none font-khmer min-w-[210px] sm:w-[240px] pt-1">
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
        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 ${playBtnBg}`}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current"/> : <Play className="w-5 h-5 fill-current ml-1" />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div 
          className="flex items-center gap-[2px] h-[30px] cursor-pointer" 
          onClick={handleTimelineClick}
        >
          {waveformHeights.map((h, index) => {
            const barProgressPoint = (index / waveformHeights.length) * 100;
            const isPlayed = currentProgressPercent >= barProgressPoint;
            return (
              <div 
                key={index} 
                className="w-[3px] rounded-full transition-colors duration-150" 
                style={{
                  height: `${Math.max(15, h)}%`,
                  backgroundColor: isPlayed ? playedColor : unplayedColor
                }} 
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-0.5">
          <span className={`text-[11px] font-bold ${textColor} tracking-wide`}>
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

// Fullscreen Image Overlay modal
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

const ChatView = ({ chats = [], user, profile, showToast, db, appId, setCurrentView, isAdmin, chatTargets = [], myContacts = [], friendRequests = [], dbRegions, gpsStatus, captureGps, gpsCoords, usersList = [], activeChatUser, setActiveChatUser, isSoundMuted, setIsSoundMuted }) => {  const myChatId = isAdmin ? 'admin_ramit_fixed_uid' : (user?.uid || 'guest_uid');
  const myChatName = isAdmin ? 'ADMIN-PAGE' : profile?.username;
  const myChatAvatar = isAdmin ? (usersList.find(u => u.id === 'admin_ramit_fixed_uid')?.avatar || profile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png') : profile?.avatar;

  const [msgText, setMsgText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Filter dropdown states
  const [localFilterActive, setLocalFilterActive] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  
  const fileInputRef = useRef(null);
  const [activeAudioId, setActiveAudioId] = useState(null);

  // Voice note recording states
  const [recordingState, setRecordingState] = useState('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const recordTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const [pulseWaves, setPulseWaves] = useState(Array(15).fill(4));
  const pulseIntervalRef = useRef(null);

  // Message modification overlays
  const [selectedActionMsg, setSelectedActionMsg] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const scrollContainerRef = useRef(null);

  // Reference for tracking long-press intervals (Telegram style)
  const pressTimerRef = useRef({});

  // Scroll to bottom of chat list
  useEffect(() => {
      if (scrollContainerRef.current) {
         scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
  }, [chats, activeChatUser, recordingState]);

  // Mark unseen chat messages targeting the current user as read
  useEffect(() => {
    if (!db || !user || !activeChatUser) return;
    const unseenMsgs = chats.filter(c => c && c.target === myChatId && c.userId === activeChatUser.id && !c.seen);
    unseenMsgs.forEach(async msg => {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', msg.id), { seen: true }).catch(()=>{});
    });
  }, [chats, activeChatUser, myChatId, db]);

  // Handle Long Press Start (Telegram style)
  const handlePressStart = (msg) => {
    if (pressTimerRef.current[msg.id]) {
      clearTimeout(pressTimerRef.current[msg.id]);
    }
    
    pressTimerRef.current[msg.id] = setTimeout(() => {
      if (isAdmin || msg.userId === myChatId) {
        if (navigator.vibrate) {
          navigator.vibrate(60);
        }
        setSelectedActionMsg(msg);
      }
    }, 550);
  };

  // Handle Long Press End/Cancel
  const handlePressEnd = (msg) => {
    if (pressTimerRef.current[msg.id]) {
      clearTimeout(pressTimerRef.current[msg.id]);
      delete pressTimerRef.current[msg.id];
    }
  };

  // Send textual messages
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
             msg: 'អ្នកបានប្រើប្រាស់ពាក្យពេចន៍មិនសមរម្យ।',
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
      userId: myChatId, 
      userName: myChatName, 
      seen: false,
      edited: false,
      timestamp: Date.now()
    }).catch(()=>{});
  };

  // Start microphone capture recording pipeline
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
              userId: myChatId,
              userName: myChatName,
              seen: false,
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
      mediaRecorderRef.current.stop(); // នេះនឹងបញ្ឆេះ onstop event ដែលនឹងផ្ញើសំឡេង
    } else {
      cleanRecordingStreams();
    }
  };

  // Push GPS coordinates directly inside active chats
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
         userId: myChatId,
         userName: myChatName,
         seen: false,
         timestamp: Date.now()
      }).then(() => showToast('ផ្ញើទីតាំងជោគជ័យ', 'success')).catch(()=>{});
  };

  // Attach images from phone gallery/camera roll
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
            userId: myChatId,
            userName: myChatName,
            seen: false,
            timestamp: Date.now()
         }).catch(()=>{});
         showToast('ផ្ញើររូបភាពជោគជ័យ');
         setShowAttachMenu(false);
     };
     reader.readAsDataURL(file);
  };

  // Wipe selected messages
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

  // Connect contact to private friend database mapping
  const handleConnectPrivateUser = async (targetUser) => {
     if (!db || !user) return;
     try {
       if (myContacts.find(c => c.id === targetUser.id)) {
          return showToast('អ្នកទាំងពីរជាមិត្តភក្តិនឹងគ្នារួចហើយ', 'info');
       }
       // ផ្ញើសំណើរសុំធ្វើមិត្ត ជំនួសឲ្យការ Add ចូលភ្លាមៗ
       await setDoc(doc(db, 'artifacts', appId, 'users', targetUser.id, 'friend_requests', myChatId), {
          id: myChatId,
          label: myChatName,
          avatar: myChatAvatar,
          timestamp: Date.now()
       });
       showToast(`បានផ្ញើសំណើរសុំធ្វើមិត្តទៅកាន់ ${targetUser.username} រួចរាល់!`, 'success');
       setShowUserSearch(false);
     } catch (err) {
       showToast('មានបញ្ហាក្នុងការផ្ញើសំណើរ', 'error');
     }
  };

  const handleAcceptRequest = async (req) => {
      if (!db || !user) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', myChatId, 'contacts', req.id), {
          id: req.id,
          label: req.label,
          avatar: req.avatar,
          timestamp: Date.now()
      });
      await setDoc(doc(db, 'artifacts', appId, 'users', req.id, 'contacts', myChatId), {
          id: myChatId,
          label: myChatName,
          avatar: myChatAvatar,
          timestamp: Date.now()
      });
      await deleteDoc(doc(db, 'artifacts', appId, 'users', myChatId, 'friend_requests', req.id));
      showToast(`អ្នក និង ${req.label} បានក្លាយជាមិត្តភក្តិ!`, 'success');
  };

  const handleDeclineRequest = async (req) => {
      if (!db || !user) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'users', myChatId, 'friend_requests', req.id));
  };

  const handleRemoveFriend = async (contact) => {
      const ok = window.confirm(`តើអ្នកពិតជាចង់លុប ${contact.label} ចេញពីបញ្ជីមិត្តភក្តិមែនទេ?`);
      if (!ok) return;
      if (db && user) {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', myChatId, 'contacts', contact.id));
          await deleteDoc(doc(db, 'artifacts', appId, 'users', contact.id, 'contacts', myChatId));
          showToast(`បានលុប ${contact.label} ចេញពីបញ្ជីមិត្តភក្តិ`);
          if (activeChatUser?.id === contact.id) setActiveChatUser(null);
      }
  };

  const toggleSound = () => {
    const newState = !isSoundMuted;
    setIsSoundMuted(newState);
    localStorage.setItem('tp_sound_muted', newState);
    showToast(newState ? 'បានបិទសំឡេង (Muted)' : 'បានបើកសំឡេង (Unmuted)');
  };

  // Skip the name check block if you are an Admin
  if (!isAdmin && (!profile?.username || profile?.username === 'ភ្ញៀវ')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center flex-1 font-khmer">
         <div className="w-12 h-12 bg-slate-100 text-[#0F2B5C] rounded-full flex items-center justify-center mb-3"><MessageCircle className="w-6 h-6" /></div>
         <h2 className="text-[14px] font-black mb-1.5 text-slate-800">តម្រូវឲ្យមានឈ្មោះគណនី</h2>
         <p className="text-slate-500 text-[12px] mb-4 max-w-xs font-medium px-4">សូមចូលទៅកាន់គណនីដើម្បីកំណត់ឈ្មោះ មុននឹងប្រើប្រាស់សេវាកម្មរាយការណ៍។</p>
         <button onClick={() => setCurrentView('account')} className="btn-gradient px-4 py-2 rounded-lg font-bold text-[12px]">កំណត់ឈ្មោះឥឡូវនេះ</button>
      </div>
    );
  }

  // Active contact thread lookup layout
  if (!activeChatUser) {
     const availableDistricts = ['រតនមណ្ឌល', ...new Set(chatTargets.map(t => t.district).filter(d => d && d !== 'រតនមណ្ឌល'))];
     const communeList = selectedDistrict && dbRegions?.[selectedDistrict] ? Object.keys(dbRegions[selectedDistrict]) : [];
     const villageList = selectedDistrict && selectedCommune && dbRegions?.[selectedDistrict]?.[selectedCommune] ? dbRegions[selectedDistrict][selectedCommune] : [];

     // Merge default institutional chat threads and private friends list together
     const mergedContacts = (() => {
         const map = new Map();
         chatTargets.forEach(t => map.set(t.id, { ...t, isPrivate: false }));
         myContacts.forEach(c => map.set(c.id, { ...c, isPrivate: true, role: 'មិត្តភក្តិ', district: 'ឯកជន' }));
         
         if (!isAdmin) {
             const adminProfile = usersList.find(u => u.id === 'admin_ramit_fixed_uid') || {};
             map.set('admin_ramit_fixed_uid', {
                 id: 'admin_ramit_fixed_uid',
                 label: 'Admin Support',
                 role: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
                 district: 'មជ្ឈមណ្ឌល',
                 avatar: adminProfile.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                 isDefault: true,
                 isPrivate: false
             });
         }
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

     const registeredUsersToShow = (usersList || []).filter(u => u && u.username && u.username !== 'ភ្ញៀវ' && u.id !== myChatId && u.id !== 'admin_ramit_fixed_uid');

     return (
        <div className="flex flex-col h-full bg-white md:rounded-xl md:border md:border-slate-200 overflow-hidden w-full flex-1 font-khmer animate-in fade-in duration-300 pb-[85px] md:pb-0">
           
           {/* Add Friend Interface Container with explicit Back Arrow button */}
           {showUserSearch ? (
              <div className="bg-slate-50 p-3 flex-1 flex flex-col min-h-0 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 mb-3 shrink-0">
                      <button 
                         onClick={() => { setShowUserSearch(false); setUserSearchTerm(''); }} 
                         className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-600 active:scale-95 transition-all"
                      >
                         <ArrowLeft className="w-4.5 h-4.5" />
                      </button>
                      <h3 className="font-black text-[13.5px] text-[#0F2B5C]">ស្វែងរកគណនីមិត្តភក្តិ</h3>
                  </div>

                  <div className="relative mb-3 shrink-0">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                          type="text" 
                          placeholder="ស្វែងរកឈ្មោះសមាជិក..." 
                          value={userSearchTerm}
                          onChange={e => setUserSearchTerm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-[13px] font-bold outline-none"
                      />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pb-1 hide-scrollbar">
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
                                       className="text-[10px] font-black bg-[#0F2B5C] text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
                                    >
                                       សុំធ្វើមិត្ត
                                    </button>
                                </div>
                              );
                          })
                      )}
                  </div>
              </div>
           ) : (
             <>
               <div className="p-3.5 border-b border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
                   <div>
                      <h1 className="text-[14px] font-black text-[#0F2B5C] flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#38BDF8]"/> ទំនាក់ទំនងឆាត</h1>
                      <p className="text-[11px] text-slate-500 font-bold mt-1 leading-relaxed">ជ្រើសរើសស្ថាប័ន ឬមិត្តភក្តិដែលអ្នកចង់ឆាតឯកជនជាមួយ។</p>
                   </div>
                   
                   <div className="flex flex-col gap-1.5 items-end">
                       <div className="flex gap-1.5 mt-1">
                           <button 
                              onClick={() => { setShowUserSearch(true); setLocalFilterActive(false); }} 
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-black bg-white border-slate-200 text-slate-600 transition-all active:scale-95"
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
               </div>

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
                             {villageList.map(v => <option key={v} value={v}>{v}</option>)}
                         </select>
                      </div>
                  </div>
               )}

               <div className="flex-1 overflow-y-auto p-3 hide-scrollbar bg-white">
                  {friendRequests.length > 0 && !localFilterActive && !showUserSearch && (
                      <div className="mb-3">
                          <div className="text-slate-400 text-[10px] font-bold mb-2 pl-1 uppercase tracking-wider">សំណើរសុំធ្វើមិត្ត ({friendRequests.length})</div>
                          {friendRequests.map(req => (
                              <div key={req.id} className="flex items-center justify-between p-3 bg-sky-50 rounded-xl border border-sky-100 mb-2 shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                      <img src={req.avatar} className="w-10 h-10 rounded-full border border-slate-200 object-cover" alt="av" />
                                      <div>
                                          <h3 className="font-black text-[13px] text-slate-800">{safeStr(req.label)}</h3>
                                          <p className="text-[10px] text-slate-500 font-bold">ចង់ក្លាយជាមិត្តរបស់អ្នក</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-1.5">
                                      <button onClick={() => handleAcceptRequest(req)} className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg text-[10px] font-black shadow-sm">ទទួល</button>
                                      <button onClick={() => handleDeclineRequest(req)} className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black">អត់</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

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
                            <div className="flex items-center gap-1.5">
                                {contact.isPrivate && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFriend(contact); }}
                                        className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 hover:bg-rose-500 hover:text-white transition-colors"
                                        title="លុបមិត្តភក្តិ"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 group-hover:bg-[#0F2B5C] group-hover:text-white transition-colors">
                                    <ArrowRight className="w-3.5 h-3.5"/>
                                </div>
                            </div>
                        </div>
                      );
                  })}
               </div>
             </>
           )}
        </div>
     );
  }

  // Symmetric Bidirectional Chat Filter & Broadcast Support
  const filteredChats = (chats || []).filter(c => {
      if (!c) return false;
      // Normal private chat
      if ((c.userId === myChatId && c.target === activeChatUser?.id) || (c.userId === activeChatUser?.id && c.target === myChatId)) return true;
      // Broadcast messages (If sent by Admin, and targeted to 'all', and I am looking at Admin's thread)
      if (c.target === 'all' && c.userId === 'admin_ramit_fixed_uid' && (activeChatUser?.id === 'admin_ramit_fixed_uid' || c.userId === myChatId)) return true;
      return false;
  });

  return (
    <div 
      className="flex flex-col flex-1 h-full min-h-0 bg-[#f1f5f9] md:bg-white md:rounded-xl md:border md:border-slate-200 overflow-hidden relative w-full font-khmer animate-in slide-in-from-right-5 duration-300 pb-0"
      onClick={()=>setShowAttachMenu(false)}
    >
      <ImageModal imageUrl={fullscreenImage} onClose={() => setFullscreenImage(null)} />

      {/* Action modal for message modification */}
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

      <div className="p-2.5 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 z-30 shadow-sm pt-safe">
        <div className="flex items-center gap-2.5">
           <button onClick={() => setActiveChatUser(null)} className="p-1.5 bg-slate-50 rounded-full border border-slate-200"><ArrowLeft className="w-4.5 h-4.5 text-slate-600"/></button>
           <div className="relative">
              <img src={activeChatUser.avatar || ' .png'} className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-white" alt="av"/>
              <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500 animate-pulse"></div>
           </div>
           <div className="min-w-0">
               <h2 className="font-black text-[13.5px] text-slate-800 truncate">{safeStr(activeChatUser.label)}</h2>
               <p className="text-[10px] font-bold text-emerald-500 mt-0.5">Online • ឆ្លើយតបរហ័ស</p>
           </div>
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
            const isMe = msg.userId === myChatId;
            
            let msgContent;
            if (msg.msgType === 'location') {
               msgContent = (
                  <div className="flex flex-col gap-2 p-0.5 text-slate-800 min-w-[200px]">
                     <LocationRouteMap senderCoords={msg.senderCoords} receiverCoords={gpsCoords} />
                     <a href={msg.mapUrl} target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-[#0F2B5C] text-white text-[11px] font-bold rounded-lg block active:scale-95 transition-transform">🗺️ បើកផែនទី Google Maps</a>
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
                    isMe={isMe}
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
                         className={`px-3 py-2.5 rounded-xl text-[14px] shadow-sm border relative cursor-pointer select-none transition-all ${
                            isMe 
                              ? 'bg-[#0F2B5C] border-[#0F2B5C] rounded-br-sm text-white' 
                              : 'bg-white text-slate-800 rounded-bl-sm border-slate-200'
                          }`}
                         onTouchStart={() => handlePressStart(msg)}
                         onTouchEnd={() => handlePressEnd(msg)}
                         onMouseDown={() => handlePressStart(msg)}
                         onMouseUp={() => handlePressEnd(msg)}
                         onMouseLeave={() => handlePressEnd(msg)}
                         onDoubleClick={(e) => {
                            e.preventDefault();
                            if (isAdmin || msg.userId === user?.uid) {
                               setSelectedActionMsg(msg);
                            }
                         }}
                      >
                         {msgContent}
                         {msg.target === 'all' && <div className="text-[9px] font-black text-amber-300 mb-1 flex items-center gap-1"><Megaphone className="w-3 h-3"/> ប្រកាសទូទៅ</div>}
                         <div className={`flex items-center justify-end gap-1 mt-1 opacity-80 text-[9px] font-bold self-end ${isMe ? 'text-sky-200' : 'text-slate-400'}`}>
                            {msg.edited && <span className="italic mr-1">edited</span>}
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && msg.seen && <CheckCheck className="w-2.5 h-2.5 ml-0.5 text-sky-300" />}
                            {isMe && !msg.seen && <Check className="w-2.5 h-2.5 ml-0.5 text-slate-300" />}
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
           <div className="w-full flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl py-2 px-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-rose-100/50 animate-pulse pointer-events-none"></div>
              <div className="flex items-center gap-2 relative z-10">
                 <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                 <span className="text-[13px] font-black text-rose-600">
                   {`0:${recordDuration.toString().padStart(2, '0')}`}
                 </span>
              </div>

              <div className="flex items-end gap-[2px] h-[16px] px-2 flex-1 justify-center max-w-[120px] relative z-10">
                 {pulseWaves.map((h, i) => (
                    <div 
                      key={i} 
                      className="w-[2px] bg-rose-500 rounded-full transition-all duration-100" 
                      style={{ height: `${h * 0.6}px` }} 
                    />
                 ))}
              </div>
              
              <div className="relative z-10 text-[10px] font-bold text-rose-400 bg-white/80 px-2 py-1 rounded shadow-sm">
                 ប្រលែងដៃដើម្បីផ្ញើ 📤
              </div>
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
                    onMouseLeave={stopAndCleanRecorder} // ការពារពេលអូសដៃចេញពីប៊ូតុង
                    className="w-11 h-11 rounded-full bg-sky-50 text-[#38BDF8] border border-sky-100 flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-90 active:bg-[#38BDF8] active:text-white"
                  >
                     <Mic className="w-5 h-5" />
                  </button>
              )}
           </form>
        )}
      </div>
    </div>
  );
}
  const AccountView = ({ user, profile, db, appId, showToast, setCurrentPage, isAdmin, setIsAdmin, setCurrentView, usersList = [], isSoundMuted, setIsSoundMuted }) => {
  const currentAdminProfile = isAdmin ? (usersList.find(u => u.id === 'admin_ramit_fixed_uid') || { username: 'ADMIN', avatar: profile?.avatar }) : null;
  const displayProfile = isAdmin ? currentAdminProfile : profile;

  const [pwdInput, setPwdInput] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [localName, setLocalName] = useState(displayProfile?.username || '');
  const [localBio, setLocalBio] = useState(displayProfile?.bio || '');
  const [isEditingName, setIsEditingName] = useState(!displayProfile?.username || displayProfile?.username === 'ភ្ញៀវ' ? true : false);

  const [lockoutTime, setLockoutTime] = useState(Number(localStorage.getItem('admin_lockout')) || 0);
  const [attempts, setAttempts] = useState(Number(localStorage.getItem('admin_attempts')) || 0);

  const toggleSound = () => {
    const newState = !isSoundMuted;
    if (setIsSoundMuted) setIsSoundMuted(newState);
    localStorage.setItem('tp_sound_muted', newState);
    showToast(newState ? 'បានបិទសំឡេង (Muted)' : 'បានបើកសំឡេង (Unmuted)');
  };

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
    if (!pwdInput.trim()) return showToast('សូមបំពេញលេខសម្ងាត់', 'error');

    setIsLoginLoading(true);
    try {
      const isMatch = await verifyAdminPassword(pwdInput.trim());
      
      if (isMatch) {
         setIsAdmin(true); 
         sessionStorage.setItem('tp_admin_session', 'true');
         
         const existingAdmin = (usersList || []).find(u => u.id === 'admin_ramit_fixed_uid');
         let adminAvatar = existingAdmin?.avatar || profile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

         if (db) {
             await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', 'admin_ramit_fixed_uid'), {
                username: 'ADMIN',
                role: 'admin',
                avatar: adminAvatar, 
                timestamp: Date.now(),
                lastActive: Date.now(),
                status: 'online',
                id: 'admin_ramit_fixed_uid'
             }, { merge: true }).catch(()=>{});
         }

         setLocalName('ADMIN');
         showToast('ចូលប្រើជាគណនី ADMIN ជោគជ័យ ✅');
         setShowAdminLogin(false);
         setPwdInput('');
         setAttempts(0);
         localStorage.removeItem('admin_attempts');
         setCurrentView('admin');
      } else {
         throw new Error("Password mismatch");
      }
    } catch (err) {
       const newAttempts = attempts + 1;
       setAttempts(newAttempts);
       localStorage.setItem('admin_attempts', newAttempts);
       
       if (db) {
          const ip = await getClientIP();
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'cyber_logs'), {
             type: 'Unauthorized security breach attempt to admin panel',
             username: profile?.username || 'Anonymous Password Entry',
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
      if (isAdmin) return showToast('មិនអាចប្តូរឈ្មោះ ADMIN បានទេ', 'error');
      
      const trimmedName = localName.trim();
      if(!trimmedName || trimmedName === 'ភ្ញៀវ') return showToast('ឈ្មោះមិនអាចទទេ ឬដាក់ថាភ្ញៀវទេ', 'error');
      
      // Stop regular users from taking the reserved name "ADMIN"
      if (trimmedName.toUpperCase() === 'ADMIN' && !isAdmin) {
         setLocalName(profile?.username || '');
         return showToast('ហាមឃាត់! ឈ្មោះ "ADMIN" ត្រូវបានរក្សាទុកសម្រាប់អភិបាលប្រព័ន្ធតែប៉ុណ្ណោះ។', 'error');
      }

      sessionStorage.removeItem('tp_is_guest');
      localStorage.setItem(`tp_username_${user?.uid}`, trimmedName);
      if (db && user) {
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user.uid), {
            username: trimmedName,
            bio: localBio.trim(),
            uid: user.uid,
            avatar: profile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            timestamp: Date.now(),
            lastActive: Date.now(),
            status: 'online',
            role: isAdmin ? 'admin' : 'user'
         }, { merge: true }).catch(()=>{});
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
       if (db) {
          const targetId = isAdmin ? 'admin_ramit_fixed_uid' : user.uid;
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', targetId), {
             avatar: b64
          }).catch(()=>{});
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
             <img src={displayProfile?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-full h-full object-cover bg-slate-100" alt="av"/>
             <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-5 h-5 text-white"/>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
             </label>
        </div>
        <div className="w-full relative z-10">
           <label className="text-[11px] font-bold text-slate-400 mb-1.5 block text-center uppercase tracking-widest">ឈ្មោះអ្នកប្រើប្រាស់ឧបករណ៍នេះ</label>
           {isEditingName && !isAdmin ? (
               <div className="flex flex-col gap-2">
                   <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-[14px] font-bold outline-none text-center" placeholder="កំណត់ឈ្មោះរបស់អ្នក..."/>
                   <textarea value={localBio} onChange={e => setLocalBio(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-[13px] font-medium outline-none h-20 resize-none text-center" placeholder="ការពិពណ៌នាអំពីខ្លួនអ្នក (ឧ. ទីតាំង, @telegram, លីង...)"></textarea>
                   <button onClick={handleSaveName} className="btn-gradient py-2.5 rounded-xl text-[13px] font-black shadow-sm">រក្សាទុក</button>
               </div>
           ) : (
               <div className="flex flex-col gap-2 w-full">
                   <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-full">
                       <span className="text-[14.5px] font-black text-[#0F2B5C]">{safeStr(displayProfile?.username)}</span>
                       {!isAdmin && <button onClick={() => setIsEditingName(true)} className="text-slate-600 bg-white border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow-sm"><Edit3 className="w-3.5 h-3.5"/> កែប្រែ</button>}
                   </div>
                   {!isAdmin && displayProfile?.bio && (
                       <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-full">
                           <p className="text-[12.5px] text-slate-600 font-medium whitespace-pre-wrap text-center">{safeStr(displayProfile.bio)}</p>
                       </div>
                   )}
               </div>
           )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
         <h2 className="text-[13px] font-black flex items-center gap-1.5 text-[#0F2B5C] border-b border-slate-100 pb-2">
            <Settings className="w-4.5 h-4.5 text-slate-400"/> ការកំណត់
         </h2>
         
         <div className="pt-1 space-y-3">
            <button onClick={() => setShowAdminLogin(true)} className="w-full bg-slate-50/50 hover:bg-slate-100/55 text-[#0F2B5C] py-3 rounded-xl font-black flex items-center justify-center gap-2 text-[12.5px] transition active:scale-95 shadow-sm border border-slate-200/50">
               <ShieldAlert className="w-4.5 h-4.5 text-[#0F2B5C] animate-pulse"/> Admin Portal របស់ប្រព័ន្ធ
            </button>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
               <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${isSoundMuted ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                     {isSoundMuted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                  </div>
                  <div>
                     <h4 className="font-bold text-[12px] text-slate-800">សំឡេងជូនដំណឹង (Ping Sound)</h4>
                     <p className="text-[10px] text-slate-500 font-medium">បើក ឬបិទសំឡេងរោទ៍ពេលមានសារថ្មីចូល</p>
                  </div>
               </div>
               <label className="relative flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only toggle-checkbox" checked={!isSoundMuted} onChange={toggleSound} />
                  <div className={`w-10 h-6 rounded-full transition-colors duration-300 toggle-label ${!isSoundMuted ? 'bg-[#10b981]' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${!isSoundMuted ? 'translate-x-4' : 'translate-x-0'}`}></div>
               </label>
            </div>
         </div>
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in bg-slate-900/70 backdrop-blur-md">
           <div className="relative w-full max-w-sm mx-auto bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#0F2B5C] to-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck className="w-6 h-6 text-[#38BDF8]"/>
              </div>
              
              <h3 className="text-[14px] font-black mb-1 text-[#0F2B5C] uppercase">បញ្ជាក់សិទ្ធិជាអភិបាល</h3>
              <p className="text-[11.5px] text-slate-400 mb-4 font-medium">សូមបញ្ចូលលេខសម្ងាត់ Admin</p>
              
              <div className="mb-4">
                 <input 
                   type="password" 
                   value={pwdInput} 
                   onChange={e=>setPwdInput(e.target.value)} 
                   placeholder="លេខសម្ងាត់..." 
                   disabled={lockoutTime > 0}
                   className="w-full bg-slate-50 px-3 py-3 rounded-xl outline-none font-bold border border-slate-200 text-[14px] text-slate-800 disabled:opacity-50 text-center"
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

const AdminDashboard = ({ locations = [], setLocations, pendingLocations = [], usersList = [], cyberLogs = [], chats = [], dbRegions, setDbRegions, db, appId, showToast, setCurrentView, setIsAdmin, chatTargets = [], setChatTargets, appeals = [], setAppeals, cosmicTheme, setCosmicTheme, customBg, setCustomBg, appLogo, setAppLogo, gatewayBg, setGatewayBg }) => {
  const [activeTab, setActiveTab] = useState('data'); 
  const [editingLoc, setEditingLoc] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUsersForDelete, setSelectedUsersForDelete] = useState([]);

  const [howToData, setHowToData] = useState({ guides: [], videoUrl: '' });

  useEffect(() => {
      if (!db || !appId) return;
      const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'how_to_use'), (docSnap) => {
          if (docSnap.exists()) {
              setHowToData(docSnap.data());
          }
      });
      return () => unsub();
  }, [db, appId]);

  const [confirmAction, setConfirmAction] = useState(null);
  const [monitoringUser, setMonitoringUser] = useState(null);
  const [monitoringTarget, setMonitoringTarget] = useState('Admin');

  const openConfirm = (title, message, action) => setConfirmAction({ title, message, action });
  
  const handleConfirm = async () => {
     if (confirmAction && confirmAction.action) {
        await confirmAction.action();
     }
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

  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [editingBroadcast, setEditingBroadcast] = useState(null);
  const [editBroadcastText, setEditBroadcastText] = useState('');

  const handleApprove = async (id, authorUid) => { 
      try {
        if (!db) throw new Error("Offline mode");
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_admin_data', id), { status: 'approved' }); 
        
        if (authorUid) {
           await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), { 
               targetId: authorUid,
               title: 'សំណើរជោគជ័យ ✅',
               msg: 'Admin បានព្រមលើសំណើររបស់អ្នក។ ទិន្នន័យត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធផ្លូវការ।',
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
      openConfirm(
         "បញ្ជាក់ការលុបសមាជិកទាំងអស់", 
         "សកម្មភាពនេះនឹងលុបគណនីសមាជិកទាំងអស់ ចេញពីប្រព័ន្ធទាំងស្រុង។ តើអ្នកចង់បន្តទេ?", 
         async () => {
            showToast('កំពុងដំណើរការលុបសមាជិក...', 'info');
            if (db) {
               for (const userObj of usersList) {
                  // Keep the primary static Admin 'ramit' reference
                  if (userObj.id && userObj.id !== 'admin_ramit_fixed_uid') {
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

  const handleBulkDeleteUsers = () => {
      if (selectedUsersForDelete.length === 0) return;
      openConfirm(
         `លុបគណនី (${selectedUsersForDelete.length})`, 
         `តើអ្នកពិតជាចង់លុបគណនីដែលបានជ្រើសរើសទាំង ${selectedUsersForDelete.length} នេះមែនទេ?`, 
         async () => {
            if (db) {
               for (const uid of selectedUsersForDelete) {
                  await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', uid)).catch(()=>{});
               }
            }
            setSelectedUsersForDelete([]);
            showToast(`បានលុបគណនី ${selectedUsersForDelete.length} ជោគជ័យ`);
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
               msg: 'សកម្មភាពសន្ទនារបស់អ្នកត្រូវបានតាមដាន। សូមរក្សាពាក្យសម្តីសមរម្យ។',
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
      openConfirm("លុបគណនីចេញពីទូរស័ព្ទ (Force Wiping Device)", `សកម្មភាពនេះនឹងលុបគណនី ${userObj.username} ចេញពីទូរស័ព្ទ និងផ្តាច់ទិន្នន័យទាំងអស់ភ្លាមៗ។ ចង់បន្តទេ?`, async () => {
         if (db) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id), { forceLogout: true });
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userObj.id)).catch(()=>{});
         }
         showToast(`បានបញ្ជាលុប Web App ចេញពីទូរស័ព្ទរបស់ ${userObj.username} រួចរាល់!`, 'success');
      });
  };

  const handleDeleteTrollUser = (userObj) => {
      openConfirm(
         `លុបគណនី ${userObj.username}`, 
         `តើអ្នកពិតជាចង់លុបគណនីរបស់ ${userObj.username} មែនទេ?`, 
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
               msg: 'សំណើរសុំសម្រុះសម្រួលរបស់អ្នកត្រូវបានអនុម័ត। គណនីត្រូវបានបើកឲ្យប្រើប្រាស់ធម្មតាវិញហើយ។',
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

  const handleCustomBgChange = async (colorHex) => {
      setCustomBg(colorHex);
      if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'theme'), { customBg: colorHex }, { merge: true }).catch(()=>{});
      showToast('រក្សាទុកផ្ទៃពណ៌ Background ជោគជ័យ');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
       const b64 = r.result;
       setAppLogo(b64);
       if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'theme'), { appLogo: b64 }, { merge: true }).catch(()=>{});
       showToast('ប្តូររូបភាព Logo សាលាបានជោគជ័យ ✅');
    };
    r.readAsDataURL(file);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return showToast('សូមបញ្ជូលសារប្រកាសសិន', 'error');
    if (!db) return showToast('Offline Sandbox Mode');
    
    openConfirm("ផ្ញើសារប្រកាស (Broadcast)", "តើអ្នកពិតជាចង់ផ្ញើសារនេះទៅកាន់ User ទាំងអស់មែនទេ? សារនេះនឹងធ្លាក់ចូលប្រអប់សាររបស់ User គ្រប់ៗគ្នា។", async () => {
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA'), {
              text: broadcastMessage.trim(), 
              msgType: 'text',
              target: 'all', 
              userId: 'admin_ramit_fixed_uid', 
              userName: 'ADMIN-PAGE', 
              seen: false,
              edited: false,
              timestamp: Date.now()
            });
            
            // បាញ់ Notification ទៅកាន់ User ទាំងអស់ដើម្បីឲ្យលោតសំឡេង និងចូលប្រអប់សារ
            usersList.forEach(u => {
               if (u.id && u.id !== 'admin_ramit_fixed_uid' && u.username !== 'ភ្ញៀវ') {
                   addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'user_notifications'), {
                      targetId: u.id,
                      title: '📢 សារប្រកាសពី Admin',
                      msg: broadcastMessage.trim(),
                      type: 'info',
                      timestamp: Date.now()
                   }).catch(()=>{});
               }
            });

            setBroadcastMessage('');
            showToast('បានផ្ញើសារប្រកាសទៅកាន់ User ទាំងអស់រួចរាល់ ✅', 'success');
        } catch (e) {
            showToast('មានបញ្ហាក្នុងការបញ្ជូន', 'error');
        }
    });
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

      {/* Edit Location Modal */}
      {editingLoc && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 pointer-events-auto">
          <div className="relative w-full max-w-lg bg-white rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-[14px] font-black text-[#0F2B5C] flex items-center gap-1.5"><Edit3 className="w-4.5 h-4.5 text-[#38BDF8]" /> កែប្រែទិន្នន័យទីតាំង</h2>
              <button type="button" onClick={() => setEditingLoc(null)} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-full text-slate-500 hover:text-rose-500">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-white space-y-4 pb-20 font-khmer">
              <div>
                 <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wider">ចំណងជើង / ឈ្មោះទីតាំង *</label>
                 <input type="text" value={editingLoc.title || ''} onChange={e=>setEditingLoc({...editingLoc, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ប្រភេទ Category *</label>
                <input type="text" value={editingLoc.category || ''} onChange={e=>setEditingLoc({...editingLoc, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ស្រុក</label>
                      <input type="text" value={editingLoc.district || ''} onChange={e=>setEditingLoc({...editingLoc, district: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800" />
                  </div>
                  <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ឃុំ</label>
                      <input type="text" value={editingLoc.commune || ''} onChange={e=>setEditingLoc({...editingLoc, commune: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800" />
                  </div>
              </div>
              
              <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ភូមិ</label>
                  <input type="text" value={editingLoc.village || ''} onChange={e=>setEditingLoc({...editingLoc, village: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[15px] outline-none font-bold text-slate-800" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">រូបភាព (Base64 URL) *</label>
                <input type="text" value={editingLoc.image || ''} onChange={e=>setEditingLoc({...editingLoc, image: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12px] font-mono outline-none" />
                {editingLoc.image && (
                   <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-slate-200">
                      <img src={editingLoc.image} alt="Preview" className="w-full h-full object-cover" />
                   </div>
                )}
              </div>
              
              <div>
                 <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">ការពណ៌នា</label>
                 <textarea value={editingLoc.desc || ''} onChange={e=>setEditingLoc({...editingLoc, desc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[14.5px] outline-none h-24 resize-none font-medium text-slate-800"></textarea>
              </div>

              <div>
                 <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">ព័ត៌មានទំនាក់ទំនង (JSON Array)</label>
                 <textarea value={JSON.stringify(editingLoc.contacts || [], null, 2)} onChange={e => {
                    try {
                       setEditingLoc({...editingLoc, contacts: JSON.parse(e.target.value)});
                    } catch(err) {
                       // Silently ignore parse errors while typing
                    }
                 }} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono h-24 outline-none"></textarea>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50 flex gap-2">
                <button onClick={() => setEditingLoc(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] active:scale-95 transition-all border border-slate-200">បោះបង់</button>
                <button onClick={async () => {
                   if (db) {
                      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_admin_data', editingLoc.id), {
                         title: editingLoc.title,
                         category: editingLoc.category,
                         district: editingLoc.district,
                         commune: editingLoc.commune,
                         village: editingLoc.village,
                         image: editingLoc.image,
                         desc: editingLoc.desc,
                         contacts: editingLoc.contacts
                      }).catch(()=>{});
                      showToast('បានរក្សាទុកការកែប្រែដោយជោគជ័យ ✅');
                   }
                   setEditingLoc(null);
                }} className="flex-1 py-3 bg-[#0F2B5C] text-white rounded-xl font-black text-[13px] shadow-md active:scale-95 transition-all">រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

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

      <div className="flex w-full gap-2 overflow-x-auto hide-scrollbar pb-2 pt-1 touch-pan-x scroll-smooth">
        {[
          {id: 'data', label: 'ទិន្នន័យ & ទីតាំង'},
          {id: 'how_to', label: 'គ្រប់គ្រង របៀបប្រើប្រាស់'},
          {id: 'chat_manage', label: 'គ្រប់គ្រងទំនាក់ទំនង'},
          {id: 'chat_monitor', label: 'គ្រប់គ្រងបទល្មើស'},
          {id: 'broadcast', label: 'ប្រកាសព័ត៌មាន (Broadcast)'},          
          {id: 'appeals', label: 'សំណើសម្រុះសម្រួល'},
          {id: 'approvals', label: 'អនុម័តសំណើរ'},
          {id: 'security', label: 'Security & Logs'},
          {id: 'settings', label: 'Settings'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`shrink-0 px-3.5 py-2 rounded-lg text-[11px] font-black whitespace-nowrap transition-colors shadow-sm ${activeTab === t.id ? 'bg-[#0F2B5C] text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{t.label}</button>
        ))}
      </div>

      <div className="min-h-[300px]">
          {activeTab === 'how_to' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-3 border-l-4 border-emerald-500 pl-2">
                   <h3 className="font-black text-[12.5px] text-[#0F2B5C]">គ្រប់គ្រង របៀបប្រើប្រាស់ Web App</h3>
                   <button onClick={async () => {
                       if(db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'how_to_use'), howToData);
                       showToast('រក្សាទុករួចរាល់ ✅', 'success');
                   }} className="bg-[#10b981] hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[11px] font-black shadow-sm transition-colors">រក្សាទុក (Save)</button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold text-[12px] text-slate-800">ផ្នែកទី១: ការណែនាំ (Guides)</h4>
                           <button onClick={() => {
                               setHowToData({...howToData, guides: [...(howToData.guides || []), {title: '', text: '', image: ''}]});
                           }} className="bg-[#38BDF8] hover:bg-sky-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm flex items-center gap-1 transition-colors">
                              <Plus className="w-3.5 h-3.5"/> បន្ថែម (Add)
                           </button>
                        </div>
                        <div className="space-y-3">
                            {howToData.guides && howToData.guides.map((g, idx) => (
                                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm relative">
                                    <button onClick={() => {
                                        const newGuides = [...howToData.guides];
                                        newGuides.splice(idx, 1);
                                        setHowToData({...howToData, guides: newGuides});
                                    }} className="absolute top-2 right-2 text-rose-500 p-1 bg-rose-50 rounded-md hover:bg-rose-100 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                    
                                    <div className="space-y-2 mr-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ចំណងជើងទី {idx + 1}</label>
                                            <input type="text" value={g.title || ''} onChange={e => {
                                                const newGuides = [...howToData.guides];
                                                newGuides[idx].title = e.target.value;
                                                setHowToData({...howToData, guides: newGuides});
                                            }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold outline-none" placeholder="ចំណងជើង..."/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">អត្ថបទខាងក្រោមចំណងជើង</label>
                                            <textarea value={g.text || ''} onChange={e => {
                                                const newGuides = [...howToData.guides];
                                                newGuides[idx].text = e.target.value;
                                                setHowToData({...howToData, guides: newGuides});
                                            }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-medium h-20 outline-none" placeholder="អត្ថបទ..."></textarea>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">រូបភាព (Upload Picture)</label>
                                            <label className="relative flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-300 bg-slate-50 rounded-lg cursor-pointer overflow-hidden hover:bg-slate-100 transition-colors">
                                                {g.image ? <img src={g.image} alt="preview" className="w-full h-full object-cover" /> : <div className="text-[10px] font-bold text-slate-400 flex flex-col items-center"><ImageSvgIcon className="mb-1 w-5 h-5"/> ជ្រើសរើសរូបភាព</div>}
                                                <input type="file" accept="image/*" className="hidden" onChange={e => {
                                                    if(e.target.files && e.target.files[0]) {
                                                        const r = new FileReader();
                                                        r.onload = () => {
                                                            const newGuides = [...howToData.guides];
                                                            newGuides[idx].image = r.result;
                                                            setHowToData({...howToData, guides: newGuides});
                                                        };
                                                        r.readAsDataURL(e.target.files[0]);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => {
                                setHowToData({...howToData, guides: [...(howToData.guides || []), {title: '', text: '', image: ''}]});
                            }} className="w-full py-2 border-2 border-dashed border-[#38BDF8] text-[#38BDF8] bg-sky-50 hover:bg-sky-100 rounded-lg font-black text-[11px] transition-colors">+ បន្ថែមចំណងជើង និងអត្ថបទថ្មី</button>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-[12px] text-slate-800 mb-2">ផ្នែកទី២: Video ការណែនាំ</h4>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">YouTube Video URL</label>
                            <input type="text" value={howToData.videoUrl || ''} onChange={e => setHowToData({...howToData, videoUrl: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-[12px] font-bold outline-none" placeholder="ឧ. https://www.youtube.com/watch?v=..."/>
                        </div>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'broadcast' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-3 border-l-4 border-amber-500 pl-2">
                   <h3 className="font-black text-[13px] text-[#0F2B5C] flex items-center gap-1.5"><Megaphone className="w-4.5 h-4.5 text-amber-500"/> ប្រកាសព័ត៌មានទូទៅ (Broadcast)</h3>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 mb-4">
                    <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                        សារដែលអ្នកសរសេរនៅទីនេះ នឹងត្រូវបានផ្ញើចូលទៅកាន់ប្រអប់សារ (Chat) របស់ User ទាំងអស់ដែលប្រើប្រាស់ Web App នេះភ្លាមៗ។ 
                        សូមប្រើប្រាស់មុខងារនេះសម្រាប់តែការផ្តល់ព័ត៌មានសំខាន់ៗប៉ុណ្ណោះ។
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">អត្ថបទសារប្រកាស</label>
                        <textarea 
                           value={broadcastMessage}
                           onChange={e => setBroadcastMessage(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-medium outline-none h-32 resize-none text-slate-800"
                           placeholder="សរសេរសារដែលចង់ប្រកាសនៅទីនេះ..."
                        ></textarea>
                    </div>
                    <button 
                       onClick={handleSendBroadcast}
                       className="w-full btn-gradient py-3.5 rounded-xl font-black text-[13px] shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform"
                    >
                       <Megaphone className="w-4.5 h-4.5"/> ផ្ញើសារប្រកាសទៅកាន់គ្រប់គ្នា (Send to All)
                    </button>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-4">
                   <h4 className="font-black text-[12px] text-slate-800 pb-1">ប្រវត្តិសារប្រកាស (Recent Broadcasts)</h4>
                   <div className="max-h-[300px] overflow-y-auto pr-1 hide-scrollbar space-y-2">
                      {chats.filter(c => c && c.target === 'all' && c.userId === 'admin_ramit_fixed_uid').sort((a,b) => b.timestamp - a.timestamp).length === 0 ? (
                          <p className="text-center py-4 text-[11px] text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50">គ្មានសារប្រកាសនៅឡើយទេ</p>
                      ) : (
                          chats.filter(c => c && c.target === 'all' && c.userId === 'admin_ramit_fixed_uid').sort((a,b) => b.timestamp - a.timestamp).map(msg => (
                             <div key={msg.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm relative">
                                 {editingBroadcast?.id === msg.id ? (
                                    <div className="space-y-2">
                                       <textarea value={editBroadcastText} onChange={e=>setEditBroadcastText(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[12px] font-medium h-24 outline-none resize-none"></textarea>
                                       <div className="flex gap-2">
                                          <button onClick={async () => {
                                             if(!editBroadcastText.trim()) return;
                                             if(db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', msg.id), { text: editBroadcastText.trim(), edited: true }).catch(()=>{});
                                             setEditingBroadcast(null);
                                             showToast('កែប្រែជោគជ័យ ✅', 'success');
                                          }} className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg text-[11px] font-black shadow-sm">រក្សាទុក</button>
                                          <button onClick={()=>setEditingBroadcast(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-300">បោះបង់</button>
                                       </div>
                                    </div>
                                 ) : (
                                    <>
                                       <div className="flex justify-between items-start gap-2 mb-2">
                                          <span className="text-[10px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">{new Date(msg.timestamp).toLocaleString()} {msg.edited && <span className="text-sky-500">(edited)</span>}</span>
                                          <div className="flex gap-1.5 shrink-0">
                                             <button onClick={()=>{setEditingBroadcast(msg); setEditBroadcastText(msg.text);}} className="text-sky-500 p-1.5 bg-white shadow-sm border border-slate-200 rounded-md hover:bg-sky-50"><Edit3 className="w-3.5 h-3.5"/></button>
                                             <button onClick={()=>openConfirm("លុបសារប្រកាស", "តើអ្នកពិតជាចង់លុបសារប្រកាសនេះចេញពីប្រអប់សារអ្នកប្រើប្រាស់មែនទេ?", async () => {
                                                if(db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'CHAT_DATA', msg.id)).catch(()=>{});
                                                showToast('លុបសារប្រកាសជោគជ័យ ✅');
                                             })} className="text-rose-500 p-1.5 bg-white shadow-sm border border-slate-200 rounded-md hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5"/></button>
                                          </div>
                                       </div>
                                       <p className="text-[12.5px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{safeStr(msg.text)}</p>
                                    </>
                                 )}
                             </div>
                          ))
                      )}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in">
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                     <h3 className="font-black text-[13px] text-[#0F2B5C] flex items-center gap-1.5"><Shield className="w-4.5 h-4.5 text-rose-500"/> SECURITY CYBER LOGS</h3>
                     <button onClick={() => clearLog()} className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1.5 rounded-lg font-black flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5"/> សម្អាត Logs ទាំងអស់
                     </button>
                 </div>
                 <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 hide-scrollbar">
                     {cyberLogs.length === 0 ? (
                         <p className="text-center py-8 text-[11px] font-bold text-slate-400">គ្មានសកម្មភាពគួរឱ្យសង្ស័យឡើយ ✅</p>
                     ) : (
                         cyberLogs.map(log => log && (
                             <div key={log.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex justify-between items-start gap-2 text-left">
                                 <div>
                                     <p className="text-[12px] font-black text-rose-600 flex items-center gap-1">⚠️ {safeStr(log.type)}</p>
                                     <p className="text-[10px] text-slate-500 mt-0.5">ឈ្មោះ: <span className="font-bold text-slate-700">{safeStr(log.username)}</span> | IP: <span className="font-bold text-slate-700">{safeStr(log.ip)}</span></p>
                                     <p className="text-[9.5px] text-slate-400 font-bold mt-1 tracking-wider leading-relaxed">Device: {safeStr(log.device)}</p>
                                 </div>
                                 <div className="text-right shrink-0">
                                     <span className="text-[8.5px] text-slate-400 font-bold block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                     <button onClick={() => clearLog(log.id)} className="p-1 text-rose-500 hover:text-rose-700 mt-1 block ml-auto"><Trash2 className="w-3.5 h-3.5"/></button>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in">
                 <h3 className="font-black text-[12.5px] border-l-4 border-[#38BDF8] pl-2 text-[#0F2B5C]">ការកំណត់ចលនាទំព័រដើម & UI</h3>
                 
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

                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                     <div>
                        <h4 className="font-bold text-[12.5px] text-slate-800">ប្ដូររូបសញ្ញាសាលារៀន (Upload High School Logo)</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">រូបភាពនេះនឹងបង្ហាញនៅលើក្បាលទំព័រ និងទំព័រស្វាគមន៍ជំនួសរូបតំណាងចាស់។</p>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-14 h-14 rounded-full border border-slate-300 bg-white flex items-center justify-center overflow-hidden">
                             {appLogo ? <img src={appLogo} alt="School Logo" className="w-full h-full object-cover" /> : <GraduationCap className="w-7 h-7 text-[#0F2B5C]"/>}
                         </div>
                         <label className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-transform">
                             Upload Logo សាលា
                             <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                         </label>
                     </div>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                     <div>
                        <h4 className="font-bold text-[12.5px] text-slate-800">ប្ដូររូបភាពផ្ទៃក្រោយទំព័រស្វាគមន៍ (Gateway Background)</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">រូបភាពនេះនឹងបង្ហាញនៅលើផ្ទៃខាងក្រោយផ្នែកខាងឆ្វេង (ផ្នែកសរ) នៃទំព័រស្វាគមន៍ដំបូង។</p>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-14 h-14 rounded-lg border border-slate-300 bg-white flex items-center justify-center overflow-hidden">
                             {gatewayBg ? <img src={gatewayBg} alt="Gateway BG" className="w-full h-full object-cover" /> : <span className="text-[9px] text-slate-400">លំនាំដើម (ស)</span>}
                         </div>
                         <div className="flex gap-2">
                             <label className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-transform">
                                 Upload រូបភាព
                                 <input type="file" accept="image/*" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                       const r = new FileReader();
                                       r.onload = async () => {
                                          const b64 = r.result;
                                          setGatewayBg(b64);
                                          if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'theme'), { gatewayBg: b64 }, { merge: true }).catch(()=>{});
                                          showToast('បានប្តូររូបភាព Background ទំព័រស្វាគមន៍ជោគជ័យ ✅');
                                       };
                                       r.readAsDataURL(e.target.files[0]);
                                    }
                                 }} className="hidden" />
                             </label>
                             {gatewayBg && (
                                 <button onClick={async () => {
                                    setGatewayBg('');
                                    if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'theme'), { gatewayBg: '' }, { merge: true }).catch(()=>{});
                                    showToast('បានកំណត់ទៅលំនាំដើមវិញ');
                                 }} className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold shadow-sm active:scale-95">
                                     លុបចេញ
                                 </button>
                             )}
                         </div>
                     </div>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                     <div>
                        <h4 className="font-bold text-[12.5px] text-slate-800">ប្ដូរពណ៌ផ្ទៃក្រោយទូទៅ (Custom App Background Color)</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">ជ្រើសរើសពណ៌សម្រាប់ផ្ទៃខាងក្រោយទូទៅរបស់កម្មវិធីនៅលើទូរស័ព្ទដៃ។</p>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {['#f8fafc', '#f1f5f9', '#e2e8f0', '#fef08a', '#ecfdf5', '#fff1f2'].map(colorHex => (
                             <button 
                                key={colorHex} 
                                onClick={() => handleCustomBgChange(colorHex)}
                                className="w-8 h-8 rounded-full border border-slate-300 shadow-sm transition-transform active:scale-90"
                                style={{ backgroundColor: colorHex }}
                                title={colorHex}
                             />
                         ))}
                     </div>
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
                    {selectedUsersForDelete.length > 0 ? (
                        <button 
                           onClick={handleBulkDeleteUsers} 
                           className="px-3 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:scale-95 transition-all text-[11px] font-black flex items-center gap-1" 
                           title="លុបជម្រើស"
                        >
                           <Trash2 className="w-4 h-4" /> លុប ({selectedUsersForDelete.length})
                        </button>
                    ) : (
                        <button 
                           onClick={handleWipeAllUsers} 
                           className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:scale-95 transition-all" 
                           title="លុបសមាជិកទាំងអស់"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                    )}
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
                                 <input 
                                     type="checkbox" 
                                     checked={selectedUsersForDelete.includes(u.id)}
                                     onChange={(e) => {
                                         if (e.target.checked) setSelectedUsersForDelete([...selectedUsersForDelete, u.id]);
                                         else setSelectedUsersForDelete(selectedUsersForDelete.filter(id => id !== u.id));
                                     }}
                                     className="w-4 h-4 rounded border-slate-300 text-[#0F2B5C] cursor-pointer"
                                 />
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
                                        const tMap = new Map();
                                        chats.forEach(c => {
                                           if (c && c.userId === u.id && c.target) tMap.set(c.target, c.target);
                                           else if (c && c.target === u.id && c.userId) tMap.set(c.userId, c.userId);
                                        });
                                        const tList = Array.from(tMap.keys());
                                        const defaultTarget = tList.length > 0 ? tList[0] : 'admin_ramit_fixed_uid';
                                        
                                        setMonitoringUser(u);
                                        setMonitoringTarget(defaultTarget);
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

               <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex gap-1.5 shrink-0 overflow-x-auto hide-scrollbar">
                  {(() => {
                     const targetsMap = new Map();
                     chats.forEach(c => {
                        if (c && c.userId === monitoringUser.id) {
                           if (c.target && !targetsMap.has(c.target)) targetsMap.set(c.target, c.target);
                        } else if (c && c.target === monitoringUser.id) {
                           if (c.userId && !targetsMap.has(c.userId)) targetsMap.set(c.userId, c.userId);
                        }
                     });
                     
                     const dynamicTargets = Array.from(targetsMap.entries()).map(([id, _]) => {
                         let label = id;
                         if (id === 'admin_ramit_fixed_uid') label = 'Admin Support';
                         else {
                            const t = chatTargets.find(x => x.id === id);
                            if (t) label = t.label;
                            else {
                               const u = usersList.find(x => x.id === id);
                               if (u) label = u.username;
                            }
                         }
                         return { id, label };
                     });

                     if (dynamicTargets.length === 0) return <span className="text-[10px] text-slate-500 font-bold p-1">មិនទាន់មានដៃគូឆាតទេ</span>;

                     return dynamicTargets.map(targetTab => (
                         <button 
                            key={targetTab.id}
                            onClick={() => setMonitoringTarget(targetTab.id)}
                            className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-[9.5px] font-black transition-all border ${monitoringTarget === targetTab.id ? 'bg-[#0F2B5C] text-white border-transparent shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
                         >
                            {targetTab.label}
                         </button>
                     ));
                  })()}
               </div>

               <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 telegram-bg hide-scrollbar">
                  {chats.filter(c => c && ((c.userId === monitoringUser.id && c.target === monitoringTarget) || (c.userId === monitoringTarget && c.target === monitoringUser.id))).length === 0 ? (
                     <div className="text-center py-10 text-slate-400 font-bold text-[11px]">
                        សូមជ្រើសរើសដៃគូឆាតខាងលើ ដើម្បីមើលសារ (បើមាន)
                     </div>
                  ) : (
                     chats.filter(c => c && ((c.userId === monitoringUser.id && c.target === monitoringTarget) || (c.userId === monitoringTarget && c.target === monitoringUser.id))).map(msg => (
                        <div key={msg.id} className={`flex ${msg.userId === monitoringUser.id ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                           <div className={`max-w-[85%] border rounded-xl p-2.5 shadow-sm text-left ${msg.userId === monitoringUser.id ? 'bg-sky-50 border-sky-100' : 'bg-white border-slate-200'}`}>
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
         <button onClick={(e)=>{ e.stopPropagation(); onToggleFavorite(); }} className={`p-1.5 rounded-full backdrop-blur-md shadow-sm transition active:scale-95 ${isFavorite ? 'bg-emerald-50 border border-emerald-200 text-emerald-500' : 'bg-white/90 border border-slate-200 text-slate-400'}`}>
            <Pin className={`w-3.5 h-3.5 ${isFavorite ? 'fill-emerald-500 text-emerald-500' : ''}`} />
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
               <span className="text-[10px] font-bold text-[#38BDF8] flex items-center gap-0.5 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100"><Pin className="w-2.5 h-2.5 fill-current"/> {location.likes || 0} Pins</span>
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
    <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto font-khmer">
       <div className="bg-white w-full max-w-lg rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-slate-200 animate-in zoom-in-95 duration-300">
          <div className="relative w-full aspect-[16/10] bg-slate-100 shrink-0">
             <img src={location.image} className="w-full h-full object-cover object-center" alt="loc"/>
             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end justify-between">
                <div>
                   <span className="bg-[#38BDF8] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border border-sky-400 uppercase tracking-wider">{safeStr(location.category)}</span>
                   <h2 className="text-white font-black text-[14.5px] mt-1 leading-tight">{displayTitle}</h2>
                </div>
                <button onClick={() => toggleFavorite(location.id)} className={`p-2 rounded-full backdrop-blur-md active:scale-95 transition ${isFav ? 'bg-emerald-500 text-white shadow-lg border border-emerald-400' : 'bg-white text-slate-500 border border-transparent'}`}>
                   <Pin className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`}/>
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
                      📍 ចម្ងាយពីអ្នក: {calculatedDistanceVal < 1 ? `${Math.round(calculatedDistanceVal * 1000)} m` : `${calculatedDistanceVal} KM`}
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