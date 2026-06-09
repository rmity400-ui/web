import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  MapPin, Search, PlusCircle, ShieldCheck, User, Sun, Moon, 
  ChevronRight, ChevronDown, Phone, Map as MapIcon, Check, X, AlertTriangle, 
  LogOut, Camera, Plus, Compass, BarChart2, ShieldAlert, Bell, Clock, ArrowLeft, Home, FileText, Activity, Users, Layers
} from 'lucide-react';
import "./assets/ramit.png";

// === CONFIGURATION & INITIALIZATION ===
const firebaseConfig = {
  apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E", 
  authDomain: "ramit-7e364.firebaseapp.com",
  projectId: "ramit-7e364",
  storageBucket: "ramit-7e364.firebasestorage.app",
  messagingSenderId: "1036691345731",
  appId: "1:1036691345731:web:df8121852c6137e3b35ff6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ramit-7e364';

const ADMIN_PASSWORD_HASH = "ict168mit"; 
const ROTANAK_MONDOL_COMMUNES = ["ស្តៅ", "ផ្លូវមាស", "អណ្តើកហែប", "រស្មីសង្ហា", "ត្រែង"];

// Get Device Info for Security Logs
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone / iOS';
  if (/iPad/i.test(ua)) return 'iPad / iOS';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac OS';
  return 'Unknown Device';
};

