import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import { 
  MapPin, Search, PlusCircle, User, Phone, Map as MapIcon, Check, AlertTriangle, 
  LogOut, Camera, Plus, BarChart2, ShieldAlert, ArrowLeft, ArrowRight, Home, 
  FileText, Layers, Edit3, Trash2, Globe, Users, Settings, PieChart, TrendingUp, 
  X, Activity, CheckCircle2, Moon, Sun, Bell, MessageSquare, Send, Star, HelpCircle, Info
} from 'lucide-react';

// =========================================================================
// ⚙️ CONFIGURATION & FIREBASE
// =========================================================================
const LOGO_URL = "logo.png"; 
const COVER_IMAGE = "logo.png";
const FALLBACK_LOGO = "logo.png"; // VMC Official Logo Fallback
const FALLBACK_COVER = "back.png";

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
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

const ADMIN_PASSWORD = "ict168mit";

// ទិន្នន័យភូមិឃុំផ្លូវការក្នុងស្រុករតនមណ្ឌល
const COMMUNE_VILLAGES = {
  "ស្តៅ": ["ស្តៅ", "បឹងអំពិល", "ដូនបា", "គីឡូម៉ែត្រ៣៨", "អូរក្រូច"],
  "ត្រែង": ["ត្រែង", "បុស្សខ្នុរ", "គីឡូម៉ែត្រ៣៤", "ជាមន្ត្រី"],
  "ផ្លូវមាស": ["ផ្លូវមាស", "ទឹកសាប", "អូររំដួល", "អូរដា"],
  "អណ្តើកហែប": ["អណ្តើកហែប", "ស្វាយជ្រុំ", "ថ្មព្រះ"],
  "រស្មីសង្ហា": ["រស្មីសង្ហា", "ពាម", "ព្រៃវែង"],
  "គរ": ["គរ", "អូរជ្រៃ", "ភ្នំរូង"]
};
const PRIMARY_COMMUNES = Object.keys(COMMUNE_VILLAGES);
const CATEGORIES = ["ទាំងអស់", "សាលារៀន", "មណ្ឌលសុខភាព", "វត្តអារាម", "ប៉ុស្តិ៍នគរបាល", "ផ្សារ", "សាលាឃុំ/សង្កាត់", "ផ្សេងៗ"];

const getDeviceInfo = () => {
  const ua = navigator.userAgent ? navigator.userAgent.toLowerCase() : '';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'Apple iOS Device';
  if (ua.includes('android')) return 'Android Device';
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('mac')) return 'Mac OS';
  return 'Unknown Device';
};

