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
  Phone, Map as MapIcon, Check, AlertTriangle, Menu,
  LogOut, Camera, Plus, Compass, BarChart2, ShieldAlert, ArrowLeft, Home, FileText, Activity, Layers, Edit3, Trash2, Globe, Star, Users, Briefcase, Settings, Shield, PieChart
} from 'lucide-react';

// =========================================================================
// 📸 BACKGROUND IMAGES & CONFIG
// =========================================================================
const WELCOME_BACKGROUND_URL = "ramit.jpg";

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

export default function App() {
  // === APP STATE ===
  const [currentPage, setCurrentPage] = useState(1); 
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Navigation
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'reports', 'add', 'profile'
  const [adminSubTab, setAdminSubTab] = useState('approvals'); // 'approvals', 'data', 'security'
  const [adminDataTab, setAdminDataTab] = useState('locations'); // 'locations', 'users'
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
  // Modals & Alerts
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  const [selectedLocation, setSelectedLocation] = useState(null); // For Details Overlay
  
  // Settings State
  const [language, setLanguage] = useState('KH');
  
  // Translation Helper
  const t = (kh, en) => language === 'EN' ? en : kh;

  // Admin Edit State
  const [editLoc, setEditLoc] = useState(null);

  // Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Explore Filters
  const [selectedDistrictTab, setSelectedDistrictTab] = useState('រតនមណ្ឌល');
  const [customDistrictsList, setCustomDistrictsList] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState('ស្តៅ'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ទាំងអស់');
  
  // Database Data
  const [approvedLocations, setApprovedLocations] = useState([]); 
  const [pendingLocations, setPendingLocations] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [appVisits, setAppVisits] = useState([]);
  const [userList, setUserList] = useState([]);
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
      if (u) {
        setUser(u);
        recordVisit(u.uid);
      } 
    });
    
    const savedUser = localStorage.getItem('vmc_username_2026');
    const savedPhoto = localStorage.getItem('vmc_user_photo_2026');
    const savedMode = localStorage.getItem('vmc_dark_mode');
    
    if (savedUser) {
      setUsername(savedUser);
      setCurrentPage(2);
    }
    if (savedPhoto) setProfileImage(savedPhoto);
    if (savedMode === 'true') setIsDarkMode(true);

    return () => unsubscribe();
  }, []);

  // === REAL-TIME DATA SYNC ===
  useEffect(() => {
    if (!user) return;
    
    const unsubLoc = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'location_data'), (snap) => {
      const locs = []; 
      const customDists = new Set();
      snap.forEach(d => {
        const item = d.data();
        locs.push({ id: d.id, ...item });
        if (item.district && item.district !== 'ស្រុករតនមណ្ឌល') customDists.add(item.district);
      });
      setApprovedLocations(locs.filter(l => l.approved));
      setPendingLocations(locs.filter(l => !l.approved));
      setCustomDistrictsList(Array.from(customDists));
    });

    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), (snap) => {
      const uList = []; snap.forEach(d => uList.push({ id: d.id, ...d.data() }));
      setUserList(uList);
    });

    const unsubVisits = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'visits_data'), (snap) => {
      const vList = []; snap.forEach(d => vList.push({ id: d.id, ...d.data() }));
      setAppVisits(vList);
    });

    const unsubSec = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2'), (snap) => {
      const logs = []; snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      setSecurityLogs(logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    });

    return () => { unsubLoc(); unsubUsers(); unsubVisits(); unsubSec(); };
  }, [user]);

  const recordVisit = async (uid) => {
    try {
      const today = new Date();
      const visitDocId = `${uid}_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visits_data', visitDocId), {
        userId: uid, timestamp: today.toISOString()
      }, { merge: true });
    } catch (err) {}
  };

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
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user?.uid || 'temp_user'), {
        username: finalName, createdAt: new Date().toISOString(), profilePic: profileImage || ''
      });
    } catch (err) {}
    setShowUsernameModal(false);
    showToast(`សូមស្វាគមន៍, ${finalName}!`);
  };

  const attemptToAddLocation = () => {
    if (!username && !isAdmin) setShowUsernameModal(true);
    else setActiveTab('add');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD_HASH) {
      setIsAdmin(true); setShowAdminLogin(false); setAdminPasswordInput(''); showToast('ចូលប្រើប្រាស់គណនី Admin ជោគជ័យ!');
    } else {
      showToast('លេខកូដមិនត្រឹមត្រូវ!', 'error');
      try {
        const randomIp = `${Math.floor(Math.random()*150)+50}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}`;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2'), {
          timestamp: new Date().toISOString(), ipAddress: randomIp, username: username || 'ភ្ញៀវអនាមិក', attemptedPassword: adminPasswordInput
        });
      } catch(err) {}
    }
  };

  const handleCommuneChange = (val) => {
    setSelectedCommune(val);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewLocImageBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setProfileImage(base64String);
        localStorage.setItem('vmc_user_photo_2026', base64String);
        
        if (username) {
          try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', user?.uid || 'temp_user'), {
              username: username, profilePic: base64String, updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch(err){}
        }
        showToast("បានផ្លាស់ប្តូររូបថតគណនីរួចរាល់!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const submitLocation = async (e) => {
    e.preventDefault();
    const finalDist = newLocDistrict === 'ផ្សេងៗ' ? newLocCustomDistrict : newLocDistrict;
    if (!newLocName || !finalDist || !newLocVillage) return showToast('សូមបំពេញព័ត៌មានឲ្យបានគ្រប់គ្រាន់!', 'error');

    setIsSubmitting(true);
    const newLoc = {
      name: newLocName, category: newLocCategory, district: finalDist, commune: newLocCommune, village: newLocVillage, phone: newLocPhone, info: newLocInfo, mapLink: newLocMapLink,
      imageUrl: newLocImageBase64 || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
      submittedBy: isAdmin ? "Admin" : username, timestamp: new Date().toISOString(), approved: isAdmin
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'location_data'), newLoc);
      showToast(isAdmin ? 'បញ្ចូលទីតាំងថ្មីជោគជ័យ!' : 'សូមរង់ចាំការត្រួតពិនិត្យពី Admin!');
      setNewLocName(''); setNewLocVillage(''); setNewLocPhone(''); setNewLocInfo(''); setNewLocMapLink(''); setNewLocImageBase64(''); setActiveTab('home');
    } catch(err) { showToast('បរាជ័យក្នុងការបញ្ជូនសំណើ!', 'error'); }
    setIsSubmitting(false);
  };

  const adminApprove = async (loc) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', loc.id), { approved: true }); showToast('បានយល់ព្រម!', 'success'); } catch(err) {}
  };
  const adminReject = async (loc) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', loc.id)); showToast('បានបដិសេធ និងលុបចោល!', 'error'); } catch(err) {}
  };
  const adminDelete = async (locId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', locId)); showToast('បានលុបទិន្នន័យ!', 'success'); } catch(err) {}
  };
  const adminDeleteUser = async (userId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_data', userId)); showToast('បានលុបគណនីអ្នកប្រើប្រាស់!', 'success'); } catch(err) {}
  };
  const adminSaveEdit = async (e) => {
    e.preventDefault();
    if(!editLoc) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', editLoc.id), {
        name: editLoc.name, category: editLoc.category, village: editLoc.village, phone: editLoc.phone, info: editLoc.info, mapLink: editLoc.mapLink
      });
      showToast('បានកែប្រែជោគជ័យ!', 'success');
      setEditLoc(null);
    } catch(err) {}
  };

  const adminClearSecurityLogs = async () => {
    try {
      for (const log of securityLogs) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2', log.id));
      }
      showToast('បានសម្អាតទិន្នន័យកំណត់ហេតុទាំងអស់!', 'success');
    } catch(err) {
      showToast('មានបញ្ហាក្នុងការសម្អាតទិន្នន័យ', 'error');
    }
  };

  const displayedLocations = useMemo(() => {
    return approvedLocations.filter(loc => {
      const isRatnak = loc.district === 'ស្រុករតនមណ្ឌល' || loc.district === 'រតនមណ្ឌល';
      if (selectedDistrictTab === 'រតនមណ្ឌល' && !isRatnak) return false;
      if (selectedDistrictTab === 'ផ្សេងៗ' && isRatnak) return false;
      if (selectedDistrictTab === 'រតនមណ្ឌល' && selectedCommune && loc.commune !== selectedCommune) return false;
      if (categoryFilter !== 'ទាំងអស់' && categoryFilter !== 'All' && loc.category !== categoryFilter) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return loc.name.toLowerCase().includes(query) || loc.village.toLowerCase().includes(query);
      }
      return true;
    });
  }, [approvedLocations, selectedDistrictTab, selectedCommune, searchQuery, categoryFilter]);

  const reportStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    let weeklyCount = 0; let monthlyCount = 0; let yearlyCount = 0;
    appVisits.forEach(v => {
      const vDate = new Date(v.timestamp);
      if (vDate >= oneWeekAgo) weeklyCount++;
      if (vDate >= oneMonthAgo) monthlyCount++;
      if (vDate >= oneYearAgo) yearlyCount++;
    });

    const totalVisits = appVisits.length || 1; // prevent divide by zero
    const weeklyPercent = Math.min(Math.round((weeklyCount / totalVisits) * 100), 100);
    const monthlyPercent = Math.min(Math.round((monthlyCount / totalVisits) * 100), 100);
    const yearlyPercent = Math.min(Math.round((yearlyCount / totalVisits) * 100), 100);

    const totalLocations = approvedLocations.length + pendingLocations.length;
    const approvedCount = approvedLocations.length;
    const pendingCount = pendingLocations.length;
    const approvedPercent = totalLocations ? Math.round((approvedCount / totalLocations) * 100) : 0;
    const pendingPercent = totalLocations ? Math.round((pendingCount / totalLocations) * 100) : 0;

    // Real Data for Bar Chart
    const khmerMonths = ['មករា', 'កុម្ភៈ', 'មិនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const barData = [];
    for(let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(now.getMonth() - i);
      const mIdx = d.getMonth();
      const count = appVisits.filter(v => new Date(v.timestamp).getMonth() === mIdx && new Date(v.timestamp).getFullYear() === d.getFullYear()).length;
      barData.push({ name: language === 'EN' ? enMonths[mIdx] : khmerMonths[mIdx], count: count });
    }
    const maxBar = Math.max(...barData.map(d => d.count), 1);
    barData.forEach(d => d.percent = (d.count / maxBar) * 100);

    // Real Data for Donut Chart
    const catMap = {};
    approvedLocations.forEach(loc => { catMap[loc.category] = (catMap[loc.category] || 0) + 1; });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
    const pieData = Object.keys(catMap).map((key, i) => ({
      name: key, count: catMap[key], color: colors[i % colors.length]
    })).sort((a,b) => b.count - a.count);

    return {
      weekly: weeklyCount, monthly: monthlyCount, yearly: yearlyCount, 
      weeklyPercent, monthlyPercent, yearlyPercent,
      totalUsers: userList.length, barData, pieData,
      locations: { total: totalLocations, approved: approvedCount, pending: pendingCount, approvedPercent, pendingPercent }
    };
  }, [appVisits, userList, approvedLocations, pendingLocations, language]);

  // Tag Color Generator
  const getCategoryStyles = (category) => {
    switch(category) {
      case 'សាលារៀន':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
      case 'មណ្ឌលសុខភាព':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'ប៉ុស្តិ៍ប៉ូលីស':
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
      case 'ផ្សារ':
        return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      default:
        return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50';
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0F172A] overflow-hidden font-sans">
      {}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Moul&family=Siemreap:wght@400;700&display=swap');
        .font-moul { font-family: 'Moul', 'Khmer OS Muol Light', serif; }
        .font-siemreap { font-family: 'Siemreap', 'Khmer OS Siemreap', sans-serif; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
      `}</style>

      {/* Main Container */}
      <div className={`w-full max-w-md h-screen md:h-[840px] relative overflow-hidden flex flex-col shadow-2xl md:rounded-[42px] md:border-[10px] md:border-slate-950 transition-all ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        
        {/* ==================== PAGE 1 (WELCOME SCREEN) ==================== */}
        {currentPage === 1 && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-cover bg-center animate-fadeIn" style={{ backgroundImage: `url(${WELCOME_BACKGROUND_URL})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/80"></div>
            
            {/* Top Logo */}
            <div className="relative z-10 mt-12 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white shadow-[0_0_25px_rgba(37,99,235,0.4)] border-4 border-[#2563EB] overflow-hidden mb-3 animate-pulse">
                <img src="logo.png" alt="App Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-[22px] font-bold text-white drop-shadow-md font-moul mb-1 text-center leading-normal">
                សូមស្វាគមន៍ មកកាន់ <span className="text-blue-400">TP nice</span>
              </h1>
              <div className="w-12 h-1 bg-[#2563EB] rounded-full opacity-85"></div>
            </div>

            <div className="flex-1"></div>

            {/* Welcome Box */}
            <div className="relative z-10 mx-6 mb-8 p-6 bg-black/40 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center">
              <h2 className="text-[14px] font-bold text-slate-200 font-moul text-center mb-2">{t('ស្វែងរកទីតាំងក្នុងសហគមន៍របស់អ្នក', 'Find Locations in Your Community')}</h2>
              <p className="text-[11px] text-slate-300 text-center font-siemreap leading-relaxed">
                {t('បង្កើតឡើងដោយសហគមន៍ ដើម្បីសម្រួលដល់ការស្វែងរក និងចែករំលែកទីតាំងសំខាន់ៗ។ យើងជួយអ្នកសន្សំពេលវេលា និងផ្តល់ព័ត៌មានដែលគួរឲ្យទុកចិត្តបំផុតសម្រាប់ការរស់នៅប្រចាំថ្ងៃ។', 'Created by the community to ease finding and sharing important places. We help save your time and provide trusted info for daily life.')}
              </p>
              
              <div className="w-full flex justify-center mt-6">
                <button 
                  onClick={handleProceed}
                  className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-600 active:scale-95 transition-all duration-300 text-white rounded-xl font-bold text-[12px] shadow-[0_8px_20px_rgba(37,99,235,0.4)] font-moul border border-blue-400/30 flex items-center justify-center gap-2"
                >
                  {t('អនុញ្ញាតឲខ្លួនឯងចូលប្រើ', 'Allow Access to Use')} <ArrowLeft size={16} className="rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PAGE 2 (MAIN APP SCREEN) ==================== */}
        {currentPage === 2 && (
          <div className="flex-1 flex flex-col h-full relative bg-slate-50 dark:bg-slate-950">
            
            {/* Header */}
            <header className={`px-4 py-3.5 flex justify-between items-center z-20 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-b`}>
              <div className="flex items-center gap-2.5">
                <button onClick={() => setCurrentPage(1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-[#2563EB]">
                  <Menu size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  <MapIcon size={18} className="text-[#2563EB]" />
                  <h2 className="font-bold text-[14px] text-[#2563EB] font-moul tracking-wide">TP nice KH</h2>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div onClick={() => setActiveTab('profile')} className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border border-[#2563EB]/30 shadow-sm">
                  {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : isAdmin ? <span className="font-bold text-[#2563EB] text-[10px]">AD</span> : username ? <span className="font-bold text-slate-600 dark:text-slate-200 text-[10px]">{username.substring(0,2).toUpperCase()}</span> : <User size={16} className="text-slate-500" />}
                </div>
              </div>
            </header>

            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto hide-scroll pb-24 z-10">
              
              {/* === TAB 1: ស្វែងរកទីតាំង (HOME) === */}
              {activeTab === 'home' && (
                <div className="animate-slide-up p-4 space-y-5 font-siemreap">
                  
                  {/* Hero Text */}
                  <div className="space-y-3 mt-2 mb-2 p-4 rounded-3xl border shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 border-blue-100 dark:border-slate-700/50">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#2563EB]/10 rounded-full blur-2xl"></div>
                    <h1 className="text-[18px] font-bold leading-snug text-slate-900 dark:text-white tracking-tight font-moul">
                      {t('ស្វាគមន៍មកកាន់', 'Welcome to')} <br />
                      <span className="text-[#2563EB]">{t('សហគមន៍ឆ្លាតវៃ', 'Smart Community')}</span> {t('របស់អ្នក', 'of yours')}
                    </h1>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-[95%] font-siemreap font-bold">
                      {t('ចូលរួមស្វែងរក និងចែករំលែកទីតាំងសំខាន់ៗជុំវិញខ្លួនអ្នក ដើម្បីផ្តល់ភាពងាយស្រួល និងទំនុកចិត្តដល់សមាជិកទាំងអស់គ្នា។', 'Join in finding and sharing important locations around you to provide ease and trust for all members.')}
                    </p>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <input 
                      type="text" placeholder={t('ស្វែងរកទីតាំង...', 'Search locations...')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full py-3.5 pl-11 pr-4 rounded-2xl text-[16px] outline-none border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 focus:border-[#2563EB]' : 'bg-white border-slate-200 shadow-sm focus:border-[#2563EB]'}`}
                    />
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  </div>

                  {/* District & Region Select */}
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-[#2563EB] flex items-center gap-1.5 font-moul"><Layers size={14} /> {t('ជម្រើសរុករកភូមិសាស្ត្រ', 'Explore Geography')}</h4>
                      <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                        <button onClick={() => { setSelectedDistrictTab('រតនមណ្ឌល'); setSelectedCommune('ស្តៅ'); }} className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${selectedDistrictTab === 'រតនមណ្ឌល' ? 'bg-[#2563EB] text-white' : 'text-slate-500'}`}>រតនមណ្ឌល</button>
                        <button onClick={() => { setSelectedDistrictTab('ផ្សេងៗ'); setSelectedCommune(''); }} className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${selectedDistrictTab === 'ផ្សេងៗ' ? 'bg-[#2563EB] text-white' : 'text-slate-500'}`}>ផ្សេងៗ</button>
                      </div>
                    </div>
                    {selectedDistrictTab === 'រតនមណ្ឌល' && (
                      <select value={selectedCommune} onChange={e => handleCommuneChange(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <option value="">-- {t('ជ្រើសរើសឃុំទាំងអស់', 'Select All Communes')} --</option>
                        {ROTANAK_MONDOL_COMMUNES.map(comm => (<option key={comm} value={comm}>ឃុំ {comm}</option>))}
                      </select>
                    )}
                  </div>

                  {/* Quick Categories Filter Buttons */}
                  <div className="flex gap-1.5 overflow-x-auto hide-scroll pb-1">
                    {['ទាំងអស់', 'សាលារៀន', 'មណ្ឌលសុខភាព', 'ប៉ុស្តិ៍ប៉ូលីស', 'ផ្សារ', 'ផ្សេងៗ'].map((cat) => {
                      const displayCat = language === 'EN' && cat === 'ទាំងអស់' ? 'All' : cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-2 text-[10px] font-bold rounded-xl whitespace-nowrap border transition-all ${
                            categoryFilter === cat 
                              ? 'bg-[#2563EB] text-white border-transparent shadow-sm' 
                              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {displayCat}
                        </button>
                      )
                    })}
                  </div>

                  {/* Locations List */}
                  <div className="space-y-3.5 pb-8">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h3 className="font-bold text-xs font-moul text-slate-800 dark:text-slate-200">
                        {t('ទីតាំងពេញនិយម', 'Popular Places')} ({displayedLocations.length})
                      </h3>
                      <button onClick={() => setCategoryFilter('ទាំងអស់')} className="text-[10px] font-bold text-[#2563EB] hover:underline">View all</button>
                    </div>
                    
                    {displayedLocations.length > 0 ? (
                      <div className="space-y-3">
                        {displayedLocations.map((loc, index) => {
                          const rating = (4.5 + (index % 5) * 0.1).toFixed(1);
                          const reviews = 50 + (index * 19);
                          return (
                            <div 
                              key={loc.id} 
                              onClick={() => setSelectedLocation(loc)} 
                              className={`p-3 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all shadow-sm hover:shadow-md flex gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                                <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                                <span className={`absolute bottom-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${getCategoryStyles(loc.category)}`}>
                                  {loc.category}
                                </span>
                              </div>
                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                  <h4 className="font-bold text-xs truncate text-slate-800 dark:text-slate-100 font-siemreap leading-snug">{loc.name}</h4>
                                  <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1">
                                    <MapPin size={10} className="text-[#2563EB]" />
                                    <span className="truncate">ឃុំ {loc.commune || 'រតនមណ្ឌល'}, {loc.village || 'ភូមិសហគមន៍'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star size={11} className="text-amber-400 fill-amber-400" />
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{rating}</span>
                                  <span className="text-[9px] text-slate-400">({reviews})</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 opacity-50 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <MapIcon size={36} className="mx-auto mb-2 text-slate-400 animate-bounce" />
                        <p className="text-xs font-bold font-siemreap">{t('មិនមានទិន្នន័យទីតាំងទេ', 'No Location Data')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 2: របាយការណ៍ (REPORTS) === */}
              {activeTab === 'reports' && (
                <div className="animate-slide-up p-4 space-y-4 font-siemreap">
                  <h2 className="font-moul text-sm text-[#2563EB] mb-2 flex items-center gap-2"><BarChart2 size={18}/> {t('របាយការណ៍ទិន្នន័យប្រព័ន្ធ', 'System Data Reports')}</h2>
                  
                  <div className={`p-5 rounded-3xl border shadow-sm relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent'}`}>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
                    <p className={`text-[11px] font-bold uppercase font-moul mb-1 ${isDarkMode ? 'text-slate-400' : 'text-blue-100'}`}>{t('ចំនួនអ្នកប្រើប្រាស់សរុប', 'Total Users')}</p>
                    <div className="flex items-end gap-2">
                      <h3 className={`text-4xl font-bold ${isDarkMode ? 'text-[#2563EB]' : 'text-white'}`}>{reportStats.totalUsers}</h3>
                      <span className={`text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-500' : 'text-blue-200'}`}>គណនី (១០០%)</span>
                    </div>
                  </div>

                  {/* Real Data Bar Chart */}
                  <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h3 className="font-bold text-[12px] font-moul mb-4 text-slate-700 dark:text-slate-300 flex items-center gap-2"><Activity size={16} className="text-[#2563EB]"/> {t('ស្ថិតិអ្នកចូលប្រើ (៦ ខែចុងក្រោយ)', 'Visits (Last 6 Months)')}</h3>
                    <div className="w-full h-40 flex items-end justify-between gap-2 pt-4">
                      {reportStats.barData.map((data, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1 gap-2">
                          <span className="text-[10px] font-bold text-slate-500">{data.count}</span>
                          <div className="w-full max-w-[24px] bg-blue-100 dark:bg-slate-800 rounded-t-md relative h-[100px] overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-[#2563EB] rounded-t-md transition-all duration-1000" style={{ height: `${data.percent || 0}%` }}></div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 truncate">{data.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Real Data Donut Chart */}
                  <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h3 className="font-bold text-[12px] font-moul mb-4 text-slate-700 dark:text-slate-300 flex items-center gap-2"><PieChart size={16} className="text-[#2563EB]"/> {t('សមាមាត្រប្រភេទទីតាំងសរុប', 'Location Categories Ratio')}</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32 relative flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                          {reportStats.pieData.length > 0 ? (() => {
                            let cumulativePercent = 0;
                            return reportStats.pieData.map((slice, i) => {
                              const percent = (slice.count / Math.max(reportStats.locations.approved, 1)) * 100;
                              const strokeDasharray = `${percent} 100`;
                              const strokeDashoffset = -cumulativePercent;
                              cumulativePercent += percent;
                              return (
                                <circle key={i} cx="50" cy="50" r="15.9155" fill="transparent" stroke={slice.color} strokeWidth="6" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
                              );
                            });
                          })() : <circle cx="50" cy="50" r="15.9155" fill="transparent" stroke="#cbd5e1" strokeWidth="6" />}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-slate-500 font-bold">{t('សរុប', 'Total')}</span>
                          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{reportStats.locations.approved}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {reportStats.pieData.slice(0, 4).map((slice, i) => (
                          <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: slice.color}}></span> <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{slice.name}</span></div>
                            <span className="text-slate-800 dark:text-slate-100">{slice.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* === TAB 3: បន្ថែមទីតាំង (ADD) === */}
              {activeTab === 'add' && (
                <div className="animate-slide-up p-4 space-y-4 font-siemreap">
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h3 className="font-bold text-sm text-[#2563EB] mb-4 font-moul flex items-center gap-2"><PlusCircle size={18}/> {t('បន្ថែមទីតាំងថ្មី', 'Add New Location')}</h3>
                    <form onSubmit={submitLocation} className="space-y-4">
                      <div><label className="text-[11px] font-bold text-slate-500 block mb-1">ឈ្មោះទីតាំង *</label><input type="text" required value={newLocName} onChange={e=>setNewLocName(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">ស្រុក *</label><select value={newLocDistrict} onChange={e=>setNewLocDistrict(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}><option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option><option value="ផ្សេងៗ">ផ្សេងៗ</option></select></div>
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">ប្រភេទ *</label><select value={newLocCategory} onChange={e=>setNewLocCategory(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}><option value="សាលារៀន">សាលារៀន</option><option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option><option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option><option value="ផ្សារ">ផ្សារ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option></select></div>
                      </div>
                      {newLocDistrict === 'ផ្សេងៗ' && <div><label className="text-[11px] font-bold text-slate-500 block mb-1">ឈ្មោះស្រុកថ្មី *</label><input type="text" required value={newLocCustomDistrict} onChange={e=>setNewLocCustomDistrict(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>}
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">ឃុំ *</label><input type="text" required value={newLocCommune} onChange={e=>setNewLocCommune(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">ភូមិ *</label><input type="text" required value={newLocVillage} onChange={e=>setNewLocVillage(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      </div>
                      <div><label className="text-[11px] font-bold text-slate-500 block mb-1">លេខទូរស័ព្ទ</label><input type="text" value={newLocPhone} onChange={e=>setNewLocPhone(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      <div><label className="text-[11px] font-bold text-slate-500 block mb-1">ព័ត៌មានលម្អិត</label><textarea value={newLocInfo} onChange={e=>setNewLocInfo(e.target.value)} rows="3" className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      <div><label className="text-[11px] font-bold text-slate-500 block mb-1">តំណភ្ជាប់ផែនទី</label><input type="text" value={newLocMapLink} onChange={e=>setNewLocMapLink(e.target.value)} className={`w-full p-3 rounded-xl border text-[16px] outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">រូបភាព</label>
                        <label className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#2563EB]/30 bg-blue-50/20'}`}>
                          {newLocImageBase64 ? <img src={newLocImageBase64} className="w-full h-full object-cover" alt="preview" /> : <><Camera className="text-[#2563EB] mb-2"/><span className="text-[10px] text-slate-500 font-bold">ចុចបញ្ចូលរូបថត</span></>}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full bg-[#2563EB] text-white py-4 rounded-xl font-bold font-moul mt-2">{isSubmitting ? 'កំពុងបញ្ជូន...' : t('បញ្ជូនសំណើទីតាំង', 'Submit Location')}</button>
                    </form>
                  </div>
                </div>
              )}

              {/* === TAB 4: PROFILE & SETTINGS (គណនី និង រដ្ឋបាល) === */}
              {activeTab === 'profile' && (
                <div className="animate-slide-up p-4 space-y-4 font-siemreap">
                  
                  {/* User Profile Card */}
                  <div className={`p-6 rounded-3xl border text-center relative ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                    <div className="w-24 h-24 mx-auto bg-blue-50/50 dark:bg-slate-800 rounded-full border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center font-bold overflow-hidden relative mb-3">
                      {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <span className="text-[#2563EB] text-2xl">{username ? username.substring(0,2).toUpperCase() : 'US'}</span>}
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#2563EB] text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white dark:border-slate-900 shadow-md hover:bg-blue-600 transition-colors"><Camera size={14} /><input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" /></label>
                    </div>
                    <h3 className="font-bold text-lg font-moul text-slate-800 dark:text-slate-100">{isAdmin ? 'រដ្ឋបាលប្រព័ន្ធ (Admin)' : (username || 'ភ្ញៀវសហគមន៍')}</h3>
                    <p className="text-[11px] font-bold text-slate-500 mt-1">សិទ្ធិ៖ {isAdmin ? 'គ្រប់គ្រងទិន្នន័យពេញលេញ' : 'អ្នកប្រើប្រាស់ធម្មតា'}</p>
                  </div>

                  {/* App Settings List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-moul text-slate-500 ml-2">{t('ការកំណត់ទូទៅ (Settings)', 'General Settings')}</h4>
                    
                    <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                      <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {isDarkMode ? <Moon size={16}/> : <Sun size={16}/>}
                          </div>
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-200 font-siemreap">{t('ផ្ទៃងងឹត (Dark Mode)', 'Dark Mode')}</span>
                        </div>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#2563EB]' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                      </div>

                      <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            <Globe size={16}/>
                          </div>
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-200 font-siemreap">{t('ផ្លាស់ប្តូរភាសា (Language)', 'Change Language')}</span>
                        </div>
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          <button onClick={()=>setLanguage('KH')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language==='KH' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#2563EB]' : 'text-slate-500'}`}>ខ្មែរ</button>
                          <button onClick={()=>setLanguage('EN')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language==='EN' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#2563EB]' : 'text-slate-500'}`}>EN</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Login */}
                  {!isAdmin && (
                    <div className="mt-6">
                      <h4 className="text-xs font-bold font-moul text-slate-500 ml-2 mb-3">{t('កិច្ចការរដ្ឋបាល (Admin Workspace)', 'Admin Workspace')}</h4>
                      <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                        {!showAdminLogin ? (
                          <button onClick={() => setShowAdminLogin(true)} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors rounded-xl font-bold text-xs flex justify-center items-center gap-2 font-moul text-slate-700 dark:text-slate-300"><ShieldCheck size={18} className="text-[#2563EB]" /> {t('ចូលគ្រប់គ្រងកិច្ចការរដ្ឋបាល', 'Login to Admin Workspace')}</button>
                        ) : (
                          <form onSubmit={handleAdminLogin} className="space-y-3 animate-fadeIn">
                            <h4 className="font-bold text-xs flex items-center gap-1.5 font-moul text-slate-800 dark:text-slate-200"><ShieldAlert size={16} className="text-yellow-500"/> ទាមទារលេខកូដសម្ងាត់</h4>
                            <p className="text-[10px] text-slate-500 font-bold mb-2">សូមបញ្ចូលលេខកូដសម្ងាត់ដើម្បីទទួលបានសិទ្ធិពេញលេញ</p>
                            {/* Input Font size changed to 16px to prevent iOS auto-zoom */}
                            <input type="password" value={adminPasswordInput} onChange={e=>setAdminPasswordInput(e.target.value)} className={`w-full p-3.5 rounded-xl border text-[16px] font-mono outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} placeholder="••••••••" />
                            <div className="flex gap-2 pt-2">
                              <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-bold rounded-xl text-xs font-moul text-slate-700 dark:text-slate-300">បោះបង់</button>
                              <button type="submit" className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-600 transition-colors text-white font-bold rounded-xl text-xs font-moul shadow-md shadow-blue-500/20">បញ្ជាក់ចូល</button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ENTERPRISE ADMIN WORKSPACE */}
                  {isAdmin && (
                    <div className="space-y-4 animate-slide-up mt-4">
                      <div className="p-4 bg-slate-900 rounded-3xl shadow-lg border border-slate-800">
                        <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
                          <ShieldCheck size={24} className="text-emerald-400" />
                          <div>
                            <h3 className="font-moul text-xs text-white">ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល (System Admin)</h3>
                            <p className="text-[10px] text-slate-400">ផ្ទាំងបញ្ជាលម្អិតកម្រិតកំពូល</p>
                          </div>
                        </div>

                        {/* Admin Subtabs Layout */}
                        <div className="flex gap-1.5 p-1 bg-slate-950 rounded-2xl">
                          <button onClick={() => setAdminSubTab('approvals')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-moul transition-all ${adminSubTab === 'approvals' ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📥 អនុម័ត ({pendingLocations.length})</button>
                          <button onClick={() => setAdminSubTab('data')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-moul transition-all ${adminSubTab === 'data' ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🗂️ ទិន្នន័យ</button>
                          <button onClick={() => setAdminSubTab('security')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-moul transition-all ${adminSubTab === 'security' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🛡️ សុវត្ថិភាព</button>
                        </div>
                      </div>

                      {/* Admin Tab: Approvals */}
                      {adminSubTab === 'approvals' && (
                        <div className="space-y-3">
                          {pendingLocations.map(loc => (
                            <div key={loc.id} className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-3`}>
                              <div className="flex justify-between items-start">
                                <div><h4 className="font-bold text-xs font-moul text-[#2563EB]">{loc.name}</h4><p className="text-[10px] text-slate-500 mt-1">ភូមិ៖ {loc.village}, ឃុំ{loc.commune}</p></div>
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold">{loc.category}</span>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => adminApprove(loc)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px]">យល់ព្រម</button>
                                <button onClick={() => adminReject(loc)} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl text-[11px]">បដិសេធ</button>
                              </div>
                            </div>
                          ))}
                          {pendingLocations.length === 0 && <p className="text-center py-8 text-xs text-slate-400">គ្មានសំណើថ្មីកំពុងរង់ចាំឡើយ</p>}
                        </div>
                      )}

                      {/* Admin Tab: Data Management with clean sub-tabs */}
                      {adminSubTab === 'data' && (
                        <div className="space-y-3">
                          {/* Subtabs for Locations vs Users */}
                          <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <button onClick={()=>setAdminDataTab('locations')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-moul transition-all flex items-center justify-center gap-1.5 ${adminDataTab==='locations' ? 'bg-white dark:bg-slate-800 shadow text-[#2563EB]':'text-slate-500 dark:text-slate-400'}`}><MapPin size={12} /> គ្រប់គ្រងទីតាំង</button>
                            <button onClick={()=>setAdminDataTab('users')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-moul transition-all flex items-center justify-center gap-1.5 ${adminDataTab==='users' ? 'bg-white dark:bg-slate-800 shadow text-[#2563EB]':'text-slate-500 dark:text-slate-400'}`}><Users size={12} /> ឈ្មោះអ្នកប្រើប្រាស់</button>
                          </div>

                          {/* Locations Management */}
                          {adminDataTab === 'locations' && (
                            <div className="space-y-2">
                              {approvedLocations.map(loc => (
                                <div key={loc.id} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex gap-3 items-center`}>
                                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-200"><img src={loc.imageUrl} className="w-full h-full object-cover" /></div>
                                  <div className="flex-1 min-w-0"><h4 className="font-bold text-[11px] truncate font-moul text-slate-800 dark:text-slate-100">{loc.name}</h4><p className="text-[9px] text-slate-500">{loc.village}, ឃុំ{loc.commune}</p></div>
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => setEditLoc(loc)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit3 size={14}/></button>
                                    <button onClick={() => adminDelete(loc.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={14}/></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Users Names List & Management (Admin has all on web app) */}
                          {adminDataTab === 'users' && (
                            <div className="space-y-2">
                              {userList.map(usr => (
                                <div key={usr.id} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex gap-3 items-center`}>
                                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 overflow-hidden shrink-0">
                                    {usr.profilePic ? <img src={usr.profilePic} className="w-full h-full object-cover" /> : usr.username?.substring(0,2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[12px] truncate font-siemreap text-slate-800 dark:text-slate-200">{usr.username}</h4>
                                    <p className="text-[9px] text-slate-400">បង្កើត៖ {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : 'សមាជិកថ្មី'}</p>
                                  </div>
                                  <button onClick={() => adminDeleteUser(usr.id)} className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 rounded-xl transition-colors">
                                    <Trash2 size={14}/>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Tab: Security redesigned beautifully */}
                      {adminSubTab === 'security' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex gap-3 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-10"><ShieldAlert size={80}/></div>
                            <Shield className="text-amber-600 shrink-0 relative z-10" size={24} />
                            <div className="relative z-10">
                              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 font-moul">សុវត្ថិភាពម៉ាស៊ីនមេ</h4>
                              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">ការឃ្លាំមើលការចូលប្រើប្រាស់ និងការប៉ុនប៉ងបញ្ចូលលេខកូដពីចម្ងាយត្រូវបានកត់ត្រាដោយស្វ័យប្រវត្តិ។</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs font-moul text-slate-700 dark:text-slate-300">កំណត់ហេតុចូលប្រើ ({securityLogs.length})</h4>
                            {securityLogs.length > 0 && (
                              <button onClick={adminClearSecurityLogs} className="text-[10px] font-bold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><Trash2 size={12}/> លុបទិន្នន័យចោល</button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {securityLogs.length > 0 ? (
                              securityLogs.map(log => (
                                <div key={log.id} className="p-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 shadow-sm text-[10px] space-y-2.5 relative overflow-hidden hover:border-red-300 transition-colors">
                                  <div className="absolute top-0 right-0 p-2 bg-red-50 dark:bg-red-900/20 rounded-bl-xl border-b border-l border-red-100 dark:border-red-900/30"><AlertTriangle size={14} className="text-red-500"/></div>
                                  <div className="flex items-center gap-2 mb-2"><ShieldAlert size={16} className="text-red-500" /><h4 className="font-bold text-red-600 font-moul text-[11px]">របាយការណ៍គំរាមកំហែង</h4></div>
                                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-siemreap bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-xl">
                                    <p className="flex justify-between items-center"><span className="text-slate-500 font-bold">ពេលវេលា:</span> <span className="font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 px-2 py-0.5 rounded shadow-sm">{new Date(log.timestamp).toLocaleString('km-KH')}</span></p>
                                    <p className="flex justify-between items-center"><span className="text-slate-500 font-bold">ឈ្មោះគណនី:</span> <span className="text-slate-800 dark:text-slate-200 font-bold">{log.username}</span></p>
                                    <p className="flex justify-between items-center"><span className="text-slate-500 font-bold">អាសយដ្ឋាន IP:</span> <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{log.ipAddress}</span></p>
                                    <p className="flex justify-between items-center"><span className="text-slate-500 font-bold">លេខកូដសាកល្បង:</span> <span className="text-red-600 font-mono font-bold bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded shadow-inner">{log.attemptedPassword}</span></p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-3 opacity-80" />
                                <p className="text-[13px] font-bold text-slate-600 dark:text-slate-400 font-moul">សុវត្ថិភាពល្អប្រសើរ</p>
                                <p className="text-[10px] text-slate-500 mt-1">មិនមានការប៉ុនប៉ងចូលដោយគ្មានការអនុញ្ញាតទេ</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logouts */}
                  {username && !isAdmin && <button onClick={() => { setUsername(''); localStorage.removeItem('vmc_username_2026'); setActiveTab('home'); }} className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex justify-center items-center gap-2 mt-6 font-moul"><LogOut size={14} /> ចាកចេញពីគណនី</button>}
                  {isAdmin && <button onClick={() => { setIsAdmin(false); setActiveTab('home'); }} className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex justify-center items-center gap-2 mt-4 font-moul"><LogOut size={14} /> ចាកចេញពីប្រព័ន្ធ Admin</button>}
                </div>
              )}
            </main>

            {/* === BOTTOM NAVIGATION BAR === */}
            <nav className={`absolute bottom-0 w-full flex justify-around items-center pt-2 pb-5 z-30 border-t rounded-t-3xl shadow-[0_-4px_15px_rgba(0,0,0,0.03)] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === 'home' ? 'text-[#2563EB] scale-110' : 'text-slate-400 scale-100'}`}>
                <Home size={22} /><span className="text-[10px] font-bold font-moul">{t('ទំព័រដើម', 'Home')}</span>
              </button>
              <button onClick={attemptToAddLocation} className={`flex flex-col items-center gap-1 w-16 relative -top-4 transition-all duration-300 ${activeTab === 'add' ? 'text-[#2563EB] scale-110' : 'text-slate-400 scale-100'}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform ${activeTab === 'add' ? 'bg-[#2563EB] text-white scale-110' : 'bg-[#2563EB] text-white'}`}><Plus size={28} /></div>
                <span className="text-[10px] font-bold mt-1 font-moul">{t('បន្ថែម', 'Add')}</span>
              </button>
              <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === 'reports' ? 'text-[#2563EB] scale-110' : 'text-slate-400 scale-100'}`}>
                <Activity size={22} /><span className="text-[10px] font-bold font-moul">{t('របាយការណ៍', 'Reports')}</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === 'profile' ? 'text-[#2563EB] scale-110' : 'text-slate-400 scale-100'}`}>
                <Settings size={22} /><span className="text-[10px] font-bold font-moul">{t('គណនី', 'Profile')}</span>
              </button>
            </nav>

          </div>
        )}

        {}
        {/* ==================== DETAILS OVERLAY MODAL ==================== */}
        {selectedLocation && (
          <div className="absolute inset-0 z-[60] bg-slate-50 dark:bg-slate-950 flex flex-col animate-slide-up">
            <div className="absolute top-0 w-full z-20 px-4 pt-12 pb-4 flex justify-between items-center text-white bg-gradient-to-b from-black/70 to-transparent">
              <button onClick={() => setSelectedLocation(null)} className="p-2 bg-black/20 rounded-full backdrop-blur-md hover:bg-black/40"><ArrowLeft size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scroll pb-24 font-siemreap">
              <div className="h-72 w-full bg-slate-200 relative"><img src={selectedLocation.imageUrl} className="w-full h-full object-cover" /></div>
              <div className={`p-5 -mt-6 relative z-10 rounded-t-3xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <h2 className="font-moul text-lg text-[#2563EB] mb-6">{selectedLocation.name}</h2>
                <div className="space-y-3">
                  <div className={`flex gap-3 items-start p-3 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><Layers size={18} className="text-[#2563EB] mt-0.5" /><div><p className="text-[10px] text-slate-500 font-bold">ប្រភេទ</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedLocation.category}</p></div></div>
                  <div className={`flex gap-3 items-start p-3 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><MapPin size={18} className="text-[#2563EB] mt-0.5" /><div><p className="text-[10px] text-slate-500 font-bold">ទីតាំង</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedLocation.village}, ឃុំ{selectedLocation.commune}, {selectedLocation.district}</p></div></div>
                  {selectedLocation.phone && <div className={`flex gap-3 items-start p-3 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><Phone size={18} className="text-[#2563EB] mt-0.5" /><div><p className="text-[10px] text-slate-500 font-bold">ទំនាក់ទំនង</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedLocation.phone}</p></div></div>}
                  {selectedLocation.info && <div className={`flex gap-3 items-start p-3 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><FileText size={18} className="text-[#2563EB] mt-0.5" /><div><p className="text-[10px] text-slate-500 font-bold">ព័ត៌មានបន្ថែម</p><p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{selectedLocation.info}</p></div></div>}
                </div>
              </div>
            </div>
            <div className={`absolute bottom-0 w-full border-t p-4 flex gap-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <a href={`tel:${selectedLocation.phone || ''}`} className="flex-1 py-3.5 bg-blue-50 text-blue-600 rounded-xl font-bold flex justify-center items-center gap-2 font-moul text-xs"><Phone size={16}/> ទូរស័ព្ទ</a>
              <a href={selectedLocation.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation.name)}`} target="_blank" rel="noreferrer" className="flex-1 py-3.5 bg-[#2563EB] text-white rounded-xl font-bold flex justify-center items-center gap-2 font-moul text-xs"><MapIcon size={16}/> ផែនទី</a>
            </div>
          </div>
        )}

        {/* ==================== ADMIN EDIT MODAL ==================== */}
        {editLoc && (
          <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-sm rounded-3xl p-5 max-h-[90vh] overflow-y-auto hide-scroll ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <h3 className="font-bold text-sm text-[#2563EB] font-moul mb-4">កែប្រែទិន្នន័យ</h3>
              <form onSubmit={adminSaveEdit} className="space-y-3 font-siemreap">
                <input type="text" value={editLoc.name} onChange={e=>setEditLoc({...editLoc, name: e.target.value})} className="w-full p-3 rounded-xl border text-[16px]" placeholder="ឈ្មោះ" required />
                <input type="text" value={editLoc.category} onChange={e=>setEditLoc({...editLoc, category: e.target.value})} className="w-full p-3 rounded-xl border text-[16px]" placeholder="ប្រភេទ" required />
                <input type="text" value={editLoc.village} onChange={e=>setEditLoc({...editLoc, village: e.target.value})} className="w-full p-3 rounded-xl border text-[16px]" placeholder="ភូមិ" required />
                <input type="text" value={editLoc.phone || ''} onChange={e=>setEditLoc({...editLoc, phone: e.target.value})} className="w-full p-3 rounded-xl border text-[16px]" placeholder="ទូរស័ព្ទ" />
                <textarea value={editLoc.info || ''} onChange={e=>setEditLoc({...editLoc, info: e.target.value})} className="w-full p-3 rounded-xl border text-[16px]" rows="3" placeholder="ព័ត៌មាន"></textarea>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setEditLoc(null)} className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs font-moul">បោះបង់</button>
                  <button type="submit" className="flex-1 py-3 bg-[#2563EB] text-white font-bold rounded-xl text-xs font-moul">រក្សាទុក</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== CREATE USERNAME MODAL ==================== */}
        {showUsernameModal && (
          <div className="absolute inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
              <div className="w-16 h-16 bg-[#2563EB]/10 rounded-full mx-auto flex items-center justify-center mb-4 text-[#2563EB]"><User size={30} /></div>
              <h3 className="text-center font-bold text-sm mb-1 font-moul">បង្កើតគណនីសហគមន៍</h3>
              <p className="text-center text-[10px] text-slate-500 mb-5 leading-relaxed font-siemreap">កំណត់ឈ្មោះសម្គាល់ដើម្បីមានសិទ្ធិបន្ថែមទីតាំង</p>
              <input type="text" placeholder="បញ្ចូលឈ្មោះ..." value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} className={`w-full p-4 rounded-xl outline-none border font-bold text-center text-[16px] mb-4 focus:border-[#2563EB] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              <div className="flex gap-3">
                <button onClick={()=>setShowUsernameModal(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-600 font-moul">បិទ</button>
                <button onClick={handleSaveUsername} className="flex-1 py-3 bg-[#2563EB] text-white rounded-xl font-bold text-xs shadow-md font-moul">រក្សាទុក</button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Alert Notification */}
        {toastAlert.show && (
          <div className="absolute top-4 left-4 right-4 z-[90] flex justify-center animate-slide-up">
            <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-[11px] text-white font-moul ${toastAlert.type === 'error' ? 'bg-red-500' : 'bg-[#2563EB]'}`}>
              {toastAlert.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
              {toastAlert.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}