// ==========================================
// SEED DATA FOR INTERACTIVE MAP EXPLORER
// ==========================================
const RatanakMondolData = {
  "ស្តៅ": {
    "ភូមិស្តៅ": {
      schools: [{ name: "សាលាបឋមសិក្សាស្តៅ", info: "សិស្សសរុប ៣៥០ នាក់", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" }],
      hospitals: [{ name: "មណ្ឌលសុខភាពស្តៅ", info: "គ្រូពេទ្យប្រចាំការ ២៤ ម៉ោង", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80" }],
      police: [{ name: "ប៉ុស្តិ៍នគរបាលរដ្ឋបាលឃុំស្តៅ", info: "ទំនាក់ទំនង៖ ០១២-៩៩៨-៨៧៧", image: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=600&q=80" }],
      leaders: [{ role: "មេភូមិស្តៅ", name: "លោក សៅ សារឿន", phone: "092-111-222" }],
      households: 230,
      population: 1120
    },
    "ភូមិបឹងអំពិល": {
      schools: [{ name: "សាលាបឋមសិក្សាបឹងអំពិល", info: "សិស្សសរុប ១៨០ នាក់", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" }],
      hospitals: [],
      police: [],
      leaders: [{ role: "មេភូមិបឹងអំពិល", name: "លោក ង៉ែត ធារ៉ា", phone: "093-222-333" }],
      households: 145,
      population: 720
    },
    "ភូមិអូរដំបង": {
      schools: [],
      hospitals: [],
      police: [],
      leaders: [{ role: "មេភូមិអូរដំបង", name: "លោក ហ៊ាន សុខា", phone: "088-333-444" }],
      households: 98,
      population: 460
    }
  },
  "ផ្លូវមាស": {
    "ភូមិផ្លូវមាស": {
      schools: [{ name: "សាលាបឋមសិក្សាបណ្តុះវិជ្ជា", info: "សាលារៀនកម្រិតបឋមសិក្សា", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" }],
      hospitals: [{ name: "មណ្ឌលសុខភាពឃុំផ្លូវមាស", info: "សេវាសុខាភិបាលសហគមន៍", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80" }],
      police: [{ name: "ប៉ុស្តិ៍នគរបាលឃុំផ្លូវមាស", info: "ទំនាក់ទំនងអាសន្ន៖ ០៨៨-៧៧៦-៦៥៥", image: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=600&q=80" }],
      leaders: [{ role: "មេភូមិផ្លូវមាស", name: "លោក ទេព មុនី", phone: "097-444-555" }],
      households: 190,
      population: 930
    },
    "ភូមិទឹកហូរ": {
      schools: [],
      hospitals: [],
      police: [],
      leaders: [{ role: "មេភូមិទឹកហូរ", name: "លោក សួន ម៉ន", phone: "012-555-666" }],
      households: 112,
      population: 520
    }
  },
  "អណ្តើកហែប": {
    "ភូមិអណ្តើកហែប": {
      schools: [{ name: "សាលាបឋមសិក្សាអណ្តើកហែប", info: "សាលារៀនរដ្ឋ", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" }],
      hospitals: [{ name: "ប៉ុស្តិ៍សុខភាពអណ្តើកហែប", info: "សេវាសុខភាពបឋម", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80" }],
      police: [{ name: "ប៉ុស្តិ៍នគរបាលអណ្តើកហែប", info: "សន្តិសុខសហគមន៍", image: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=600&q=80" }],
      leaders: [{ role: "មេភូមិអណ្តើកហែប", name: "លោក គង់ ណារ៉េត", phone: "015-666-777" }],
      households: 310,
      population: 1450
    }
  },
  "រស្មីសង្ហា": {
    "ភូមិរស្មីសង្ហា": {
      schools: [{ name: "សាលាបឋមសិក្សារស្មីសង្ហា", info: "សាលារៀនភូមិ", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" }],
      hospitals: [],
      police: [],
      leaders: [{ role: "មេភូមិរស្មីសង្ហា", name: "លោក ឃីម ពិសិដ្ឋ", phone: "099-777-888" }],
      households: 155,
      population: 780
    }
  },
  "ត្រែង": {
    "ភូមិត្រែង": {
      schools: [{ name: "វិទ្យាល័យត្រែង", info: "វិទ្យាល័យពេញលេញ", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" }],
      hospitals: [{ name: "មន្ទីរពេទ្យបង្អែកត្រែង", info: "មន្ទីរពេទ្យកម្រិតស្រុក", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80" }],
      police: [{ name: "ប៉ុស្តិ៍នគរបាលឃុំត្រែង", info: "ទំនាក់ទំនង៖ ០៩៦-៥៥៤-៤៣៣", image: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=600&q=80" }],
      leaders: [{ role: "មេភូមិត្រែង", name: "លោក សុខ ហេង", phone: "081-888-999" }],
      households: 420,
      population: 1980
    },
    "ភូមិគីឡូ៣៨": {
      schools: [],
      hospitals: [],
      police: [],
      leaders: [{ role: "មេភូមិគីឡូ៣៨", name: "លោក ចាន់ ធី", phone: "070-999-000" }],
      households: 160,
      population: 790
    }
  }
};

// Create a unified Initial Locations array for global search
const INITIAL_LOCATIONS = [];
Object.entries(RatanakMondolData).forEach(([commName, commData]) => {
  Object.entries(commData).forEach(([vilName, vilData]) => {
    vilData.schools.forEach((s, i) => INITIAL_LOCATIONS.push({
      id: `school-${commName}-${vilName}-${i}`, name: s.name, category: "សាលារៀន", district: "ស្រុករតនមណ្ឌល", commune: commName, village: vilName, imageUrl: s.image || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80", approved: true, submittedBy: "Admin Data", mapLink: "https://maps.google.com"
    }));
    vilData.hospitals.forEach((h, i) => INITIAL_LOCATIONS.push({
      id: `hospital-${commName}-${vilName}-${i}`, name: h.name, category: "មណ្ឌលសុខភាព", district: "ស្រុករតនមណ្ឌល", commune: commName, village: vilName, imageUrl: h.image || "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80", approved: true, submittedBy: "Admin Data", mapLink: "https://maps.google.com"
    }));
    vilData.police.forEach((p, i) => INITIAL_LOCATIONS.push({
      id: `police-${commName}-${vilName}-${i}`, name: p.name, category: "ប៉ុស្តិ៍ប៉ូលីស", district: "ស្រុករតនមណ្ឌល", commune: commName, village: vilName, imageUrl: p.image || "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=600&q=80", approved: true, submittedBy: "Admin Data", mapLink: "https://maps.google.com"
    }));
  });
});

export default function App() {
  // === APP STATE ===
  const [currentPage, setCurrentPage] = useState(1); // 1: Welcome Screen, 2: Main Application
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  
  // Navigation & General UI States
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'add', 'profile'
  const [adminSubTab, setAdminSubTab] = useState('approvals'); // 'approvals', 'data', 'stats', 'security'
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
  // Modals / Overlays
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  
  // Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Explore Dropdowns / Interactive State
  const [selectedDistrictTab, setSelectedDistrictTab] = useState('រតនមណ្ឌល'); // 'រតនមណ្ឌល' or 'ផ្សេងៗ'
  const [customDistrictsList, setCustomDistrictsList] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database State (Realtime)
  const [approvedLocations, setApprovedLocations] = useState(INITIAL_LOCATIONS);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Add Location Form
  const [newLocName, setNewLocName] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('សាលារៀន');
  const [newLocDistrict, setNewLocDistrict] = useState('ស្រុករតនមណ្ឌល');
  const [newLocCustomDistrict, setNewLocCustomDistrict] = useState('');
  const [newLocCommune, setNewLocCommune] = useState('ស្តៅ');
  const [newLocVillage, setNewLocVillage] = useState('');
  const [newLocImageBase64, setNewLocImageBase64] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Admin Tree Accordion Expand Status
  const [expComm, setExpComm] = useState('ស្តៅ');

  // === FIREBASE INITIALIZATION & AUTH ===
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } 
          catch (e) { await signInAnonymously(auth); }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {}
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => { if (u) setUser(u); });
    const session = localStorage.getItem('vmc_user_session_2026');
    if (session) {
      setUsername(session);
      setCurrentPage(2);
    }
    return () => unsubscribe();
  }, []);

  // === FIREBASE REAL-TIME SYNC ===
  useEffect(() => {
    if (!user) return;
    const unsubLoc = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'locations_vmc_v2'), (snap) => {
      const locs = []; 
      const customDists = new Set();
      snap.forEach(d => {
        const item = d.data();
        locs.push({ id: d.id, ...item });
        if (item.district && item.district !== 'ស្រុករតនមណ្ឌល') {
          customDists.add(item.district);
        }
      });
      
      // Combine Seed Data and Live Firebase Data
      const liveApproved = locs.filter(l => l.approved);
      setApprovedLocations([...INITIAL_LOCATIONS, ...liveApproved]);
      setPendingLocations(locs.filter(l => !l.approved));
      setCustomDistrictsList(Array.from(customDists));
    });

    const unsubSec = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2'), (snap) => {
      const logs = []; snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      setSecurityLogs(logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    });

    return () => { unsubLoc(); unsubSec(); };
  }, [user]);

  // === UI HELPER ===
  const showToast = (message, type = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => setToastAlert({ show: false, message: '', type: 'success' }), 5000);
  };

  // === BUSINESS LOGIC / ACTIONS ===
  const handleProceed = () => {
    setCurrentPage(2);
    setActiveTab('home');
  };

  const handleSaveUsername = () => {
    if (!usernameInput.trim()) return;
    setUsername(usernameInput.trim());
    localStorage.setItem('vmc_user_session_2026', usernameInput.trim());
    setShowUsernameModal(false);
    showToast(`ស្វាគមន៍មកកាន់ប្រព័ន្ធ, ${usernameInput.trim()}!`);
  };

  const attemptToAddLocation = () => {
    if (!username && !isAdmin) {
      setShowUsernameModal(true);
    } else {
      setActiveTab('add');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD_HASH) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPasswordInput('');
      showToast('ចូលប្រើប្រាស់គណនី Admin ជោគជ័យ!');
    } else {
      showToast('លេខកូដមិនត្រឹមត្រូវ!', 'error');
      // Save Security Logs
      try {
        const randomIp = `${Math.floor(Math.random()*150)+50}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}`;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2'), {
          timestamp: new Date().toISOString(),
          ipAddress: randomIp,
          username: username || 'ភ្ញៀវអនាមិក',
          deviceModel: getDeviceInfo(),
          attemptedPassword: adminPasswordInput
        });
      } catch(err) {}
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewLocImageBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitLocation = async (e) => {
    e.preventDefault();
    const finalDist = newLocDistrict === 'ផ្សេងៗ' ? newLocCustomDistrict : newLocDistrict;
    if (!newLocName || !finalDist || !newLocVillage) return showToast('សូមបំពេញព័ត៌មានឲ្យបានគ្រប់គ្រាន់!', 'error');

    setIsSubmitting(true);
    // If Admin enters direct, auto approve immediately!
    const isAutoApproved = isAdmin; 
    
    const newLoc = {
      name: newLocName, category: newLocCategory, district: finalDist, commune: newLocCommune, village: newLocVillage,
      imageUrl: newLocImageBase64 || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
      submittedBy: isAdmin ? "Admin" : username, timestamp: new Date().toISOString(), approved: isAutoApproved
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'locations_vmc_v2'), newLoc);
      if (isAutoApproved) {
        showToast('បញ្ចូលទីតាំងថ្មីជោគជ័យ!');
      } else {
        showToast('សូមរង់ចាំរយៈពេល 3 នាទីសម្រាប់ការត្រួតពិនិត្យពី admin ។');
      }
      // Reset
      setNewLocName(''); setNewLocVillage(''); setNewLocImageBase64(''); setActiveTab('home');
    } catch(err) {
      showToast('បរាជ័យក្នុងការបញ្ជូនសំណើ!', 'error');
    }
    setIsSubmitting(false);
  };

  const adminApprove = async (loc) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations_vmc_v2', loc.id), { approved: true });
      showToast('សំណើររបស់អ្នកជោគជ័យ។', 'success');
    } catch(err) {}
  };

  const adminReject = async (loc) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations_vmc_v2', loc.id));
      showToast('សូមពិនិត្យមើលទិន្ន័យឡើងវិញរួចធ្វើការផ្ញើរមកម្តងទៀត។', 'error');
    } catch(err) {}
  };

  // Filter approved locations for view
  const displayedLocations = useMemo(() => {
    return approvedLocations.filter(loc => {
      const isRatnak = loc.district === 'ស្រុករតនមណ្ឌល';
      
      // Filter by custom district list
      if (selectedDistrictTab === 'រតនមណ្ឌល' && !isRatnak) return false;
      if (selectedDistrictTab === 'ផ្សេងៗ' && isRatnak) return false;
      
      // Filter by interactive pickers if selected
      if (selectedCommune && loc.commune !== selectedCommune) return false;
      if (selectedVillage && loc.village !== selectedVillage) return false;
      
      // General search queries
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return loc.name.toLowerCase().includes(query) || 
               loc.village.toLowerCase().includes(query) || 
               loc.category.toLowerCase().includes(query);
      }
      return true;
    });
  }, [approvedLocations, selectedDistrictTab, selectedCommune, selectedVillage, searchQuery]);

  // Retrieve current active village metadata from seed
  const activeVillageMeta = useMemo(() => {
    if (selectedCommune && selectedVillage && RatanakMondolData[selectedCommune]?.[selectedVillage]) {
      return RatanakMondolData[selectedCommune][selectedVillage];
    }
    return null;
  }, [selectedCommune, selectedVillage]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'} flex items-center justify-center p-0 md:p-4 font-sans transition-colors duration-300`}>
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
      `}</style>

      {/* MOBILE FRAME SIMULATOR */}
      <div className={`w-full max-w-md h-screen md:h-[850px] relative overflow-hidden flex flex-col shadow-2xl md:rounded-[40px] md:border-[8px] ${isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-900 bg-slate-50 text-slate-800'}`}>
        
        {/* ==========================================
            PAGE 1: WELCOME SCREEN (Full Panoramic Background)
            ========================================== */}
        {currentPage === 1 && (
          /* 💡 ណែនាំ៖ ប្អូនអាចផ្លាស់ប្តូររូបភាព Background នៃទំព័រដំបូងត្រង់កន្លែងនេះ 
            ដោយគ្រាន់តែប្តូរលីង URL ក្នុង backgroundImage: 'url("...")' ខាងក្រោមនេះជាមួយរូបភាពរបស់ប្អូន។
          */
          <div 
            className="absolute inset-0 z-50 flex flex-col justify-between bg-cover bg-center" 
            style={{ backgroundImage: 'url("/images.ramit.png")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"></div>
            
            {/* Header Content of Welcome Page */}
            <div className="relative z-10 p-6 pt-12 text-center">
              <div className="w-14 h-14 bg-[#00965e] rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg border-2 border-white/20">
                <MapPin size={26} className="text-white animate-bounce" />
              </div>
              <h1 className="text-xl font-black text-white drop-shadow-md font-sans leading-relaxed">
                ផែនទីសហគមន៍ឆ្លាតវៃ
              </h1>
              <p className="text-emerald-300 text-[11px] font-semibold tracking-wider drop-shadow-sm">
                គម្រោង VMC ឆ្នាំ 2026 - វិទ្យាល័យស្តៅសន្តិភាព
              </p>
            </div>

            {/* Project Goals / Purpose Block ("គោលបំណង") */}
            <div className="relative z-10 px-6 py-4 mx-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 animate-slide-up">
              <h3 className="text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                🎯 គោលបំណងគម្រោង VMC
              </h3>
              <ul className="text-[10px] text-slate-200 space-y-1 text-left list-disc list-inside leading-relaxed">
                <li>ជួយសម្រួលការស្វែងរកសាលារៀន មណ្ឌលសុខភាព និងប៉ុស្តិ៍ប៉ូលីសក្នុងតំបន់</li>
                <li>កត់ត្រាស្ថិតិគ្រួសារ និងព័ត៌មានទំនាក់ទំនងមេភូមិដោយតម្លាភាព</li>
                <li>បង្កើនការចូលរួមរបស់ប្រជាពលរដ្ឋក្នុងការកសាងទិន្នន័យមូលដ្ឋាន</li>
              </ul>
            </div>

            {/* Footer and Button on Welcome Page */}
            <div className="relative z-10 p-6 text-center">
              <button 
                onClick={handleProceed}
                className="w-full bg-[#00965e] hover:bg-[#007a4c] active:scale-95 transition-transform text-white py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-[#00965e]/30"
              >
                ដំណើរការចូលប្រើ
              </button>
              <p className="text-[8.5px] text-slate-400/80 mt-4 tracking-widest uppercase">
                VMC Youth STAU SANTEPHEAP • 2026
              </p>
            </div>
          </div>
        )}

        {/* ==========================================
            PAGE 2: MAIN APPLICATION SHELL
            ========================================== */}
        {currentPage === 2 && (
          <div className="flex-1 flex flex-col h-full relative">
            
            {/* Header with BACK button to welcome page */}
            <header className={`px-4 py-3 flex justify-between items-center z-20 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-b shadow-xs`}>
              <div className="flex items-center gap-1.5">
                {/* 🔙 ប៊ូតុងត្រឡប់មកកាន់ទំព័រស្វាគមន៍ដំបូងវិញ (Welcome / First Page) */}
                <button 
                  onClick={() => setCurrentPage(1)} 
                  className="p-1.5 text-slate-400 hover:text-[#00965e] dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="ត្រឡប់ទៅទំព័រស្វាគមន៍"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>
                <div>
                  <h2 className="font-bold text-xs leading-tight text-[#00965e]">ផែនទីសហគមន៍ឆ្លាតវៃ</h2>
                  <p className="text-[9px] text-slate-450">គម្រោង VMC ឆ្នាំ 2026</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-slate-400 hover:text-[#00965e] transition-colors p-1">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="w-8 h-8 bg-slate-250 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border border-[#00965e]/30 transition-transform hover:scale-105"
                >
                  {isAdmin ? (
                    <span className="font-bold text-emerald-600 text-[10px]">AD</span>
                  ) : username ? (
                    <span className="font-bold text-slate-600 dark:text-slate-200 text-[10px]">{username.substring(0,2).toUpperCase()}</span>
                  ) : (
                    <User size={16} className="text-slate-500" />
                  )}
                </div>
              </div>
            </header>

            {/* Scrollable Content Container */}
            <main className="flex-1 overflow-y-auto hide-scroll pb-24">
              
              {/* TAB 1: HOME / EXPLORE */}
              {activeTab === 'home' && (
                <div className="animate-slide-up p-4 space-y-4">
                  
                  {/* Panoramic header */}
                  <div className="rounded-3xl p-4 text-white bg-gradient-to-r from-[#00965e] to-emerald-700 shadow-md">
                    <h3 className="font-bold text-xs mb-1">ស្វាគមន៍មកកាន់ផែនទីសហគមន៍!</h3>
                    <p className="text-[10px] opacity-90 leading-relaxed">ចុចជ្រើសរើសឃុំ និងភូមិខាងក្រោម ដើម្បីពិនិត្យមើលទិន្នន័យជាក់ស្តែង និងទីតាំងសំខាន់ៗ។</p>
                  </div>

                  {/* Search input field */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="ស្វែងរកតាមឈ្មោះទីតាំង ឬភូមិ..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full py-3 pl-10 pr-4 rounded-2xl text-xs outline-none border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#00965e]' : 'bg-white border-slate-200 text-slate-800 shadow-sm focus:border-[#00965e]'}`}
                    />
                    <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  </div>

                  {/* District selector (ស្រុករតនមណ្ឌល vs ផ្សេងៗ) */}
                  <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200/50'}`}>
                    <button 
                      onClick={() => { setSelectedDistrictTab('រតនមណ្ឌល'); setSelectedCommune(''); setSelectedVillage(''); }}
                      className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg transition-all ${selectedDistrictTab === 'រតនមណ្ឌល' ? 'bg-[#00965e] text-white shadow-md' : 'text-slate-500'}`}
                    >
                      ស្រុករតនមណ្ឌល
                    </button>
                    <button 
                      onClick={() => { setSelectedDistrictTab('ផ្សេងៗ'); setSelectedCommune(''); setSelectedVillage(''); }}
                      className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg transition-all ${selectedDistrictTab === 'ផ្សេងៗ' ? 'bg-[#00965e] text-white shadow-md' : 'text-slate-500'}`}
                    >
                      ស្រុកផ្សេងៗ ({customDistrictsList.length})
                    </button>
                  </div>

                  {/* INTERACTIVE GEOGRAPHIC PICKER (For Rotanak Mondol) */}
                  {selectedDistrictTab === 'រតនមណ្ឌល' && (
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'} space-y-3`}>
                      <h4 className="font-bold text-xs text-[#00965e] flex items-center gap-1.5">
                        <Layers size={14} /> ជ្រើសរើសតំបន់រុករក
                      </h4>
                      
                      {/* Commune Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">ជ្រើសរើសឃុំ</label>
                        <select 
                          value={selectedCommune} 
                          onChange={e => { setSelectedCommune(e.target.value); setSelectedVillage(''); }}
                          className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                        >
                          <option value="">-- ជ្រើសរើសឃុំ --</option>
                          {Object.keys(RatanakMondolData).map(comm => (
                            <option key={comm} value={comm}>ឃុំ {comm}</option>
                          ))}
                        </select>
                      </div>

                      {/* Village Dropdown */}
                      {selectedCommune && (
                        <div className="space-y-1 animate-slide-up">
                          <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">ជ្រើសរើសភូមិ</label>
                          <select 
                            value={selectedVillage} 
                            onChange={e => setSelectedVillage(e.target.value)}
                            className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                          >
                            <option value="">-- ជ្រើសរើសភូមិ --</option>
                            {Object.keys(RatanakMondolData[selectedCommune] || {}).map(vil => (
                              <option key={vil} value={vil}>{vil}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INTERACTIVE DEMO DATA (If commune & village is picked) */}
                  {selectedDistrictTab === 'រតនមណ្ឌល' && activeVillageMeta && (
                    <div className="space-y-4 animate-slide-up">
                      
                      {/* Demographics Card */}
                      <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'} space-y-3`}>
                        <h4 className="font-bold text-xs text-[#00965e] pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          📊 ស្ថិតិភូមិគ្រឹះ {selectedVillage}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                            <span className="text-[10px] text-slate-400 block mb-0.5">គ្រួសារសរុប</span>
                            <strong className="text-xs text-[#00965e]">{activeVillageMeta.households} គ្រួសារ</strong>
                          </div>
                          <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                            <span className="text-[10px] text-slate-400 block mb-0.5">ប្រជាជនសរុប</span>
                            <strong className="text-xs text-[#00965e]">{activeVillageMeta.population} នាក់</strong>
                          </div>
                        </div>

                        {/* Village Leaders with Direct Calling Button */}
                        {activeVillageMeta.leaders && activeVillageMeta.leaders.map((ldr, i) => (
                          <div key={i} className={`p-3 rounded-xl flex justify-between items-center ${isDarkMode ? 'bg-slate-800' : 'bg-emerald-50/30 border border-emerald-100/50'}`}>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">{ldr.role}</span>
                              <strong className="text-xs text-slate-700 dark:text-slate-200">{ldr.name}</strong>
                            </div>
                            {ldr.phone && (
                              <a 
                                href={`tel:${ldr.phone}`} 
                                className="px-2.5 py-1.5 bg-[#00965e] text-white rounded-full text-[9px] font-bold flex items-center gap-1 hover:bg-[#007a4c]"
                              >
                                <Phone size={10} /> ហៅទូរស័ព្ទ ({ldr.phone})
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* DISPLAY FILTERED LOCATIONS */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                      📍 ទីតាំងសំខាន់ៗ ({displayedLocations.length})
                    </h3>
                    
                    {displayedLocations.length > 0 ? (
                      displayedLocations.map(loc => (
                        <div key={loc.id} className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'} animate-slide-up`}>
                          <img src={loc.imageUrl} alt={loc.name} className="w-full h-40 object-cover" />
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-xs leading-tight">{loc.name}</h4>
                              <span className="text-[9px] bg-[#00965e]/10 text-[#00965e] px-2.5 py-1 rounded-full font-bold">{loc.category}</span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                              <MapPin size={12} className="text-slate-400" /> {loc.commune}, {loc.village}
                            </p>
                            <button 
                              onClick={() => alert(`តភ្ជាប់ទៅ Google Maps សម្រាប់ទីតាំង៖ ${loc.name}`)} 
                              className="w-full py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold flex justify-center items-center gap-2 hover:bg-slate-200 transition-colors"
                            >
                              <Compass size={14} /> មើលទីតាំងលើផែនទី
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 opacity-50">
                        <MapIcon size={36} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-bold">មិនទាន់មានទីតាំងចុះបញ្ជីទេ</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ADD LOCATION FORM */}
              {activeTab === 'add' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'}`}>
                    <h3 className="font-bold text-xs text-[#00965e] mb-4 flex items-center gap-2">
                      <PlusCircle size={16}/> ស្នើសុំបន្ថែមទីតាំងថ្មី
                    </h3>
                    
                    <form onSubmit={submitLocation} className="space-y-4 text-xs">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ឈ្មោះទីតាំង *</label>
                        <input 
                          type="text" 
                          required 
                          value={newLocName} 
                          onChange={e=>setNewLocName(e.target.value)} 
                          className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                          placeholder="ឧ. សាលាបឋមសិក្សាកិរីឡា" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ស្រុក *</label>
                          <select 
                            value={newLocDistrict} 
                            onChange={e=>setNewLocDistrict(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                          >
                            <option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                            <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ប្រភេទទីតាំង *</label>
                          <select 
                            value={newLocCategory} 
                            onChange={e=>setNewLocCategory(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                          >
                            <option value="សាលារៀន">សាលារៀន</option>
                            <option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option>
                            <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                            <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                          </select>
                        </div>
                      </div>

                      {/* Optional Custom District */}
                      {newLocDistrict === 'ផ្សេងៗ' && (
                        <div className="animate-slide-up">
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ឈ្មោះស្រុកថ្មី *</label>
                          <input 
                            type="text" 
                            required 
                            value={newLocCustomDistrict} 
                            onChange={e=>setNewLocCustomDistrict(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                            placeholder="បញ្ចូលឈ្មោះស្រុក" 
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ឃុំ/សង្កាត់ *</label>
                          {newLocDistrict === 'ស្រុករតនមណ្ឌល' ? (
                            <select 
                              value={newLocCommune} 
                              onChange={e=>setNewLocCommune(e.target.value)} 
                              className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                            >
                              {ROTANAK_MONDOL_COMMUNES.map(comm => (
                                <option key={comm} value={comm}>ឃុំ {comm}</option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              required 
                              value={newLocCommune} 
                              onChange={e=>setNewLocCommune(e.target.value)} 
                              className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                              placeholder="ឈ្មោះឃុំ" 
                            />
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ភូមិ *</label>
                          <input 
                            type="text" 
                            required 
                            value={newLocVillage} 
                            onChange={e=>setNewLocVillage(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                            placeholder="ឧ. ភូមិត្រៃត្រង្ស" 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">រូបភាពគំរូនៃទីតាំង</label>
                        <label className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-800/80' : 'border-[#00965e]/30 bg-[#00965e]/5 hover:bg-[#00965e]/10'} transition-colors`}>
                          {newLocImageBase64 ? (
                            <img src={newLocImageBase64} className="w-full h-full object-cover" alt="preview" />
                          ) : (
                            <>
                              <Camera className="text-[#00965e] mb-2" size={24} />
                              <span className="text-[10px] text-slate-400 font-bold">ចុចជ្រើសរើសរូបភាព (Upload)</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Friendly warning notice */}
                      <p className="text-[9.5px] text-slate-400 italic leading-relaxed border-l-2 border-amber-500 pl-2">
                        * រាល់ទិន្នន័យដែលអ្នកស្នើសុំ នឹងត្រូវឆ្លងកាត់ការត្រួតពិនិត្យ និងយល់ព្រមពី Admin ជាមុនសិន ទើបបង្ហាញជាសាធារណៈ។
                      </p>

                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full bg-[#00965e] text-white py-3.5 rounded-xl font-bold mt-2 shadow-md hover:bg-[#007a4c] transition-all active:scale-98 text-xs"
                      >
                        {isSubmitting ? 'កំពុងបញ្ជូន...' : '📤 ផ្ញើរកញ្ចប់សំណើរ'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 3: ACCOUNT & ADMIN PROFILE */}
              {activeTab === 'profile' && (
                <div className="animate-slide-up p-4 space-y-4">
                  
                  {/* Account Header Banner */}
                  <div className={`p-5 rounded-3xl border flex items-center gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#00965e] text-white shadow-lg'}`}>
                    <div className="w-14 h-14 bg-white/20 rounded-full border border-white/40 flex items-center justify-center text-lg font-black shadow-inner">
                      {isAdmin ? 'AD' : (username ? username.substring(0,2).toUpperCase() : 'US')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{isAdmin ? 'រដ្ឋបាលប្រព័ន្ធ (Admin)' : (username || 'មិនទាន់មានគណនី ID')}</h3>
                      <p className={`text-[10.5px] ${isDarkMode ? 'text-slate-400' : 'text-emerald-100'}`}>
                        {isAdmin ? 'សិទ្ធិគ្រប់គ្រងទិន្នន័យពេញលេញ' : 'គណនីសហគមន៍ធម្មតា'}
                      </p>
                    </div>
                  </div>

                  {/* If not Admin yet, show Admin Login trigger */}
                  {!isAdmin && (
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xs'}`}>
                      <button 
                        onClick={() => setShowAdminLogin(true)} 
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      >
                        <ShieldCheck size={16} /> ចូលកាន់កិច្ចការរដ្ឋបាល (Admin)
                      </button>
                    </div>
                  )}

                  {/* ==========================================
                      ADMIN WORKSPACE & 4 CORE SUB-TABS
                      ========================================== */}
                  {isAdmin && (
                    <div className="space-y-4 animate-slide-up">
                      
                      {/* Sub tab selectors */}
                      <div className="flex gap-1.5 overflow-x-auto hide-scroll pb-1">
                        <button 
                          onClick={() => setAdminSubTab('approvals')} 
                          className={`px-3 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${adminSubTab === 'approvals' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          📥 សំណើអនុម័ត ({pendingLocations.length})
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('data')} 
                          className={`px-3 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${adminSubTab === 'data' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          🗂️ ទីតាំងទិន្នន័យ
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('stats')} 
                          className={`px-3 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${adminSubTab === 'stats' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          📈 របាយការណ៍
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('security')} 
                          className={`px-3 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${adminSubTab === 'security' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          🛡️ សុវត្ថិភាព
                        </button>
                      </div>

                      {/* SUB-TAB 1: APPROVAL MANAGER */}
                      {adminSubTab === 'approvals' && (
                        <div className="space-y-3 animate-slide-up">
                          {pendingLocations.map(loc => (
                            <div key={loc.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-xs">{loc.name}</h4>
                                  <p className="text-[10px] text-slate-500">{loc.commune}, {loc.village} • ដោយ៖ {loc.submittedBy}</p>
                                </div>
                                <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold uppercase">{loc.category}</span>
                              </div>
                              
                              {loc.imageUrl && <img src={loc.imageUrl} alt="" className="w-full h-24 object-cover rounded-xl" />}
                              
                              <div className="flex gap-2 pt-1">
                                <button 
                                  onClick={() => adminApprove(loc)} 
                                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-[10.5px] hover:bg-emerald-700"
                                >
                                  ✓ យល់ព្រម
                                </button>
                                <button 
                                  onClick={() => adminReject(loc)} 
                                  className="flex-1 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-[10.5px] hover:bg-red-100"
                                >
                                  ✗ បដិសេធ
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {pendingLocations.length === 0 && (
                            <div className="text-center py-10 opacity-60">
                              <Check size={32} className="mx-auto text-emerald-600 mb-2" />
                              <p className="text-xs font-bold">គ្មានសំណើកំពុងរង់ចាំការអនុម័តទេ</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 2: DEEP DATA TREE VIEW STRUCTURE */}
                      {adminSubTab === 'data' && (
                        <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} animate-slide-up`}>
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <h4 className="font-bold text-xs flex items-center gap-2">
                              <FileText size={14}/> រចនាសម្ព័ន្ធទិន្នន័យ (ស្រុករតនមណ្ឌល)
                            </h4>
                          </div>
                          
                          <div className="p-2.5 space-y-2">
                            {Object.entries(RatanakMondolData).map(([commName, commData]) => (
                              <div key={commName} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                                <button 
                                  onClick={() => setExpComm(expComm === commName ? '' : commName)} 
                                  className="w-full flex justify-between p-3 bg-slate-50 dark:bg-slate-800/30 text-xs font-bold text-left"
                                >
                                  ឃុំ {commName} 
                                  <ChevronDown size={14} className={`transition-transform ${expComm === commName ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expComm === commName && (
                                  <div className="p-2 space-y-2 bg-white dark:bg-slate-900">
                                    {Object.entries(commData).map(([vilName, vilData]) => (
                                      <div key={vilName} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1.5">
                                        <h5 className="text-xs font-bold text-[#00965e]">{vilName}</h5>
                                        
                                        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                          <span className="text-[10px] text-slate-500">គ្រួសារ៖ <strong>{vilData.households} គ្រួសារ</strong></span>
                                          <span className="text-[10px] text-slate-500">ប្រជាជន៖ <strong>{vilData.population} នាក់</strong></span>
                                        </div>
                                        
                                        <div className="space-y-2 text-[10px]">
                                          {vilData.leaders && vilData.leaders.length > 0 && (
                                            <div>
                                              <strong className="text-slate-600 dark:text-slate-400 block mb-0.5">👤 ថ្នាក់ដឹកនាំភូមិ៖</strong>
                                              {vilData.leaders.map((ldr, idx) => (
                                                <p key={idx} className="text-slate-500 ml-2">• {ldr.role} : {ldr.name} ({ldr.phone})</p>
                                              ))}
                                            </div>
                                          )}
                                          <div>
                                            <strong className="text-slate-600 dark:text-slate-400 block mb-0.5">📍 ស្ថាប័នសំខាន់ៗ៖</strong>
                                            {vilData.schools.map((s, idx) => <p key={`s-${idx}`} className="text-slate-500 ml-2">• 🏫 {s.name}</p>)}
                                            {vilData.hospitals.map((h, idx) => <p key={`h-${idx}`} className="text-slate-500 ml-2">• 🏥 {h.name}</p>)}
                                            {vilData.police.map((p, idx) => <p key={`p-${idx}`} className="text-slate-500 ml-2">• 👮 {p.name}</p>)}
                                            {vilData.schools.length === 0 && vilData.hospitals.length === 0 && vilData.police.length === 0 && (
                                              <p className="text-slate-400 italic ml-2">មិនទាន់មានស្ថាប័នក្នុងទិន្នន័យ</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 3: REPORTS / ANALYTICS STATISTICS */}
                      {adminSubTab === 'stats' && (
                        <div className="space-y-3 animate-slide-up text-xs">
                          <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">ចំនួនអ្នកប្រើប្រាស់សរុប (Active Users)</p>
                              <h4 className="text-xl font-black text-[#00965e]">1,284 នាក់</h4>
                            </div>
                            <Activity size={28} className="text-emerald-300 animate-pulse" />
                          </div>
                          
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
                            <h4 className="font-bold text-xs">ស្ថិតិកំណើនសហគមន៍ (%)</h4>
                            
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span>កំណើនប្រចាំសប្តាហ៍</span>
                                  <span className="text-[#00965e] font-bold">15%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                  <div className="bg-[#00965e] h-1.5 rounded-full" style={{ width: '15%' }}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span>កំណើនប្រចាំខែ</span>
                                  <span className="text-[#00965e] font-bold">45%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                  <div className="bg-[#00965e] h-1.5 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span>កំណើនប្រចាំឆ្នាំ</span>
                                  <span className="text-[#00965e] font-bold">88%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                  <div className="bg-[#00965e] h-1.5 rounded-full" style={{ width: '88%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 4: SECURITY SYSTEM LOGS */}
                      {adminSubTab === 'security' && (
                        <div className="space-y-3 animate-slide-up text-[11px]">
                          <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-150 dark:border-red-900/30 flex gap-2 text-red-600 dark:text-red-400">
                            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed">កំណត់ហេតុកត់ត្រាពីជនដែលព្យាយាមលួចចូលប្រព័ន្ធ Admin មិនត្រឹមត្រូវ (Security Monitor)។</p>
                          </div>
                          
                          <div className="space-y-2">
                            {securityLogs.length > 0 ? (
                              securityLogs.map(log => (
                                <div key={log.id} className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'} space-y-1`}>
                                  <div className="flex justify-between font-bold text-red-500 border-b border-slate-50 dark:border-slate-800 pb-1 mb-1">
                                    <span>បរាជ័យក្នុងការ Login</span>
                                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                    <p>គណនី៖ <strong className="text-slate-800 dark:text-slate-200">{log.username}</strong></p>
                                    <p>IP៖ <strong>{log.ipAddress}</strong></p>
                                    <p className="col-span-2">ឧបករណ៍៖ <strong>{log.deviceModel}</strong></p>
                                    <p className="col-span-2 text-[9px] opacity-75">Password សាកល្បង៖ <strong className="text-red-400">{log.attemptedPassword}</strong></p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-10 text-xs text-slate-400">មិនទាន់មានកំណត់ត្រាជ្រៀតជ្រែកទេ</p>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                  
                  {/* Logout actions */}
                  {username && !isAdmin && (
                    <button 
                      onClick={() => { setUsername(''); localStorage.removeItem('vmc_user_session_2026'); setActiveTab('home'); }} 
                      className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex justify-center items-center gap-2"
                    >
                      <LogOut size={14} /> ចាកចេញពីគណនី {username}
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => { setIsAdmin(false); setActiveTab('home'); }} 
                      className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex justify-center items-center gap-2 mt-4"
                    >
                      <LogOut size={14} /> ចាកចេញពី Admin
                    </button>
                  )}

                </div>
              )}

            </main>

            {/* BOTTOM NAVIGATION TAB (Smartphone optimized 3 menus) */}
            <nav className={`absolute bottom-0 w-full flex justify-around items-center pt-2 pb-5 z-30 border-t ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              <button 
                onClick={() => setActiveTab('home')} 
                className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'home' ? 'text-[#00965e]' : 'text-slate-400'}`}
              >
                <Home size={22} className={activeTab === 'home' ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">ទំព័រដើម</span>
              </button>
              
              <button 
                onClick={attemptToAddLocation} 
                className={`flex flex-col items-center gap-1 w-16 relative -top-3 ${activeTab === 'add' ? 'text-[#00965e]' : 'text-slate-400'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${activeTab === 'add' ? 'bg-[#00965e] text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Plus size={26} />
                </div>
                <span className="text-[10px] font-bold mt-1">បន្ថែម</span>
              </button>

              <button 
                onClick={() => setActiveTab('profile')} 
                className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'profile' ? 'text-[#00965e]' : 'text-slate-400'}`}
              >
                <User size={22} className={activeTab === 'profile' ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">គណនី</span>
              </button>
            </nav>

          </div>
        )}

        {/* ==========================================
            MODALS & TOASTS OVERLAYS
            ========================================== */}
        
        {/* Username ID registration modal */}
        {showUsernameModal && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <div className="w-16 h-16 bg-[#00965e]/10 rounded-full mx-auto flex items-center justify-center mb-4 text-[#00965e]">
                <User size={30} />
              </div>
              <h3 className="text-center font-bold text-base mb-1">បង្កើតគណនីសហគមន៍ ID</h3>
              <p className="text-center text-[10.5px] text-slate-500 mb-5 leading-relaxed">សូមកំណត់ឈ្មោះ ID របស់អ្នក ដើម្បីទទួលបានសិទ្ធិផ្ញើរស្នើសុំទីតាំងថ្មី</p>
              
              <input 
                type="text" 
                placeholder="បញ្ចូលឈ្មោះរបស់អ្នក..." 
                value={usernameInput}
                onChange={e=>setUsernameInput(e.target.value)}
                className={`w-full p-4 rounded-xl outline-none border font-bold text-center text-sm mb-4 focus:border-[#00965e] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
              
              <div className="flex gap-3">
                <button onClick={()=>setShowUsernameModal(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300">បិទ</button>
                <button onClick={handleSaveUsername} className="flex-1 py-3 bg-[#00965e] text-white rounded-xl font-bold text-xs shadow-md">រក្សាទុក</button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Secret Login Modal (Password is hidden securely) */}
        {showAdminLogin && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <button onClick={()=>setShowAdminLogin(false)} className="absolute top-4 right-4 text-slate-400 bg-slate-100 dark:bg-slate-800 p-1 rounded-full"><X size={16}/></button>
              
              <div className="w-16 h-16 bg-[#00965e]/10 rounded-full mx-auto flex items-center justify-center mb-4 text-[#00965e]">
                <ShieldCheck size={30} />
              </div>
              <h3 className="text-center font-bold text-base mb-4">ផ្ទៀងផ្ទាត់លេខកូដរដ្ឋបាល</h3>
              
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={adminPasswordInput}
                  onChange={e=>setAdminPasswordInput(e.target.value)}
                  className={`w-full p-4 rounded-xl outline-none border font-bold text-center tracking-widest text-sm focus:border-[#00965e] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
                <button type="submit" className="w-full py-3.5 bg-[#00965e] text-white rounded-xl font-bold text-xs shadow-md">ផ្ទៀងផ្ទាត់</button>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification alert */}
        {toastAlert.show && (
          <div className="absolute top-4 left-4 right-4 z-[60] flex justify-center animate-slide-up">
            <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-[11px] text-white ${toastAlert.type === 'error' ? 'bg-red-500' : 'bg-[#00965e]'}`}>
              {toastAlert.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
              {toastAlert.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}