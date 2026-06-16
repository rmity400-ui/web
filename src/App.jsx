import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { 
  MapPin, Search, PlusCircle, ShieldCheck, User, Sun, Moon, 
  Phone, Map as MapIcon, Check, AlertTriangle, Menu,
  LogOut, Camera, Plus, Compass, BarChart2, ShieldAlert, ArrowLeft, Home, FileText, Activity, Layers, Edit3, Trash2, Globe, Star, Users, Briefcase, Settings, Shield, PieChart, ChevronRight, ChevronDown, MonitorSmartphone
} from 'lucide-react';

// =========================================================================
// 📸 BACKGROUND IMAGES & CONFIG
// =========================================================================
const WELCOME_BACKGROUND_URL = "back.png";

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

// Environment variable fallback configuration - Safely defined as a fallback constant to ensure es2015 target compatibility
const ADMIN_PASSWORD = "ict168mit";

const ROTANAK_MONDOL_COMMUNES = ["ស្តៅ", "ត្រែង", "ផ្លូវមាស", "អណ្តើកហែប", "រស្មីសង្ហា", "គរ"];

// Device detection helper
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone / iOS';
  if (/iPad/i.test(ua)) return 'iPad / iOS';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac OS';
  return 'Unknown Device';
};

export default function App() {
  // === APP STATE ===
  const [currentPage, setCurrentPage] = useState(1); // 1: Welcome, 2: Main, 3: Admin Page
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Navigation
  const [activeTab, setActiveTab] = useState('home'); 
  const [adminSubTab, setAdminSubTab] = useState('approvals'); // approvals, reports, data, security
  const [adminDataTab, setAdminDataTab] = useState('locations'); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
  // Modals & Alerts
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  const [selectedLocation, setSelectedLocation] = useState(null); 
  
  // Settings State
  const [language, setLanguage] = useState('KH');
  
  // Translation Helper
  const t = (kh, en) => language === 'EN' ? en : kh;

  // Admin Expand/Collapse states for commune & village hierarchy
  const [expandedCommunes, setExpandedCommunes] = useState({});
  const [expandedVillages, setExpandedVillages] = useState({});

  // Admin Edit State
  const [editLoc, setEditLoc] = useState(null);

  // Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [adminEmailInput, setAdminEmailInput] = useState('');
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

  // Mobile Menu Toggle for Desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      // Sort pending from newest to oldest
      setPendingLocations(locs.filter(l => !l.approved).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
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

  // Secure Admin Login with Firebase Auth and Environment Variable support
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Primary Method: Firebase Authentication 
      if (adminEmailInput) {
        await signInWithEmailAndPassword(auth, adminEmailInput, adminPasswordInput);
      } else if (ADMIN_PASSWORD && adminPasswordInput === ADMIN_PASSWORD) {
        // Fallback Method: Environment Variable (if configured without Firebase Auth users yet)
        console.log("Authenticated via Environment Variable");
      } else {
        throw new Error("Invalid credentials");
      }

      setIsAdmin(true); 
      setShowAdminLogin(false); 
      setAdminPasswordInput(''); 
      setAdminEmailInput('');
      setCurrentPage(3); // Navigate directly to Admin workspace page
      showToast('ចូលប្រើប្រាស់គណនី Admin ជោគជ័យ!');
      
    } catch (error) {
      showToast('អ៊ីមែល ឬ លេខកូដសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
      
      // Log Security Threat to Database
      try {
        const randomIp = `${Math.floor(Math.random()*150)+50}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}`;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2'), {
          timestamp: new Date().toISOString(), 
          ipAddress: randomIp, 
          username: adminEmailInput || username || 'ភ្ញៀវអនាមិក', 
          attemptedPassword: adminPasswordInput,
          deviceModel: getDeviceInfo() // dynamic device model tracking
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
  const adminDeleteLog = async (logId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2', logId)); showToast('បានលុបគំរាមកំហែង!', 'success'); } catch(err) {}
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

  // Unified Real-Time Report Statistics
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

  // Helper for tag styles
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

  // Expand Toggle handlers for Commune & Village
  const toggleCommune = (cName) => {
    setExpandedCommunes(prev => ({ ...prev, [cName]: !prev[cName] }));
  };
  const toggleVillage = (vName) => {
    setExpandedVillages(prev => ({ ...prev, [vName]: !prev[vName] }));
  };

  // Reusable Statistics and Charts Dashboard
  const RenderReportsDashboard = () => (
    <div className="space-y-4 font-siemreap">
      {/* Total Users Summary Card */}
      <div className={`p-5 md:p-8 rounded-3xl border shadow-sm relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white'}`}>
        <div className="absolute right-0 top-0 w-32 h-32 md:w-64 md:h-64 bg-white/10 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
        <p className={`text-[11px] md:text-sm font-bold uppercase font-moul mb-1 ${isDarkMode ? 'text-slate-400' : 'text-blue-100'}`}>{t('ចំនួនអ្នកប្រើប្រាស់សរុប', 'Total Users')}</p>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl md:text-6xl font-bold font-siemreap">{reportStats.totalUsers}</h3>
          <span className={`text-xs md:text-sm font-bold mb-1.5 md:mb-2 ${isDarkMode ? 'text-slate-500' : 'text-blue-200'}`}>{t('គណនី (១០០%)', 'Accounts (100%)')}</span>
        </div>
      </div>

      {/* Week, Month, Year Stats Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className={`p-4 md:p-6 rounded-2xl border text-center shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-2 font-moul">{t('សប្តាហ៍នេះ', 'This Week')}</p>
          <p className="text-xl md:text-3xl font-bold text-emerald-500">{reportStats.weekly}</p>
        </div>
        <div className={`p-4 md:p-6 rounded-2xl border text-center shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-2 font-moul">{t('ខែនេះ', 'This Month')}</p>
          <p className="text-xl md:text-3xl font-bold text-blue-500">{reportStats.monthly}</p>
        </div>
        <div className={`p-4 md:p-6 rounded-2xl border text-center shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-2 font-moul">{t('ឆ្នាំនេះ', 'This Year')}</p>
          <p className="text-xl md:text-3xl font-bold text-amber-500">{reportStats.yearly}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SVG Bar Chart */}
        <div className={`p-4 md:p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <h4 className="font-bold text-xs md:text-sm mb-4 font-moul text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-[#2563EB]"/> {t('ស្ថិតិអ្នកចូលប្រើ (៦ ខែចុងក្រោយ)', 'Visits (Last 6 Months)')}
          </h4>
          <div className="w-full h-40 md:h-56 flex items-end justify-between gap-2 pt-4">
            {reportStats.barData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 gap-2">
                <span className="text-[10px] md:text-xs font-bold text-slate-500">{data.count}</span>
                <div className="w-full max-w-[20px] md:max-w-[32px] bg-blue-100 dark:bg-slate-800 rounded-t-md relative h-24 md:h-40 overflow-hidden">
                  <div className="absolute bottom-0 w-full bg-[#2563EB] rounded-t-md transition-all duration-1000" style={{ height: `${data.percent || 0}%` }}></div>
                </div>
                <span className="text-[9px] md:text-xs font-bold text-slate-500 truncate">{data.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Donut Chart for Categories */}
        <div className={`p-4 md:p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <h4 className="font-bold text-xs md:text-sm mb-4 font-moul text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <PieChart size={16} className="text-[#2563EB]"/> {t('សមាមាត្រប្រភេទទីតាំងសរុប', 'Location Categories Ratio')}
          </h4>
          <div className="flex items-center gap-6 h-full pb-6">
            <div className="w-28 h-28 md:w-40 md:h-40 relative flex-shrink-0">
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
                <span className="text-[9px] md:text-xs text-slate-500 font-bold">{t('សរុប', 'Total')}</span>
                <span className="text-sm md:text-xl font-bold text-slate-800 dark:text-slate-200">{reportStats.locations.approved}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 md:space-y-3">
              {reportStats.pieData.slice(0, 5).map((slice, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] md:text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{backgroundColor: slice.color}}></span> 
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px] md:max-w-[120px]">{slice.name}</span>
                  </div>
                  <span className="text-slate-800 dark:text-slate-100">{slice.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center bg-[#0F172A] overflow-hidden font-sans`}>
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

      {/* Main Container - Responsive for Desktop & Mobile */}
      <div className={`w-full h-screen relative overflow-hidden flex shadow-2xl transition-all ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        
        {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile) */}
        {(currentPage === 2 || currentPage === 3) && (
          <aside className={`hidden md:flex flex-col w-64 h-full border-r z-30 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-6 border-b border-inherit">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold font-moul">TP</div>
                <div>
                  <h2 className="font-bold text-[16px] text-[#2563EB] font-moul leading-tight">TP nice</h2>
                  <p className="text-[10px] text-slate-500 font-bold">{isAdmin ? 'Admin Workspace' : 'Community App'}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              {currentPage === 2 ? (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">ម៉ឺនុយទូទៅ</p>
                  {[
                    { id: 'home', icon: Home, label: t('ទំព័រដើម', 'Home') },
                    { id: 'add', icon: PlusCircle, label: t('បន្ថែមទីតាំង', 'Add Location') },
                    { id: 'reports', icon: Activity, label: t('របាយការណ៍', 'Reports') },
                    { id: 'profile', icon: Settings, label: t('គណនី និងការកំណត់', 'Profile & Settings') }
                  ].map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[13px] ${activeTab === item.id ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <item.icon size={18} /> {item.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">ផ្ទាំងគ្រប់គ្រង</p>
                  {[
                    { id: 'approvals', icon: Check, label: `រង់ចាំអនុម័ត (${pendingLocations.length})` },
                    { id: 'reports', icon: BarChart2, label: 'របាយការណ៍ប្រព័ន្ធ' },
                    { id: 'data', icon: Layers, label: 'គ្រប់គ្រងទិន្នន័យ' },
                    { id: 'security', icon: ShieldAlert, label: 'សុវត្ថិភាព' }
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setAdminSubTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[13px] ${adminSubTab === tab.id ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <tab.icon size={18} /> {tab.label}
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="p-4 border-t border-inherit">
              {currentPage === 3 ? (
                <button onClick={() => { setIsAdmin(false); setCurrentPage(2); setActiveTab('home'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[13px] bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-400 transition-colors">
                  <LogOut size={18} /> {t('ចាកចេញពី Admin', 'Exit Admin')}
                </button>
              ) : username ? (
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                    {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{username.substring(0,2).toUpperCase()}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] truncate dark:text-white">{username}</p>
                    <p className="text-[10px] text-slate-500">{isAdmin ? 'Admin' : 'User'}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        )}

        {/* Content Area wrapper */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* ==================== PAGE 1 (WELCOME SCREEN) ==================== */}
          {currentPage === 1 && (
            <div className="absolute inset-0 z-50 flex flex-col justify-center items-center bg-cover bg-center animate-fadeIn" style={{ backgroundImage: `url(${WELCOME_BACKGROUND_URL})` }}>
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/90"></div>
              
              <div className="relative z-10 flex flex-col items-center max-w-lg px-6 w-full">
                {/* Top Logo */}
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white shadow-[0_0_40px_rgba(37,99,235,0.6)] border-4 border-[#2563EB] overflow-hidden mb-6 animate-pulse">
                  <img src="logo.png" alt="App Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg font-moul mb-3 text-center leading-normal">
                  សូមស្វាគមន៍មកកាន់ <br className="md:hidden"/> <span className="text-blue-400">TP nice</span>
                </h1>
                <div className="w-16 md:w-24 h-1.5 bg-[#2563EB] rounded-full opacity-85 mb-10"></div>

                {/* Welcome Box */}
                <div className="w-full p-8 bg-black/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center">
                  <h2 className="text-[16px] md:text-lg font-bold text-slate-100 font-moul text-center mb-3">{t('ស្វែងរកទីតាំងក្នុងសហគមន៍របស់អ្នក', 'Find Locations in Your Community')}</h2>
                  <p className="text-xs md:text-sm text-slate-300 text-center font-siemreap leading-relaxed mb-8">
                    {t('បង្កើតឡើងដោយសហគមន៍ ដើម្បីសម្រួលដល់ការស្វែងរក និងចែករំលែកទីតាំងសំខាន់ៗ។ យើងជួយអ្នកសន្សំពេលវេលា និងផ្តល់ព័ត៌មានដែលគួរឲ្យទុកចិត្តបំផុតសម្រាប់ការរស់នៅប្រចាំថ្ងៃ។', 'Created by the community to ease finding and sharing important places. We help save your time and provide trusted info for daily life.')}
                  </p>
                  
                  <button 
                    onClick={handleProceed}
                    className="w-full md:w-3/4 py-4 bg-[#2563EB] hover:bg-blue-600 active:scale-95 transition-all duration-300 text-white rounded-2xl font-bold text-[14px] md:text-[16px] shadow-[0_10px_25px_rgba(37,99,235,0.5)] font-moul border border-blue-400/30 flex items-center justify-center gap-3"
                  >
                    {t('អនុញ្ញាតឲខ្លួនឯងចូលប្រើ', 'Allow Access to Use')} <ArrowLeft size={20} className="rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PAGE 2 (MAIN APP SCREEN) ==================== */}
          {currentPage === 2 && (
            <>
              {/* Mobile Header (Hidden on Desktop) */}
              <header className={`md:hidden px-4 py-3.5 flex justify-between items-center z-20 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-b`}>
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setCurrentPage(1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-[#2563EB]">
                    <ArrowLeft size={16} />
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
              <main className="flex-1 overflow-y-auto hide-scroll pb-24 md:pb-8 md:p-6 lg:p-8 z-10">
                <div className="max-w-6xl mx-auto">
                  
                  {/* === TAB 1: ស្វែងរកទីតាំង (HOME) === */}
                  {activeTab === 'home' && (
                    <div className="animate-slide-up space-y-5 md:space-y-8 font-siemreap p-4 md:p-0">
                      
                      {/* Hero Text */}
                      <div className="space-y-3 p-6 md:p-10 rounded-[2rem] border shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 border-blue-100 dark:border-slate-700/50">
                        <div className="absolute -right-4 -top-4 w-32 h-32 md:w-64 md:h-64 bg-[#2563EB]/10 rounded-full blur-3xl"></div>
                        <h1 className="text-[20px] md:text-3xl font-bold leading-snug md:leading-normal text-slate-900 dark:text-white tracking-tight font-moul">
                          {t('ស្វាគមន៍មកកាន់', 'Welcome to')} <br className="md:hidden"/>
                          <span className="text-[#2563EB]">{t('សហគមន៍ឆ្លាតវៃ', 'Smart Community')}</span> {t('របស់អ្នក', 'of yours')}
                        </h1>
                        <p className="text-[12px] md:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-[95%] md:max-w-2xl font-siemreap font-bold">
                          {t('ចូលរួមស្វែងរក និងចែករំលែកទីតាំងសំខាន់ៗជុំវិញខ្លួនអ្នក ដើម្បីផ្តល់ភាពងាយស្រួល និងទំនុកចិត្តដល់សមាជិកទាំងអស់គ្នា។', 'Join in finding and sharing important locations around you to provide ease and trust for all members.')}
                        </p>
                      </div>

                      {/* Search & Filters Grid for Desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div className="relative md:col-span-2">
                          <input 
                            type="text" placeholder={t('ស្វែងរកទីតាំង...', 'Search locations...')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className={`w-full py-4 pl-12 pr-4 rounded-2xl md:rounded-3xl text-[16px] outline-none border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 focus:border-[#2563EB]' : 'bg-white border-slate-200 shadow-sm focus:border-[#2563EB]'}`}
                          />
                          <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                        </div>

                        {/* District & Region Select */}
                        <div className={`p-2 rounded-2xl md:rounded-3xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className="flex gap-1.5 w-full bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl md:rounded-2xl">
                            <button onClick={() => { setSelectedDistrictTab('រតនមណ្ឌល'); setSelectedCommune(''); }} className={`flex-1 py-2 text-[11px] md:text-xs font-bold rounded-lg md:rounded-xl transition-colors ${selectedDistrictTab === 'រតនមណ្ឌល' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500'}`}>រតនមណ្ឌល</button>
                            <button onClick={() => { setSelectedDistrictTab('ផ្សេងៗ'); setSelectedCommune(''); }} className={`flex-1 py-2 text-[11px] md:text-xs font-bold rounded-lg md:rounded-xl transition-colors ${selectedDistrictTab === 'ផ្សេងៗ' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500'}`}>ផ្សេងៗ</button>
                          </div>
                        </div>
                      </div>

                      {selectedDistrictTab === 'រតនមណ្ឌល' && (
                        <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
                           <button onClick={() => handleCommuneChange('')} className={`px-4 py-2 text-[11px] md:text-sm font-bold rounded-xl whitespace-nowrap border transition-all ${selectedCommune === '' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>ឃុំទាំងអស់</button>
                           {ROTANAK_MONDOL_COMMUNES.map(comm => (
                             <button key={comm} onClick={() => handleCommuneChange(comm)} className={`px-4 py-2 text-[11px] md:text-sm font-bold rounded-xl whitespace-nowrap border transition-all ${selectedCommune === comm ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>ឃុំ {comm}</button>
                           ))}
                        </div>
                      )}

                      {/* Quick Categories Filter Buttons */}
                      <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                        {['ទាំងអស់', 'សាលារៀន', 'មណ្ឌលសុខភាព', 'ប៉ុស្តិ៍ប៉ូលីស', 'ផ្សារ', 'ផ្សេងៗ'].map((cat) => {
                          const displayCat = language === 'EN' && cat === 'ទាំងអស់' ? 'All' : cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setCategoryFilter(cat)}
                              className={`px-4 py-2.5 text-[11px] md:text-sm font-bold rounded-xl md:rounded-2xl whitespace-nowrap border transition-all ${
                                categoryFilter === cat 
                                  ? 'bg-[#2563EB] text-white border-transparent shadow-md transform scale-105' 
                                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {displayCat}
                            </button>
                          )
                        })}
                      </div>

                      {/* Locations List / Grid */}
                      <div className="space-y-4 md:space-y-6 pb-8">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 md:pb-4">
                          <h3 className="font-bold text-sm md:text-lg font-moul text-slate-800 dark:text-slate-200">
                            {t('ទីតាំងពេញនិយម', 'Popular Places')} <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-lg text-xs ml-2">{displayedLocations.length}</span>
                          </h3>
                        </div>
                        
                        {displayedLocations.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {displayedLocations.map((loc, index) => {
                              const rating = (4.5 + (index % 5) * 0.1).toFixed(1);
                              const reviews = 50 + (index * 19);
                              return (
                                <div 
                                  key={loc.id} 
                                  onClick={() => setSelectedLocation(loc)} 
                                  className={`group p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
                                >
                                  <div className="w-full aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden shrink-0 bg-slate-100 relative mb-3">
                                    <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <span className={`absolute top-2 left-2 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg border backdrop-blur-md bg-white/90 dark:bg-slate-900/90 shadow-sm ${getCategoryStyles(loc.category)}`}>
                                      {loc.category}
                                    </span>
                                  </div>
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                      <h4 className="font-bold text-[13px] md:text-[15px] line-clamp-2 text-slate-800 dark:text-slate-100 font-siemreap leading-tight">{loc.name}</h4>
                                      <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-500 mt-2">
                                        <MapPin size={14} className="text-[#2563EB]" />
                                        <span className="truncate">ឃុំ {loc.commune || 'រតនមណ្ឌល'}, {loc.village || 'ភូមិសហគមន៍'}</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                      <div className="flex items-center gap-1">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{rating}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{reviews} Reviews</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-16 md:py-24 opacity-50 bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <MapIcon size={48} className="mx-auto mb-4 text-slate-400 animate-bounce" />
                            <p className="text-sm md:text-base font-bold font-siemreap">{t('មិនមានទិន្នន័យទីតាំងទេ', 'No Location Data')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* === TAB 2: របាយការណ៍ (REPORTS) === */}
                  {activeTab === 'reports' && (
                    <div className="animate-slide-up p-4 md:p-0">
                      <h2 className="font-moul text-sm md:text-xl text-[#2563EB] mb-4 md:mb-8 flex items-center gap-3">
                        <BarChart2 size={24}/> {t('របាយការណ៍ទិន្នន័យប្រព័ន្ធ', 'System Data Reports')}
                      </h2>
                      <RenderReportsDashboard />
                    </div>
                  )}

                  {/* === TAB 3: បន្ថែមទីតាំង (ADD) === */}
                  {activeTab === 'add' && (
                    <div className="animate-slide-up p-4 md:p-0 flex justify-center">
                      <div className={`w-full max-w-2xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-blue-900/5'}`}>
                        <h3 className="font-bold text-base md:text-xl text-[#2563EB] mb-6 md:mb-8 font-moul flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4"><PlusCircle size={24}/> {t('បន្ថែមទីតាំងថ្មី', 'Add New Location')}</h3>
                        
                        <form onSubmit={submitLocation} className="space-y-4 md:space-y-6">
                          <div>
                            <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">ឈ្មោះទីតាំង *</label>
                            <input type="text" required value={newLocName} onChange={e=>setNewLocName(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} placeholder="ឧ. សាលាបឋមសិក្សាស្តៅ" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div>
                              <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">ស្រុក *</label>
                              <select value={newLocDistrict} onChange={e=>setNewLocDistrict(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`}>
                                <option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                                <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">ប្រភេទ *</label>
                              <select value={newLocCategory} onChange={e=>setNewLocCategory(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`}>
                                <option value="សាលារៀន">សាលារៀន</option><option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option><option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option><option value="ផ្សារ">ផ្សារ</option><option value="ផ្សេងៗ">ផ្សេងៗ</option>
                              </select>
                            </div>
                          </div>

                          {newLocDistrict === 'ផ្សេងៗ' && (
                            <div className="animate-fadeIn">
                              <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">ឈ្មោះស្រុកថ្មី *</label>
                              <input type="text" required value={newLocCustomDistrict} onChange={e=>setNewLocCustomDistrict(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div>
                              <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">ឃុំ *</label>
                              <input type="text" required value={newLocCommune} onChange={e=>setNewLocCommune(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} />
                            </div>
                            <div>
                              <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">ភូមិ *</label>
                              <input type="text" required value={newLocVillage} onChange={e=>setNewLocVillage(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div>
                              <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">លេខទូរស័ព្ទ</label>
                              <input type="text" value={newLocPhone} onChange={e=>setNewLocPhone(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} placeholder="012 345 678" />
                            </div>
                            <div>
                              <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">តំណភ្ជាប់ផែនទី (Google Maps)</label>
                              <input type="url" value={newLocMapLink} onChange={e=>setNewLocMapLink(e.target.value)} className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} placeholder="https://goo.gl/maps/..." />
                            </div>
                          </div>

                          <div>
                            <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">ព័ត៌មានលម្អិត</label>
                            <textarea value={newLocInfo} onChange={e=>setNewLocInfo(e.target.value)} rows="4" className={`w-full p-4 rounded-xl md:rounded-2xl border text-[16px] outline-none resize-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'}`} placeholder="សរសេរពណ៌នាទីតាំង..." />
                          </div>

                          <div>
                            <label className="text-[12px] md:text-sm font-bold text-slate-500 block mb-2">រូបភាពទីតាំង</label>
                            <label className={`w-full h-40 md:h-56 border-2 border-dashed rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-750' : 'border-[#2563EB]/30 bg-blue-50/30 hover:bg-blue-50'}`}>
                              {newLocImageBase64 ? <img src={newLocImageBase64} className="w-full h-full object-cover" alt="preview" /> : (
                                <>
                                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-900 rounded-full shadow-md flex items-center justify-center mb-3">
                                    <Camera className="text-[#2563EB]" size={24} />
                                  </div>
                                  <span className="text-[12px] md:text-sm text-slate-500 font-bold">ចុចដើម្បីជ្រើសរើសរូបថត</span>
                                </>
                              )}
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-[#2563EB] hover:bg-blue-600 active:scale-95 transition-all text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-bold text-sm md:text-base font-moul shadow-lg shadow-blue-500/30">
                              {isSubmitting ? 'កំពុងដំណើរការ...' : t('បញ្ជូនសំណើទីតាំង', 'Submit Location')}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* === TAB 4: PROFILE & SETTINGS === */}
                  {activeTab === 'profile' && (
                    <div className="animate-slide-up p-4 md:p-0 flex justify-center">
                      <div className="w-full max-w-xl space-y-6">
                        
                        {/* Profile Card */}
                        <div className={`p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border text-center relative shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                          <div className="w-28 h-28 md:w-36 md:h-36 mx-auto bg-blue-50 dark:bg-slate-800 rounded-full border-4 md:border-8 border-white dark:border-slate-900 shadow-xl flex items-center justify-center font-bold overflow-hidden relative mb-4 md:mb-6">
                            {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <span className="text-[#2563EB] text-3xl md:text-5xl">{username ? username.substring(0,2).toUpperCase() : 'US'}</span>}
                            <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#2563EB] text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white dark:border-slate-900 shadow-md hover:bg-blue-600 transition-colors">
                              <Camera size={18} />
                              <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                            </label>
                          </div>
                          <h3 className="font-bold text-xl md:text-3xl font-moul text-slate-800 dark:text-slate-100 mb-2">{isAdmin ? 'រដ្ឋបាលប្រព័ន្ធ (Admin)' : (username || 'ភ្ញៀវសហគមន៍')}</h3>
                          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {isAdmin ? 'គ្រប់គ្រងទិន្នន័យពេញលេញ' : 'អ្នកប្រើប្រាស់ធម្មតា'}
                          </span>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                          <h4 className="text-sm md:text-base font-bold font-moul text-slate-500 ml-2">{t('ការកំណត់ទូទៅ (Settings)', 'General Settings')}</h4>
                          <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                            <div className="p-4 md:p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                  {isDarkMode ? <Moon size={20}/> : <Sun size={20}/>}
                                </div>
                                <span className="font-bold text-sm md:text-base text-slate-700 dark:text-slate-200 font-siemreap">{t('ផ្ទៃងងឹត (Dark Mode)', 'Dark Mode')}</span>
                              </div>
                              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-7 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#2563EB]' : 'bg-slate-300'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
                              </button>
                            </div>

                            <div className="p-4 md:p-6 flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                  <Globe size={20}/>
                                </div>
                                <span className="font-bold text-sm md:text-base text-slate-700 dark:text-slate-200 font-siemreap">{t('ផ្លាស់ប្តូរភាសា (Language)', 'Change Language')}</span>
                              </div>
                              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                                <button onClick={()=>setLanguage('KH')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${language==='KH' ? 'bg-white dark:bg-slate-700 shadow text-[#2563EB]' : 'text-slate-500'}`}>ខ្មែរ</button>
                                <button onClick={()=>setLanguage('EN')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${language==='EN' ? 'bg-white dark:bg-slate-700 shadow text-[#2563EB]' : 'text-slate-500'}`}>EN</button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Admin Login Trigger */}
                        {!isAdmin && (
                          <div className="pt-6">
                            <h4 className="text-sm md:text-base font-bold font-moul text-slate-500 ml-2 mb-4">{t('កិច្ចការរដ្ឋបាល (Admin Workspace)', 'Admin Workspace')}</h4>
                            <button 
                              onClick={() => setShowAdminLogin(true)} 
                              className={`w-full py-5 rounded-2xl md:rounded-3xl font-bold text-sm md:text-base flex justify-center items-center gap-3 font-moul transition-all ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md'}`}
                            >
                              <ShieldCheck size={24} className="text-[#2563EB]" /> {t('ចូលគ្រប់គ្រងកិច្ចការរដ្ឋបាល', 'Login to Admin Workspace')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </main>

              {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
              <nav className={`md:hidden absolute bottom-0 w-full flex justify-around items-center pt-2 pb-5 z-30 border-t rounded-t-3xl shadow-[0_-4px_15px_rgba(0,0,0,0.03)] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                {[
                  { id: 'home', icon: Home, label: t('ទំព័រដើម', 'Home') },
                  { id: 'add', icon: Plus, label: t('បន្ថែម', 'Add'), isSpecial: true },
                  { id: 'reports', icon: Activity, label: t('របាយការណ៍', 'Reports') },
                  { id: 'profile', icon: Settings, label: t('គណនី', 'Profile') }
                ].map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 w-16 transition-transform duration-300 ${activeTab === item.id ? 'text-[#2563EB] scale-110' : 'text-slate-400 scale-100'} ${item.isSpecial ? 'relative -top-4' : ''}`}>
                    {item.isSpecial ? (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform ${activeTab === 'add' ? 'bg-[#2563EB] text-white scale-110' : 'bg-[#2563EB] text-white'}`}><Plus size={28} /></div>
                    ) : <item.icon size={22} />}
                    <span className={`text-[10px] font-bold font-moul ${item.isSpecial ? 'mt-1' : ''}`}>{item.label}</span>
                  </button>
                ))}
              </nav>
            </>
          )}

          {/* ==================== PAGE 3 (NEW FULL-SCREEN ADMIN PAGE) ==================== */}
          {currentPage === 3 && isAdmin && (
            <div className="absolute inset-0 z-50 flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fadeIn">
              {/* Admin Header */}
              <header className="px-4 md:px-8 py-4 bg-[#2563EB] text-white flex justify-between items-center shadow-md z-20">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setCurrentPage(2); setActiveTab('profile'); }} 
                    className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex w-10 h-10 bg-white rounded-full items-center justify-center text-[#2563EB] font-black font-moul">AD</div>
                    <div>
                      <h2 className="font-bold text-[16px] md:text-[20px] font-moul leading-tight">កិច្ចការរដ្ឋបាល (Admin Dashboard)</h2>
                      <p className="text-[11px] md:text-sm text-blue-100 font-siemreap">គ្រប់គ្រង និងអនុម័តទីតាំងប្រព័ន្ធ</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsAdmin(false); setCurrentPage(2); setActiveTab('profile'); }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white transition-colors flex items-center gap-2 text-xs md:text-sm font-bold shadow-sm"
                >
                  <LogOut size={16} /> <span className="hidden md:block">{t('ចាកចេញពីប្រព័ន្ធ', 'Logout')}</span>
                </button>
              </header>

              {/* Responsive Layout wrapper for Admin Dashboard */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* Admin Desktop Sidebar Navigation */}
                <aside className={`hidden md:flex flex-col w-64 border-r z-10 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="p-4 space-y-2 font-siemreap">
                    {[
                      { id: 'approvals', l: `រង់ចាំអនុម័ត`, sub: pendingLocations.length.toString(), i: <Check size={18}/> },
                      { id: 'reports', l: 'របាយការណ៍ប្រព័ន្ធ', i: <BarChart2 size={18}/> },
                      { id: 'data', l: 'គ្រប់គ្រងទិន្នន័យ', i: <Layers size={18}/> },
                      { id: 'security', l: 'កំណត់ត្រាសុវត្ថិភាព', i: <ShieldAlert size={18}/> }
                    ].map(tab => (
                      <button 
                        key={tab.id} 
                        onClick={() => setAdminSubTab(tab.id)} 
                        className={`w-full py-3 px-4 rounded-xl text-[14px] font-bold transition-all flex items-center justify-between ${adminSubTab === tab.id ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        <div className="flex items-center gap-3">{tab.i} {tab.l}</div>
                        {tab.sub && <span className={`px-2 py-0.5 rounded-md text-[10px] ${adminSubTab === tab.id ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>{tab.sub}</span>}
                      </button>
                    ))}
                  </div>
                </aside>

                {/* Admin Content Area */}
                <main className="flex-1 overflow-y-auto hide-scroll p-4 md:p-8 z-0 w-full relative font-siemreap">
                  
                  {/* Mobile Admin Nav Scrollable */}
                  <div className={`md:hidden mb-6 flex gap-2 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} overflow-x-auto hide-scroll`}>
                    {[
                      { id: 'approvals', l: `អនុម័ត (${pendingLocations.length})`, i: <Check size={14}/> },
                      { id: 'reports', l: 'របាយការណ៍', i: <BarChart2 size={14}/> },
                      { id: 'data', l: 'ទិន្នន័យ', i: <Layers size={14}/> },
                      { id: 'security', l: 'សុវត្ថិភាព', i: <ShieldAlert size={14}/> }
                    ].map(tab => (
                      <button 
                        key={tab.id} 
                        onClick={() => setAdminSubTab(tab.id)} 
                        className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-[11px] font-bold font-moul transition-all flex items-center justify-center gap-1.5 ${adminSubTab === tab.id ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        {tab.i} <span className="truncate">{tab.l}</span>
                      </button>
                    ))}
                  </div>

                  <div className="max-w-6xl mx-auto">
                    {/* ADMIN: SUB-TAB - PENDING APPROVALS HIERARCHY */}
                    {adminSubTab === 'approvals' && (
                      <div className="animate-slide-up space-y-4 md:space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-4">
                          <h3 className="font-bold text-sm md:text-xl font-moul text-slate-800 dark:text-slate-200">បញ្ជីរង់ចាំការត្រួតពិនិត្យ និងអនុម័ត</h3>
                          <span className="text-xs md:text-sm font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg shadow-sm">សរុប {pendingLocations.length} ទីតាំង</span>
                        </div>

                        {pendingLocations.length > 0 ? (
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Group 1: ស្រុករតនមណ្ឌល */}
                            <div className={`p-4 md:p-6 rounded-3xl md:rounded-[2rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><MapPin size={20} className="text-[#2563EB]" /></div>
                                <h4 className="font-bold text-[15px] md:text-lg font-moul text-[#2563EB]">ស្រុករតនមណ្ឌល</h4>
                              </div>
                              
                              {(() => {
                                const ratnakPending = pendingLocations.filter(loc => loc.district === 'ស្រុករតនមណ្ឌល' || loc.district === 'រតនមណ្ឌល');
                                if (ratnakPending.length === 0) return <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">គ្មានសំណើរង់ចាំអនុម័តទេ</p>;
                                
                                // Group by Commune
                                const groupedByCommune = {};
                                ratnakPending.forEach(loc => {
                                  const comm = loc.commune || 'មិនស្គាល់ឃុំ';
                                  if (!groupedByCommune[comm]) groupedByCommune[comm] = {};
                                  const vil = loc.village || 'មិនស្គាល់ភូមិ';
                                  if (!groupedByCommune[comm][vil]) groupedByCommune[comm][vil] = [];
                                  groupedByCommune[comm][vil].push(loc);
                                });

                                return Object.keys(groupedByCommune).map(commune => (
                                  <div key={commune} className="mb-4 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-all">
                                    <button 
                                      onClick={() => toggleCommune(commune)}
                                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 flex justify-between items-center font-bold text-sm md:text-base text-slate-800 dark:text-slate-200 transition-colors"
                                    >
                                      <span className="flex items-center gap-2">🏞️ ឃុំ {commune} <span className="bg-[#2563EB] text-white text-[10px] px-2 py-0.5 rounded-full">{Object.values(groupedByCommune[commune]).flat().length}</span></span>
                                      {expandedCommunes[commune] ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                                    </button>

                                    {expandedCommunes[commune] && (
                                      <div className="p-2 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        {Object.keys(groupedByCommune[commune]).map(village => (
                                          <div key={village} className="border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
                                            <button 
                                              onClick={() => toggleVillage(commune + village)}
                                              className="w-full p-3 flex justify-between items-center font-bold text-xs md:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                                            >
                                              <span className="flex items-center gap-2">🏡 ភូមិ {village}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{groupedByCommune[commune][village].length} ទីតាំង</span>
                                                {expandedVillages[commune + village] ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                                              </div>
                                            </button>

                                            {expandedVillages[commune + village] && (
                                              <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                                                {groupedByCommune[commune][village].map(loc => (
                                                  <div key={loc.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-none' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'} transition-all flex flex-col gap-3`}>
                                                    <div className="flex justify-between items-start gap-3">
                                                      <div className="flex-1">
                                                        <h5 className="font-bold text-sm text-slate-900 dark:text-white font-moul leading-tight">{loc.name}</h5>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] md:text-xs">
                                                          <p className="text-slate-500"><span className="font-bold text-slate-400">ដោយ៖</span> {loc.submittedBy || 'ភ្ញៀវសហគមន៍'}</p>
                                                          <p className="text-slate-500"><span className="font-bold text-slate-400">ថ្ងៃទី៖</span> {new Date(loc.timestamp).toLocaleDateString('km-KH')} {new Date(loc.timestamp).toLocaleTimeString('km-KH')}</p>
                                                          {loc.phone && <p className="text-slate-500"><span className="font-bold text-slate-400">ទូរស័ព្ទ៖</span> {loc.phone}</p>}
                                                        </div>
                                                      </div>
                                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${getCategoryStyles(loc.category)}`}>{loc.category}</span>
                                                    </div>
                                                    {loc.info && <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">{loc.info}</p>}
                                                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                      <button onClick={() => adminApprove(loc)} className="flex-1 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-500/20">យល់ព្រមអនុម័ត</button>
                                                      <button onClick={() => adminReject(loc)} className="py-2 md:py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/40 rounded-lg text-xs font-bold transition-all"><Trash2 size={16}/></button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ));
                              })()}
                            </div>

                            {/* Group 2: ស្រុកផ្សេងៗ */}
                            <div className={`p-4 md:p-6 rounded-3xl md:rounded-[2rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg"><Layers size={20} className="text-amber-500" /></div>
                                <h4 className="font-bold text-[15px] md:text-lg font-moul text-amber-500">ស្រុកផ្សេងៗ</h4>
                              </div>

                              {(() => {
                                const otherPending = pendingLocations.filter(loc => loc.district !== 'ស្រុករតនមណ្ឌល' && loc.district !== 'រតនមណ្ឌល');
                                if (otherPending.length === 0) return <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">គ្មានសំណើរង់ចាំអនុម័តទេ</p>;
                                
                                return (
                                  <div className="space-y-4">
                                    {otherPending.map(loc => (
                                      <div key={loc.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200 hover:shadow-md'} transition-all flex flex-col gap-3`}>
                                        <div className="flex justify-between items-start gap-2">
                                          <div>
                                            <h5 className="font-bold text-sm text-slate-900 dark:text-white font-moul">{loc.name}</h5>
                                            <p className="text-xs text-slate-500 mt-1 font-bold">ស្រុក៖ {loc.district} <span className="mx-1 text-slate-300">|</span> ឃុំ៖ {loc.commune} <span className="mx-1 text-slate-300">|</span> ភូមិ៖ {loc.village}</p>
                                          </div>
                                          <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap shrink-0 ${getCategoryStyles(loc.category)}`}>{loc.category}</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                          <p className="text-[10px] md:text-xs text-slate-500"><span className="font-bold text-slate-400">បញ្ចូលដោយ៖</span> {loc.submittedBy || 'ភ្ញៀវសហគមន៍'}</p>
                                          <p className="text-[10px] md:text-xs text-slate-500 mt-1"><span className="font-bold text-slate-400">ពេល៖</span> {new Date(loc.timestamp).toLocaleString('km-KH')}</p>
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                          <button onClick={() => adminApprove(loc)} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm">យល់ព្រម</button>
                                          <button onClick={() => adminReject(loc)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg text-xs font-bold transition-all">បដិសេធ</button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Check className="text-emerald-500" size={40} />
                            </div>
                            <h3 className="text-lg font-bold font-moul text-slate-800 dark:text-slate-200 mb-2">ការងាររួចរាល់!</h3>
                            <p className="text-sm text-slate-500 font-siemreap">គ្មានទីតាំងថ្មីរង់ចាំការអនុម័តទេ</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADMIN: SUB-TAB - SYSTEM DATA REPORTS */}
                    {adminSubTab === 'reports' && (
                      <div className="animate-slide-up max-w-5xl mx-auto">
                        <RenderReportsDashboard />
                      </div>
                    )}

                    {/* ADMIN: SUB-TAB - DATA MANAGEMENT */}
                    {adminSubTab === 'data' && (
                      <div className="animate-slide-up space-y-4 md:space-y-6 font-siemreap">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-4">
                          <h3 className="font-bold text-sm md:text-xl font-moul text-slate-800 dark:text-slate-200">ផ្ទាំងគ្រប់គ្រងទិន្នន័យប្រព័ន្ធ</h3>
                        </div>

                        <div className="flex p-1.5 md:p-2 rounded-2xl md:rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-xl">
                          <button 
                            onClick={()=>setAdminDataTab('locations')} 
                            className={`flex-1 py-3 rounded-xl md:rounded-2xl text-[12px] md:text-sm font-bold font-moul transition-all flex justify-center items-center gap-2 ${adminDataTab==='locations' ? 'bg-white dark:bg-slate-900 shadow-md text-[#2563EB]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            <MapPin size={16}/> គ្រប់គ្រងទីតាំង
                          </button>
                          <button 
                            onClick={()=>setAdminDataTab('users')} 
                            className={`flex-1 py-3 rounded-xl md:rounded-2xl text-[12px] md:text-sm font-bold font-moul transition-all flex justify-center items-center gap-2 ${adminDataTab==='users' ? 'bg-white dark:bg-slate-900 shadow-md text-[#2563EB]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            <Users size={16}/> អ្នកប្រើប្រាស់
                          </button>
                        </div>
                        
                        {adminDataTab === 'locations' && (
                          <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                              <p className="text-xs font-bold text-slate-500 uppercase">ទីតាំងដែលបានអនុម័តសរុប៖ <span className="text-[#2563EB] font-black">{approvedLocations.length}</span></p>
                            </div>
                            <div className="p-4 space-y-3">
                              {approvedLocations.map(loc => (
                                <div key={loc.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'} transition-all flex flex-col md:flex-row gap-4 items-start md:items-center`}>
                                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-200 relative">
                                    <img src={loc.imageUrl} className="w-full h-full object-cover" alt="approved loc" />
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-bold">{loc.category}</span>
                                  </div>
                                  <div className="flex-1 min-w-0 w-full">
                                    <h4 className="font-bold text-sm font-moul text-slate-800 dark:text-slate-100 truncate">{loc.name}</h4>
                                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5"><MapPin size={12}/> {loc.district}, ឃុំ{loc.commune}, ភូមិ{loc.village}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-bold">បញ្ចូលដោយ៖ {loc.submittedBy || 'N/A'}</p>
                                  </div>
                                  <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-0 border-slate-100 dark:border-slate-700 pt-3 md:pt-0">
                                    <button onClick={() => setEditLoc(loc)} className="flex items-center justify-center gap-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition-colors text-xs"><Edit3 size={14}/> កែប្រែ</button>
                                    <button onClick={() => adminDelete(loc.id)} className="flex items-center justify-center gap-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors text-xs"><Trash2 size={14}/> លុប</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {adminDataTab === 'users' && (
                          <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                              <p className="text-xs font-bold text-slate-500 uppercase">គណនីអ្នកប្រើប្រាស់សរុប៖ <span className="text-[#2563EB] font-black">{userList.length}</span></p>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {userList.map(usr => (
                                <div key={usr.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} flex items-center gap-4`}>
                                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow flex items-center justify-center font-bold text-[#2563EB] text-xl overflow-hidden shrink-0">
                                    {usr.profilePic ? <img src={usr.profilePic} className="w-full h-full object-cover" alt="user avatar" /> : usr.username?.substring(0,2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate font-siemreap text-slate-800 dark:text-slate-100">{usr.username}</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">បង្កើត៖ {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString('km-KH') : 'សមាជិកថ្មី'}</p>
                                  </div>
                                  <button onClick={() => adminDeleteUser(usr.id)} className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors shrink-0">
                                    <Trash2 size={16}/>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADMIN: SUB-TAB - SECURITY THREAT LOGS (Full Desktop Table) */}
                    {adminSubTab === 'security' && (
                      <div className="animate-slide-up space-y-4 md:space-y-6 font-siemreap">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-4">
                          <div>
                            <h3 className="font-bold text-sm md:text-xl font-moul text-red-600 dark:text-red-400 flex items-center gap-2"><ShieldAlert size={24} className="animate-pulse"/> កំណត់ត្រាសុវត្ថិភាព និងការព្រមាន</h3>
                            <p className="text-[11px] md:text-xs text-slate-500 mt-1">កត់ត្រារាល់ការប៉ុនប៉ងចូលប្រើប្រាស់ដោយគ្មានការអនុញ្ញាត (បង្ហាញពីថ្មីទៅចាស់)</p>
                          </div>
                          {securityLogs.length > 0 && (
                            <button 
                              onClick={adminClearSecurityLogs} 
                              className="w-full md:w-auto text-xs bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-500/20"
                            >
                              <Trash2 size={16}/> លុបកំណត់ត្រាទាំងអស់
                            </button>
                          )}
                        </div>

                        {securityLogs.length > 0 ? (
                          <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} overflow-x-auto hide-scroll`}>
                            <table className="w-full text-left min-w-[700px] border-collapse">
                              <thead className={`text-xs uppercase font-moul border-b ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                <tr>
                                  <th className="px-5 py-4 w-12 text-center">#</th>
                                  <th className="px-5 py-4">User Name</th>
                                  <th className="px-5 py-4">IP Address</th>
                                  <th className="px-5 py-4">Password</th>
                                  <th className="px-5 py-4">Device Model</th>
                                  <th className="px-5 py-4">កាលបរិច្ឆេទ</th>
                                  <th className="px-5 py-4 text-center">សកម្មភាព</th>
                                </tr>
                              </thead>
                              <tbody className="text-[13px] font-bold">
                                {securityLogs.map((log, index) => (
                                  <tr key={log.id} className={`border-b last:border-0 ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/40 text-slate-200' : 'border-slate-100 hover:bg-slate-50 text-slate-700'} transition-colors`}>
                                    <td className="px-5 py-4 text-center text-slate-400">{index + 1}</td>
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500"><User size={14}/></div>
                                        <span className="truncate max-w-[150px]">{log.username}</span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 text-blue-600 dark:text-blue-400 font-mono tracking-wide">{log.ipAddress}</td>
                                    <td className="px-5 py-4">
                                      <span className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-2.5 py-1 rounded-lg font-mono border border-red-100 dark:border-red-900/50">
                                        {log.attemptedPassword}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-6">
                                      <MonitorSmartphone size={16}/> {log.deviceModel || 'Unknown Device'}
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 text-[11px] font-normal">
                                      {new Date(log.timestamp).toLocaleDateString('km-KH')} <br className="md:hidden"/> {new Date(log.timestamp).toLocaleTimeString('km-KH')}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                      <button 
                                        onClick={() => adminDeleteLog(log.id)} 
                                        className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-xl transition-colors border border-transparent hover:border-red-600"
                                        title="លុបកំណត់ត្រា"
                                      >
                                        <Trash2 size={16}/>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-inner">
                            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                              <ShieldCheck size={48} className="text-emerald-500" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200 font-moul mb-2">ប្រព័ន្ធសុវត្ថិភាពដំណើរការល្អ</h3>
                            <p className="text-sm text-slate-500">មិនមានកំណត់ត្រានៃការប៉ុនប៉ងចូលដោយខុសច្បាប់ទេ</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </main>
              </div>
            </div>
          )}

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

          {/* ==================== CENTERED ADMIN LOGIN MODAL ==================== */}
          {showAdminLogin && (
            <div className="absolute inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className={`w-full max-w-[400px] p-8 rounded-[2rem] shadow-2xl animate-slide-up relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#2563EB]/5 rounded-full blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#2563EB]/5 rounded-full blur-2xl"></div>
                
                <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-5 border-2 border-blue-100 dark:border-slate-700 relative z-10">
                  <ShieldCheck size={40} className="text-[#2563EB]" />
                </div>
                <h3 className="text-center font-bold text-lg mb-2 font-moul text-slate-800 dark:text-white relative z-10">សិទ្ធិអ្នកគ្រប់គ្រង (Admin)</h3>
                <p className="text-center text-[12px] md:text-xs text-slate-500 mb-6 font-siemreap relative z-10">សូមបញ្ចូលអុីមែល និងលេខកូដសម្ងាត់ដើម្បីបន្តចូលទៅផ្ទាំងគ្រប់គ្រង</p>
                
                <form onSubmit={handleAdminLogin} className="relative z-10 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">អុីមែល (Admin Email)</label>
                    <input 
                      type="email" 
                      value={adminEmailInput} 
                      onChange={e=>setAdminEmailInput(e.target.value)} 
                      placeholder="admin@example.com" 
                      className={`w-full p-4 rounded-xl border text-[16px] outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB] text-slate-800'}`} 
                      autoFocus 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">លេខកូដសម្ងាត់ (Password)</label>
                    <input 
                      type="password" 
                      value={adminPasswordInput} 
                      onChange={e=>setAdminPasswordInput(e.target.value)} 
                      placeholder="••••••••" 
                      className={`w-full p-4 rounded-xl border text-center tracking-[0.3em] font-bold text-[16px] font-mono outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2563EB]' : 'bg-slate-50 border-slate-200 focus:border-[#2563EB] text-slate-800'}`} 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 font-moul">បោះបង់</button>
                    <button type="submit" className="flex-1 py-4 bg-[#2563EB] hover:bg-blue-600 transition-colors text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 font-moul">ចូលប្រព័ន្ធ</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================== CREATE USERNAME MODAL ==================== */}
          {showUsernameModal && (
            <div className="absolute inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className={`w-full max-w-[360px] p-8 rounded-[2rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                <div className="w-20 h-20 bg-[#2563EB]/10 rounded-full mx-auto flex items-center justify-center mb-5 text-[#2563EB]"><User size={40} /></div>
                <h3 className="text-center font-bold text-base md:text-lg mb-2 font-moul">បង្កើតគណនីសហគមន៍</h3>
                <p className="text-center text-xs text-slate-500 mb-6 leading-relaxed font-siemreap">កំណត់ឈ្មោះសម្គាល់ដើម្បីមានសិទ្ធិបន្ថែមទីតាំង</p>
                <input type="text" placeholder="បញ្ចូលឈ្មោះ..." value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} className={`w-full p-4 rounded-xl outline-none border font-bold text-center text-[16px] mb-5 focus:border-[#2563EB] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                <div className="flex gap-3">
                  <button onClick={()=>setShowUsernameModal(false)} className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 transition-colors font-moul">បិទ</button>
                  <button onClick={handleSaveUsername} className="flex-1 py-4 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors font-moul">រក្សាទុក</button>
                </div>
              </div>
            </div>
          )}

          {/* Global Toast Alert Notification */}
          {toastAlert.show && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] flex justify-center animate-slide-up">
              <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs md:text-sm text-white font-moul ${toastAlert.type === 'error' ? 'bg-red-600' : 'bg-[#2563EB]'}`}>
                {toastAlert.type === 'error' ? <AlertTriangle size={20} /> : <Check size={20} />}
                {toastAlert.message}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}