export default function App() {
  // === 1. APP STATE ===
  const [currentPage, setCurrentPage] = useState(1); 
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [language, setLanguage] = useState('KH'); 
  const [skippedWelcome, setSkippedWelcome] = useState(false);
  
  // Navigation & UI Controls
  const [activeTab, setActiveTab] = useState('home'); 
  const [adminSubTab, setAdminSubTab] = useState('approvals'); 
  const [adminDataTab, setAdminDataTab] = useState('locations'); 
  
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  const [selectedLocation, setSelectedLocation] = useState(null); 
  const [editLoc, setEditLoc] = useState(null);

  // Notifications State (Real-time Broadcast & Custom Messages)
  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'ប្រព័ន្ធគ្រប់គ្រងទីតាំងត្រូវបានដាក់ឱ្យប្រើប្រាស់ផ្លូវការ!', type: 'success', time: new Date().toISOString(), sender: 'Admin' },
    { id: 'n2', text: 'សូមស្វាគមន៍មកកាន់ប្រព័ន្ធផែនទីឌីជីថលស្រុករតនមណ្ឌល', type: 'info', time: new Date().toISOString(), sender: 'VMC Team' }
  ]);
  const [notifInput, setNotifInput] = useState('');
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Explore Filters
  const [selectedDistrictTab, setSelectedDistrictTab] = useState('រតនមណ្ឌល');
  const [selectedCommune, setSelectedCommune] = useState(''); 
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ទាំងអស់');
  
  // Favorites State
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('vmc_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Database Data (Strict Separation)
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

  // Theme Helpers
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const bgMain = isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F6F9] text-slate-800';
  const bgCard = isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800';
  const bgPrimary = 'bg-[#15803D] text-white border-[#15803D]'; // Styled to match Mockup Emerald Green
  const textPrimary = isDarkMode ? 'text-green-400' : 'text-[#15803D]';

  // Refs
  const notifRef = useRef(null);

  // Translate helper
  const t = (kh, en) => language === 'EN' ? en : kh;

  // === 2. INITIALIZATION & SYNC ===
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { await signInAnonymously(auth); }
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
    
    const savedUser = localStorage.getItem('vmc_user_name');
    const savedPhoto = localStorage.getItem('vmc_user_photo');
    const savedLang = localStorage.getItem('vmc_language');
    const savedMode = localStorage.getItem('vmc_dark_mode');
    
    if (savedUser) {
      setUsername(savedUser);
      setSkippedWelcome(true);
      setCurrentPage(2);
    }
    if (savedPhoto) setProfileImage(savedPhoto);
    if (savedLang) setLanguage(savedLang);
    if (savedMode === 'true') setIsDarkMode(true);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Sync Locations from 'data_admin'
    const unsubLoc = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'data_admin'), (snap) => {
      const locs = []; snap.forEach(d => locs.push({ id: d.id, ...d.data() }));
      setApprovedLocations(locs.filter(l => l.approved));
      setPendingLocations(locs.filter(l => !l.approved).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });
    // Sync Users from 'data_user'
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'data_user'), (snap) => {
      const uList = []; snap.forEach(d => uList.push({ id: d.id, ...d.data() }));
      setUserList(uList);
    });
    // Sync Visits
    const unsubVisits = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'visits_data'), (snap) => {
      const vList = []; snap.forEach(d => vList.push({ id: d.id, ...d.data() }));
      setAppVisits(vList);
    });
    // Sync Logs
    const unsubSec = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs'), (snap) => {
      const logs = []; snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      setSecurityLogs(logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });

    // Sync Broadcast Notifications
    const unsubNotif = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'broadcast_notifications'), (snap) => {
      const loaded = [];
      snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
      if (loaded.length > 0) {
        setNotifications(prev => {
          const merged = [...loaded, ...prev.filter(p => !loaded.some(l => l.id === p.id))];
          return merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        });
      }
    });

    return () => { unsubLoc(); unsubUsers(); unsubVisits(); unsubSec(); unsubNotif(); };
  }, [user]);

  // Click outside listener for notification panel
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // === 3. FUNCTIONS ===
  const recordVisit = async (uid) => {
    try {
      const today = new Date();
      const visitDocId = String(uid) + "_" + String(today.getFullYear()) + "_" + String(today.getMonth() + 1) + "_" + String(today.getDate());
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visits_data', visitDocId), { userId: uid, timestamp: today.toISOString() }, { merge: true });
    } catch (err) {}
  };

  const showToast = (message, type = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => setToastAlert({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleProceedToApp = () => {
    setCurrentPage(2);
    setActiveTab('home');
  };

  const navigateTab = (tab) => {
    if (tab === 'add' && !username && !isAdmin) {
      setShowUsernameModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) return;
    const finalName = usernameInput.trim();
    setUsername(finalName);
    localStorage.setItem('vmc_user_name', finalName);
    try {
      const docId = user && user.uid ? user.uid : "usr_" + String(Date.now());
      // រក្សាទុកឈ្មោះចូល 'data_user'
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', docId), {
        username: finalName, createdAt: new Date().toISOString(), profilePic: profileImage || ''
      });
    } catch (err) {}
    setShowUsernameModal(false);
    showToast("សូមស្វាគមន៍, " + finalName + "!");
    setSkippedWelcome(true);
    if (currentPage === 1) {
      setCurrentPage(2);
      setActiveTab('home');
    } else {
      setActiveTab('add'); 
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdmin(true); 
      setShowAdminLogin(false); 
      setAdminPasswordInput(''); 
      setCurrentPage(3);
      showToast('ចូលប្រើប្រាស់គណនី Admin ជោគជ័យ!');
    } else {
      showToast('លេខកូដសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
      try {
        const randomIp = String(Math.floor(Math.random()*150)+50) + "." + String(Math.floor(Math.random()*200)) + ".1.1";
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs'), {
          timestamp: new Date().toISOString(), ipAddress: randomIp, username: username || 'Guest', attemptedPassword: adminPasswordInput, deviceModel: getDeviceInfo()
        });
      } catch(err) {}
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewLocImageBase64(String(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = String(reader.result);
        setProfileImage(base64String);
        localStorage.setItem('vmc_user_photo', base64String);
        if (username) {
          try {
            const docId = user && user.uid ? user.uid : 'temp_user';
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', docId), {
              username: username, profilePic: base64String, updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch(err){}
        }
        showToast("បានផ្លាស់ប្តូររូបថតរួចរាល់!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Favorite
  const toggleFavorite = (id) => {
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
      showToast("បានលុបចេញពីទីតាំងពេញចិត្ត", "info");
    } else {
      updated = [...favorites, id];
      showToast("បានរក្សាទុកក្នុងទីតាំងពេញចិត្ត", "success");
    }
    setFavorites(updated);
    localStorage.setItem('vmc_favorites', JSON.stringify(updated));
  };

  // Notification Broadcast Creation
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifInput.trim()) return;
    const authorName = isAdmin ? 'Admin' : (username || 'អ្នកប្រើប្រាស់អនាមិក');
    const newNotif = {
      text: notifInput.trim(),
      type: isAdmin ? 'success' : 'info',
      time: new Date().toISOString(),
      sender: authorName
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'broadcast_notifications'), newNotif);
      setNotifInput('');
      showToast("បានផ្ញើសារ/សេចក្តីជូនដំណឹង!");
    } catch (err) {
      showToast("ការផ្ញើសារមិនជោគជ័យ", "error");
    }
  };

  const submitLocation = async (e) => {
    e.preventDefault();
    const finalDist = newLocDistrict === 'ផ្សេងៗ' ? newLocCustomDistrict : newLocDistrict;
    if (!newLocName || !finalDist || !newLocVillage) return showToast('សូមបំពេញព័ត៌មានឲ្យបានគ្រប់គ្រាន់!', 'error');

    setIsSubmitting(true);
    const newLoc = {
      name: newLocName, category: newLocCategory, district: finalDist, commune: newLocCommune, village: newLocVillage, phone: newLocPhone, info: newLocInfo, mapLink: newLocMapLink,
      imageUrl: newLocImageBase64 || FALLBACK_COVER,
      submittedBy: isAdmin ? "Admin" : username, timestamp: new Date().toISOString(), approved: isAdmin
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'data_admin'), newLoc);
      // Automatically send a notification about the submission
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'broadcast_notifications'), {
        text: `ទីតាំងថ្មីត្រូវបានស្នើសុំ៖ "${newLocName}" ក្នុងឃុំ ${newLocCommune}`,
        type: 'info',
        time: new Date().toISOString(),
        sender: isAdmin ? 'Admin' : (username || 'សហគមន៍')
      });
      showToast(isAdmin ? 'បានបន្ថែមទីតាំងជោគជ័យ!' : 'សូមរង់ចាំការត្រួតពិនិត្យពី Admin!');
      setNewLocName(''); setNewLocVillage(''); setNewLocPhone(''); setNewLocInfo(''); setNewLocMapLink(''); setNewLocImageBase64(''); 
      setActiveTab('home');
    } catch(err) { showToast('មានបញ្ហាក្នុងការបញ្ជូនទិន្នន័យ!', 'error'); }
    setIsSubmitting(false);
  };

  const adminApprove = async (loc) => { 
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', loc.id), { approved: true }); 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'broadcast_notifications'), {
        text: `ទីតាំង "${loc.name}" ត្រូវបានអនុម័តជាផ្លូវការ!`,
        type: 'success',
        time: new Date().toISOString(),
        sender: 'Admin'
      });
      showToast('បានយល់ព្រម!', 'success'); 
    } catch(err) {} 
  };
  
  const adminReject = async (loc) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', loc.id)); showToast('បានបដិសេធ!', 'error'); } catch(err) {} };
  const adminDelete = async (locId) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', locId)); showToast('បានលុប!', 'success'); } catch(err) {} };
  const adminDeleteUser = async (userId) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_user', userId)); showToast('បានលុបគណនី!', 'success'); } catch(err) {} };
  
  const adminSaveEdit = async (e) => {
    e.preventDefault();
    if(!editLoc) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'data_admin', editLoc.id), {
        name: editLoc.name, category: editLoc.category, commune: editLoc.commune, village: editLoc.village, phone: editLoc.phone, info: editLoc.info
      });
      showToast('បានកែប្រែ!', 'success');
      setEditLoc(null);
    } catch(err) {}
  };

  const adminClearSecurityLogs = async () => {
    try {
      for (const log of securityLogs) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', log.id));
      }
      showToast('បានសម្អាតកំណត់ត្រាទាំងអស់!', 'success');
    } catch(err) {
      showToast('មានបញ្ហាក្នុងការសម្អាត!', 'error');
    }
  };

  const handleImageError = (e, fallbackPath) => {
    e.currentTarget.src = fallbackPath;
  };

  // === 4. DATA FILTERING & STATS ===
  const displayedLocations = useMemo(() => {
    return approvedLocations.filter(loc => {
      const isRatnak = loc.district === 'ស្រុករតនមណ្ឌល' || loc.district === 'រតនមណ្ឌល';
      if (selectedDistrictTab === 'រតនមណ្ឌល' && !isRatnak) return false;
      if (selectedDistrictTab === 'ផ្សេងៗ' && isRatnak) return false;
      if (selectedDistrictTab === 'រតនមណ្ឌល') {
        if (selectedCommune && loc.commune !== selectedCommune) return false;
        if (selectedVillageFilter && loc.village !== selectedVillageFilter) return false;
      }
      if (categoryFilter !== 'ទាំងអស់' && loc.category !== categoryFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return loc.name.toLowerCase().includes(query) || loc.village.toLowerCase().includes(query) || (loc.info || '').toLowerCase().includes(query);
      }
      return true;
    });
  }, [approvedLocations, selectedDistrictTab, selectedCommune, selectedVillageFilter, searchQuery, categoryFilter]);

  const reportStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let weeklyCount = 0; let monthlyCount = 0; let yearlyCount = appVisits.length;
    appVisits.forEach(v => {
      const vDate = new Date(v.timestamp);
      if (vDate >= oneWeekAgo) weeklyCount++;
      if (vDate >= oneMonthAgo) monthlyCount++;
    });

    const khmerMonths = ['មករា', 'កុម្ភៈ', 'មិនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    
    // Line Chart Data (Users)
    const lineData = [];
    for(let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(now.getMonth() - i);
      const mIdx = d.getMonth();
      const count = appVisits.filter(v => new Date(v.timestamp).getMonth() === mIdx && new Date(v.timestamp).getFullYear() === d.getFullYear()).length;
      lineData.push({ name: khmerMonths[mIdx], count: count });
    }
    
    // Line Chart Data 2 (Locations added)
    const locationLineData = [];
    for(let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(now.getMonth() - i);
      const mIdx = d.getMonth();
      const count = approvedLocations.filter(l => new Date(l.timestamp).getMonth() === mIdx && new Date(l.timestamp).getFullYear() === d.getFullYear()).length;
      locationLineData.push({ name: khmerMonths[mIdx], count: count });
    }

    const catMap = {};
    approvedLocations.forEach(loc => { catMap[loc.category] = (catMap[loc.category] || 0) + 1; });
    const colors = ['#15803D', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B', '#06B6D4'];
    const pieData = Object.keys(catMap).map((key, i) => ({
      name: key, count: catMap[key], color: colors[i % colors.length]
    })).sort((a,b) => b.count - a.count);

    return { weekly: weeklyCount, monthly: monthlyCount, yearly: yearlyCount, totalUsers: userList.length, lineData, locationLineData, pieData };
  }, [appVisits, userList, approvedLocations]);

  const toggleLanguage = () => {
    const nextLang = language === 'KH' ? 'EN' : 'KH';
    setLanguage(nextLang);
    localStorage.setItem('vmc_language', nextLang);
  };
  
  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('vmc_dark_mode', String(nextMode));
  };

  const getCatStyle = (cat) => {
    switch(cat) {
      case 'សាលារៀន': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200';
      case 'មណ្ឌលសុខភាព': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
      case 'វត្តអារាម': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
      case 'ប៉ុស្តិ៍នគរបាល': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200';
      case 'សាលាឃុំ/សង្កាត់': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  // === 5. PREMIUM RENDER DASHBOARD CHARTS ===
  const RenderReportsDashboard = () => {
    // 1. Line Chart Calculations
    const maxLine1 = Math.max(...reportStats.lineData.map(d => d.count), 1);
    const maxLine2 = Math.max(...reportStats.locationLineData.map(d => d.count), 1);
    
    const linePointsArray1 = reportStats.lineData.map((d, i) => {
      const x = i * 20;
      const y = 100 - ((d.count * 80) / maxLine1);
      return { x, y, name: d.name, count: d.count };
    });
    const linePathString1 = linePointsArray1.map(pt => String(pt.x) + "," + String(pt.y)).join(' ');

    const linePointsArray2 = reportStats.locationLineData.map((d, i) => {
      const x = i * 20;
      const y = 100 - ((d.count * 80) / maxLine2);
      return { x, y, name: d.name, count: d.count };
    });
    const linePathString2 = linePointsArray2.map(pt => String(pt.x) + "," + String(pt.y)).join(' ');

    // 2. Pie Chart Calculations
    const maxTotalPie = Math.max(approvedLocations.length, 1);
    let cumulativePiePercent = 0;
    
    const pieSlices = reportStats.pieData.map((s, i) => {
      const p = (s.count * 100) / maxTotalPie;
      const offset = -cumulativePiePercent; 
      cumulativePiePercent += p;
      return { ...s, p, offset };
    });

    // 3. Bar Chart Calculations
    const communeStats = {};
    PRIMARY_COMMUNES.forEach(c => communeStats[c] = 0);
    approvedLocations.forEach(l => {
      if (l.district === 'ស្រុករតនមណ្ឌល' || l.district === 'រតនមណ្ឌល') {
        if (communeStats[l.commune] !== undefined) communeStats[l.commune]++;
      }
    });
    const barData = PRIMARY_COMMUNES.map(c => ({ name: c, count: communeStats[c] }));
    const maxBar = Math.max(...barData.map(d => d.count), 1);

    return (
      <div className="space-y-6 pb-8 font-siemreap">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${bgCard}`}>
            <Users size={20} className="text-blue-500 mb-2"/>
            <span className="text-xl md:text-2xl font-black">{reportStats.totalUsers}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold">អ្នកប្រើប្រាស់</span>
          </div>
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${bgCard}`}>
            <MapPin size={20} className="text-emerald-500 mb-2"/>
            <span className="text-xl md:text-2xl font-black">{approvedLocations.length}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold">ទីតាំងបានអនុម័ត</span>
          </div>
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${bgCard}`}>
            <Activity size={20} className="text-amber-500 mb-2"/>
            <span className="text-xl md:text-2xl font-black">{reportStats.monthly}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold">អ្នកចូលខែនេះ</span>
          </div>
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${bgCard}`}>
            <TrendingUp size={20} className="text-purple-500 mb-2"/>
            <span className="text-xl md:text-2xl font-black">{pendingLocations.length}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold">រង់ចាំអនុម័ត</span>
          </div>
        </div>

        {/* Chart Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Mathematical grid styled Line chart */}
          <div className={`p-5 rounded-3xl border shadow-sm ${bgCard} lg:col-span-2`}>
            <h4 className="font-bold text-xs md:text-sm mb-4 flex items-center gap-2 font-moul text-slate-700 dark:text-slate-200">
              <Activity size={16} className="text-emerald-500"/> ក្រាហ្វខ្សែរ៖ កំណើនគណនី និងការបន្ថែមទីតាំង (Grid)
            </h4>
            <div className="w-full h-32 relative border-b border-l border-slate-300 dark:border-slate-700 ml-1">
              {/* Mathematics Grid backdrop */}
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-5 pointer-events-none opacity-20">
                {Array.from({length: 50}).map((_, i) => (
                  <div key={i} className="border-t border-r border-slate-400"></div>
                ))}
              </div>
              
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible z-10 relative">
                {/* Connecting Line 1 */}
                <polyline points={linePathString1} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Connecting Line 2 */}
                <polyline points={linePathString2} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute -bottom-6 w-full flex justify-between px-1 text-[8px] md:text-[9px] text-slate-400 font-bold">
                {linePointsArray1.map((pt, i) => <span key={i} className="-ml-2">{pt.name}</span>)}
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-8 text-[9px] font-bold">
              <div className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-[#2563EB] rounded"></span> <span className="text-slate-600 dark:text-slate-400">គណនីអ្នកប្រើប្រាស់</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-[#10B981] rounded"></span> <span className="text-slate-600 dark:text-slate-400">ទីតាំងសហគមន៍</span></div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className={`p-5 rounded-3xl border shadow-sm ${bgCard}`}>
            <h4 className="font-bold text-xs md:text-sm mb-6 flex items-center gap-2 font-moul text-slate-700 dark:text-slate-200">
              <BarChart2 size={16} className="text-[#2563EB]"/> ក្រាហ្វសសរ៖ ចំនួនទីតាំងតាមឃុំ (រតនមណ្ឌល)
            </h4>
            <div className="w-full h-32 relative border-b border-l border-slate-300 dark:border-slate-700 ml-4 flex items-end justify-around pb-0">
              {barData.map((d, i) => {
                const height = (d.count / maxBar) * 100;
                return (
                  <div key={i} className="flex flex-col items-center relative group w-1/8 z-10">
                    <div className="absolute -top-6 bg-slate-800 dark:bg-slate-700 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</div>
                    <div className="w-6 bg-[#2563EB] hover:bg-blue-400 transition-colors rounded-t-sm" style={{ height: `${height}%` }}></div>
                    <span className="absolute -bottom-6 text-[8px] md:text-[9px] text-slate-500 font-bold rotate-[-30deg] origin-top-left whitespace-nowrap">{d.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pie Chart / Donut */}
          <div className={`p-5 rounded-3xl border shadow-sm ${bgCard}`}>
            <h4 className="font-bold text-xs md:text-sm mb-4 flex items-center gap-2 font-moul text-slate-700 dark:text-slate-200">
              <PieChart size={16} className="text-[#15803D]"/> ក្រាហ្វរង្វង់៖ សមាមាត្រប្រភេទទីតាំង (%)
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 relative flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {pieSlices.length > 0 ? pieSlices.map((slice, i) => (
                    <circle key={i} cx="50" cy="50" r="25" fill="transparent" stroke={slice.color} strokeWidth="12" strokeDasharray={String(slice.p) + " 100"} strokeDashoffset={String(slice.offset)} className="transition-all duration-500 hover:stroke-[14px]" />
                  )) : (
                    <circle cx="50" cy="50" r="25" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[8px] text-slate-400 font-bold">សរុប</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{approvedLocations.length}</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {reportStats.pieData.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg font-bold">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></span>
                      {s.name}
                    </span>
                    <span className="text-slate-800 dark:text-white">{s.count} ({Math.round((s.count/maxTotalPie)*100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className={`w-full h-screen overflow-hidden flex font-sans font-siemreap ${bgMain}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        html, body {
          touch-action: manipulation;
          -webkit-text-size-adjust: 100%;
          user-scalable: no;
        }
      `}} />

      {/* ==========================================================
          PAGE 1: WELCOME SCREEN (Subtle Gradient Overlay)
          ========================================================== */}
      {currentPage === 1 && (
        <div className="absolute inset-0 z-[100] flex flex-col md:flex-row bg-cover bg-center" style={{ backgroundImage: `url(${FALLBACK_COVER})` }}>
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0"></div>
          
          {/* Header Area */}
          <div className="absolute top-0 w-full p-5 md:p-10 flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-md p-1 flex items-center justify-center overflow-hidden">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" onError={(e)=>handleImageError(e, FALLBACK_LOGO)} />
              </div>
              <h2 className="text-white font-moul text-sm hidden sm:block">យុវជនសហគមន៍ VMC</h2>
            </div>
            <button onClick={toggleLanguage} className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl shadow-md text-xs font-bold text-white border border-white/20 hover:scale-105 transition-all flex items-center gap-1">
              <Globe size={14}/> {language === 'KH' ? 'EN' : 'KH'}
            </button>
          </div>

          {/* Text Content */}
          <div className="w-full md:w-[60%] flex flex-col justify-center px-6 md:px-16 lg:px-24 z-10 h-full relative text-white">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-moul leading-[1.3] md:leading-[1.2] mb-5 drop-shadow-md">
              {t('សូមស្វាគមន៍មកកាន់ Web App', 'Welcome to Web App')} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">{t('ប្រព័ន្ធគ្រប់គ្រងទីតាំងសហគមន៍', 'Community Location System')}</span>
            </h1>
            
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-siemreap mb-8 max-w-lg drop-shadow-md">
              {t('ប្រព័ន្ធព័ត៌មានវិទ្យានេះជួយសម្រួលដល់ការស្វែងរក និងរាយការណ៍អំពីទីតាំងសេវាសាធារណៈនានា ក្នុងស្រុករតនមណ្ឌល ខេត្តបាត់ដំបង ងាយស្រួល ឆាប់រហ័ស និងតម្លាភាព។', 'This IT system facilitates the search and reporting of public service locations in Ratanak Mondol district, Battambang province, easily, quickly, and transparently.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleProceedToApp}
                className="w-full md:w-max px-8 py-4 bg-[#15803D] hover:bg-green-700 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-green-900/30 transition-transform active:scale-95 flex items-center justify-center gap-2 font-moul"
              >
                {t('អនុញ្ញាតឱ្យខ្លួនឯងចូលប្រើ', 'Allow me to access')} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          SIDEBAR NAVIGATION (DESKTOP - Style Match to Mockup)
          ========================================================== */}
      {(currentPage === 2 || currentPage === 3) && (
        <aside className={`hidden md:flex flex-col w-64 h-full border-r shrink-0 z-30 transition-colors ${bgCard} shadow-sm`}>
          <div className="p-5 border-b border-inherit">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm p-1 flex items-center justify-center overflow-hidden border">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" onError={(e)=>handleImageError(e, FALLBACK_LOGO)} />
              </div>
              <div>
                <h2 className="font-bold text-xs text-[#15803D] font-moul leading-tight">ប្រព័ន្ធគ្រប់គ្រងទីតាំង</h2>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">ស្រុករតនមណ្ឌល</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 font-siemreap">
            {currentPage === 2 ? (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">មាតិកា Web App</p>
                {[
                  { id: 'home', icon: Home, label: 'ទំព័រដើម' },
                  { id: 'add', icon: PlusCircle, label: 'បន្ថែមទីតាំងសាធារណៈ' },
                  { id: 'reports', icon: PieChart, label: 'ស្ថិតិ & របាយការណ៍' },
                  { id: 'profile', icon: User, label: 'គណនីផ្ទាល់ខ្លួន' }
                ].map(item => (
                  <button key={item.id} onClick={() => navigateTab(item.id)} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-bold text-xs ${activeTab === item.id ? bgPrimary + ' shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    <item.icon size={16} /> {item.label}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button onClick={() => { setCurrentPage(2); setActiveTab('home'); }} className="w-full flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-siemreap">
                  <ArrowLeft size={14} /> ត្រឡប់ទៅ App វិញ
                </button>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">ផ្ទាំងបញ្ជា Admin</p>
                {[
                  { id: 'approvals', icon: Check, label: `ពិនិត្យការអនុម័ត (${pendingLocations.length})` },
                  { id: 'reports', icon: BarChart2, label: 'របាយការណ៍ប្រព័ន្ធ' },
                  { id: 'data', icon: Layers, label: 'គ្រប់គ្រងទិន្នន័យ' },
                  { id: 'security', icon: ShieldAlert, label: 'កំណត់ត្រាសុវត្ថិភាព' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setAdminSubTab(tab.id)} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-bold text-xs ${adminSubTab === tab.id ? bgPrimary + ' shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    <tab.icon size={16} /> {tab.label}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            {isAdmin && currentPage === 3 ? (
              <button onClick={() => { setIsAdmin(false); setCurrentPage(2); setActiveTab('home'); }} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 transition-colors">
                <LogOut size={14} /> ចាកចេញពី Admin
              </button>
            ) : username ? (
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer" onClick={() => navigateTab('profile')}>
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-[#15803D] overflow-hidden shrink-0 border">
                  {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : username.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[11px] truncate text-slate-800 dark:text-slate-200">{username}</p>
                  <p className="text-[9px] text-slate-400">សហគមន៍រតនមណ្ឌល</p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      )}

      {/* ==========================================================
          MAIN AREA CONTENT (Strict Mockup Upgrade)
          ========================================================== */}
      {(currentPage === 2 || currentPage === 3) && (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden font-siemreap">
          
          {/* Top Bar Navigation (Match mockup dashboard with search & profile) */}
          <header className={`px-4 md:px-6 py-3 flex justify-between items-center shrink-0 z-40 border-b shadow-xs ${bgCard}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage(1)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                 <ArrowLeft size={14} /> <span className="hidden md:inline text-xs font-bold font-moul">ទៅកាន់ទំព័រដើម</span>
              </button>
              <h2 className={`font-bold text-xs md:text-sm font-moul ${textPrimary}`}>
                 {currentPage === 3 ? 'ផ្ទាំងបញ្ជាពិសេស (Admin)' : 'ទំព័រដើម'}
              </h2>
            </div>

            {/* Notification Bell & Profile Controls */}
            <div className="flex items-center gap-3">
              {/* Notification Center Popover */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300 relative transition-transform active:scale-95">
                  <Bell size={18} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {showNotifPanel && (
                  <div className={`absolute right-0 mt-3.5 w-80 rounded-2xl shadow-xl border overflow-hidden z-[110] animate-slide-up ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className="p-3.5 border-b border-inherit font-bold text-xs flex justify-between items-center bg-[#15803D] text-white">
                      <span>សារ និងសេចក្តីជូនដំណឹង</span>
                      <MessageSquare size={14} />
                    </div>
                    
                    {/* Send message inside Notif Panel */}
                    <form onSubmit={handleSendNotification} className="p-3 border-b border-inherit bg-slate-50 dark:bg-slate-800/50 flex gap-1.5">
                      <input type="text" value={notifInput} onChange={e=>setNotifInput(e.target.value)} placeholder="ផ្ញើសារ/រាយការណ៍..." className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white dark:bg-slate-900 dark:border-slate-700" />
                      <button type="submit" className="p-2 bg-[#15803D] text-white rounded-lg hover:bg-green-700 transition"><Send size={12}/></button>
                    </form>

                    <div className="max-h-60 overflow-y-auto hide-scroll divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-white flex justify-between">
                            <span>{n.sender}</span>
                            <span className="text-[9px] text-slate-400 font-normal">{new Date(n.time).toLocaleTimeString()}</span>
                          </p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle icon */}
              <button onClick={toggleDarkMode} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300">
                {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
              </button>

              <div className="hidden sm:flex items-center gap-2 border-l pl-3 border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border">
                  {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <User size={16} className="m-auto text-slate-400 mt-2"/>}
                </div>
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{username || 'ភ្ញៀវសាកល្បង'}</p>
                  <span className="text-[8px] text-slate-400 font-bold">សមាជិក</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto hide-scroll p-4 md:p-6 lg:p-6 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6 pb-16 md:pb-6">
              
              {currentPage === 2 && (
                <>
                  {/* HOME TAB (STRICT MOCKUP MATCH) */}
                  {activeTab === 'home' && (
                    <div className="animate-fadeIn space-y-6">
                      
                      {/* BANNER WITH EMBEDDED METRICS WIDGETS */}
                      <div className="w-full rounded-[1.8rem] overflow-hidden relative border shadow-sm flex flex-col lg:flex-row bg-[#1e293b] text-white">
                        {/* Background Overlay */}
                        <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-[1px]" style={{backgroundImage: `url(${FALLBACK_COVER})`}}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-0"></div>

                        {/* Welcome text */}
                        <div className="p-6 md:p-8 lg:w-[45%] z-10 flex flex-col justify-center text-left relative">
                          <h3 className="font-moul text-lg md:text-xl text-white mb-2 leading-tight">សូមស្វាគមន៍មកកាន់</h3>
                          <h2 className="font-moul text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-300 mb-3 leading-tight">ប្រព័ន្ធគ្រប់គ្រងទីតាំងសាធារណៈ</h2>
                          <p className="text-xs text-slate-300 flex items-center gap-1.5"><MapPin size={14} className="text-green-400"/> ស្រុករតនមណ្ឌល, ខេត្តបាត់ដំបង</p>
                        </div>

                        {/* Mockup Embedding Metrics Grid Right side of the banner */}
                        <div className="p-4 md:p-6 lg:w-[55%] z-10 grid grid-cols-2 gap-3 bg-white/5 backdrop-blur-md border-l border-white/10">
                          <div className="bg-white/10 p-3.5 rounded-2xl flex items-center gap-3 border border-white/10 hover:bg-white/15 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><MapPin size={18}/></div>
                            <div>
                              <p className="text-[10px] text-slate-300 font-bold">ទីតាំងបានអនុម័ត</p>
                              <h4 className="text-base font-black text-white">{approvedLocations.length} ទីតាំង</h4>
                            </div>
                          </div>
                          
                          <div className="bg-white/10 p-3.5 rounded-2xl flex items-center gap-3 border border-white/10 hover:bg-white/15 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0"><Activity size={18}/></div>
                            <div>
                              <p className="text-[10px] text-slate-300 font-bold">កំពុងរង់ចាំអនុម័ត</p>
                              <h4 className="text-base font-black text-white">{pendingLocations.length} ទីតាំង</h4>
                            </div>
                          </div>

                          <div className="bg-white/10 p-3.5 rounded-2xl flex items-center gap-3 border border-white/10 hover:bg-white/15 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0"><Users size={18}/></div>
                            <div>
                              <p className="text-[10px] text-slate-300 font-bold">អ្នកប្រើប្រាស់សរុប</p>
                              <h4 className="text-base font-black text-white">{userList.length} នាក់</h4>
                            </div>
                          </div>

                          <div className="bg-white/10 p-3.5 rounded-2xl flex items-center gap-3 border border-white/10 hover:bg-white/15 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0"><TrendingUp size={18}/></div>
                            <div>
                              <p className="text-[10px] text-slate-300 font-bold">ចំនួនចូលប្រើប្រាស់</p>
                              <h4 className="text-base font-black text-white">{appVisits.length} ដង</h4>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FILTER PANEL SECTION (Precisely formatted like the image mockup) */}
                      <div className={`p-4 md:p-5 rounded-2xl border shadow-xs ${bgCard}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                          
                          {/* 1. Select District */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">ជ្រើសរើសស្រុក</label>
                            <select value={selectedDistrictTab} onChange={e=>setSelectedDistrictTab(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none font-bold text-xs bg-[#15803D] text-white border-[#15803D] focus:ring-2 focus:ring-green-400">
                              <option value="រតនមណ្ឌល">រតនមណ្ឌល</option>
                              <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                            </select>
                          </div>

                          {/* 2. Select Commune */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">ជ្រើសរើសឃុំ/សង្កាត់</label>
                            <select value={selectedCommune} onChange={e=>{setSelectedCommune(e.target.value); setSelectedVillageFilter('');}} className={`w-full p-2.5 rounded-xl border outline-none font-bold text-xs ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-white border-slate-200 text-slate-800'} focus:ring-2 focus:ring-green-400`}>
                              <option value="">ទាំងអស់</option>
                              {PRIMARY_COMMUNES.map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>

                          {/* 3. Select Village */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">ជ្រើសរើសភូមិ</label>
                            <select value={selectedVillageFilter} onChange={e=>setSelectedVillageFilter(e.target.value)} className={`w-full p-2.5 rounded-xl border outline-none font-bold text-xs ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-white border-slate-200 text-slate-800'} focus:ring-2 focus:ring-green-400`}>
                              <option value="">ទាំងអស់</option>
                              {selectedCommune && COMMUNE_VILLAGES[selectedCommune] ? COMMUNE_VILLAGES[selectedCommune].map(v=><option key={v} value={v}>{v}</option>) : null}
                            </select>
                          </div>

                          {/* 4. Search and Input */}
                          <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">ស្វែងរកទីតាំង</label>
                            <div className="flex gap-1.5">
                              <input type="text" placeholder="ស្វែងរកឈ្មោះ..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={`flex-1 p-2.5 rounded-xl border outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white':'bg-white border-slate-200 text-slate-800'}`} />
                              <button className="p-2.5 bg-[#15803D] hover:bg-green-700 text-white rounded-xl transition-all"><Search size={14}/></button>
                            </div>
                          </div>

                          {/* 5. Category filter */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">ប្រភេទទីតាំង</label>
                            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className={`w-full p-2.5 rounded-xl border outline-none font-bold text-xs ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-white border-slate-200 text-slate-800'} focus:ring-2 focus:ring-green-400`}>
                              {CATEGORIES.map(cat=><option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>

                        </div>
                      </div>

                      {/* MAIN GRID DISPLAYING LOCATIONS (Style matched to mockup) */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h3 className="font-moul text-sm text-[#15803D] dark:text-green-400 flex items-center gap-2">
                            <MapPin size={16} /> ទីតាំងដែលបានអនុម័ត
                          </h3>
                          <button onClick={()=>setCategoryFilter('ទាំងអស់')} className="text-[11px] font-bold text-white bg-[#15803D] hover:bg-green-700 px-3 py-1.5 rounded-lg transition">មើលទាំងអស់ &gt;</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {displayedLocations.map(loc => (
                            <div key={loc.id} className={`rounded-2xl border overflow-hidden flex flex-col shadow-xs transition-transform hover:-translate-y-1 ${bgCard}`}>
                              <div className="w-full aspect-[16/11] relative bg-slate-100 dark:bg-slate-800">
                                <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" onError={(e)=>handleImageError(e, FALLBACK_COVER)} />
                                <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md text-slate-700 bg-white shadow-xs border">
                                  {loc.category}
                                </span>
                                
                                {/* Favorite/Star button */}
                                <button onClick={()=>toggleFavorite(loc.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-amber-500 hover:scale-110 transition-all shadow-xs">
                                  <Star size={14} fill={favorites.includes(loc.id) ? "currentColor" : "none"} />
                                </button>
                              </div>

                              <div className="p-3.5 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-xs text-slate-800 dark:text-white mb-2 leading-tight">{loc.name}</h4>
                                  <div className="text-[9px] text-slate-500 space-y-1">
                                    <p className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400 shrink-0"/> ភូមិ {loc.village}, ឃុំ {loc.commune}</p>
                                    {loc.phone && <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400 shrink-0"/> {loc.phone}</p>}
                                  </div>
                                </div>

                                <div className="flex gap-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                                  <a href={loc.mapLink || ("https://maps.google.com/maps?q=" + encodeURIComponent(loc.name))} target="_blank" rel="noreferrer" className="flex-1 py-1.5 rounded-lg border text-slate-700 dark:text-slate-200 font-bold text-[9px] flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                    <MapIcon size={10}/> មើលផែនទី
                                  </a>
                                  <button onClick={()=>setSelectedLocation(loc)} className="flex-1 py-1.5 rounded-lg border text-slate-700 dark:text-slate-200 font-bold text-[9px] flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                    <Info size={10}/> ព័ត៌មានលម្អិត
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {displayedLocations.length === 0 && (
                          <div className="p-16 text-center text-slate-400 text-xs">មិនទាន់មានទីតាំងនៅក្នុងជម្រើសចម្រោះនេះឡើយ</div>
                        )}
                      </div>

                      {/* BOTTOM GRID STATISTICS (5 Custom color metrics exactly like mockup) */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 pt-4">
                        
                        <div className="p-4 rounded-2xl bg-[#E8F5E9] dark:bg-emerald-950/20 text-slate-800 dark:text-white flex flex-col justify-between border border-emerald-100 dark:border-emerald-900/40">
                          <MapIcon size={24} className="text-[#2E7D32]" />
                          <div className="mt-4">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ស្រុក</span>
                            <span className="text-lg font-black block mt-0.5">1 ស្រុក</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#FFF8E1] dark:bg-amber-950/20 text-slate-800 dark:text-white flex flex-col justify-between border border-amber-100 dark:border-amber-900/40">
                          <Home size={24} className="text-[#F57F17]" />
                          <div className="mt-4">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ឃុំ/សង្កាត់</span>
                            <span className="text-lg font-black block mt-0.5">6 ឃុំ/សង្កាត់</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#E3F2FD] dark:bg-blue-950/20 text-slate-800 dark:text-white flex flex-col justify-between border border-blue-100 dark:border-blue-900/40">
                          <Users size={24} className="text-[#0D47A1]" />
                          <div className="mt-4">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ភូមិ</span>
                            <span className="text-lg font-black block mt-0.5">22 ភូមិ</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#F3E5F5] dark:bg-purple-950/20 text-slate-800 dark:text-white flex flex-col justify-between border border-purple-100 dark:border-purple-900/40">
                          <Layers size={24} className="text-[#4A148C]" />
                          <div className="mt-4">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ប្រភេទទីតាំង</span>
                            <span className="text-lg font-black block mt-0.5">10 ប្រភេទ</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#E0F7FA] dark:bg-cyan-950/20 text-slate-800 dark:text-white flex flex-col justify-between border border-cyan-100 dark:border-cyan-900/40 col-span-2 md:col-span-1">
                          <Globe size={24} className="text-[#006064]" />
                          <div className="mt-4">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ទីតាំងសាធារណៈទាំងអស់</span>
                            <span className="text-lg font-black block mt-0.5">{approvedLocations.length} ទីតាំង</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* ADD TAB */}
                  {activeTab === 'add' && (
                    <div className="animate-fadeIn max-w-xl mx-auto">
                      <div className={`p-6 rounded-[2rem] border shadow-sm ${bgCard}`}>
                        <h3 className={`font-bold text-sm md:text-base mb-5 border-b border-slate-100 dark:border-slate-800 pb-3 font-moul flex items-center gap-2 ${textPrimary}`}><PlusCircle size={20}/> បន្ថែមទីតាំងថ្មី</h3>
                        <form onSubmit={submitLocation} className="space-y-4 text-xs md:text-sm">
                          <div>
                            <label className="font-bold text-slate-500 block mb-1.5">ឈ្មោះទីតាំង *</label>
                            <input type="text" required value={newLocName} onChange={e=>setNewLocName(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="ឈ្មោះទីតាំង..." />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="font-bold text-slate-500 block mb-1.5">ស្រុក *</label>
                              <select value={newLocDistrict} onChange={e=>setNewLocDistrict(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}>
                                <option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                                <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                              </select>
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block mb-1.5">ប្រភេទ *</label>
                              <select value={newLocCategory} onChange={e=>setNewLocCategory(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}>
                                {CATEGORIES.filter(c => c !== 'ទាំងអស់').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="font-bold text-slate-500 block mb-1.5">ឃុំ *</label>
                              {newLocDistrict === 'ស្រុករតនមណ្ឌល' ? (
                                <select required value={newLocCommune} onChange={e=>{setNewLocCommune(e.target.value); setNewLocVillage('');}} className={`w-full p-3.5 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}>
                                  {PRIMARY_COMMUNES.map(c => <option key={c} value={c}>ឃុំ {c}</option>)}
                                </select>
                              ) : (
                                <input type="text" required value={newLocCommune} onChange={e=>setNewLocCommune(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="ឈ្មោះឃុំ *" />
                              )}
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block mb-1.5">ភូមិ *</label>
                              {newLocDistrict === 'ស្រុករតនមណ្ឌល' && COMMUNE_VILLAGES[newLocCommune] ? (
                                <select required value={newLocVillage} onChange={e=>setNewLocVillage(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}>
                                  <option value="">-- ជ្រើសរើសភូមិ --</option>
                                  {COMMUNE_VILLAGES[newLocCommune].map(v => <option key={v} value={v}>ភូមិ {v}</option>)}
                                </select>
                              ) : (
                                <input type="text" required value={newLocVillage} onChange={e=>setNewLocVillage(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="ឈ្មោះភូមិ *" />
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="font-bold text-slate-500 block mb-1.5">រូបភាព</label>
                            <label className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-colors ${isDarkMode?'bg-slate-800 border-slate-600 hover:bg-slate-700':'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}>
                              {newLocImageBase64 ? <img src={newLocImageBase64} className="w-full h-full object-cover" /> : <><Camera size={24} className="text-[#15803D] mb-2"/><span className="text-[10px] text-slate-500 font-bold">ចុចជ្រើសរើសរូបថតទីតាំង</span></>}
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                          </div>

                          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#15803D] hover:bg-green-700 text-white rounded-xl font-bold font-moul shadow-lg transition-all mt-4">
                            {isSubmitting?'កំពុងដំណើរការ...':'យល់ព្រមបន្ថែមទិន្នន័យ'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* REPORTS TAB */}
                  {activeTab === 'reports' && (
                    <div className="animate-fadeIn max-w-5xl mx-auto">
                      <h2 className={`text-sm md:text-base font-bold mb-5 flex items-center gap-2 font-moul ${textPrimary}`}><BarChart2 size={20}/> របាយការណ៍សហគមន៍កម្រិតខ្ពស់</h2>
                      <RenderReportsDashboard />
                    </div>
                  )}

                  {/* PROFILE TAB */}
                  {activeTab === 'profile' && (
                    <div className="animate-fadeIn max-w-xl mx-auto space-y-5">
                      <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm text-center relative overflow-hidden ${bgCard}`}>
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
                        <div className="relative mt-6">
                          <div className="w-24 h-24 mx-auto rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-md relative group">
                            {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>}
                            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                              <Camera size={20} className="mb-1"/><span className="text-[10px] font-bold">ប្តូររូប</span>
                              <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                            </label>
                          </div>
                          <h3 className="font-black text-lg mt-3 text-slate-800 dark:text-white">{isAdmin ? 'System Admin' : (username || 'អ្នកប្រើប្រាស់')}</h3>
                          <p className="text-[10px] text-slate-500 mt-2">សមាជិកផ្លូវការស្រុករតនមណ្ឌល</p>
                        </div>
                      </div>

                      <div className={`rounded-2xl border shadow-sm overflow-hidden ${bgCard}`}>
                         <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3"><Moon className="text-[#15803D]" size={20}/><span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200">ងងឹត (Dark Mode)</span></div>
                            <button onClick={toggleDarkMode} className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-[#15803D]' : 'bg-slate-300'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                            </button>
                         </div>
                         <div className="p-4 md:p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3"><Globe className="text-emerald-500" size={20}/><span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200">ភាសា (Language)</span></div>
                            <button onClick={toggleLanguage} className="text-xs font-bold text-[#15803D] bg-green-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-green-200">{language === 'KH' ? 'ប្តូរទៅ English' : 'Change to Khmer'}</button>
                         </div>
                      </div>

                      {!isAdmin && (
                        <div className={`p-5 rounded-[2rem] border shadow-sm ${bgCard}`}>
                          {!showAdminLogin ? (
                            <button onClick={() => setShowAdminLogin(true)} className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-xs md:text-sm flex justify-center items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"><ShieldAlert size={16} /> ចូលកិច្ចការរដ្ឋបាល (Admin)</button>
                          ) : (
                            <div className="text-center p-4">សូមប្រើប្រាស់ផ្ទាំងអ្នកគ្រប់គ្រង</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* === PAGE 3: ADMIN AREA === */}
              {currentPage === 3 && isAdmin && (
                <div className="animate-fadeIn space-y-6">
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 border-b border-slate-200 dark:border-slate-800">
                    {[
                      { id: 'approvals', label: `សំណើអនុម័ត (${pendingLocations.length})` },
                      { id: 'reports', label: 'របាយការណ៍ប្រព័ន្ធ' },
                      { id: 'data', label: 'គ្រប់គ្រងទិន្នន័យ' },
                      { id: 'security', label: 'កំណត់ត្រាសុវត្ថិភាព' }
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setAdminSubTab(tab.id)} className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${adminSubTab === tab.id ? bgPrimary + ' shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>{tab.label}</button>
                    ))}
                  </div>

                  {adminSubTab === 'approvals' && (
                    <div className="space-y-4">
                      {pendingLocations.map(loc => (
                        <div key={loc.id} className={`p-5 rounded-[2rem] border flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm ${bgCard}`}>
                          <img src={loc.imageUrl} className="w-full md:w-24 h-40 md:h-24 rounded-xl object-cover shrink-0" onError={(e)=>handleImageError(e, FALLBACK_COVER)} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm md:text-base font-moul text-slate-800 dark:text-white truncate mb-1">{loc.name}</h4>
                            <p className="text-xs text-slate-500 mb-1">ភូមិ{loc.village}, ឃុំ{loc.commune}</p>
                            <p className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-1 rounded-md">ដោយ៖ <span className="text-[#15803D] font-bold">{loc.submittedBy}</span></p>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                            <button onClick={()=>adminApprove(loc)} className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">អនុម័ត</button>
                            <button onClick={()=>adminReject(loc)} className="flex-1 md:flex-none px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-xs font-bold transition-colors">បដិសេធ</button>
                          </div>
                        </div>
                      ))}
                      {pendingLocations.length === 0 && <p className="text-center py-16 text-sm text-slate-400 border-2 border-dashed rounded-3xl dark:border-slate-800">គ្មានសំណើអនុម័តរង់ចាំឡើយ</p>}
                    </div>
                  )}

                  {adminSubTab === 'reports' && <RenderReportsDashboard />}
                  
                  {adminSubTab === 'data' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button onClick={()=>setAdminDataTab('locations')} className={`px-4 py-2 rounded-lg text-xs font-bold ${adminDataTab==='locations'?bgPrimary:'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>ទីតាំង ({approvedLocations.length})</button>
                        <button onClick={()=>setAdminDataTab('users')} className={`px-4 py-2 rounded-lg text-xs font-bold ${adminDataTab==='users'?bgPrimary:'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>គណនី ({userList.length})</button>
                      </div>

                      {adminDataTab === 'locations' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {approvedLocations.map(loc => (
                            <div key={loc.id} className={`p-4 rounded-xl border flex items-center justify-between ${bgCard}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <img src={loc.imageUrl} className="w-10 h-10 rounded-lg object-cover" onError={(e)=>handleImageError(e, FALLBACK_COVER)} />
                                <h4 className="font-bold text-xs truncate text-slate-800 dark:text-white">{loc.name}</h4>
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={()=>setEditLoc(loc)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={14}/></button>
                                <button onClick={()=>adminDelete(loc.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {userList.map(usr => (
                            <div key={usr.id} className={`p-4 rounded-xl border flex items-center justify-between ${bgCard}`}>
                              <h4 className="font-bold text-xs text-slate-800 dark:text-white">{usr.username}</h4>
                              <button onClick={()=>adminDeleteUser(usr.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {adminSubTab === 'security' && (
                    <div className="space-y-4">
                      {securityLogs.length > 0 && <button onClick={adminClearSecurityLogs} className="py-2.5 px-4 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"><Trash2 size={14}/> លុបកំណត់ត្រាទាំងអស់</button>}
                      <div className="space-y-3">
                        {securityLogs.map(log => (
                          <div key={log.id} className="p-4 rounded-xl border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 text-xs">
                            <p className="font-bold text-red-600">លួចចូលប្រព័ន្ធខុសឆ្គង</p>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">គណនី៖ {log.username} | IP: {log.ipAddress} | កូដសាកល្បង៖ {log.attemptedPassword}</p>
                          </div>
                        ))}
                        {securityLogs.length === 0 && <p className="text-center py-10 text-xs text-slate-400">គ្មានកំណត់ត្រាគំរាមកំហែងទេ</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* Mobile Bottom Navigation Bar (Page 2 Only, Strict Support) */}
          {currentPage === 2 && (
            <nav className={`md:hidden absolute bottom-0 w-full flex justify-around items-center pt-2.5 pb-6 shrink-0 z-30 border-t rounded-t-[1.8rem] shadow-[0_-10px_25px_rgba(0,0,0,0.04)] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              {[
                { id: 'home', icon: Home, label: 'ទំព័រដើម' },
                { id: 'add', icon: Plus, label: 'បន្ថែម', isSpecial: true },
                { id: 'reports', icon: BarChart2, label: 'របាយការណ៍' },
                { id: 'profile', icon: User, label: 'គណនី' }
              ].map(item => (
                <button key={item.id} onClick={() => navigateTab(item.id)} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === item.id ? 'text-[#15803D]' : 'text-slate-400'} ${item.isSpecial ? 'relative -top-4' : ''}`}>
                  {item.isSpecial ? (
                    <div className="w-11 h-11 rounded-full bg-[#15803D] text-white flex items-center justify-center shadow-md scale-105"><Plus size={20}/></div>
                  ) : <item.icon size={18} />}
                  <span className="text-[9px] font-bold mt-0.5">{item.label}</span>
                </button>
              ))}
            </nav>
          )}

        </div>
      )}

      {/* ==========================================================
          MODALS & OVERLAYS (STYLISH LARGE ADMIN DESIGNED MODAL)
          ========================================================== */}
      
      {/* 1. Location Details Overlay */}
      {selectedLocation && (
        <div className="absolute inset-0 z-[120] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-siemreap">
          <div className={`w-full max-w-md rounded-[1.8rem] overflow-hidden shadow-2xl relative animate-slide-up flex flex-col ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <button onClick={() => setSelectedLocation(null)} className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-colors"><X size={14}/></button>
            <div className="h-52 w-full relative">
              <img src={selectedLocation.imageUrl} className="w-full h-full object-cover" onError={(e)=>handleImageError(e, FALLBACK_COVER)} />
            </div>
            <div className="p-5 flex-1">
              <span className={`text-[8px] font-bold px-2.5 py-1 rounded border mb-2 inline-block ${getCatStyle(selectedLocation.category)}`}>{selectedLocation.category}</span>
              <h2 className="font-moul text-sm text-slate-800 dark:text-white mb-4 leading-tight">{selectedLocation.name}</h2>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <p className="text-slate-600 dark:text-slate-400"><b>ទីតាំង៖</b> ភូមិ {selectedLocation.village}, ឃុំ {selectedLocation.commune}, {selectedLocation.district}</p>
                {selectedLocation.phone && <p className="text-slate-600 dark:text-slate-400"><b>ទំនាក់ទំនង៖</b> {selectedLocation.phone}</p>}
                {selectedLocation.info && <p className="text-slate-500 dark:text-slate-400 leading-snug"><b>ព័ត៌មានបន្ថែម៖</b> {selectedLocation.info}</p>}
              </div>
              <div className="flex gap-2.5 mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                {selectedLocation.phone && <a href={"tel:" + selectedLocation.phone} className="flex-1 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl font-bold flex justify-center items-center gap-1.5 text-[11px] font-moul">ទូរស័ព្ទ</a>}
                <a href={selectedLocation.mapLink || ("https://maps.google.com/maps?q=" + encodeURIComponent(selectedLocation.name))} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-[#15803D] text-white rounded-xl font-bold flex justify-center items-center gap-1.5 text-[11px] shadow-sm font-moul text-center">ផែនទី</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Admin Edit Overlay */}
      {editLoc && (
        <div className="absolute inset-0 z-[100] bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn font-siemreap">
          <div className={`w-full max-w-md rounded-[1.8rem] p-6 shadow-2xl animate-slide-up ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <h3 className="font-bold text-xs text-[#15803D] mb-4 flex items-center gap-1.5 font-moul"><Edit3 size={14}/> កែប្រែទិន្នន័យទីតាំង</h3>
            <form onSubmit={adminSaveEdit} className="space-y-4 text-xs">
              <input type="text" value={editLoc.name} onChange={e=>setEditLoc({...editLoc, name: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="ឈ្មោះទីតាំង" required />
              <input type="text" value={editLoc.category} onChange={e=>setEditLoc({...editLoc, category: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="ប្រភេទ" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={editLoc.commune} onChange={e=>setEditLoc({...editLoc, commune: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="ឃុំ" required />
                <input type="text" value={editLoc.village} onChange={e=>setEditLoc({...editLoc, village: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="ភូមិ" required />
              </div>
              <input type="text" value={editLoc.phone || ''} onChange={e=>setEditLoc({...editLoc, phone: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold focus:border-[#2563EB] ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} placeholder="លេខទូរស័ព្ទ" />
              <textarea value={editLoc.info || ''} onChange={e=>setEditLoc({...editLoc, info: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold focus:border-[#2563EB] resize-none ${isDarkMode?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`} rows="2" placeholder="ពណ៌នា"></textarea>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditLoc(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-[11px] font-moul">បោះបង់</button>
                <button type="submit" className="flex-1 py-3 bg-[#15803D] hover:bg-green-700 text-white rounded-xl font-bold text-[11px] font-moul shadow-md">រក្សាទុក</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create Username Overlay */}
      {showUsernameModal && (
        <div className="absolute inset-0 bg-black bg-opacity-70 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn font-siemreap">
          <div className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-slide-up border ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="w-16 h-16 bg-emerald-50 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-5 text-[#15803D]"><User size={28} /></div>
            <h3 className="text-center font-bold text-sm mb-1 font-moul dark:text-white">បង្កើតគណនីសហគមន៍</h3>
            <p className="text-center text-[10px] text-slate-500 mb-6 leading-relaxed">សូមបង្កើតឈ្មោះគណនីសម្គាល់ខ្លួនរបស់អ្នកដើម្បីអាចបំពេញទីតាំងបន្ថែម។</p>
            <input type="text" placeholder="វាយឈ្មោះគណនី..." value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} className={`w-full p-3.5 rounded-xl border font-bold text-center text-xs mb-5 focus:border-[#15803D] transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
            <div className="flex gap-3">
              <button onClick={()=>setShowUsernameModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-[10px] font-moul">បិទ</button>
              <button onClick={handleSaveUsername} className="flex-1 py-3 bg-[#15803D] hover:bg-green-700 text-white rounded-xl font-bold text-[10px] font-moul shadow-lg shadow-green-500/20">រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Admin Login Overlay (New Professional standard size) */}
      {showAdminLogin && (
        <div className="absolute inset-0 bg-black bg-opacity-70 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn font-siemreap">
          <div className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-slide-up border ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="w-16 h-16 bg-green-50 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-5 text-[#15803D]"><ShieldAlert size={28} /></div>
            <h3 className="text-center font-bold text-sm mb-2 font-moul dark:text-white">ប្រព័ន្ធសន្តិសុខ Admin</h3>
            <p className="text-center text-[10px] text-slate-500 mb-6 leading-relaxed">សូមបញ្ចូលលេខកូដសម្ងាត់អ្នកគ្រប់គ្រងដើម្បីបន្ត។</p>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input type="password" value={adminPasswordInput} onChange={e=>setAdminPasswordInput(e.target.value)} placeholder="លេខកូដសម្ងាត់..." className={`w-full p-3.5 rounded-xl border text-center font-bold text-xs outline-none focus:border-[#15803D] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} autoFocus />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-[10px] font-moul">បោះបង់</button>
                <button type="submit" className="flex-1 py-3.5 bg-[#15803D] hover:bg-green-700 text-white rounded-xl font-bold text-[10px] font-moul shadow-lg shadow-green-500/20">បញ្ជាក់ចូល</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Global Toast Alert */}
      {toastAlert.show && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[130] animate-slide-up flex justify-center w-[90%] md:w-auto font-siemreap">
          <div className={`px-5 py-3.5 rounded-xl shadow-xl flex items-center justify-center gap-2 font-bold text-[10px] text-white ${toastAlert.type === 'error' ? 'bg-red-600' : 'bg-[#15803D]'} font-moul`}>
            {toastAlert.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {toastAlert.message}
          </div>
        </div>
      )}

    </div>
  );
}