import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  MapPin, Search, User, Sun, Moon, Phone, Map as MapIcon, CheckCircle2, AlertTriangle, 
  LogOut, Camera, Plus, PlusCircle, BarChart2, ShieldAlert, ArrowLeft, Home, FileText, Layers, Edit3, Trash2, TrendingUp, Users, Map
} from 'lucide-react';

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
const ROTANAK_MONDOL_COMMUNES = ["ស្តៅ", "ត្រែង", "ផ្លូវមាស", "អណ្តើកហែប", "រស្មីសង្ហា", "គរ"];
const CUSTOM_LOGO_URL = "back.png"; // Logo ផ្ទាល់ខ្លួន

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return 'Mobile Device';
  return 'Desktop PC';
};

export default function App() {
  // === APP STATE ===
  const [currentPage, setCurrentPage] = useState(1); 
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [skippedWelcome, setSkippedWelcome] = useState(false);
  
  // Navigation
  const [activeTab, setActiveTab] = useState('home'); // home, add, reports, profile
  const [adminSubTab, setAdminSubTab] = useState('data'); // approvals, data, security
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
  // Modals & Overlays
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  const [selectedLocation, setSelectedLocation] = useState(null); 
  const [editLoc, setEditLoc] = useState(null);

  // Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Explore Filters
  const [selectedDistrictTab, setSelectedDistrictTab] = useState('រតនមណ្ឌល');
  const [selectedCommune, setSelectedCommune] = useState(''); 
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database Data (Strict Collections as Requested)
  const [dbAdminData, setDbAdminData] = useState([]); // from 'data_admin' (Locations & All Content)
  const [dbUserData, setDbUserData] = useState([]);   // from 'data_user' (Usernames)
  const [securityLogs, setSecurityLogs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Add Location Form
  const [newLocName, setNewLocName] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('សាលារៀន');
  const [newLocDistrict, setNewLocDistrict] = useState('ស្រុករតនមណ្ឌល');
  const [newLocCustomDistrict, setNewLocCustomDistrict] = useState('');
  const [newLocCommune, setNewLocCommune] = useState('ស្តៅ');
  const [newLocVillage, setNewLocVillage] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocInfo, setNewLocInfo] = useState('');
  const [newLocMapLink, setNewLocMapLink] = useState('');
  const [newLocImageBase64, setNewLocImageBase64] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === INITIALIZATION ===
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

    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      if (u) setUser(u); 
    });
    
    const savedUser = localStorage.getItem('vmc_username_2026');
    const savedPhoto = localStorage.getItem('vmc_user_photo_2026');
    const savedMode = localStorage.getItem('vmc_dark_mode');
    
    // បើមាន Username រួចហើយ រំលងទំព័រទី១ ចូលទំព័រទី២ តែម្តង
    if (savedUser) {
      setUsername(savedUser);
      setSkippedWelcome(true);
      setCurrentPage(2);
    }
    if (savedPhoto) setProfileImage(savedPhoto);
    if (savedMode === 'true') setIsDarkMode(true);

    return () => unsubscribe();
  }, []);

  // === REAL-TIME DATA SYNC ===
  useEffect(() => {
    if (!user) return;
    
    // 1. Fetch Locations from 'data_admin' collection
    const unsubAdminData = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'data_admin'), 
      (snap) => {
        const data = []; 
        snap.forEach(d => data.push({ id: d.id, ...d.data() }));
        setDbAdminData(data);
      }, (err) => console.error(err)
    );

    // 2. Fetch Users from 'data_user' collection
    const unsubUserData = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'data_user'), 
      (snap) => {
        const uList = []; 
        snap.forEach(d => uList.push({ id: d.id, ...d.data() }));
        setDbUserData(uList);
      }, (err) => console.error(err)
    );

    // 3. Security Logs
    const unsubSec = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'security_logs'), 
      (snap) => {
        const logs = []; 
        snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
        setSecurityLogs(logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }, (err) => console.error(err)
    );

    return () => { unsubAdminData(); unsubUserData(); unsubSec(); };
  }, [user]);

  // Computed Derived Data
  const approvedLocations = dbAdminData.filter(loc => loc.approved);
  const pendingLocations = dbAdminData.filter(loc => !loc.approved);

  // Dynamic Village List based on Locations
  const availableVillages = useMemo(() => {
    const villages = new Set();
    approvedLocations.forEach(loc => {
      if (loc.village && (!selectedCommune || loc.commune === selectedCommune)) {
        villages.add(loc.village);
      }
    });
    return Array.from(villages);
  }, [approvedLocations, selectedCommune]);

  const showToast = (message, type = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => setToastAlert({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleProceed = () => {
    setCurrentPage(2);
    setActiveTab('home');
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) return;
    const finalName = usernameInput.trim();
    setUsername(finalName);
    localStorage.setItem('vmc_username_2026', finalName);
    try {
      // រក្សាទុក User ចូល 'data_user'
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', user?.uid || `user_${Date.now()}`), {
        username: finalName, 
        createdAt: new Date().toISOString(), 
        profilePic: profileImage || '',
        status: 'active'
      });
    } catch (err) { console.error(err); }
    setShowUsernameModal(false);
    showToast(`ទទួលបានជោគជ័យ!`);
    setSkippedWelcome(true); // From now on, they skip the welcome page
    setActiveTab('add'); // Redirect to Add Location after creation
  };

  const attemptToAddLocation = () => {
    // បើគ្មានឈ្មោះទេ ទាមទារឱ្យបង្កើតសិន ទើបឱ្យចូលទៅកន្លែងបញ្ចូលទីតាំង
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
      showToast('ចូលជាអ្នកគ្រប់គ្រងប្រព័ន្ធជោគជ័យ!');
    } else {
      showToast('លេខសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs'), {
          timestamp: new Date().toISOString(), 
          device: getDeviceInfo(), 
          username: username || 'ភ្ញៀវ', 
          attemptedPassword: adminPasswordInput
        });
      } catch(err) {}
    }
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageChange = (e) => {
    handleImageUpload(e, async (base64String) => {
      setProfileImage(base64String);
      localStorage.setItem('vmc_user_photo_2026', base64String);
      if (username) {
        try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', user?.uid), {
            profilePic: base64String, updatedAt: new Date().toISOString()
          });
        } catch(err){}
      }
      showToast("បានផ្លាស់ប្តូររូបថតគណនីរួចរាល់!");
    });
  };

  const submitLocation = async (e) => {
    e.preventDefault();
    if (!newLocName || !newLocVillage) return showToast('សូមបំពេញព័ត៌មានឲ្យបានគ្រប់គ្រាន់!', 'error');

    setIsSubmitting(true);
    const newLoc = {
      type: 'location',
      name: newLocName, category: newLocCategory, district: newLocDistrict, commune: newLocCommune, 
      village: newLocVillage, phone: newLocPhone, info: newLocInfo, mapLink: newLocMapLink,
      imageUrl: newLocImageBase64 || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
      submittedBy: isAdmin ? "Admin" : username, 
      timestamp: new Date().toISOString(), 
      approved: isAdmin // Admin auto-approves, user requires approval
    };

    try {
      // រក្សាទុកទីតាំង និងព័ត៌មានចូល 'data_admin'
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'data_admin'), newLoc);
      showToast(isAdmin ? 'បញ្ចូលទីតាំងថ្មីជោគជ័យ!' : 'ស្នើសុំជោគជ័យ! សូមរង់ចាំការអនុម័តពី Admin។');
      setNewLocName(''); setNewLocVillage(''); setNewLocPhone(''); setNewLocInfo(''); setNewLocMapLink(''); setNewLocImageBase64(''); 
      setActiveTab('home');
    } catch(err) { showToast('បរាជ័យក្នុងការបញ្ជូនសំណើ!', 'error'); }
    setIsSubmitting(false);
  };

  // --- Admin Actions ---
  const adminApprove = async (loc) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', loc.id), { approved: true }); showToast('បានអនុម័ត!', 'success'); } catch(err) {}
  };
  const adminDeleteLocation = async (locId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', locId)); showToast('បានលុបទិន្នន័យ!', 'success'); } catch(err) {}
  };
  const adminSaveEdit = async (e) => {
    e.preventDefault();
    if(!editLoc) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', editLoc.id), {
        name: editLoc.name, category: editLoc.category, village: editLoc.village, phone: editLoc.phone, info: editLoc.info
      });
      showToast('បានកែប្រែជោគជ័យ!');
      setEditLoc(null);
    } catch(err) {}
  };
  const clearSecurityLogs = async () => {
    showToast('កំពុងលុបប្រវត្តិ...', 'success');
    securityLogs.forEach(async (log) => {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', log.id)); } catch(e){}
    });
    setSecurityLogs([]);
  };

  // --- Derived Displays ---
  const displayedLocations = useMemo(() => {
    return approvedLocations.filter(loc => {
      if (selectedDistrictTab === 'រតនមណ្ឌល' && loc.district !== 'ស្រុករតនមណ្ឌល') return false;
      if (selectedDistrictTab === 'ផ្សេងៗ' && loc.district === 'ស្រុករតនមណ្ឌល') return false;
      if (selectedDistrictTab === 'រតនមណ្ឌល' && selectedCommune && loc.commune !== selectedCommune) return false;
      if (selectedVillageFilter && loc.village !== selectedVillageFilter) return false;
      if (searchQuery && !loc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [approvedLocations, selectedDistrictTab, selectedCommune, selectedVillageFilter, searchQuery]);

  // Report Calculations
  const reportStats = useMemo(() => {
    const totalUsers = dbUserData.length || 1; 
    const totalLocations = dbAdminData.length;
    const totalApproved = approvedLocations.length;
    
    const approvalRate = totalLocations > 0 ? Math.round((totalApproved / totalLocations) * 100) : 0;

    // Simulate Modern Line Chart Data with 2 lines (Activity vs Approvals)
    const lineChartData = [
      { x: 0, y1: 100, y2: 120 },   // Jan 
      { x: 50, y1: 80, y2: 90 },    // Feb
      { x: 100, y1: 40, y2: 60 },   // Mar
      { x: 150, y1: 70, y2: 85 },   // Apr
      { x: 200, y1: 30, y2: 50 },   // May
      { x: 250, y1: 20, y2: 30 }    // Jun
    ];

    return { totalUsers, totalLocations, totalApproved, approvalRate, lineChartData };
  }, [dbUserData, dbAdminData, approvedLocations]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('vmc_dark_mode', String(newTheme));
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center font-sans overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Moul&family=Siemreap:wght@400;600;700&display=swap');
        .font-moul { font-family: 'Moul', serif; }
        .font-siemreap { font-family: 'Siemreap', sans-serif; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .dark .glass-panel { background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.05); }
        .anim-fade-right { animation: fadeRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-fade-left { animation: fadeLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Responsive Desktop App Container */
        .app-container {
          width: 100%; height: 100%; position: relative; display: flex; flex-direction: column; background-color: ${isDarkMode ? '#0f172a' : '#f8fafc'};
        }
        @media (min-width: 768px) {
          .app-container {
            max-width: 1200px; height: 92vh; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 8px solid ${isDarkMode ? '#1e293b' : '#ffffff'}; overflow: hidden;
          }
        }
        
        /* Chart SVG Filter */
        .svg-shadow { filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.1)); }
      `}</style>

      {/* SVG Definitions for Modern Charts */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Responsive App Container */}
      <div className="app-container">
        
        {/* ==================== PAGE 1 (WELCOME SCREEN) ==================== */}
        {currentPage === 1 && (
          <div className="absolute inset-0 z-50 flex flex-col md:flex-row bg-blue-50/50 dark:bg-slate-900 overflow-hidden">
            
            {/* Header Logo Top Left */}
            <div className="absolute top-6 left-6 md:top-10 md:left-12 flex items-center gap-3 z-30 anim-fade-left">
              <img src={CUSTOM_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-xl shadow-lg" />
              <span className="font-black text-xl tracking-tight text-slate-800 dark:text-white">TP nice KH</span>
            </div>

            {/* Left Content (Text) */}
            <div className="flex-1 px-8 pt-32 pb-12 md:p-16 md:pt-0 lg:p-24 flex flex-col justify-center z-20 anim-fade-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-slate-900 dark:text-white">
                ស្វែងរកទីតាំង <br/><span className="text-blue-600">អស្ចារ្យ</span> ជុំវិញអ្នក
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-siemreap mb-10 max-w-md leading-relaxed">
                ជួយសម្រួលដល់ការស្វែងរកស្ថាប័នសំខាន់ៗដូចជា សាលារៀន មណ្ឌលសុខភាព និងប៉ុស្តិ៍ប៉ូលីស ដើម្បីរស់នៅកាន់តែងាយស្រួល។
              </p>
              <button onClick={handleProceed} className="w-fit px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/30 transition-all active:scale-95 font-siemreap text-sm flex items-center gap-2">
                អនុញ្ញាតឲ្យខ្លួនឯងចូលប្រើ <ArrowLeft className="rotate-180" size={16}/>
              </button>
            </div>

            {/* Right Image (Floats smoothly) */}
            <div className="flex-1 relative min-h-[40vh] md:min-h-full flex items-center justify-center p-8 lg:p-12">
               <div className="absolute right-0 top-0 bottom-0 w-[85%] bg-blue-100/60 dark:bg-slate-800 rounded-l-[80px] lg:rounded-l-[120px] z-0"></div>
               <img src="https://images.unsplash.com/photo-1596422846543-75c6fc197f0a?auto=format&fit=crop&w=800&q=80" 
                    className="relative z-10 w-full max-w-md lg:max-w-lg rounded-[32px] lg:rounded-[40px] shadow-2xl anim-fade-right object-cover h-64 md:h-auto border-[6px] border-white/50 dark:border-slate-800/50" alt="Map Illustration" />
               
               {/* Decorative Glass Cards */}
               <div className="absolute top-1/4 right-1/4 glass-panel p-3 rounded-2xl shadow-xl z-20 flex items-center gap-2 anim-fade-right" style={{animationDelay: '0.2s'}}>
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white"><MapPin size={14}/></div>
                  <span className="text-[10px] font-bold font-siemreap text-slate-700 dark:text-slate-200">ទីតាំងរហ័ស</span>
               </div>
            </div>
          </div>
        )}

        {/* ==================== PAGE 2 (MAIN APP SCREEN) ==================== */}
        {currentPage === 2 && (
          <div className="flex-1 flex flex-col h-full relative">
            
            {/* --- HEADER --- */}
            <header className={`px-4 py-3 md:py-4 flex justify-between items-center z-20 glass-panel border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                {/* ត្រឡប់ក្រោយ បង្ហាញលុះត្រាតែមិនទាន់ធ្លាប់បង្កើតឈ្មោះ */}
                {!skippedWelcome && (
                  <button onClick={() => setCurrentPage(1)} className="p-2 md:p-2.5 bg-slate-200/50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <img src={CUSTOM_LOGO_URL} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-lg shadow-sm" />
                  <h2 className="font-black text-sm md:text-base tracking-tight text-slate-800 dark:text-white">TP nice KH</h2>
                </div>
              </div>
              
              <div onClick={() => setActiveTab('profile')} className="flex items-center gap-2 cursor-pointer bg-slate-200/50 dark:bg-slate-800 pr-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {profileImage ? <img src={profileImage} className="w-full h-full object-cover"/> : <User size={16} className="text-blue-600"/>}
                </div>
                {username && <span className="text-[11px] md:text-xs font-bold hidden sm:block">{username}</span>}
              </div>
            </header>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto hide-scroll pb-24 md:pb-6 relative z-10 flex flex-col">
              
              {/* === TAB 1: HOME === */}
              {activeTab === 'home' && (
                <div className="anim-slide-up p-4 md:p-8 space-y-5 md:space-y-6 max-w-6xl mx-auto w-full flex-1">
                  
                  {/* Search Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white mb-1 md:mb-2">រុករកទីតាំង</h2>
                      <p className="text-xs md:text-sm text-slate-500 font-siemreap">ស្វែងរក និងចែករំលែកទីតាំងក្នុងសហគមន៍របស់អ្នក។</p>
                    </div>
                    <div className="relative w-full md:w-80">
                      <input type="text" placeholder="ស្វែងរកទីតាំង..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className={`w-full py-3 md:py-3.5 pl-11 pr-4 rounded-2xl text-xs md:text-sm font-siemreap outline-none transition-all border ${isDarkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500 shadow-sm'}`} />
                      <Search className="absolute left-4 top-3.5 md:top-4 text-slate-400" size={16} />
                    </div>
                  </div>

                  {/* Filter Pills (Communes & Villages) */}
                  <div className="flex flex-col gap-3">
                    {/* Communes */}
                    <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
                      <button onClick={() => { setSelectedDistrictTab('រតនមណ្ឌល'); setSelectedCommune(''); setSelectedVillageFilter(''); }} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-bold font-siemreap whitespace-nowrap transition-all border ${selectedDistrictTab === 'រតនមណ្ឌល' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>ស្រុករតនមណ្ឌល</button>
                      <button onClick={() => { setSelectedDistrictTab('ផ្សេងៗ'); setSelectedCommune(''); setSelectedVillageFilter(''); }} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-bold font-siemreap whitespace-nowrap transition-all border ${selectedDistrictTab === 'ផ្សេងៗ' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>ស្រុកផ្សេងៗ</button>
                      
                      {selectedDistrictTab === 'រតនមណ្ឌល' && ROTANAK_MONDOL_COMMUNES.map(comm => (
                        <button key={comm} onClick={() => { setSelectedCommune(comm); setSelectedVillageFilter(''); }} className={`px-3 md:px-4 py-2 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-bold font-siemreap whitespace-nowrap transition-all border ${selectedCommune === comm ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>ឃុំ{comm}</button>
                      ))}
                    </div>
                    
                    {/* Villages Filter (if communes selected) */}
                    {selectedCommune && availableVillages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 items-center">
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">ជ្រើសរើសភូមិ៖</span>
                        <button onClick={() => setSelectedVillageFilter('')} className={`px-3 py-1.5 rounded-full text-[9px] font-bold font-siemreap whitespace-nowrap transition-all border ${!selectedVillageFilter ? 'bg-purple-500 text-white border-purple-500' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>ទាំងអស់</button>
                        {availableVillages.map(village => (
                          <button key={village} onClick={() => setSelectedVillageFilter(village)} className={`px-3 py-1.5 rounded-full text-[9px] font-bold font-siemreap whitespace-nowrap transition-all border ${selectedVillageFilter === village ? 'bg-purple-500 text-white border-purple-500 shadow-md' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>{village}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grid Layout for Locations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-2">
                    {displayedLocations.length > 0 ? displayedLocations.map(loc => (
                      <div key={loc.id} onClick={() => setSelectedLocation(loc)} className={`rounded-3xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl ${isDarkMode ? 'bg-slate-900 border border-slate-800 hover:shadow-blue-900/20' : 'bg-white border border-slate-100 hover:shadow-blue-500/10'}`}>
                        <div className="h-40 md:h-48 relative overflow-hidden bg-slate-200">
                          <img src={loc.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={loc.name} />
                          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-[10px] md:text-[11px] font-bold font-siemreap text-blue-600">{loc.category}</div>
                        </div>
                        <div className="p-4 md:p-5">
                          <h4 className="font-black text-sm md:text-base text-slate-800 dark:text-white leading-tight mb-1 md:mb-1.5">{loc.name}</h4>
                          <p className="text-[10px] md:text-[11px] text-slate-500 font-siemreap flex items-center gap-1"><MapPin size={12}/> {loc.village}, ឃុំ{loc.commune}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-16 opacity-50">
                        <MapIcon size={48} className="mx-auto mb-3 text-slate-400" />
                        <p className="text-sm font-bold font-siemreap">មិនមានទិន្នន័យទីតាំងទេ</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 2: បន្ថែម (ADD) === */}
              {activeTab === 'add' && (
                <div className="anim-slide-up p-4 md:p-8 max-w-2xl mx-auto font-siemreap flex-1 w-full">
                  <div className={`p-6 md:p-10 rounded-[32px] border shadow-xl ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-slate-100 shadow-blue-500/5'}`}>
                    <h3 className="font-black text-lg md:text-2xl text-blue-600 mb-6 flex items-center gap-2"><PlusCircle size={24}/> បន្ថែមទីតាំងថ្មី</h3>
                    <form onSubmit={submitLocation} className="space-y-4 md:space-y-5">
                      <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">ឈ្មោះទីតាំង *</label><input type="text" required value={newLocName} onChange={e=>setNewLocName(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="ឧ. មណ្ឌលសុខភាព..." /></div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">ប្រភេទ *</label><select value={newLocCategory} onChange={e=>setNewLocCategory(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}><option value="សាលារៀន">សាលារៀន</option><option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option><option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option><option value="ផ្សេងៗ">ផ្សេងៗ</option></select></div>
                        <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">ស្រុក *</label><select value={newLocDistrict} onChange={e=>setNewLocDistrict(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}><option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option><option value="ផ្សេងៗ">ផ្សេងៗ</option></select></div>
                      </div>

                      {newLocDistrict === 'ផ្សេងៗ' && <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">ឈ្មោះស្រុកថ្មី *</label><input type="text" required value={newLocCustomDistrict} onChange={e=>setNewLocCustomDistrict(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">ឃុំ *</label><input type="text" required value={newLocCommune} onChange={e=>setNewLocCommune(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                        <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">ភូមិ *</label><input type="text" required value={newLocVillage} onChange={e=>setNewLocVillage(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">លេខទូរស័ព្ទ</label><input type="text" value={newLocPhone} onChange={e=>setNewLocPhone(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                        <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">តំណភ្ជាប់ផែនទី (Map Link)</label><input type="text" value={newLocMapLink} onChange={e=>setNewLocMapLink(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      </div>
                      
                      <div><label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">ព័ត៌មានលម្អិត</label><textarea value={newLocInfo} onChange={e=>setNewLocInfo(e.target.value)} rows="3" className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-xs outline-none resize-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      
                      <div>
                        <label className="text-[11px] md:text-xs font-bold text-slate-500 block mb-1.5 md:mb-2">រូបភាពទីតាំង</label>
                        <label className={`w-full h-32 md:h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-950 hover:bg-slate-800' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'}`}>
                          {newLocImageBase64 ? <img src={newLocImageBase64} className="w-full h-full object-cover" alt="preview" /> : <><Camera className="text-blue-500 mb-2" size={24}/><span className="text-[10px] md:text-[11px] text-slate-500 font-bold">ចុចបញ្ចូលរូបថត</span></>}
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewLocImageBase64)} className="hidden" />
                        </label>
                      </div>
                      
                      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 md:py-4 rounded-2xl font-bold font-siemreap text-xs md:text-sm mt-4 shadow-lg shadow-blue-500/30 transition-all active:scale-95">{isSubmitting ? 'កំពុងដំណើរការ...' : 'យល់ព្រមបញ្ជូន'}</button>
                    </form>
                  </div>
                </div>
              )}

              {/* === TAB 3: របាយការណ៍ (REPORTS) === */}
              {activeTab === 'reports' && (
                <div className="anim-slide-up p-4 md:p-8 space-y-6 max-w-5xl mx-auto font-siemreap w-full flex-1">
                  <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white mb-2 md:mb-4">របាយការណ៍ & ស្ថិតិ</h2>
                  
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <Users className="text-blue-500 mb-2" size={20}/>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide">អ្នកប្រើប្រាស់សរុប</p>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{reportStats.totalUsers}</h3>
                    </div>
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <Map className="text-emerald-500 mb-2" size={20}/>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide">ទីតាំងសរុប</p>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{reportStats.totalLocations}</h3>
                    </div>
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <CheckCircle2 className="text-purple-500 mb-2" size={20}/>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide">បានអនុម័តរួច</p>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{reportStats.totalApproved}</h3>
                    </div>
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <TrendingUp className="text-orange-500 mb-2" size={20}/>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide">អត្រាអនុម័ត (%)</p>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{reportStats.approvalRate}%</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Modern SVG Line Chart with 2 lines and area */}
                    <div className={`p-5 md:p-6 rounded-2xl md:rounded-[32px] border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <h4 className="font-bold text-xs md:text-sm text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2"><BarChart2 size={16}/> កំណើនទិន្នន័យ (អ្នកប្រើប្រាស់ vs ទីតាំង)</h4>
                      <div className="w-full h-40 md:h-56 relative">
                        <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible svg-shadow">
                          {/* Grid */}
                          <line x1="0" y1="20" x2="300" y2="20" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4"/>
                          <line x1="0" y1="70" x2="300" y2="70" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4"/>
                          <line x1="0" y1="120" x2="300" y2="120" stroke={isDarkMode ? '#475569' : '#cbd5e1'} strokeWidth="1"/>
                          
                          {/* Fill Area Line 1 */}
                          <path d="M 15,120 L 15,100 C 50,100 50,80 85,80 C 120,80 120,40 155,40 C 190,40 190,70 225,70 C 260,70 260,30 285,30 L 285,120 Z" fill="url(#areaGradient)" />
                          
                          {/* Line 1 (Blue) */}
                          <path d="M 15,100 C 50,100 50,80 85,80 C 120,80 120,40 155,40 C 190,40 190,70 225,70 C 260,70 260,30 285,30" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                          
                          {/* Line 2 (Green) */}
                          <path d="M 15,120 C 50,120 50,90 85,90 C 120,90 120,60 155,60 C 190,60 190,85 225,85 C 260,85 260,50 285,50" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeDasharray="4" />
                          
                          {/* Labels */}
                          {['មករា', 'កុម្ភៈ', 'មិនា', 'មេសា', 'ឧសភា', 'មិថុនា'].map((month, i) => (
                            <text key={month} x={15 + (i * 54)} y="140" textAnchor="middle" fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="9" className="font-bold">{month}</text>
                          ))}
                        </svg>
                      </div>
                      <div className="flex gap-4 justify-center mt-4">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] text-slate-500 font-bold">អ្នកប្រើប្រាស់</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-slate-500 font-bold">ទីតាំងថ្មី</span></div>
                      </div>
                    </div>

                    {/* Modern SVG Donut Chart */}
                    <div className={`p-5 md:p-6 rounded-2xl md:rounded-[32px] border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} flex flex-col justify-center items-center`}>
                       <h4 className="font-bold text-xs md:text-sm text-slate-700 dark:text-slate-200 mb-6 w-full text-left flex items-center gap-2"><PlusCircle size={16}/> សមាមាត្រអ្នកប្រើប្រាស់ (%)</h4>
                       <div className="relative w-36 h-36 md:w-44 md:h-44">
                         <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg] drop-shadow-lg">
                            {/* Background Track */}
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="5"></circle>
                            {/* Segment 1: General (70%) */}
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#3b82f6" strokeWidth="5" strokeDasharray="70 100" strokeDashoffset="0" strokeLinecap="round"></circle>
                            {/* Segment 2: Members (25%) */}
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#10b981" strokeWidth="5" strokeDasharray="25 100" strokeDashoffset="-70" strokeLinecap="round"></circle>
                            {/* Segment 3: Admin (5%) */}
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f59e0b" strokeWidth="5" strokeDasharray="5 100" strokeDashoffset="-95" strokeLinecap="round"></circle>
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">100%</span>
                            <span className="text-[9px] text-slate-400 font-bold">សរុប</span>
                         </div>
                       </div>
                       <div className="mt-8 flex flex-wrap justify-center gap-4 w-full">
                          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div><span className="text-[10px] md:text-[11px] font-bold text-slate-500">អ្នកប្រើប្រាស់ (70%)</span></div>
                          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div><span className="text-[10px] md:text-[11px] font-bold text-slate-500">សមាជិក (25%)</span></div>
                          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></div><span className="text-[10px] md:text-[11px] font-bold text-slate-500">Admin (5%)</span></div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 4: PROFILE & SETTINGS / ADMIN === */}
              {activeTab === 'profile' && (
                <div className="anim-slide-up p-4 md:p-8 max-w-2xl mx-auto font-siemreap space-y-5 md:space-y-6 w-full flex-1">
                  
                  {/* Profile Header */}
                  <div className={`p-6 md:p-8 rounded-[32px] border shadow-sm text-center relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="relative mt-6">
                      <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full border-[5px] border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-lg relative group">
                        {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>}
                        <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                          <Camera size={20} className="mb-1"/><span className="text-[9px] font-bold">ប្តូររូបភាព</span>
                          <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                        </label>
                      </div>
                      <h3 className="font-black text-lg md:text-xl mt-3 text-slate-800 dark:text-white">{isAdmin ? 'System Admin' : (username || 'អ្នកប្រើប្រាស់')}</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full inline-block">
                        {isAdmin ? 'សិទ្ធិខ្ពស់បំផុត (Full Access)' : 'សមាជិកទូទៅ'}
                      </p>
                    </div>
                  </div>

                  {/* Settings Module */}
                  <div className={`p-2 rounded-2xl md:rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                     <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3"><Moon className="text-slate-400" size={16}/><span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200">ងងឹត (Dark Mode)</span></div>
                        <button onClick={toggleTheme} className={`w-10 md:w-12 h-5 md:h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 md:w-5 md:h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isDarkMode ? 'translate-x-5 md:translate-x-6' : 'translate-x-0.5'}`}></div>
                        </button>
                     </div>
                     <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><Layers className="text-slate-400" size={16}/><span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200">ភាសា (Language)</span></div>
                        <span className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">ភាសាខ្មែរ</span>
                     </div>
                  </div>

                  {/* Admin Area Access */}
                  {!isAdmin && (
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      {!showAdminLogin ? (
                        <button onClick={() => setShowAdminLogin(true)} className="w-full py-3.5 md:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs md:text-sm flex justify-center items-center gap-2 text-slate-700 dark:text-slate-300 transition"><ShieldAlert size={16} /> ចូលកិច្ចការរដ្ឋបាល (Admin)</button>
                      ) : (
                        <form onSubmit={handleAdminLogin} className="space-y-4 anim-slide-up">
                          <label className="font-bold text-[11px] md:text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"><ShieldAlert size={14} className="text-blue-500"/> លេខសម្ងាត់អ្នកគ្រប់គ្រង</label>
                          <input type="password" value={adminPasswordInput} onChange={e=>setAdminPasswordInput(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl border text-[11px] md:text-sm outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="••••••••" />
                          <div className="flex gap-3">
                            <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 md:py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[11px] md:text-sm transition">បោះបង់</button>
                            <button type="submit" className="flex-1 py-3 md:py-3.5 bg-blue-600 text-white font-bold rounded-xl text-[11px] md:text-sm shadow-md hover:bg-blue-700 transition">បញ្ជាក់</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* ADMIN ENTERPRISE DASHBOARD */}
                  {isAdmin && (
                    <div className="space-y-4 anim-slide-up border-t-4 border-blue-500 pt-6 mt-6">
                      <h3 className="font-black text-base md:text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4"><Layers className="text-blue-500"/> ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យ</h3>
                      
                      {/* Admin Tabs */}
                      <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
                        <button onClick={() => setAdminSubTab('data')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold whitespace-nowrap transition-all ${adminSubTab === 'data' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>🗂️ ទិន្នន័យទីតាំង ({dbAdminData.length})</button>
                        <button onClick={() => setAdminSubTab('users')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold whitespace-nowrap transition-all ${adminSubTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>👥 ឈ្មោះគណនី ({dbUserData.length})</button>
                        <button onClick={() => setAdminSubTab('security')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold whitespace-nowrap transition-all ${adminSubTab === 'security' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>🛡️ សុវត្ថិភាព ({securityLogs.length})</button>
                      </div>

                      {/* Admin SubTab: Locations (data_admin) */}
                      {adminSubTab === 'data' && (
                        <div className="space-y-3">
                          {dbAdminData.map(loc => (
                            <div key={loc.id} className={`p-3 md:p-4 rounded-2xl border flex gap-3 md:gap-4 items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 bg-slate-200"><img src={loc.imageUrl} className="w-full h-full object-cover" /></div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[11px] md:text-sm truncate text-slate-800 dark:text-white">{loc.name}</h4>
                                <p className="text-[9px] md:text-[10px] text-slate-500 mb-1">បញ្ចូលដោយ៖ {loc.submittedBy}</p>
                                {!loc.approved ? (
                                  <span className="text-[8px] md:text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-bold">រង់ចាំអនុម័ត</span>
                                ) : (
                                  <span className="text-[8px] md:text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-bold">បានអនុម័ត</span>
                                )}
                              </div>
                              <div className="flex flex-col md:flex-row gap-1.5 shrink-0">
                                {!loc.approved && <button onClick={() => adminApprove(loc)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><CheckCircle2 size={12}/></button>}
                                <button onClick={() => setEditLoc(loc)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit3 size={12}/></button>
                                <button onClick={() => adminDeleteLocation(loc.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={12}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin SubTab: Users (data_user) */}
                      {adminSubTab === 'users' && (
                        <div className="space-y-3">
                          {dbUserData.map(u => (
                            <div key={u.id} className={`p-3 md:p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-slate-200 border-2 border-white">
                                  {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover"/> : <User className="m-1.5 md:m-2 text-slate-400"/>}
                                </div>
                                <div>
                                  <p className="font-bold text-[11px] md:text-sm text-slate-800 dark:text-white">{u.username}</p>
                                  <p className="text-[8px] md:text-[9px] text-slate-400">ID: {u.id.substring(0, 8)}...</p>
                                </div>
                              </div>
                              <button onClick={async () => { try{await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', u.id)); showToast('បានលុបគណនីនេះ!');}catch(e){} }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin SubTab: Security Logs */}
                      {adminSubTab === 'security' && (
                        <div className="space-y-4">
                          <div className="flex justify-end">
                            <button onClick={clearSecurityLogs} className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white text-[9px] md:text-[10px] font-bold rounded-lg hover:bg-red-700 flex items-center gap-1"><Trash2 size={12}/> លុបទិន្នន័យចោល</button>
                          </div>
                          {securityLogs.length > 0 ? (
                            securityLogs.map(log => (
                              <div key={log.id} className="p-3 md:p-4 rounded-2xl border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-900 text-[10px] md:text-xs space-y-1">
                                <div className="flex justify-between items-center mb-1.5 md:mb-2"><span className="font-bold text-red-600 flex items-center gap-1"><ShieldAlert size={12}/> ការចូលមិនត្រឹមត្រូវ</span><span className="text-[8px] md:text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span></div>
                                <p className="text-slate-700 dark:text-slate-300"><b>គណនី:</b> {log.username} | <b>ឧបករណ៍:</b> {log.device}</p>
                                <p className="text-slate-700 dark:text-slate-300"><b>Password សាកល្បង:</b> <span className="font-mono text-red-500">{log.attemptedPassword}</span></p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-8 text-[11px] md:text-xs text-slate-400">ប្រព័ន្ធសុវត្ថិភាពល្អប្រសើរ គ្មានការគំរាមកំហែងទេ</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logout Button */}
                  {(username || isAdmin) && (
                    <button onClick={() => { setUsername(''); setIsAdmin(false); localStorage.removeItem('vmc_username_2026'); setActiveTab('home'); setSkippedWelcome(false); setCurrentPage(1); }} className="w-full py-3.5 md:py-4 mt-8 border-2 border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl font-bold text-[11px] md:text-sm transition flex justify-center items-center gap-2">
                      <LogOut size={16} /> ចាកចេញពីគណនី
                    </button>
                  )}
                </div>
              )}
              
              {/* === VMC Footer Credit === */}
              <div className="text-center pb-8 pt-6 mt-auto">
                <a href="https://web.facebook.com/Youth.VMC.SdaoSantepheap/?_rdc=1&_rdr#" target="_blank" rel="noreferrer" className="text-[9px] md:text-[10px] text-slate-400 hover:text-blue-500 font-siemreap border-t border-slate-200 dark:border-slate-800 pt-4 px-4 inline-block w-full max-w-sm mx-auto">
                  រៀបចំដោយយុវជន VMC វិទ្យាល័យស្តៅសន្តិភាព
                </a>
              </div>

            </main>

            {/* --- BOTTOM / SIDE NAVIGATION BAR --- */}
            <nav className={`absolute bottom-0 w-full flex justify-around items-center pt-2 pb-5 md:pb-2 z-30 border-t rounded-t-3xl md:rounded-none shadow-[0_-10px_20px_rgba(0,0,0,0.03)] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <Home size={20} className="md:w-6 md:h-6" /><span className="text-[9px] md:text-[10px] font-bold font-siemreap">ទំព័រដើម</span>
              </button>
              <button onClick={attemptToAddLocation} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'add' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <PlusCircle size={20} className="md:w-6 md:h-6" /><span className="text-[9px] md:text-[10px] font-bold font-siemreap">បន្ថែម</span>
              </button>
              <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'reports' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <BarChart2 size={20} className="md:w-6 md:h-6" /><span className="text-[9px] md:text-[10px] font-bold font-siemreap">របាយការណ៍</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <User size={20} className="md:w-6 md:h-6" /><span className="text-[9px] md:text-[10px] font-bold font-siemreap">គណនី</span>
              </button>
            </nav>

          </div>
        )}

        {/* ==================== DETAILS OVERLAY MODAL ==================== */}
        {selectedLocation && (
          <div className={`absolute inset-0 z-[60] flex flex-col anim-slide-up ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="absolute top-0 w-full z-20 p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/60 to-transparent">
              <button onClick={() => setSelectedLocation(null)} className="p-2 md:p-2.5 bg-black/30 backdrop-blur-md rounded-xl hover:bg-black/50 transition"><ArrowLeft size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scroll pb-24 font-siemreap">
              <div className="h-56 md:h-80 w-full bg-slate-200 relative"><img src={selectedLocation.imageUrl} className="w-full h-full object-cover" /></div>
              <div className={`p-5 md:p-10 -mt-8 relative z-10 rounded-t-[32px] max-w-3xl mx-auto shadow-xl ${isDarkMode ? 'bg-slate-950 shadow-black/50' : 'bg-slate-50 shadow-blue-900/5'}`}>
                <h2 className="font-black text-xl md:text-2xl text-slate-800 dark:text-white mb-5 md:mb-6 leading-tight">{selectedLocation.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className={`flex gap-3 md:gap-4 items-start p-3 md:p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><Layers size={18} className="text-blue-500 mt-0.5" /><div><p className="text-[10px] md:text-[11px] text-slate-400 font-bold mb-0.5">ប្រភេទ</p><p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">{selectedLocation.category}</p></div></div>
                  <div className={`flex gap-3 md:gap-4 items-start p-3 md:p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><MapPin size={18} className="text-emerald-500 mt-0.5" /><div><p className="text-[10px] md:text-[11px] text-slate-400 font-bold mb-0.5">ទីតាំង</p><p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">{selectedLocation.village}, ឃុំ{selectedLocation.commune}</p></div></div>
                  {selectedLocation.phone && <div className={`flex gap-3 md:gap-4 items-start p-3 md:p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><Phone size={18} className="text-purple-500 mt-0.5" /><div><p className="text-[10px] md:text-[11px] text-slate-400 font-bold mb-0.5">ទំនាក់ទំនង</p><p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">{selectedLocation.phone}</p></div></div>}
                  <div className={`col-span-full flex gap-3 md:gap-4 items-start p-3 md:p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><FileText size={18} className="text-orange-500 mt-0.5" /><div><p className="text-[10px] md:text-[11px] text-slate-400 font-bold mb-1">ព័ត៌មានបន្ថែម</p><p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedLocation.info || 'មិនមានព័ត៌មានលម្អិតទេ'}</p></div></div>
                </div>
              </div>
            </div>
            <div className={`absolute bottom-0 w-full border-t p-3 md:p-6 flex gap-3 md:gap-4 z-30 justify-center ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              <a href={`tel:${selectedLocation.phone || ''}`} className="flex-1 max-w-xs py-3.5 md:py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-bold flex justify-center items-center gap-2 font-siemreap text-xs transition"><Phone size={16}/> ទូរស័ព្ទ</a>
              <a href={selectedLocation.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation.name)}`} target="_blank" rel="noreferrer" className="flex-1 max-w-xs py-3.5 md:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex justify-center items-center gap-2 font-siemreap text-xs shadow-lg shadow-blue-500/30 transition"><MapIcon size={16}/> មើលផែនទី</a>
            </div>
          </div>
        )}

        {/* ==================== ADMIN EDIT MODAL ==================== */}
        {editLoc && (
          <div className="absolute inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-[32px] p-6 md:p-8 max-h-[90vh] overflow-y-auto hide-scroll shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <h3 className="font-black text-base md:text-lg text-blue-600 font-siemreap mb-4 md:mb-6">កែប្រែទិន្នន័យ</h3>
              <form onSubmit={adminSaveEdit} className="space-y-3 md:space-y-4 font-siemreap">
                <input type="text" value={editLoc.name} onChange={e=>setEditLoc({...editLoc, name: e.target.value})} className={`w-full p-3.5 md:p-4 rounded-2xl border text-xs md:text-sm outline-none ${isDarkMode?'bg-slate-950 border-slate-800 text-white':'bg-slate-50'}`} placeholder="ឈ្មោះ" required />
                <input type="text" value={editLoc.category} onChange={e=>setEditLoc({...editLoc, category: e.target.value})} className={`w-full p-3.5 md:p-4 rounded-2xl border text-xs md:text-sm outline-none ${isDarkMode?'bg-slate-950 border-slate-800 text-white':'bg-slate-50'}`} placeholder="ប្រភេទ" required />
                <input type="text" value={editLoc.village} onChange={e=>setEditLoc({...editLoc, village: e.target.value})} className={`w-full p-3.5 md:p-4 rounded-2xl border text-xs md:text-sm outline-none ${isDarkMode?'bg-slate-950 border-slate-800 text-white':'bg-slate-50'}`} placeholder="ភូមិ" required />
                <input type="text" value={editLoc.phone || ''} onChange={e=>setEditLoc({...editLoc, phone: e.target.value})} className={`w-full p-3.5 md:p-4 rounded-2xl border text-xs md:text-sm outline-none ${isDarkMode?'bg-slate-950 border-slate-800 text-white':'bg-slate-50'}`} placeholder="ទូរស័ព្ទ" />
                <textarea value={editLoc.info || ''} onChange={e=>setEditLoc({...editLoc, info: e.target.value})} className={`w-full p-3.5 md:p-4 rounded-2xl border text-xs md:text-sm outline-none ${isDarkMode?'bg-slate-950 border-slate-800 text-white':'bg-slate-50'}`} rows="4" placeholder="ព័ត៌មាន"></textarea>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditLoc(null)} className="flex-1 py-3.5 md:py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs md:text-sm transition">បោះបង់</button>
                  <button type="submit" className="flex-1 py-3.5 md:py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs md:text-sm shadow-md transition">រក្សាទុក</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== CREATE USERNAME MODAL ==================== */}
        {showUsernameModal && (
          <div className="absolute inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 md:p-8 rounded-[32px] shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-4 md:mb-6 text-blue-600"><User size={32} className="md:w-9 md:h-9" /></div>
              <h3 className="text-center font-black text-lg md:text-xl mb-2 text-slate-800 dark:text-white">បង្កើតគណនី</h3>
              <p className="text-center text-[11px] md:text-xs text-slate-500 mb-6 md:mb-8 font-siemreap leading-relaxed">កំណត់ឈ្មោះសម្គាល់របស់អ្នក ដើម្បីមានសិទ្ធិបន្ថែមទីតាំងទៅកាន់ប្រព័ន្ធ</p>
              <input type="text" placeholder="បញ្ចូលឈ្មោះ..." value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} className={`w-full p-3.5 md:p-4 rounded-2xl outline-none border-2 font-bold text-center text-sm md:text-base mb-4 md:mb-6 transition focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'}`} />
              <div className="flex gap-2 md:gap-3">
                <button onClick={()=>setShowUsernameModal(false)} className="flex-1 py-3.5 md:py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs md:text-sm text-slate-600 dark:text-slate-300 transition">បិទ</button>
                <button onClick={handleSaveUsername} className="flex-1 py-3.5 md:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs md:text-sm shadow-lg shadow-blue-500/30 transition">យល់ព្រម</button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Alert Notification */}
        {toastAlert.show && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[90] flex justify-center anim-slide-up w-[90%] max-w-sm">
            <div className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-xs md:text-sm text-white font-siemreap ${toastAlert.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
              {toastAlert.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              {toastAlert.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}